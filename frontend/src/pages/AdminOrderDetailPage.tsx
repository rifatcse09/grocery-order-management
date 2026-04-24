import { Link, useParams } from "react-router-dom";
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
      <p className="text-sm">
        Order not found. <Link to="/admin/orders">Back to list</Link>
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <Link to="/admin/orders" className="text-xs text-accent hover:underline">
        ← Order list
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNo}</h1>
          <p className="text-sm text-slate-600">{order.contactPerson}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-card sm:grid-cols-2 sm:p-6">
        <div>
          <p className="text-xs text-slate-500">Order date</p>
          <p className="font-semibold">{order.orderDate}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Delivery date</p>
          <p className="font-semibold">{order.deliveryDate}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Phone</p>
          <p className="font-semibold">{order.phone}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Time window</p>
          <p className="font-semibold">{order.deliveryTime || "—"}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-slate-500">Billing address</p>
          <p className="font-medium">{order.billingAddress}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-slate-500">Delivery address</p>
          <p className="font-medium">{order.deliveryAddress}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold">Line items (read-only)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
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
                <tr key={line.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">{line.serial}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{line.itemNameEn}</p>
                    <p className="font-bn text-xs text-slate-500">{line.itemNameBn}</p>
                  </td>
                  <td className="px-4 py-3">{formatQty(line.kg, line.gram, line.piece)}</td>
                  <td className="px-4 py-3 text-right">{line.unitPrice != null ? line.unitPrice.toFixed(0) : "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {line.lineTotal != null ? line.lineTotal.toFixed(0) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {order.challanGenerated ? (
        <section className="space-y-2">
          <h3 className="font-semibold">Challan preview</h3>
          <DeliveryChallanTemplate order={order} />
        </section>
      ) : null}

      {order.invoiceGenerated || order.status === "invoiced" ? (
        <section className="space-y-2">
          <h3 className="font-semibold">Invoice preview</h3>
          <BanglaInvoiceTemplate order={order} />
        </section>
      ) : null}
    </div>
  );
}
