import { Link } from "react-router-dom";
import { Plus, Pencil, FileCheck2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrdersContext";
import { StatusBadge } from "../components/StatusBadge";
import { canEditOrder } from "../lib/quantityRules";
import { PaginationControls } from "../components/PaginationControls";

export function UserOrderDashboard() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const mine = orders.filter((o) => o.ownerId === user?.id || user?.role === "admin");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "submitted" | "under_review" | "delivered" | "invoiced">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mine.filter((o) => {
      const matchStatus = status === "all" || o.status === status;
      const matchQuery =
        q.length === 0 ||
        o.orderNo.toLowerCase().includes(q) ||
        o.contactPerson.toLowerCase().includes(q) ||
        o.deliveryAddress.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [mine, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Procurement requester
          </p>
          <h1 className="text-xl font-bold text-brand-dark sm:text-2xl">Order dashboard</h1>
          <p className="text-sm text-brand-muted">
            Search, filter, and paginate orders. Existing orders are editable until 48h before delivery.
          </p>
        </div>
        <Link
          to="/user/orders/new"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          New order
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <span className="text-sm font-medium text-slate-700">My orders</span>
          <span className="text-xs text-slate-500">{filtered.length} matched</span>
        </div>
        <div className="grid gap-2 border-b border-slate-100 px-3 py-3 sm:px-4 md:grid-cols-3">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by order no., contact, or delivery address"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as typeof status);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under review</option>
            <option value="delivered">Delivered</option>
            <option value="invoiced">Invoiced</option>
          </select>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[760px] w-full text-left text-base">
            <thead className="bg-cyan-100/70 text-xs uppercase text-cyan-900">
              <tr>
                <th className="px-4 py-3">Order no.</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((o) => {
                const editable = o.status === "draft" || canEditOrder(o.deliveryDate);
                return (
                  <tr key={o.id} className="border-t border-cyan-100 bg-white/90">
                    <td className="px-4 py-3.5 font-mono text-sm font-semibold">{o.orderNo}</td>
                    <td className="px-4 py-3.5 text-slate-700">{o.orderDate}</td>
                    <td className="px-4 py-3.5 text-slate-700">{o.deliveryDate}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/user/orders/${o.id}/review`}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${
                            editable
                              ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              : "cursor-not-allowed bg-slate-100 text-slate-400"
                          }`}
                          onClick={(e) => {
                            if (!editable) e.preventDefault();
                          }}
                          aria-disabled={!editable}
                          title={
                            editable
                              ? "Review summary and submit"
                              : "Less than 48h to delivery — review disabled"
                          }
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                          Review
                        </Link>
                        <Link
                          to={`/user/orders/${o.id}/edit`}
                          className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${
                            editable
                              ? "bg-slate-900 text-white hover:bg-slate-800"
                              : "cursor-not-allowed bg-slate-100 text-slate-400"
                          }`}
                          onClick={(e) => {
                            if (!editable) e.preventDefault();
                          }}
                          aria-disabled={!editable}
                          title={
                            editable
                              ? "Edit order"
                              : "Less than 48h to delivery — editing disabled"
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    No orders found for current search/filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 p-3 md:hidden">
          {pageItems.map((o) => {
            const editable = o.status === "draft" || canEditOrder(o.deliveryDate);
            return (
              <div key={o.id} className="rounded-2xl border border-cyan-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-xs font-semibold">{o.orderNo}</p>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-2 text-xs text-slate-600">Date: {o.orderDate}</p>
                <p className="text-xs text-slate-600">Delivery: {o.deliveryDate}</p>
                <div className="mt-3">
                  <div className="flex gap-2">
                    <Link
                      to={`/user/orders/${o.id}/review`}
                      className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${
                        editable
                          ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          : "cursor-not-allowed bg-slate-100 text-slate-400"
                      }`}
                      onClick={(e) => {
                        if (!editable) e.preventDefault();
                      }}
                    >
                      <FileCheck2 className="h-3.5 w-3.5" />
                      Review
                    </Link>
                    <Link
                      to={`/user/orders/${o.id}/edit`}
                      className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium ${
                        editable
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : "cursor-not-allowed bg-slate-100 text-slate-400"
                      }`}
                      onClick={(e) => {
                        if (!editable) e.preventDefault();
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          {pageItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No orders found for current search/filter.
            </p>
          ) : null}
        </div>
        <PaginationControls
          totalItems={filtered.length}
          page={currentPage}
          perPage={pageSize}
          onPageChange={setPage}
          onPerPageChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
