import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { ArrowLeft, FileText, User } from "lucide-react";
import { DeliveryChallanTemplate } from "../components/DeliveryChallanTemplate";
import { StatusBadge } from "../components/StatusBadge";
import { useOrders } from "../context/OrdersContext";

export function UserChallanDetailPage() {
  const { id } = useParams();
  const { getById } = useOrders();
  const order = id ? getById(id) : undefined;

  useEffect(() => {
    if (!order) return;
    const prevTitle = document.title;
    document.body.classList.add("print-isolated");
    document.title = `Challan-${order.orderNo}`;
    return () => {
      document.body.classList.remove("print-isolated");
      document.title = prevTitle;
    };
  }, [order]);

  const lineCount = order?.lines.length ?? 0;
  const subtotal = useMemo(
    () => (order ? order.lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0) : 0),
    [order],
  );

  if (!order || !order.challanGenerated) {
    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-8 text-center">
        <p className="text-slate-700">Challan is not available for this order yet.</p>
        <Link
          to="/user/invoices"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-4 py-2 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Billing documents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 print:space-y-0">
      <Link
        to="/user/invoices"
        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Billing documents
      </Link>

      <div className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 p-6 text-white shadow-xl sm:p-8 print:hidden">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-100">Delivery challan</p>
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
              <span className="rounded-full bg-emerald-400/30 px-3 py-1 text-emerald-50">Challan</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 print:hidden">
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
            {order.grandTotal != null ? `৳ ${Math.round(order.grandTotal).toLocaleString("en-US")}` : "—"}
          </p>
        </div>
      </div>

      <section className="space-y-3 print:space-y-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 print:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-emerald-950">Challan preview</h2>
              <p className="text-xs text-emerald-800/80">Delivery document (quantities)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-4 py-2 text-sm font-semibold text-white hover:from-slate-800 hover:to-indigo-700"
          >
            Print / Save as PDF
          </button>
        </div>
        <div className="print-doc-only print:p-0">
          <DeliveryChallanTemplate order={order} />
        </div>
      </section>
    </div>
  );
}
