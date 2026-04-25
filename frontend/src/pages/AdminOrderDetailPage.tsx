import { Link, useParams } from "react-router-dom";
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
import { useOrders } from "../context/OrdersContext";
import { StatusBadge } from "../components/StatusBadge";

function formatQty(kg: string, gram: string, piece: string) {
  const parts: string[] = [];
  if (piece && Number(piece) > 0) return `${piece} pcs`;
  if (kg && Number(kg) > 0) parts.push(`${kg} kg`);
  if (gram && Number(gram) > 0) parts.push(`${gram} g`);
  return parts.join(" + ") || "—";
}

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const { getById } = useOrders();
  const order = id ? getById(id) : undefined;

  if (!order) {
    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-8 text-center">
        <p className="text-slate-700">Order not found.</p>
        <Link
          to="/admin/orders"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-4 py-2 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to order list
        </Link>
      </div>
    );
  }

  const lineCount = order.lines.length;
  const subtotal = order.lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0);

  return (
    <div className="space-y-8">
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Order list
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-100">Read-only review</p>
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
            {order.grandTotal != null ? `৳ ${Math.round(order.grandTotal).toLocaleString("en-US")}` : "—"}
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

      {/* Line items */}
      <section className="overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-card">
        <div className="border-b border-violet-100 bg-violet-50/80 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-violet-950">
            <Package className="h-5 w-5 text-indigo-600" />
            Line items
            <span className="ml-2 rounded-full bg-violet-200/80 px-2.5 py-0.5 text-xs font-semibold text-violet-900">
              Read-only
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-base">
            <thead className="bg-violet-100/80 text-sm uppercase tracking-wide text-violet-900">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3 text-right">Unit price</th>
                <th className="px-4 py-3 text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.id} className="border-t border-violet-100 bg-white/95">
                  <td className="px-4 py-3.5 font-mono text-sm text-slate-600">{line.serial}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-900">{line.itemNameEn}</p>
                    <p className="font-bn text-sm text-slate-500">{line.itemNameBn}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">{formatQty(line.kg, line.gram, line.piece)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-slate-700">
                    {line.unitPrice != null ? `৳ ${line.unitPrice.toFixed(0)}` : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-right text-base font-bold tabular-nums text-slate-900">
                    {line.lineTotal != null ? `৳ ${line.lineTotal.toFixed(0)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {order.challanGenerated ? (
        <section className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-emerald-950">Challan preview</h3>
              <p className="text-xs text-emerald-800/80">Delivery document (quantities only)</p>
            </div>
          </div>
          <DeliveryChallanTemplate order={order} />
        </section>
      ) : null}

      {order.invoiceGenerated || order.status === "invoiced" ? (
        <section className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-indigo-950">Invoice preview</h3>
              <p className="text-xs text-indigo-800/80">Final billing document</p>
            </div>
          </div>
          <BanglaInvoiceTemplate order={order} />
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
