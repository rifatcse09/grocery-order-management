import { Link } from "react-router-dom";
import { Plus, Pencil, FileCheck2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrdersContext";
import { StatusBadge } from "../components/StatusBadge";
import { canEditOrder } from "../lib/quantityRules";
import { PaginationControls } from "../components/PaginationControls";
import { formatOrderSubmittedAt } from "../lib/formatOrderSubmit";
import type { OrderStatus } from "../types";

export function UserOrderDashboard() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const mine = orders.filter((o) => o.ownerId === user?.id || user?.role === "admin");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mine.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!q) return true;
      return (
        o.orderNo.toLowerCase().includes(q) ||
        o.contactPerson.toLowerCase().includes(q) ||
        (o.phone || "").toLowerCase().includes(q) ||
        o.deliveryAddress.toLowerCase().includes(q)
      );
    });
  }, [mine, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const btnPrimary =
    "inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-slate-800 hover:to-indigo-700";
  const btnPrimaryNew =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-slate-800 hover:to-indigo-700 sm:w-auto";
  const btnOutline =
    "inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-indigo-50";
  const btnDisabled = "inline-flex cursor-not-allowed items-center gap-1 rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-900">User · Procurement requester</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Order dashboard</h1>
          <p className="mt-1 text-base font-medium text-slate-600">
            Search, filter, and paginate orders. Existing orders are editable until 48h before delivery.
          </p>
        </div>
        <Link to="/user/orders/new" className={btnPrimaryNew}>
          <Plus className="h-4 w-4" />
          New order
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-card">
        <div className="border-b border-indigo-100 bg-white/80 px-4 py-4 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-indigo-900 sm:col-span-2">
              <span className="mb-1 flex items-center gap-1.5 text-slate-600">
                <Search className="h-3.5 w-3.5" />
                Search
              </span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Order no., contact, phone, address…"
                className="mt-1 w-full rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none ring-indigo-200/50 focus:ring-2"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Status
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "all" | OrderStatus);
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under review</option>
                <option value="delivered">Delivered</option>
                <option value="invoiced">Invoiced</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Showing <strong className="text-slate-700">{filtered.length}</strong> of {mine.length} orders
          </p>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-base">
            <thead className="bg-indigo-100/80 text-sm uppercase tracking-wide text-indigo-900">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Order date</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((o) => {
                const editable = o.status === "draft" || canEditOrder(o.deliveryDate);
                const lockTitle = "Less than 48h to delivery — editing and review are locked";
                return (
                  <tr key={o.id} className="border-t border-indigo-100 bg-white/95">
                    <td className="px-4 py-4 font-mono text-base font-semibold text-slate-900">{o.orderNo}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{formatOrderSubmittedAt(o)}</td>
                    <td className="px-4 py-4 text-slate-700">{o.orderDate}</td>
                    <td className="px-4 py-4 text-slate-700">{o.deliveryDate}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        {editable ? (
                          <Link
                            to={`/user/orders/${o.id}/review`}
                            className={btnOutline}
                            title="Review summary and submit"
                          >
                            <FileCheck2 className="h-4 w-4" />
                            Review
                          </Link>
                        ) : (
                          <span className={btnDisabled} title={lockTitle}>
                            <FileCheck2 className="h-4 w-4" />
                            Review
                          </span>
                        )}
                        {editable ? (
                          <Link to={`/user/orders/${o.id}/edit`} className={btnPrimary} title="Edit order">
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Link>
                        ) : (
                          <span className={btnDisabled} title={lockTitle}>
                            <Pencil className="h-4 w-4" />
                            Edit
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pageItems.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No orders match your search or filters.</p>
          ) : null}
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {pageItems.map((o) => {
            const editable = o.status === "draft" || canEditOrder(o.deliveryDate);
            const lockTitle = "Less than 48h to delivery — editing and review are locked";
            return (
              <div key={o.id} className="rounded-2xl border border-indigo-200 bg-white p-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-sm font-semibold text-slate-900">{o.orderNo}</p>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Submitted: <span className="font-medium text-slate-800">{formatOrderSubmittedAt(o)}</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Order date: <span className="font-medium text-slate-800">{o.orderDate}</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Delivery: <span className="font-medium text-slate-800">{o.deliveryDate}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {editable ? (
                    <Link to={`/user/orders/${o.id}/review`} className={`${btnOutline} flex-1 justify-center`}>
                      <FileCheck2 className="h-4 w-4" />
                      Review
                    </Link>
                  ) : (
                    <span className={`${btnDisabled} flex-1 justify-center`} title={lockTitle}>
                      <FileCheck2 className="h-4 w-4" />
                      Review
                    </span>
                  )}
                  {editable ? (
                    <Link to={`/user/orders/${o.id}/edit`} className={`${btnPrimary} flex-1 justify-center`}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>
                  ) : (
                    <span className={`${btnDisabled} flex-1 justify-center`} title={lockTitle}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {pageItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No orders match your search or filters.</p>
          ) : null}
        </div>

        {filtered.length > 0 ? (
          <PaginationControls
            totalItems={filtered.length}
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
