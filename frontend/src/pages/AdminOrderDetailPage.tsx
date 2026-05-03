import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
} from "lucide-react";
import { OrderLinesEditor } from "../components/OrderLinesEditor";
import { useCatalog } from "../context/CatalogContext";
import { useOrders } from "../context/OrdersContext";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { formatOrderSubmittedAt } from "../lib/formatOrderSubmit";
import { clearAdminOrderNotification } from "../lib/orderNotifications";
import { nextOrderNo, todayIsoDate } from "../lib/orderNo";
import { formatDeliveryWindow } from "../lib/deliveryWindow";
import { loadCategoryMarkupSettings } from "../lib/categoryMarkupSettings";
import { hasBillingInvoice, hasPurchaseInvoice, linesReadyForPurchaseInvoice } from "../lib/invoiceFlow";
import {
  apiEnabled,
  apiGenerateBillingInvoice,
  apiGenerateChallan,
  apiGeneratePurchaseInvoice,
  apiMarkOrderDelivered,
  apiUpdateOrder,
} from "../lib/api";
import type { Order } from "../types";

function makeAdminDraftOrder(owner: {
  id: string;
  name: string;
  phone: string;
  billingAddress: string;
  deliveryAddress: string;
}, nextNo: string): Order {
  return {
    id: crypto.randomUUID(),
    ownerId: owner.id,
    orderNo: nextNo,
    orderDate: todayIsoDate(),
    deliveryDate: todayIsoDate(),
    status: "draft",
    billingAddress: owner.billingAddress || "—",
    deliveryAddress: owner.deliveryAddress || "—",
    contactPerson: owner.name,
    phone: owner.phone || "",
    lines: [],
    signatureDataUrl: null,
  };
}

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();
  const { listAccounts } = useAuth();
  const { categories, addCategory, addCustomItem } = useCatalog();
  const { loadOrders, getById, upsertOrder, deleteOrder } = useOrders();
  const userAccounts = listAccounts().filter((a) => a.role === "user");
  const base = !isNew && id ? getById(id) : undefined;
  const [order, setOrder] = useState(base);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [addRowModal, setAddRowModal] = useState(false);
  const [newCatBn, setNewCatBn] = useState("");
  const [newCatEn, setNewCatEn] = useState("");
  const [itemCat, setItemCat] = useState("");
  const [pickItem, setPickItem] = useState("");
  const [itemBn, setItemBn] = useState("");
  const [itemEn, setItemEn] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workflowError, setWorkflowError] = useState("");
  const [workflowSuccess, setWorkflowSuccess] = useState("");
  /** Each workflow action has its own busy flag so challan / purchase / billing never block one another. */
  const [challanBusy, setChallanBusy] = useState(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);
  const [markDeliverBusy, setMarkDeliverBusy] = useState(false);
  const [lineItemError, setLineItemError] = useState("");
  const categoryMarkups = loadCategoryMarkupSettings();
  const itemsOf = useMemo(() => {
    const c = categories.find((x) => x.id === itemCat);
    return c?.items ?? [];
  }, [categories, itemCat]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (isNew) {
      const firstUser = userAccounts[0];
      if (!firstUser) return;
      setOrder(
        makeAdminDraftOrder(
          {
            id: firstUser.id,
            name: firstUser.name,
            phone: firstUser.phone,
            billingAddress: firstUser.billingAddress,
            deliveryAddress: firstUser.deliveryAddress,
          },
          nextOrderNo(),
        ),
      );
      return;
    }
    if (base) setOrder(base);
  }, [isNew, userAccounts, base]);

  useEffect(() => {
    if (!order?.id) return;
    clearAdminOrderNotification(order.id);
  }, [order?.id]);

  const purchaseLinesReady = useMemo(
    () => linesReadyForPurchaseInvoice(order?.lines ?? []),
    [order?.lines],
  );

  if (!order || (!isNew && !base)) {
    return (
      <div className="rounded-2xl border border-border bg-muted p-8 text-center">
        <p className="text-slate-700">Order not found.</p>
        <Link
          to="/admin/orders"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to order list
        </Link>
      </div>
    );
  }

  const lineCount = order.lines.length;
  const deliveredOrInvoiced = !isNew && (order.status === "delivered" || order.status === "invoiced");
  const quantityLocked = deliveredOrInvoiced;
  const pricingLocked =
    deliveredOrInvoiced ||
    (!isNew && hasPurchaseInvoice(order)) ||
    (!isNew && hasBillingInvoice(order));
  const subtotal = order.lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0);
  const save = () => upsertOrder(order);
  const genChallan = async () => {
    if (challanBusy || order.challanGenerated) return;
    setWorkflowError("");
    setWorkflowSuccess("");
    setChallanBusy(true);
    try {
      if (apiEnabled()) {
        await apiGenerateChallan(order.id);
        await loadOrders();
        setWorkflowSuccess("Challan generated successfully.");
        return;
      }
      const next = { ...order, challanGenerated: true, status: "under_review" as const };
      setOrder(next);
      upsertOrder(next);
      setWorkflowSuccess("Challan generated successfully.");
    } catch (e) {
      setWorkflowError(e instanceof Error ? e.message : "Failed to generate challan.");
    } finally {
      setChallanBusy(false);
    }
  };

  const generatePurchaseInvoice = async () => {
    if (purchaseBusy || hasPurchaseInvoice(order)) return;
    if (apiEnabled() && isNew) {
      setWorkflowError("Create the order on the server first, then generate a purchase invoice.");
      return;
    }
    if (!purchaseLinesReady) {
      setWorkflowError(
        "Purchase invoice needs a cost amount on every line: valid quantity (kg/g or pcs), cost unit price greater than zero, and a positive line total.",
      );
      return;
    }
    setWorkflowError("");
    setWorkflowSuccess("");
    setPurchaseBusy(true);
    try {
      if (apiEnabled()) {
        const saved = await apiUpdateOrder(order.id, order);
        setOrder(saved);
        await apiGeneratePurchaseInvoice(saved.id);
        await loadOrders();
        setWorkflowSuccess("Purchase invoice generated successfully.");
        navigate(`/admin/purchase-invoices/${saved.id}`);
        return;
      }
      const next = {
        ...order,
        purchaseInvoiceGenerated: true,
        purchaseInvoiceGeneratedBy: "admin" as const,
        status: "under_review" as const,
      };
      setOrder(next);
      upsertOrder(next);
      setWorkflowSuccess("Purchase invoice generated successfully.");
      navigate(`/admin/purchase-invoices/${order.id}`);
    } catch (e) {
      setWorkflowError(e instanceof Error ? e.message : "Failed to generate purchase invoice.");
    } finally {
      setPurchaseBusy(false);
    }
  };

  const markDeliveryComplete = async () => {
    if (
      markDeliverBusy ||
      purchaseBusy ||
      billingBusy ||
      order.status === "delivered" ||
      order.status === "invoiced"
    )
      return;
    if (order.status !== "submitted" && order.status !== "under_review") return;
    setWorkflowError("");
    setWorkflowSuccess("");
    setMarkDeliverBusy(true);
    try {
      if (apiEnabled()) {
        const updated = await apiMarkOrderDelivered(order.id);
        await loadOrders();
        setOrder(updated);
        setWorkflowSuccess("Delivery marked complete. Order status updated.");
        return;
      }
      const next = { ...order, status: "delivered" as const };
      setOrder(next);
      upsertOrder(next);
      setWorkflowSuccess("Delivery marked complete (saved locally).");
    } catch (e) {
      setWorkflowError(e instanceof Error ? e.message : "Could not mark delivery complete.");
    } finally {
      setMarkDeliverBusy(false);
    }
  };

  const finalizeInvoice = async () => {
    if (
      billingBusy ||
      !hasPurchaseInvoice(order) ||
      hasBillingInvoice(order) ||
      order.status !== "delivered"
    )
      return;
    setWorkflowError("");
    setWorkflowSuccess("");
    setBillingBusy(true);
    try {
      if (apiEnabled()) {
        await apiGenerateBillingInvoice(order.id, {
          markupPercent: 0,
          markupByCategory: categoryMarkups,
        });
        await loadOrders();
        setWorkflowSuccess("Billing invoice generated successfully.");
        navigate(`/admin/billing-invoices/${order.id}`);
        return;
      }
      const totals = {
        purchaseSubtotal: order.lines.reduce((sum, line) => sum + Number(line.lineTotal ?? 0), 0),
        billingSubtotal: order.lines.reduce((sum, line) => {
          const purchaseLine = Number(line.lineTotal ?? 0);
          const pct = Number(categoryMarkups[line.categoryId] ?? 0);
          return sum + (purchaseLine + Math.round(purchaseLine * (pct / 100)));
        }, 0),
      };
      const next = {
        ...order,
        billingInvoiceGenerated: true,
        invoiceGenerated: true,
        status: "invoiced" as const,
        purchaseSubtotal: totals.purchaseSubtotal,
        billingSubtotal: totals.billingSubtotal,
        subtotal: totals.billingSubtotal,
        markupPercent: undefined,
        billingCategoryMarkups: categoryMarkups,
        grandTotal: totals.billingSubtotal,
      };
      setOrder(next);
      upsertOrder(next);
      setWorkflowSuccess("Billing invoice generated successfully.");
      navigate(`/admin/billing-invoices/${order.id}`);
    } catch (e) {
      setWorkflowError(e instanceof Error ? e.message : "Failed to generate billing invoice.");
    } finally {
      setBillingBusy(false);
    }
  };

  const addFromCatalog = () => {
    const cat = categories.find((c) => c.id === itemCat);
    const it = cat?.items.find((i) => i.id === pickItem);
    if (!cat || !it) return;
    const exists = order.lines.some((l) => l.categoryId === cat.id && l.itemId === it.id);
    if (exists) {
      setLineItemError("Same item already exists in line items.");
      return;
    }
    const next = {
      ...order,
      lines: [
        ...order.lines,
        {
          id: crypto.randomUUID(),
          serial: order.lines.length + 1,
          categoryId: cat.id,
          itemId: it.id,
          itemNameBn: it.nameBn,
          itemNameEn: it.nameEn,
          kg: "",
          gram: "",
          piece: "",
        },
      ],
    };
    setOrder(next);
    upsertOrder(next);
    setLineItemError("");
    setAddRowModal(false);
  };

  return (
    <div className="space-y-8">
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Order list
      </Link>

      {/* Hero */}
      <div className="rounded-3xl border border-border bg-primary p-6 text-primary-foreground shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground">Administrator full access</p>
            <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight sm:text-3xl">
              {isNew ? "Create user order" : order.orderNo}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-primary-foreground">
              <User className="h-4 w-4 shrink-0" />
              <span className="font-medium text-primary-foreground">{order.contactPerson}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            <div className="flex flex-wrap justify-end gap-2 text-xs font-medium text-primary-foreground">
              <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-900">
                {lineCount} line{lineCount !== 1 ? "s" : ""}
              </span>
              {order.challanGenerated ? (
                <span className="rounded-full bg-emerald-800 px-3 py-1 text-white">Challan</span>
              ) : null}
              {hasPurchaseInvoice(order) ? (
                <span className="rounded-full bg-amber-700 px-3 py-1 text-amber-50">Purchase invoice</span>
              ) : null}
              {hasBillingInvoice(order) ? (
                <span className="rounded-full bg-blue-800 px-3 py-1 text-white">Billing invoice</span>
              ) : null}
            </div>
            {!isNew ? (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="mt-1 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-500"
              >
                Delete order
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-muted p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Lines</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{lineCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-muted p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Purchase cost total</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {subtotal > 0 ? `৳ ${Math.round(subtotal).toLocaleString("en-US")}` : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Grand total</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {order.grandTotal != null ? `৳ ${Math.round(order.grandTotal).toLocaleString("en-US")}` : "—"}
          </p>
        </div>
      </div>

      {/* Order details */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-primary">
            <Package className="h-5 w-5" />
          </span>
          Order details
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {isNew ? (
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Customer (user)</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={order.ownerId ?? ""}
                onChange={(e) => {
                  const selected = userAccounts.find((a) => a.id === e.target.value);
                  if (!selected) return;
                  setOrder({
                    ...order,
                    ownerId: selected.id,
                    contactPerson: selected.name,
                    phone: selected.phone,
                    billingAddress: selected.billingAddress,
                    deliveryAddress: selected.deliveryAddress,
                  });
                }}
              >
                {userAccounts.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <DetailTile icon={Calendar} label="Order date" value={order.orderDate} />
          <DetailTile icon={Calendar} label="Submitted" value={formatOrderSubmittedAt(order)} />
          <DetailTile icon={Calendar} label="Delivery date" value={order.deliveryDate} />
          <DetailTile icon={Phone} label="Phone" value={order.phone} />
          <DetailTile icon={Clock} label="Time window" value={formatDeliveryWindow(order.deliveryTime)} />
          <div className="sm:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Billing address
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">{order.billingAddress}</p>
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Delivery address
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Line items */}
      <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-card">
        <div className="border-b border-border bg-muted px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Package className="h-5 w-5 text-foreground" />
            Line items & pricing
            <span className="ml-2 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
              {quantityLocked && pricingLocked
                ? "Locked"
                : pricingLocked
                  ? "Quantities editable — supplier/customer invoice locks cost until delivery"
                  : "Editable — save cost changes before marking delivery complete"}
            </span>
          </h2>
        </div>
        <div className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setItemCat(categories[0]?.id ?? "");
                setShowCatalogModal(true);
              }}
              disabled={pricingLocked}
              className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Add category/item
            </button>
            <button
              type="button"
              onClick={() => {
                setItemCat(categories[0]?.id ?? "");
                setPickItem(categories[0]?.items[0]?.id ?? "");
                setLineItemError("");
                setAddRowModal(true);
              }}
              disabled={pricingLocked}
              className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Add row
            </button>
          </div>
          {lineItemError ? <p className="mb-3 text-xs font-semibold text-red-700">{lineItemError}</p> : null}
          {!hasPurchaseInvoice(order) ? (
            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950">
              <strong>Cost required for purchase invoice:</strong> each line must have a{" "}
              <strong>supplier cost (unit) price</strong> greater than zero, valid <strong>quantity</strong>, and a
              positive <strong>line total</strong>. The server will reject a purchase invoice without these.
            </p>
          ) : null}
          <OrderLinesEditor
            lines={order.lines}
            categories={categories}
            showPricing
            billingMarkupsByCategory={categoryMarkups}
            globalBillingMarkupPercent={0}
            linesLocked={false}
            quantityLocked={quantityLocked}
            pricingLocked={pricingLocked}
            onChange={(lines) => setOrder({ ...order, lines })}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              className="rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-muted"
            >
              {isNew ? "Create order" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                void genChallan();
              }}
              disabled={Boolean(challanBusy || order.challanGenerated)}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {challanBusy ? "Generating…" : "Generate challan"}
            </button>
            <button
              type="button"
              onClick={() => void generatePurchaseInvoice()}
              disabled={Boolean(
                purchaseBusy ||
                  hasPurchaseInvoice(order) ||
                  !purchaseLinesReady ||
                  (apiEnabled() && isNew),
              )}
              title={
                apiEnabled() && isNew
                  ? "Save as a new order first."
                  : !hasPurchaseInvoice(order) && !purchaseLinesReady
                    ? "Enter cost (unit) price and quantity on every line before purchase invoice."
                    : undefined
              }
              className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {purchaseBusy ? "Generating…" : "Generate purchase invoice"}
            </button>
            <button
              type="button"
              onClick={() => void markDeliveryComplete()}
              disabled={Boolean(
                markDeliverBusy ||
                  purchaseBusy ||
                  billingBusy ||
                  order.status === "delivered" ||
                  order.status === "invoiced" ||
                  (order.status !== "submitted" && order.status !== "under_review"),
              )}
              className="inline-flex items-center gap-2 rounded-xl border border-teal-600 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Truck className="h-4 w-4" />
              {markDeliverBusy ? "Updating…" : "Mark delivery complete"}
            </button>
            <button
              type="button"
              onClick={() => {
                void finalizeInvoice();
              }}
              disabled={Boolean(
                billingBusy ||
                  !hasPurchaseInvoice(order) ||
                  hasBillingInvoice(order) ||
                  order.status !== "delivered",
              )}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {billingBusy ? "Generating…" : "Generate customer billing invoice"}
            </button>
          </div>
          {!hasPurchaseInvoice(order) && purchaseLinesReady ? (
            <p className="mt-2 text-xs font-semibold text-amber-700">
              Purchase invoice is required before customer billing invoice.
            </p>
          ) : null}
          {hasPurchaseInvoice(order) && order.status !== "delivered" && order.status !== "invoiced" ? (
            <p className="mt-2 text-xs font-semibold text-teal-800">
              Use <strong>Mark delivery complete</strong> when the order has been delivered. Billing invoice is only
              available after that.
            </p>
          ) : null}
          {workflowSuccess ? <p className="mt-2 text-xs font-semibold text-emerald-700">{workflowSuccess}</p> : null}
          {workflowError ? <p className="mt-2 text-xs font-semibold text-red-700">{workflowError}</p> : null}
        </div>
      </section>

      {showCatalogModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">Catalog management</h3>
            <div className="mt-4 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-500">Add category</p>
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Category name (Bangla)" value={newCatBn} onChange={(e) => setNewCatBn(e.target.value)} />
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Category name (English)" value={newCatEn} onChange={(e) => setNewCatEn(e.target.value)} />
                <button type="button" className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white" onClick={async () => {
                  const c = await addCategory(newCatBn, newCatEn);
                  if (c) {
                    setItemCat(c.id);
                    setNewCatBn("");
                    setNewCatEn("");
                  }
                }}>
                  Save category
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-500">Add item</p>
                <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={itemCat} onChange={(e) => setItemCat(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.nameBn})
                    </option>
                  ))}
                </select>
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Item name (Bangla)" value={itemBn} onChange={(e) => setItemBn(e.target.value)} />
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Item name (English)" value={itemEn} onChange={(e) => setItemEn(e.target.value)} />
                <button type="button" className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white" onClick={async () => {
                  const created = await addCustomItem(itemCat, itemBn, itemEn);
                  if (created) {
                    setItemBn("");
                    setItemEn("");
                  }
                }}>
                  Save item
                </button>
              </div>
              <button type="button" onClick={() => setShowCatalogModal(false)} className="w-full rounded-xl border border-slate-200 py-2 text-sm text-slate-700">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {addRowModal ? (
        <div className="fixed left-0 top-0 z-[250] flex h-screen w-screen items-center justify-center bg-slate-900/35 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Add line</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-600">Category</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={itemCat}
                  onChange={(e) => {
                    setItemCat(e.target.value);
                    const c = categories.find((x) => x.id === e.target.value);
                    setPickItem(c?.items[0]?.id ?? "");
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.nameBn})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-600">Item</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={pickItem}
                  onChange={(e) => setPickItem(e.target.value)}
                >
                  {itemsOf.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nameEn} ({i.nameBn})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={addFromCatalog}
                className="w-full rounded-xl bg-slate-700 py-2 text-sm font-semibold text-white hover:bg-slate-600"
              >
                Add row
              </button>
              <button
                type="button"
                onClick={() => setAddRowModal(false)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteModal ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Delete Order</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{order.orderNo}</span>? This
              action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteOrder(order.id);
                  setShowDeleteModal(false);
                  navigate("/admin/orders");
                }}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
