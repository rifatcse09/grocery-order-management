import { Link } from "react-router-dom";
import { useState } from "react";
import { useOrders } from "../context/OrdersContext";
import { StatusBadge } from "../components/StatusBadge";
import { PaginationControls } from "../components/PaginationControls";

export function AdminOrdersPage() {
  const { orders } = useOrders();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageList = orders.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin order list</h1>
        <p className="text-sm text-brand-muted">
          Read-only review of all orders. Open any order to view challan and invoice previews.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 shadow-card">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-base">
            <thead className="bg-violet-100/80 text-xs uppercase tracking-wide text-violet-900">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Challan</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageList.map((o) => (
                <tr key={o.id} className="border-t border-violet-100 bg-white/95">
                  <td className="px-4 py-3.5 font-mono text-sm font-semibold">{o.orderNo}</td>
                  <td className="px-4 py-3.5 font-medium">{o.contactPerson}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        o.challanGenerated ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {o.challanGenerated ? "Available" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        o.invoiceGenerated || o.status === "invoiced"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {o.invoiceGenerated || o.status === "invoiced" ? "Available" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/orders/${o.id}`}
                      className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {pageList.map((o) => (
            <div key={o.id} className="rounded-2xl border border-violet-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-xs font-semibold">{o.orderNo}</p>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-2 text-xs text-slate-600">Customer: {o.contactPerson}</p>
              <div className="mt-2 flex gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-1 ${o.challanGenerated ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
                >
                  Challan: {o.challanGenerated ? "Available" : "Pending"}
                </span>
                <span
                  className={`rounded-full px-2 py-1 ${
                    o.invoiceGenerated || o.status === "invoiced"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  Invoice: {o.invoiceGenerated || o.status === "invoiced" ? "Available" : "Pending"}
                </span>
              </div>
              <Link
                to={`/admin/orders/${o.id}`}
                className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Review
              </Link>
            </div>
          ))}
        </div>

        {orders.length > 0 ? (
          <PaginationControls
            totalItems={orders.length}
            page={safePage}
            perPage={pageSize}
            onPageChange={setPage}
            onPerPageChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
