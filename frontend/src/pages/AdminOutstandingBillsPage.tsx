import { useEffect, useMemo, useState } from "react";
import { useOrders } from "../context/OrdersContext";
import { PaginationControls } from "../components/PaginationControls";

type Range = "all" | "7d" | "30d" | "90d";
const PAYMENTS_KEY = "gom_statement_payments";

export function AdminOutstandingBillsPage() {
  const { orders } = useOrders();
  const [range, setRange] = useState<Range>("all");
  const [customer, setCustomer] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const invoiced = useMemo(
    () => orders.filter((o) => o.status === "invoiced" || o.invoiceGenerated),
    [orders],
  );

  const customers = useMemo(
    () =>
      [...new Set(invoiced.map((o) => o.contactPerson?.trim()).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b))),
    [invoiced],
  );

  const rows = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const from = new Date(now);
    if (range === "7d") from.setDate(now.getDate() - 7);
    if (range === "30d") from.setDate(now.getDate() - 30);
    if (range === "90d") from.setDate(now.getDate() - 90);

    const invoiceRows = invoiced
      .filter((o) => {
        if (customer !== "all" && o.contactPerson !== customer) return false;
        if (range === "all") return true;
        const d = parseIso(o.orderDate);
        return Boolean(d && d.getTime() >= from.getTime());
      })
      .map((o) => {
        const issue = parseIso(o.orderDate) ?? new Date();
        const due = new Date(issue);
        due.setDate(due.getDate() + 7);
        const diff = Math.floor((now.getTime() - due.getTime()) / 86400000);
        const overdueDays = diff > 0 ? diff : 0;
        return {
          id: o.id,
          orderNo: o.orderNo,
          customer: o.contactPerson || "Unknown",
          issue,
          due,
          total: o.grandTotal ?? 0,
          remaining: o.grandTotal ?? 0,
          overdueDays,
          isOverdue: overdueDays > 0,
        };
      })
      .sort((a, b) => a.issue.getTime() - b.issue.getTime());

    // FIFO allocation: apply weekly statement payments to oldest invoices first per customer.
    const paymentsByCustomer = new Map<string, number>();
    try {
      const raw = localStorage.getItem(PAYMENTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        Object.entries(parsed).forEach(([key, paid]) => {
          const amount = Number(paid);
          if (!Number.isFinite(amount) || amount <= 0) return;
          const customerName = key.split("::")[1] || "Unknown";
          paymentsByCustomer.set(customerName, (paymentsByCustomer.get(customerName) ?? 0) + amount);
        });
      }
    } catch {
      /* ignore parse errors */
    }

    const byCustomer = new Map<string, typeof invoiceRows>();
    invoiceRows.forEach((r) => {
      const arr = byCustomer.get(r.customer) ?? [];
      arr.push(r);
      byCustomer.set(r.customer, arr);
    });

    byCustomer.forEach((list, c) => {
      let pool = paymentsByCustomer.get(c) ?? 0;
      if (pool <= 0) return;
      for (const row of list) {
        if (pool <= 0) break;
        const consume = Math.min(pool, row.remaining);
        row.remaining -= consume;
        pool -= consume;
      }
    });

    return invoiceRows
      .filter((r) => r.remaining > 0)
      .sort((a, b) => b.issue.getTime() - a.issue.getTime());
  }, [invoiced, range, customer]);

  const totalUnpaid = rows.reduce((s, r) => s + r.remaining, 0);
  const pendingCount = rows.length;
  const overdueCount = rows.filter((r) => r.isOverdue).length;
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * perPage, safePage * perPage);

  useEffect(() => {
    setPage(1);
  }, [range, customer]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Outstanding bills</h1>
        <p className="text-sm text-slate-600">
          Total unpaid, pending invoices, overdue payments with customer/date filters.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card title="Total unpaid amount" value={`৳ ${Math.round(totalUnpaid).toLocaleString("en-US")}`} />
        <Card title="Pending invoices" value={String(pendingCount)} />
        <Card title="Overdue payments" value={String(overdueCount)} danger />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <label className="text-xs text-slate-600">
            Date range
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as Range)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Customer
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All customers</option>
              {customers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2">Invoice / Order</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Issue date</th>
                <th className="px-3 py-2">Due date</th>
                <th className="px-3 py-2 text-right">Remaining amount</th>
                <th className="px-3 py-2">Overdue days</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => (
                <tr
                  key={r.id}
                  className={`border-t border-slate-100 ${r.isOverdue ? "bg-red-50/70" : "bg-white"}`}
                >
                  <td className="px-3 py-2 font-medium">{r.orderNo}</td>
                  <td className="px-3 py-2">{r.customer}</td>
                  <td className="px-3 py-2">{formatIso(r.issue)}</td>
                  <td className="px-3 py-2">{formatIso(r.due)}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    ৳ {Math.round(r.remaining).toLocaleString("en-US")}
                  </td>
                  <td className="px-3 py-2">
                    {r.isOverdue ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        {r.overdueDays} days
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        On time
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationControls
          totalItems={rows.length}
          page={safePage}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(size) => {
            setPerPage(size);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

function Card({ title, value, danger }: { title: string; value: string; danger?: boolean }) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-card ${
        danger
          ? "border-red-200 bg-gradient-to-br from-red-50 to-white"
          : "border-blue-200 bg-gradient-to-br from-blue-50 to-white"
      }`}
    >
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p
        className={`mt-2 break-words text-2xl font-extrabold leading-tight sm:text-3xl ${
          danger ? "text-red-600" : "text-brand-dark"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function parseIso(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
