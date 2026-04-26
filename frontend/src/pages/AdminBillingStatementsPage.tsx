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
  const [viewMode, setViewMode] = useState<"active" | "history">("active");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [adjustKey, setAdjustKey] = useState<string | null>(null);
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
  const [adjustInput, setAdjustInput] = useState("");

  const customers = useMemo(
    () =>
      [...new Set(orders.map((o) => o.contactPerson?.trim()).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b))),
    [orders],
  );

  const statements = useMemo(() => {
    const cycleDays = 7 as const;
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

  useEffect(() => {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  }, [payments]);

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

  const activeStatements = useMemo(
    () =>
      statements.filter((row) => {
        const fullyPaid = paymentStatusOf(row) === "Paid";
        const olderThanSixWeeks = isOlderThanDays(row.end, 42);
        return !(fullyPaid && olderThanSixWeeks);
      }),
    [statements, payments],
  );

  const historyStatements = useMemo(
    () =>
      statements.filter((row) => {
        const fullyPaid = paymentStatusOf(row) === "Paid";
        const olderThanSixWeeks = isOlderThanDays(row.end, 42);
        return fullyPaid && olderThanSixWeeks;
      }),
    [statements, payments],
  );

  const listSource = viewMode === "active" ? activeStatements : historyStatements;
  const safePage = Math.min(page, Math.max(1, Math.ceil(listSource.length / perPage)));
  const paged = listSource.slice((safePage - 1) * perPage, safePage * perPage);
  const selected = selectedKey ? listSource.find((s) => s.key === selectedKey) ?? null : null;
  const adjusting = adjustKey ? statements.find((s) => s.key === adjustKey) ?? null : null;

  function openAdjustModal(row: StatementRow) {
    setAdjustKey(row.key);
    setAdjustInput("");
  }

  function saveAdjustedPayment() {
    if (!adjusting) return;
    const amount = Number(adjustInput);
    if (!Number.isFinite(amount) || amount < 0) return;
    const bounded = Math.min(adjusting.totalDue, amount);
    setPayments((prev) => ({ ...prev, [adjusting.key]: bounded }));
    setAdjustKey(null);
    setAdjustInput("");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Billing cycle statements</h1>
        <p className="text-sm text-slate-600">
          Customer-wise weekly bills with invoice totals, previous due carry-over, and due status. Tables scroll when
          there are many rows or on narrow screens.
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setViewMode("active");
              setPage(1);
              setSelectedKey(null);
            }}
            className={
              viewMode === "active"
                ? "rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                : "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            }
          >
            Active ({activeStatements.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode("history");
              setPage(1);
              setSelectedKey(null);
            }}
            className={
              viewMode === "history"
                ? "rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                : "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            }
          >
            History ({historyStatements.length})
          </button>
        </div>

        <div className="table-scroll mt-3 max-h-[min(70vh,640px)] rounded-2xl border border-border shadow-inner">
          <table className="min-w-[1080px] w-full text-left text-base">
            <thead className="sticky top-0 z-10 border-b border-border bg-muted text-xs font-bold uppercase tracking-wide text-foreground shadow-sm">
              <tr>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Period</th>
                <th className="px-4 py-3.5">Invoices</th>
                <th className="px-4 py-3.5 text-right">Total due</th>
                <th className="px-4 py-3.5 text-right">Paid</th>
                <th className="px-4 py-3.5 text-right">Balance</th>
                <th className="px-4 py-3.5">Due status</th>
                <th className="px-4 py-3.5">Payment</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr
                  key={r.key}
                  onClick={() => setSelectedKey(r.key)}
                  className={`cursor-pointer border-t border-border ${
                    selected?.key === r.key ? "bg-muted" : r.status === "Overdue" ? "bg-red-50" : "bg-card"
                  }`}
                >
                  <td className="px-3 py-3.5 font-semibold">{r.customer}</td>
                  <td className="px-3 py-3.5">
                    {formatIso(r.start)} to {formatIso(r.end)}
                    <span className="ml-1 text-xs text-slate-500">· Due {formatIso(r.dueDate)}</span>
                  </td>
                  <td className="px-3 py-3.5">{r.invoiceCount}</td>
                  <td className="px-3 py-3.5 text-right font-semibold">
                    ৳ {Math.round(r.totalDue).toLocaleString("en-US")}
                  </td>
                  <td className="px-3 py-3.5 text-right">৳ {Math.round(paidOf(r.key)).toLocaleString("en-US")}</td>
                  <td className="px-3 py-3.5 text-right font-semibold">
                    ৳ {Math.round(balanceOf(r)).toLocaleString("en-US")}
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
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedKey(r.key);
                        }}
                        className="relative z-[1] inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAdjustModal(r);
                        }}
                        className="relative z-[1] inline-flex rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
                      >
                        Adjust
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 ? (
                <tr className="border-t border-border bg-card">
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                    {viewMode === "active"
                      ? "No active statements found."
                      : "No history statements found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <PaginationControls
          totalItems={listSource.length}
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
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailStat label="Invoice total" value={`৳ ${Math.round(selected.invoiceTotal).toLocaleString("en-US")}`} />
              <DetailStat
                label="Previous due carry-over"
                value={`৳ ${Math.round(selected.previousDue).toLocaleString("en-US")}`}
              />
              <DetailStat label="Total bill due" value={`৳ ${Math.round(selected.totalDue).toLocaleString("en-US")}`} />
              <DetailStat label="Paid (statement-wise)" value={`৳ ${Math.round(paidOf(selected.key)).toLocaleString("en-US")}`} />
              <DetailStat label="Balance due" value={`৳ ${Math.round(balanceOf(selected)).toLocaleString("en-US")}`} />
              <DetailStat label="Payment status" value={paymentStatusOf(selected)} />
            </div>
          </div>

          <div className="table-scroll mt-3 max-h-[min(50vh,420px)] rounded-2xl border border-border shadow-inner">
            <table className="min-w-[480px] w-full text-left text-base">
              <thead className="sticky top-0 z-10 border-b border-border bg-muted text-sm font-semibold uppercase tracking-wide text-foreground shadow-sm">
                <tr>
                  <th className="px-3 py-2">Invoice/Order</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selected.invoices.map((inv) => (
                  <tr key={`${selected.key}-${inv.orderNo}`} className="border-t border-border bg-card">
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

      {adjusting ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900">Adjust payment</h3>
            <p className="mt-2 text-base text-slate-600">
              {adjusting.customer} · {formatIso(adjusting.start)} to {formatIso(adjusting.end)}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Total due</p>
                <p className="font-semibold text-slate-900">৳ {Math.round(adjusting.totalDue).toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Paid</p>
                <p className="font-semibold text-slate-900">৳ {Math.round(paidOf(adjusting.key)).toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Balance</p>
                <p className="font-semibold text-slate-900">৳ {Math.round(balanceOf(adjusting)).toLocaleString("en-US")}</p>
              </div>
            </div>
            <label className="mt-5 block text-sm font-semibold text-slate-600">
              Set paid amount
              <input
                type="number"
                min={0}
                max={Math.round(adjusting.totalDue)}
                value={adjustInput}
                onChange={(e) => setAdjustInput(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg"
                placeholder="Enter total paid amount"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setAdjustKey(null);
                  setAdjustInput("");
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-base font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAdjustedPayment}
                className="rounded-lg bg-slate-700 px-4 py-2 text-base font-semibold text-white hover:bg-slate-600"
              >
                Save adjustment
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isOlderThanDays(date: Date, days: number): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((now.getTime() - target.getTime()) / 86_400_000);
  return diffDays > days;
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

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}
