import { Link } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";
import { StatusBadge } from "../components/StatusBadge";
import { useState } from "react";
import { PaginationControls } from "../components/PaginationControls";

export function ModeratorOrdersPage() {
  const { orders } = useOrders();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageList = orders.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Moderator panel</h1>
        <p className="text-sm text-brand-muted">
          Edit quantities, add pricing, generate challan, finalize billing
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white shadow-card">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-base">
          <thead className="bg-indigo-100/70 text-xs uppercase text-indigo-900">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageList.map((o) => (
              <tr key={o.id} className="border-t border-indigo-100 bg-white/90">
                <td className="px-4 py-3.5 font-mono text-sm font-semibold">{o.orderNo}</td>
                <td className="px-4 py-3.5 font-medium">{o.contactPerson}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/moderator/orders/${o.id}`}
                    className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        <div className="space-y-3 p-3 md:hidden">
          {pageList.map((o) => (
            <div key={o.id} className="rounded-2xl border border-indigo-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-xs font-semibold">{o.orderNo}</p>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-2 text-xs text-slate-600">Customer: {o.contactPerson}</p>
              <Link
                to={`/moderator/orders/${o.id}`}
                className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Open
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
