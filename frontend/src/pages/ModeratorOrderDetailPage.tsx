import { Link, useParams } from "react-router-dom";
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
import { OrderLinesEditor } from "../components/OrderLinesEditor";
import { DeliveryChallanTemplate } from "../components/DeliveryChallanTemplate";
import { BanglaInvoiceTemplate } from "../components/BanglaInvoiceTemplate";
import { StatusBadge } from "../components/StatusBadge";
import { useCatalog } from "../context/CatalogContext";
import { useOrders } from "../context/OrdersContext";
import { formatOrderSubmittedAt } from "../lib/formatOrderSubmit";
import {
  flagOrderForAdminReview,
  markModeratorSeenOrder,
  orderHasPricingData,
} from "../lib/orderNotifications";
import type { Order } from "../types";

function applyMarkup(sub: number): { pct: number; grand: number } {
  const pct = sub <= 125_000 ? 20 : 15;
  const markup = Math.round(sub * (pct / 100));
  return { pct, grand: sub + markup };
}

export function ModeratorOrderDetailPage() {
  const { id } = useParams();
  const { getById, upsertOrder } = useOrders();
  const { categories } = useCatalog();
  const base = id ? getById(id) : undefined;
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [printDoc, setPrintDoc] = useState<"challan" | "invoice" | null>(null);
  useEffect(() => {
    if (base) setOrder(base);
  }, [base]);

  useEffect(() => {
    if (order?.id) markModeratorSeenOrder(order.id);
  }, [order?.id]);

  if (!base || !order) {
    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-8 text-center">
        <p className="text-slate-700">Order not found.</p>
        <Link
          to="/moderator/orders"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-4 py-2 text-sm font-semibold text-white"
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

  const genChallan = () => {
    const next = { ...order, challanGenerated: true, status: "under_review" as const };
    setOrder(next);
    upsertOrder(next);
    flagOrderForAdminReview(order.id);
  };

  const finalizeInvoice = () => {
    const sub = order.lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0);
    const { pct, grand } = applyMarkup(sub);
    const next: Order = {
      ...order,
      invoiceGenerated: true,
      status: "invoiced",
      subtotal: sub,
      markupPercent: pct,
      grandTotal: grand,
    };
    setOrder(next);
    upsertOrder(next);
    flagOrderForAdminReview(order.id);
  };

  const markDelivered = () => {
    const next: Order = {
      ...order,
      status: "delivered",
    };
    setOrder(next);
    upsertOrder(next);
    flagOrderForAdminReview(order.id);
  };

  const printWithTitle = (doc: "challan" | "invoice", title: string) => {
    const prevTitle = document.title;
    setPrintDoc(doc);
    document.body.classList.add("print-isolated");
    document.title = title;
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintDoc(null);
        document.body.classList.remove("print-isolated");
        document.title = prevTitle;
      }, 100);
    }, 0);
  };

  const lineCount = order.lines.length;
  const subtotal = order.lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0);
  const previewGrand =
    order.grandTotal != null
      ? order.grandTotal
      : subtotal > 0
        ? applyMarkup(subtotal).grand
        : null;

  const actionBtn =
    "rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-slate-800 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/moderator/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Order list
        </Link>
        <button
          type="button"
          onClick={save}
          className="rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-slate-800 hover:to-indigo-700"
        >
          Save changes
        </button>
      </div>

      {/* Hero — aligned with admin order review */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-100">Moderator review</p>
            <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight sm:text-3xl">{order.orderNo}</h1>
            <p className="mt-2 flex items-center gap-2 text-violet-100">
              <User className="h-4 w-4 shrink-0" />
              <span className="font-medium text-white">{order.contactPerson}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            <div className="flex flex-wrap justify-end gap-2 text-xs font-medium text-violet-100">
              <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                {lineCount} line{lineCount !== 1 ? "s" : ""}
              </span>
              {order.challanGenerated ? (
                <span className="rounded-full bg-emerald-400/30 px-3 py-1 text-emerald-50">Challan</span>
              ) : null}
              {order.invoiceGenerated || order.status === "invoiced" ? (
                <span className="rounded-full bg-blue-400/30 px-3 py-1 text-blue-50">Invoice</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-white to-violet-50/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">Lines</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{lineCount}</p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-white to-fuchsia-50/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-800">Line total (sum)</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {subtotal > 0 ? `৳ ${Math.round(subtotal).toLocaleString("en-US")}` : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-white to-indigo-50/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">Grand total</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {previewGrand != null ? `৳ ${Math.round(previewGrand).toLocaleString("en-US")}` : "—"}
          </p>
        </div>
      </div>

      {/* Order details */}
      <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/60 via-white to-fuchsia-50/40 p-5 shadow-card sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Package className="h-5 w-5" />
          </span>
          Order details
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <DetailTile icon={Calendar} label="Order date" value={order.orderDate} />
          <DetailTile icon={Calendar} label="Submitted" value={formatOrderSubmittedAt(order)} />
          <DetailTile icon={Calendar} label="Delivery date" value={order.deliveryDate} />
          <DetailTile icon={Phone} label="Phone" value={order.phone} />
          <DetailTile icon={Clock} label="Time window" value={order.deliveryTime || "—"} />
          <div className="sm:col-span-2">
            <div className="rounded-2xl border border-violet-100 bg-white/90 p-4 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                Billing address
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">{order.billingAddress}</p>
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="rounded-2xl border border-violet-100 bg-white/90 p-4 shadow-sm">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-fuchsia-500" />
                Delivery address
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-800">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Line items — editor inside admin-style shell */}
      <section className="overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-card">
        <div className="border-b border-violet-100 bg-violet-50/80 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
            <Package className="h-5 w-5 text-indigo-600" />
            Line items &amp; pricing
            <span className="ml-2 rounded-full bg-amber-200/90 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
              Editable
            </span>
          </h2>
        </div>
        <div className="p-4 sm:p-5">
          <OrderLinesEditor
            lines={order.lines}
            categories={categories}
            showPricing
            onChange={(lines) => setOrder({ ...order, lines })}
          />
        </div>
      </section>

      {/* Workflow actions */}
      <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/60 via-white to-fuchsia-50/40 p-5 shadow-card sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Workflow</h2>
        <p className="mt-1 text-sm text-slate-600">Challan, delivery, and invoice steps</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={genChallan} disabled={Boolean(order.challanGenerated)} className={actionBtn}>
            Generate challan (no prices)
          </button>
          <button
            type="button"
            onClick={markDelivered}
            disabled={order.status === "delivered" || order.status === "invoiced"}
            className={actionBtn}
          >
            Mark delivery complete
          </button>
          <button
            type="button"
            onClick={finalizeInvoice}
            disabled={!order.challanGenerated || order.invoiceGenerated}
            className={actionBtn}
          >
            Finalize invoice
          </button>
        </div>
      </section>

      {order.challanGenerated ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-emerald-950">Challan preview</h3>
                <p className="text-xs text-emerald-800/80">Delivery document (quantities only)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => printWithTitle("challan", `Challan-${order.orderNo}`)}
              className="rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-4 py-2 text-sm font-semibold text-white print:hidden hover:from-slate-800 hover:to-indigo-700"
            >
              Print challan / Save as PDF
            </button>
          </div>
          <div className={printDoc === "invoice" ? "print:hidden" : "print-doc-only print:p-0"}>
            <DeliveryChallanTemplate order={order} />
          </div>
        </section>
      ) : null}

      {order.invoiceGenerated ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <Receipt className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-indigo-950">Invoice preview</h3>
                <p className="text-xs text-indigo-800/80">Final billing document</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => printWithTitle("invoice", `Invoice-${order.orderNo}`)}
              className="rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-4 py-2 text-sm font-semibold text-white print:hidden hover:from-slate-800 hover:to-indigo-700"
            >
              Print invoice / Save as PDF
            </button>
          </div>
          <div className={printDoc === "challan" ? "print:hidden" : "print-doc-only print:p-0"}>
            <BanglaInvoiceTemplate order={order} />
          </div>
        </section>
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
    <div className="rounded-2xl border border-violet-100 bg-white/90 p-4 shadow-sm">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5 text-indigo-500" />
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}
