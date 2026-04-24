import { Link } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { PaginationControls } from "../components/PaginationControls";

export function UserInvoicesPage() {
  const { orders } = useOrders();
  const { user } = useAuth();
  const list = orders
    .filter(
      (o) =>
        (o.ownerId === user?.id || user?.role === "admin") &&
        (o.challanGenerated || o.invoiceGenerated || o.status === "invoiced"),
    )
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageList = list.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 p-4 sm:p-5">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Billing documents</h1>
        <p className="mt-1 text-sm font-medium text-slate-700 sm:text-base">
          Challan appears after moderator generates it. Invoice appears after moderator finalizes billing.
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 shadow-card">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-base">
          <thead className="bg-violet-100/80 text-sm uppercase tracking-wide text-violet-900">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Challan</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageList.map((o) => (
              <tr key={o.id} className="border-t border-violet-100 bg-white/95">
                <td className="px-4 py-3.5 font-mono text-base font-semibold text-slate-800">{o.orderNo}</td>
                <td className="px-4 py-3">
                  {o.challanGenerated ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-800">
                      Available
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-500">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {o.invoiceGenerated || o.status === "invoiced" ? (
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-sm font-semibold text-blue-800">
                      Available
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-500">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    {o.challanGenerated ? (
                      <Link
                        to={`/user/challans/${o.id}`}
                        className="rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        View challan
                      </Link>
                    ) : null}
                    {o.invoiceGenerated || o.status === "invoiced" ? (
                      <Link
                        to={`/user/invoices/${o.id}`}
                        className="rounded-xl bg-violet-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-violet-800"
                      >
                        View invoice
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        <div className="space-y-3 p-3 md:hidden">
          {pageList.map((o) => (
            <div key={o.id} className="rounded-2xl border border-violet-200 bg-white p-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-slate-800">{o.orderNo}</p>
                <StatusBadge status={o.status} />
              </div>
              <div className="mt-2 flex gap-2 text-sm">
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold ${o.challanGenerated ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
                >
                  Challan: {o.challanGenerated ? "Available" : "Pending"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold ${o.invoiceGenerated || o.status === "invoiced" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"}`}
                >
                  Invoice: {o.invoiceGenerated || o.status === "invoiced" ? "Available" : "Pending"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {o.challanGenerated ? (
                  <Link
                    to={`/user/challans/${o.id}`}
                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    View challan
                  </Link>
                ) : null}
                {o.invoiceGenerated || o.status === "invoiced" ? (
                  <Link
                    to={`/user/invoices/${o.id}`}
                    className="rounded-xl bg-violet-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-violet-800"
                  >
                    View invoice
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {list.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            No challan or invoice available yet.
          </p>
        ) : null}
        {list.length > 0 ? (
          <PaginationControls
            totalItems={list.length}
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
