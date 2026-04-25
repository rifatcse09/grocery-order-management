import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useOrders } from "../context/OrdersContext";
import { StatusBadge } from "../components/StatusBadge";
import { PaginationControls } from "../components/PaginationControls";
import { formatOrderSubmittedAt } from "../lib/formatOrderSubmit";
import { NOTIFICATIONS_EVENT, readAdminNotifyOrderIds } from "../lib/orderNotifications";
import type { OrderStatus } from "../types";

export function AdminOrdersPage() {
  const { orders } = useOrders();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [customer, setCustomer] = useState("all");
  const [docFilter, setDocFilter] = useState<"all" | "challan_yes" | "challan_no" | "invoice_yes" | "invoice_no">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [adminNewIds, setAdminNewIds] = useState(() => readAdminNotifyOrderIds());

  useEffect(() => {
    const sync = () => setAdminNewIds(readAdminNotifyOrderIds());
    window.addEventListener(NOTIFICATIONS_EVENT, sync);
    return () => window.removeEventListener(NOTIFICATIONS_EVENT, sync);
  }, []);

  const customers = useMemo(
    () =>
      [...new Set(orders.map((o) => o.contactPerson?.trim()).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b)),
      ),
    [orders],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (customer !== "all" && o.contactPerson !== customer) return false;
      if (docFilter === "challan_yes" && !o.challanGenerated) return false;
      if (docFilter === "challan_no" && o.challanGenerated) return false;
      if (docFilter === "invoice_yes" && !(o.invoiceGenerated || o.status === "invoiced")) return false;
      if (docFilter === "invoice_no" && (o.invoiceGenerated || o.status === "invoiced")) return false;
      if (!q) return true;
      return (
        o.orderNo.toLowerCase().includes(q) ||
        o.contactPerson.toLowerCase().includes(q) ||
        (o.phone || "").toLowerCase().includes(q) ||
        o.deliveryAddress.toLowerCase().includes(q)
      );
    });
  }, [orders, query, status, customer, docFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageList = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Admin order list</h1>
        <p className="mt-1 text-base font-medium text-slate-600">
          Read-only review of all orders. Open any order to view challan and invoice previews.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 shadow-card">
        <div className="border-b border-violet-100 bg-white/80 px-4 py-4 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-violet-900 sm:col-span-2 lg:col-span-2">
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
                placeholder="Order no., customer, phone, address…"
                className="mt-1 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none ring-violet-200/50 focus:ring-2"
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
                className="mt-1 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under review</option>
                <option value="delivered">Delivered</option>
                <option value="invoiced">Invoiced</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Customer
              <select
                value={customer}
                onChange={(e) => {
                  setCustomer(e.target.value);
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">All customers</option>
                {customers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-2">
              Documents
              <select
                value={docFilter}
                onChange={(e) => {
                  setDocFilter(e.target.value as typeof docFilter);
                  setPage(1);
                }}
                className="mt-1 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">All orders</option>
                <option value="challan_yes">Challan available</option>
                <option value="challan_no">Challan pending</option>
                <option value="invoice_yes">Invoice available</option>
                <option value="invoice_no">Invoice pending</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Showing <strong className="text-slate-700">{filtered.length}</strong> of {orders.length} orders
          </p>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-base">
            <thead className="bg-violet-100/80 text-sm uppercase tracking-wide text-violet-900">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Submitted</th>
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
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-semibold text-slate-900">{o.orderNo}</span>
                      {adminNewIds.includes(o.id) ? (
                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow-sm">
                          New
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{formatOrderSubmittedAt(o)}</td>
                  <td className="px-4 py-4 text-base font-semibold text-slate-800">{o.contactPerson}</td>
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
                      className="inline-flex items-center rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-3.5 py-2 text-sm font-semibold text-white hover:from-slate-800 hover:to-indigo-700"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageList.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No orders match your search or filters.</p>
          ) : null}
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {pageList.map((o) => (
            <div key={o.id} className="rounded-2xl border border-violet-200 bg-white p-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-semibold text-slate-900">{o.orderNo}</p>
                  {adminNewIds.includes(o.id) ? (
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                      New
                    </span>
                  ) : null}
                </div>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Submitted: <span className="font-medium text-slate-800">{formatOrderSubmittedAt(o)}</span>
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">Customer: {o.contactPerson}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold ${o.challanGenerated ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
                >
                  Challan: {o.challanGenerated ? "Available" : "Pending"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 font-semibold ${
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
                className="mt-3 inline-flex rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-3.5 py-2 text-sm font-semibold text-white"
              >
                Review
              </Link>
            </div>
          ))}
          {pageList.length === 0 ? (
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
