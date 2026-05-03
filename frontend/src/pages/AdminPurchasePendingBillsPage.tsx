import { AlertTriangle, FileStack } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatMetricCard } from "../components/StatMetricCard";
import { useOrders } from "../context/OrdersContext";
import { PaginationControls } from "../components/PaginationControls";
import { BdTakaIcon } from "../components/icons/BdTakaIcon";
import { apiListAdjustments, apiListPayments, type AdjustmentTxn, type PaymentTxn } from "../lib/api";
import { resolvePaymentTxnEffectiveType } from "../lib/paymentTxnType";

type Range = "all" | "7d" | "30d" | "90d";

export function AdminPurchasePendingBillsPage() {
  const { orders } = useOrders();
  const [range, setRange] = useState<Range>("all");
  const [customer, setCustomer] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [transactions, setTransactions] = useState<{ payments: PaymentTxn[]; adjustments: AdjustmentTxn[] }>({
    payments: [],
    adjustments: [],
  });

  useEffect(() => {
    void Promise.all([apiListPayments(), apiListAdjustments()])
      .then(([payments, adjustments]) => setTransactions({ payments, adjustments }))
      .catch(() => setTransactions({ payments: [], adjustments: [] }));
  }, []);

  const purchaseInvoiced = useMemo(
    () => orders.filter((o) => o.purchaseInvoiceGenerated && (o.purchaseSubtotal ?? 0) > 0),
    [orders],
  );

  const customers = useMemo(
    () =>
      [...new Set(purchaseInvoiced.map((o) => o.contactPerson?.trim()).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b)),
      ),
    [purchaseInvoiced],
  );

  const rows = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const from = new Date(now);
    if (range === "7d") from.setDate(now.getDate() - 7);
    if (range === "30d") from.setDate(now.getDate() - 30);
    if (range === "90d") from.setDate(now.getDate() - 90);

    const invoiceRows = purchaseInvoiced
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
          total: o.purchaseSubtotal ?? 0,
          remaining: o.purchaseSubtotal ?? 0,
          overdueDays,
          isOverdue: overdueDays > 0,
        };
      })
      .sort((a, b) => a.issue.getTime() - b.issue.getTime());

    const paymentsByCustomer = new Map<string, number>();
    transactions.payments
      .filter((txn) => resolvePaymentTxnEffectiveType(txn) === "purchase")
      .forEach((txn) => {
        const customerName = txn.contact_person?.trim() || "Unknown";
        const amount = Number(txn.amount || 0);
        if (!Number.isFinite(amount) || amount <= 0) return;
        paymentsByCustomer.set(customerName, (paymentsByCustomer.get(customerName) ?? 0) + amount);
      });
    transactions.adjustments
      .filter((txn) => txn.type === "purchase")
      .forEach((txn) => {
        const customerName = txn.contact_person?.trim() || "Unknown";
        const amount = Number(txn.amount || 0);
        if (!Number.isFinite(amount) || amount <= 0) return;
        paymentsByCustomer.set(customerName, Math.max(0, (paymentsByCustomer.get(customerName) ?? 0) - amount));
      });

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

    return invoiceRows.filter((r) => r.remaining > 0).sort((a, b) => b.issue.getTime() - a.issue.getTime());
  }, [purchaseInvoiced, range, customer, transactions]);

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
        <h1 className="text-2xl font-bold">Purchase pending bills</h1>
        <p className="text-sm text-slate-600">
          Total unpaid purchase amount, pending invoices, overdue payments with customer/date filters.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatMetricCard
          title="Total unpaid amount"
          value={`৳ ${Math.round(totalUnpaid).toLocaleString("en-US")}`}
          icon={BdTakaIcon}
          tone="coral"
          sparkSeed="purchase-pending-total-unpaid"
        />
        <StatMetricCard
          title="Pending invoices"
          value={String(pendingCount)}
          icon={FileStack}
          tone="slate"
          sparkSeed="purchase-pending-count"
        />
        <StatMetricCard
          title="Overdue payments"
          value={String(overdueCount)}
          icon={AlertTriangle}
          tone="rose"
          sparkSeed="purchase-pending-overdue"
        />
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
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

        <div className="table-scroll mt-3 max-h-[min(70vh,640px)] rounded-2xl border border-border shadow-inner">
          <table className="min-w-[720px] w-full text-left text-base">
            <thead className="sticky top-0 z-10 border-b border-border bg-muted text-sm font-semibold uppercase tracking-wide text-foreground shadow-sm">
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
                <tr key={r.id} className={`border-t border-border ${r.isOverdue ? "bg-red-50" : "bg-card"}`}>
                  <td className="px-3 py-3.5 font-semibold">{r.orderNo}</td>
                  <td className="px-3 py-3.5 font-medium">{r.customer}</td>
                  <td className="px-3 py-3.5">{formatIso(r.issue)}</td>
                  <td className="px-3 py-3.5">{formatIso(r.due)}</td>
                  <td className="px-3 py-3.5 text-right font-semibold">৳ {Math.round(r.remaining).toLocaleString("en-US")}</td>
                  <td className="px-3 py-3.5">
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
