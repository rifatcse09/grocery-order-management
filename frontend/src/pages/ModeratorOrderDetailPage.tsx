import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Package,
  Phone,
  User,
} from "lucide-react";
import { OrderLinesEditor } from "../components/OrderLinesEditor";
import { StatusBadge } from "../components/StatusBadge";
import { useCatalog } from "../context/CatalogContext";
import { useOrders } from "../context/OrdersContext";
import { formatOrderSubmittedAt } from "../lib/formatOrderSubmit";
import {
  flagOrderForAdminReview,
  markModeratorSeenOrder,
  orderHasPricingData,
} from "../lib/orderNotifications";
import { formatDeliveryWindow } from "../lib/deliveryWindow";
import { hasPurchaseInvoice, linesReadyForPurchaseInvoice } from "../lib/invoiceFlow";
import { apiEnabled, apiGenerateChallan, apiGeneratePurchaseInvoice, apiUpdateOrder } from "../lib/api";
import type { Order } from "../types";

function applyMarkup(sub: number): { pct: number; grand: number } {
  const pct = sub <= 125_000 ? 20 : 15;
  const markup = Math.round(sub * (pct / 100));
  return { pct, grand: sub + markup };
}

export function ModeratorOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById, upsertOrder, loadOrders } = useOrders();
  const { categories, addCategory, addCustomItem } = useCatalog();
  const base = id ? getById(id) : undefined;
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [addRowModal, setAddRowModal] = useState(false);
  const [newCatBn, setNewCatBn] = useState("");
  const [newCatEn, setNewCatEn] = useState("");
  const [itemCat, setItemCat] = useState("");
  const [pickItem, setPickItem] = useState("");
  const [itemBn, setItemBn] = useState("");
  const [itemEn, setItemEn] = useState("");
  const [workflowError, setWorkflowError] = useState("");
  const [workflowSuccess, setWorkflowSuccess] = useState("");
  const [challanBusy, setChallanBusy] = useState(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [lineItemError, setLineItemError] = useState("");
  const itemsOf = useMemo(() => {
    const c = categories.find((x) => x.id === itemCat);
    return c?.items ?? [];
  }, [categories, itemCat]);
  useEffect(() => {
    if (base) setOrder(base);
  }, [base]);

  useEffect(() => {
    if (order?.id) markModeratorSeenOrder(order.id);
  }, [order?.id]);

  const purchaseLinesReady = useMemo(
    () => linesReadyForPurchaseInvoice(order?.lines ?? []),
    [order?.lines],
  );

  if (!base || !order) {
    return (
      <div className="rounded-2xl border border-border bg-muted p-8 text-center">
        <p className="text-slate-700">Order not found.</p>
        <Link
          to="/moderator/orders"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to order list
        </Link>
      </div>
    );
  }

  const save = () => {
    upsertOrder(order);
    if (orderHasPricingData(order)) {
      flagOrderForAdminReview(order.id);
    }
  };

  const genChallan = async () => {
    if (challanBusy || order.challanGenerated) return;
    setWorkflowError("");
    setWorkflowSuccess("");
    setChallanBusy(true);
    try {
      if (apiEnabled()) {
        await apiGenerateChallan(order.id);
        await loadOrders();
        flagOrderForAdminReview(order.id);
        setWorkflowSuccess("Challan generated successfully.");
        return;
      }
      const next = { ...order, challanGenerated: true, status: "under_review" as const };
      setOrder(next);
      upsertOrder(next);
      flagOrderForAdminReview(order.id);
      setWorkflowSuccess("Challan generated successfully.");
    } catch (e) {
      setWorkflowError(e instanceof Error ? e.message : "Failed to generate challan.");
    } finally {
      setChallanBusy(false);
    }
  };

  const markDelivered = async () => {
    if (purchaseBusy || hasPurchaseInvoice(order)) return;
    if (!linesReadyForPurchaseInvoice(order.lines)) {
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
        flagOrderForAdminReview(saved.id);
        setWorkflowSuccess("Purchase invoice generated successfully.");
        navigate(`/moderator/purchase-invoices/${saved.id}`);
        return;
      }
      const next: Order = {
        ...order,
        status: "under_review",
        purchaseInvoiceGenerated: true,
        purchaseInvoiceGeneratedBy: "moderator" as const,
      };
      setOrder(next);
      upsertOrder(next);
      flagOrderForAdminReview(order.id);
      setWorkflowSuccess("Purchase invoice generated successfully.");
      navigate(`/moderator/purchase-invoices/${order.id}`);
    } catch (e) {
      setWorkflowError(e instanceof Error ? e.message : "Failed to generate purchase invoice.");
    } finally {
      setPurchaseBusy(false);
    }
  };

  const lineCount = order.lines.length;
  const deliveredOrInvoiced = order.status === "delivered" || order.status === "invoiced";
  const quantityLocked = deliveredOrInvoiced;
  const pricingLocked = deliveredOrInvoiced || hasPurchaseInvoice(order);
  const subtotal = order.lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0);
  const previewGrand =
    order.grandTotal != null
      ? order.grandTotal
      : subtotal > 0
        ? applyMarkup(subtotal).grand
        : null;

  const actionBtn =
    "rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:hover:bg-slate-100 dark:hover:text-slate-900 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";

  const addFromCatalog = () => {
    if (pricingLocked) return;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/moderator/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Order list
        </Link>
        <button
          type="button"
          onClick={save}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 dark:hover:text-slate-900"
        >
          Save changes
        </button>
      </div>

      {/* Hero — aligned with admin order review */}
      <div className="rounded-3xl border border-border bg-primary p-6 text-primary-foreground shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground">Moderator review</p>
            <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight sm:text-3xl">{order.orderNo}</h1>
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
              {order.status === "delivered" ? (
                <span className="rounded-full bg-amber-800 px-3 py-1 text-amber-50">Purchase invoice sent to admin</span>
              ) : null}
            </div>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Line total (sum)</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {subtotal > 0 ? `৳ ${Math.round(subtotal).toLocaleString("en-US")}` : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-muted p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Grand total</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {previewGrand != null ? `৳ ${Math.round(previewGrand).toLocaleString("en-US")}` : "—"}
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

      {/* Line items — editor inside admin-style shell */}
      <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-card">
        <div className="border-b border-border bg-muted px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Package className="h-5 w-5 text-foreground" />
            Line items &amp; cost pricing
            <span className="ml-2 rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
              {quantityLocked && pricingLocked
                ? "Locked"
                : pricingLocked
                  ? "Qty editable — cost locked (purchase invoice)"
                  : "Editable"}
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
              <strong>Cost required for purchase invoice:</strong> each line needs a{" "}
              <strong>supplier cost (unit) price</strong> greater than zero, valid <strong>quantity</strong>, and a
              positive{" "}
              <strong>line total</strong>. The API blocks generating a purchase invoice without full cost data.
            </p>
          ) : null}
          <OrderLinesEditor
            lines={order.lines}
            categories={categories}
            showPricing
            linesLocked={false}
            quantityLocked={quantityLocked}
            pricingLocked={pricingLocked}
            onChange={(lines) => setOrder({ ...order, lines })}
          />
        </div>
      </section>

      {/* Workflow actions */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Workflow</h2>
        <p className="mt-1 text-sm text-slate-600">
          Challan can be created without prices; <strong>purchase invoice always requires cost amounts</strong> on
          every line before it can be generated.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              void genChallan();
            }}
            disabled={Boolean(challanBusy || order.challanGenerated)}
            className={actionBtn}
          >
            {challanBusy ? "Generating…" : "Generate challan (no prices)"}
          </button>
          <button
            type="button"
            onClick={() => void markDelivered()}
            disabled={Boolean(
              purchaseBusy ||
                hasPurchaseInvoice(order) ||
                !purchaseLinesReady ||
                order.status === "delivered" ||
                order.status === "invoiced",
            )}
            title={
              !hasPurchaseInvoice(order) && !purchaseLinesReady
                ? "Complete quantity and cost unit in the table above for each line."
                : undefined
            }
            className={actionBtn}
          >
            {purchaseBusy ? "Generating…" : "Generate purchase invoice"}
          </button>
        </div>
        {hasPurchaseInvoice(order) ? (
          <p className="mt-2 text-xs font-semibold text-emerald-700">Purchase invoice is generated and visible to admin.</p>
        ) : null}
        {workflowSuccess ? <p className="mt-2 text-xs font-semibold text-emerald-700">{workflowSuccess}</p> : null}
        {workflowError ? <p className="mt-2 text-xs font-semibold text-red-700">{workflowError}</p> : null}
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
