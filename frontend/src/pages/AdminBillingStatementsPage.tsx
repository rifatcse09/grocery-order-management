import { useEffect, useMemo, useState } from "react";
import { PaginationControls } from "../components/PaginationControls";
import { useOrders } from "../context/OrdersContext";

interface StatementRow {
  key: string;
  customer: string;
  start: Date;
  end: Date;
  dueDate: Date;
  invoiceCount: number;
  invoiceTotal: number;
  previousDue: number;
  totalDue: number;
  status: "Due" | "Overdue";
  invoices: Array<{ orderNo: string; orderDate: string; amount: number }>;
}

const PAYMENTS_KEY = "gom_statement_payments";

export function AdminBillingStatementsPage() {
  const { orders } = useOrders();
  const [customer, setCustomer] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [payments, setPayments] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(PAYMENTS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, number>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const [payInput, setPayInput] = useState("");

  const customers = useMemo(
    () =>
      [...new Set(orders.map((o) => o.contactPerson?.trim()).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b))),
    [orders],
  );

  const statements = useMemo(() => {
    const cycleDays: 7 = 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const invoiced = orders
      .filter((o) => o.status === "invoiced" && (o.grandTotal ?? 0) > 0)
      .filter((o) => (customer === "all" ? true : o.contactPerson === customer))
      .sort((a, b) => a.orderDate.localeCompare(b.orderDate));

    const bucket = new Map<
      string,
      { customer: string; start: Date; end: Date; total: number; invoices: StatementRow["invoices"] }
    >();

    for (const o of invoiced) {
      const d = parseIso(o.orderDate);
      if (!d) continue;
      const start = startOfCycle(d, cycleDays);
      const end = new Date(start);
      end.setDate(end.getDate() + cycleDays - 1);
      const c = o.contactPerson || "Unknown customer";
      const key = `${formatIso(start)}::${c}`;
      const prev = bucket.get(key);
      bucket.set(key, {
        customer: c,
        start,
        end,
        total: (prev?.total ?? 0) + (o.grandTotal ?? 0),
        invoices: [
          ...(prev?.invoices ?? []),
          { orderNo: o.orderNo, orderDate: o.orderDate, amount: o.grandTotal ?? 0 },
        ],
      });
    }

    const sorted = [...bucket.entries()]
      .map(([key, v]) => ({
        key,
        customer: v.customer,
        start: v.start,
        end: v.end,
        invoiceCount: v.invoices.length,
        invoiceTotal: v.total,
        invoices: v.invoices,
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Carry-over is cumulative prior dues per customer (common practice).
    const carryPerCustomer = new Map<string, number>();
    const rows: StatementRow[] = sorted.map((s) => {
      const previousDue = carryPerCustomer.get(s.customer) ?? 0;
      const totalDue = previousDue + s.invoiceTotal;
      carryPerCustomer.set(s.customer, totalDue);

      const dueDate = new Date(s.end);
      dueDate.setDate(dueDate.getDate() + cycleDays);
      const status: StatementRow["status"] = dueDate.getTime() < today.getTime() ? "Overdue" : "Due";
      return { ...s, previousDue, totalDue, dueDate, status };
    });

    return rows.sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [orders, customer]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(statements.length / perPage)));
  const paged = statements.slice((safePage - 1) * perPage, safePage * perPage);
  const selected = selectedKey ? statements.find((s) => s.key === selectedKey) ?? null : null;

  useEffect(() => {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    setPayInput("");
  }, [selectedKey]);

  function paidOf(key: string): number {
    return Math.max(0, payments[key] ?? 0);
  }

  function balanceOf(row: StatementRow): number {
    return Math.max(0, row.totalDue - paidOf(row.key));
  }

  function paymentStatusOf(row: StatementRow): "Paid" | "Partial" | "Unpaid" {
    const paid = paidOf(row.key);
    if (paid <= 0) return "Unpaid";
    if (paid >= row.totalDue) return "Paid";
    return "Partial";
  }

  function addPaymentForSelected() {
    if (!selected) return;
    const amount = Number(payInput);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setPayments((prev) => {
      const current = prev[selected.key] ?? 0;
      const next = Math.min(selected.totalDue, current + amount);
      return { ...prev, [selected.key]: next };
    });
    setPayInput("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Billing cycle statements</h1>
        <p className="text-sm text-slate-600">
          Customer-wise weekly bills with invoice totals, previous due carry-over, and status.
        </p>
      </div>

      <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 shadow-card">
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">Cycle</p>
            <p className="text-sm font-semibold">Weekly (Sunday - Saturday)</p>
          </div>
          <label className="text-xs text-slate-600">
            Customer
            <select
              value={customer}
              onChange={(e) => {
                setCustomer(e.target.value);
                setPage(1);
                setSelectedKey(null);
              }}
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

        <div className="mt-3 overflow-hidden rounded-2xl border border-violet-200">
          <table className="w-full text-left text-base">
            <thead className="bg-violet-100/80 text-sm uppercase tracking-wide text-violet-900">
              <tr>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2">Invoices</th>
                <th className="px-3 py-2 text-right">Invoice total</th>
                <th className="px-3 py-2 text-right">Previous due</th>
                <th className="px-3 py-2 text-right">Total due</th>
                <th className="px-3 py-2">Due status</th>
                <th className="px-3 py-2">Payment</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr
                  key={r.key}
                  onClick={() => setSelectedKey(r.key)}
                  className={`cursor-pointer border-t border-violet-100 ${
                    selected?.key === r.key ? "bg-blue-50" : r.status === "Overdue" ? "bg-red-50/60" : "bg-white"
                  }`}
                >
                  <td className="px-3 py-3.5 font-semibold">{r.customer}</td>
                  <td className="px-3 py-3.5">
                    {formatIso(r.start)} to {formatIso(r.end)}
                  </td>
                  <td className="px-3 py-3.5">{r.invoiceCount}</td>
                  <td className="px-3 py-3.5 text-right">৳ {Math.round(r.invoiceTotal).toLocaleString("en-US")}</td>
                  <td className="px-3 py-3.5 text-right">৳ {Math.round(r.previousDue).toLocaleString("en-US")}</td>
                  <td className="px-3 py-3.5 text-right font-semibold">
                    ৳ {Math.round(r.totalDue).toLocaleString("en-US")}
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "Overdue" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        paymentStatusOf(r) === "Paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : paymentStatusOf(r) === "Partial"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {paymentStatusOf(r)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedKey(r.key);
                      }}
                      className="rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-3 py-1.5 text-xs font-semibold text-white hover:from-slate-800 hover:to-indigo-700"
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationControls
          totalItems={statements.length}
          page={safePage}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(size) => {
            setPerPage(size);
            setPage(1);
          }}
        />
      </div>

      {selected ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="text-sm font-semibold">Statement details</h2>
          <div className="mt-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
            {selected.customer} · {formatIso(selected.start)} to {formatIso(selected.end)} · Due{" "}
            {formatIso(selected.dueDate)}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <MiniStat label="Invoice total" value={`৳ ${Math.round(selected.invoiceTotal).toLocaleString("en-US")}`} />
            <MiniStat label="Previous due carry-over" value={`৳ ${Math.round(selected.previousDue).toLocaleString("en-US")}`} />
            <MiniStat label="Total bill due" value={`৳ ${Math.round(selected.totalDue).toLocaleString("en-US")}`} strong />
            <MiniStat label="Paid (statement-wise)" value={`৳ ${Math.round(paidOf(selected.key)).toLocaleString("en-US")}`} />
            <MiniStat label="Balance due" value={`৳ ${Math.round(balanceOf(selected)).toLocaleString("en-US")}`} strong />
            <MiniStat label="Payment status" value={paymentStatusOf(selected)} />
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs text-slate-600">Record payment to this weekly statement</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0}
                value={payInput}
                onChange={(e) => setPayInput(e.target.value)}
                placeholder="Enter received amount"
                className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addPaymentForSelected}
                className="rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-3 py-2 text-xs font-semibold text-white"
              >
                Add payment
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-violet-200">
            <table className="w-full text-left text-base">
              <thead className="bg-violet-100/80 text-sm uppercase tracking-wide text-violet-900">
                <tr>
                  <th className="px-3 py-2">Invoice/Order</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selected.invoices.map((inv) => (
                  <tr key={`${selected.key}-${inv.orderNo}`} className="border-t border-violet-100 bg-white/95">
                    <td className="px-3 py-3.5 font-semibold">{inv.orderNo}</td>
                    <td className="px-3 py-3.5">{inv.orderDate}</td>
                    <td className="px-3 py-3.5 text-right">৳ {Math.round(inv.amount).toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 shadow-card">
          Click <strong>View details</strong> in any statement row to open details.
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm ${strong ? "font-bold text-brand-dark" : "font-semibold"}`}>{value}</p>
    </div>
  );
}

function parseIso(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfCycle(date: Date, cycleDays: 7 | 14): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const sunday = new Date(d);
  sunday.setDate(sunday.getDate() - sunday.getDay());
  if (cycleDays === 7) return sunday;

  const anchor = new Date("2026-01-04T00:00:00");
  const diffDays = Math.floor((sunday.getTime() - anchor.getTime()) / 86_400_000);
  const blockIndex = Math.floor(diffDays / 14);
  const start = new Date(anchor);
  start.setDate(anchor.getDate() + blockIndex * 14);
  return start;
}

function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
