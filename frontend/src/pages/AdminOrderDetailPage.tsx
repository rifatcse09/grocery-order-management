import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  MapPin,
  Package,
  Phone,
  Receipt,
  User,
} from "lucide-react";
import { DeliveryChallanTemplate } from "../components/DeliveryChallanTemplate";
import { BanglaInvoiceTemplate } from "../components/BanglaInvoiceTemplate";
import { OrderLinesEditor } from "../components/OrderLinesEditor";
import { useCatalog } from "../context/CatalogContext";
import { useOrders } from "../context/OrdersContext";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { formatOrderSubmittedAt } from "../lib/formatOrderSubmit";
import { clearAdminOrderNotification } from "../lib/orderNotifications";
import { nextOrderNo, todayIsoDate } from "../lib/orderNo";
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
  const { orders, getById, upsertOrder, deleteOrder } = useOrders();
  const userAccounts = listAccounts().filter((a) => a.role === "user");
  const base = !isNew && id ? getById(id) : undefined;
  const [order, setOrder] = useState(base);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [newCatBn, setNewCatBn] = useState("");
  const [newCatEn, setNewCatEn] = useState("");
  const [itemCat, setItemCat] = useState("");
  const [itemBn, setItemBn] = useState("");
  const [itemEn, setItemEn] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
          nextOrderNo(orders),
        ),
      );
      return;
    }
    if (base) setOrder(base);
  }, [isNew, userAccounts, orders, base]);

  useEffect(() => {
    if (!order?.id) return;
    clearAdminOrderNotification(order.id);
  }, [order?.id]);

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
  const subtotal = order.lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0);
  const save = () => upsertOrder(order);
  const genChallan = () => {
    const next = { ...order, challanGenerated: true, status: "under_review" as const };
    setOrder(next);
    upsertOrder(next);
  };
  const finalizeInvoice = () => {
    const sub = order.lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0);
    const pct = sub <= 125_000 ? 20 : 15;
    const grand = sub + Math.round(sub * (pct / 100));
    const next = {
      ...order,
      invoiceGenerated: true,
      status: "invoiced" as const,
      subtotal: sub,
      markupPercent: pct,
      grandTotal: grand,
    };
    setOrder(next);
    upsertOrder(next);
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
              {order.invoiceGenerated || order.status === "invoiced" ? (
                <span className="rounded-full bg-blue-800 px-3 py-1 text-white">Invoice</span>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Line total (sum)</p>
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
          <DetailTile icon={Clock} label="Time window" value={order.deliveryTime || "—"} />
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
              Editable
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
              className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-muted"
            >
              Manage catalog (add category/item)
            </button>
          </div>
          <OrderLinesEditor
            lines={order.lines}
            categories={categories}
            showPricing
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
              onClick={genChallan}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Edit delivery challan
            </button>
            <button
              type="button"
              onClick={finalizeInvoice}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Approve invoice request
            </button>
          </div>
        </div>
      </section>

      {order.challanGenerated ? (
        <section className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-emerald-950">Challan preview</h3>
              <p className="text-xs text-emerald-900">Delivery document (quantities only)</p>
            </div>
          </div>
          <DeliveryChallanTemplate order={order} />
        </section>
      ) : null}

      {order.invoiceGenerated || order.status === "invoiced" ? (
        <section className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">Invoice preview</h3>
              <p className="text-xs text-foreground">Final billing document</p>
            </div>
          </div>
          <BanglaInvoiceTemplate order={order} />
        </section>
      ) : null}

      {showCatalogModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">Catalog management</h3>
            <div className="mt-4 space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-500">Add category</p>
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Category name (Bangla)" value={newCatBn} onChange={(e) => setNewCatBn(e.target.value)} />
                <input className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Category name (English)" value={newCatEn} onChange={(e) => setNewCatEn(e.target.value)} />
                <button type="button" className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white" onClick={() => {
                  const c = addCategory(newCatBn, newCatEn);
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
                <button type="button" className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white" onClick={() => {
                  const created = addCustomItem(itemCat, itemBn, itemEn);
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
