import { useEffect, useMemo, useState } from "react";
import { PaginationControls } from "../components/PaginationControls";
import { useOrders } from "../context/OrdersContext";
import {
  apiApplyStatementBooking,
  apiGetBillingCycleConfig,
  apiListAdjustments,
  apiListPayments,
  formatPaymentHistoryWhen,
  type AdjustmentTxn,
  type PaymentTxn,
  apiEnabled,
} from "../lib/api";
import { DEFAULT_BILLING_CYCLE_CONFIG, startOfCycle, type BillingCycleConfig } from "../lib/billingCycle";
import { applyPaymentAwareCarryover } from "../lib/statementCarryover";
import { resolvePaymentTxnEffectiveType } from "../lib/paymentTxnType";
import {
  invoiceCapForStatement,
  netPaidAppliedOnOrder,
  orderNumericId,
  ordersForStatementInvoices,
  planAdjustmentDecreaseChunks,
  planPaymentIncreaseChunks,
  resolveStatementTxnBucketMeta,
  statementBucketKeyForTxn,
  totalPaymentRoomOnOrders,
} from "../lib/statementPaymentAllocation";
import type { Order } from "../types";

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

/** Cumulative total after save: current paid + pay now, clamped to [0, totalDue]. */
function previewPaidAfterPayNow(totalDue: number, currentPaid: number, payNowRaw: string): number | null {
  const t = payNowRaw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  const sum = Math.round((currentPaid + n) * 100) / 100;
  return Math.round(Math.min(totalDue, Math.max(0, sum)) * 100) / 100;
}

export function AdminBillingStatementsPage() {
  const { orders, loadOrders } = useOrders();
  const [customer, setCustomer] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewMode, setViewMode] = useState<"active" | "history">("active");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [adjustRow, setAdjustRow] = useState<StatementRow | null>(null);
  const [transactions, setTransactions] = useState<{ payments: PaymentTxn[]; adjustments: AdjustmentTxn[] }>({
    payments: [],
    adjustments: [],
  });
  const [adjustPayNowInput, setAdjustPayNowInput] = useState("");
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [cycleConfig, setCycleConfig] = useState<BillingCycleConfig>(DEFAULT_BILLING_CYCLE_CONFIG);

  const customers = useMemo(
    () =>
      [...new Set(orders.map((o) => o.contactPerson?.trim()).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b))),
    [orders],
  );

  useEffect(() => {
    if (!apiEnabled()) return;
    void apiGetBillingCycleConfig()
      .then(setCycleConfig)
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  useEffect(() => {
    if (!apiEnabled()) return;
    void Promise.all([apiListPayments(), apiListAdjustments()])
      .then(([payments, adjustments]) => setTransactions({ payments, adjustments }))
      .catch(() => setTransactions({ payments: [], adjustments: [] }));
  }, [cycleConfig.cycleDays, cycleConfig.weekStartDay]);

  const paymentsByKey = useMemo(() => {
    const map = new Map<string, number>();
    transactions.payments
      .filter((txn) => resolvePaymentTxnEffectiveType(txn) === "billing")
      .forEach((txn) => {
        const meta = resolveStatementTxnBucketMeta(txn, orders);
        if (!meta) return;
        const dt = parseIso(meta.orderDateKey);
        if (!dt) return;
        const cycleStart = startOfCycle(dt, cycleConfig.cycleDays, cycleConfig.weekStartDay);
        const key = `${formatIso(cycleStart)}::${meta.customer}`;
        map.set(key, (map.get(key) ?? 0) + Number(txn.amount || 0));
      });
    transactions.adjustments
      .filter((txn) => txn.type === "billing")
      .forEach((txn) => {
        const meta = resolveStatementTxnBucketMeta(txn, orders);
        if (!meta) return;
        const dt = parseIso(meta.orderDateKey);
        if (!dt) return;
        const cycleStart = startOfCycle(dt, cycleConfig.cycleDays, cycleConfig.weekStartDay);
        const key = `${formatIso(cycleStart)}::${meta.customer}`;
        map.set(key, (map.get(key) ?? 0) - Number(txn.amount || 0));
      });
    return map;
  }, [transactions, cycleConfig, orders]);

  const statements = useMemo(() => {
    const cycleDays = cycleConfig.cycleDays;
    const weekStart = cycleConfig.weekStartDay;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only orders with a generated billing invoice and a billing total (see invoiceFlow / API flags).
    const eligible = orders
      .filter((o) => o.billingInvoiceGenerated)
      .filter((o) => billingStatementAmount(o) > 0)
      .filter((o) => (customer === "all" ? true : o.contactPerson === customer))
      .sort((a, b) => a.orderDate.localeCompare(b.orderDate));

    const bucket = new Map<
      string,
      { customer: string; start: Date; end: Date; total: number; invoices: StatementRow["invoices"] }
    >();

    for (const o of eligible) {
      const d = parseIso(o.orderDate);
      if (!d) continue;
      const start = startOfCycle(d, cycleDays, weekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + cycleDays - 1);
      const c = (o.contactPerson ?? "").trim() || "Unknown customer";
      const key = `${formatIso(start)}::${c}`;
      const prev = bucket.get(key);
      const lineAmt = billingStatementAmount(o);
      bucket.set(key, {
        customer: c,
        start,
        end,
        total: (prev?.total ?? 0) + lineAmt,
        invoices: [
          ...(prev?.invoices ?? []),
          { orderNo: o.orderNo, orderDate: o.orderDate, amount: lineAmt },
        ],
      });
    }

    const bucketRows = [...bucket.entries()].map(([key, v]) => ({
      key,
      customer: v.customer,
      start: v.start,
      end: v.end,
      invoiceCount: v.invoices.length,
      invoiceTotal: v.total,
      invoices: v.invoices,
    }));

    const netPaid = (k: string) => Math.max(0, paymentsByKey.get(k) ?? 0);
    const withCarry = applyPaymentAwareCarryover(bucketRows, netPaid);

    const rows: StatementRow[] = withCarry.map((s) => {
      const dueDate = new Date(s.end);
      dueDate.setDate(dueDate.getDate() + cycleDays);
      const status: StatementRow["status"] = dueDate.getTime() < today.getTime() ? "Overdue" : "Due";
      return { ...s, dueDate, status };
    });

    return rows.sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [orders, customer, cycleConfig, paymentsByKey]);

  function paidOf(key: string): number {
    return Math.max(0, paymentsByKey.get(key) ?? 0);
  }

  function balanceOf(row: StatementRow): number {
    return Math.max(0, roundMoney(row.totalDue) - roundMoney(paidOf(row.key)));
  }

  function paymentStatusOf(row: StatementRow): "Paid" | "Partial" | "Unpaid" {
    const paid = roundMoney(paidOf(row.key));
    const due = roundMoney(row.totalDue);
    if (paid <= 0) return "Unpaid";
    if (paid >= due - 0.01) return "Paid";
    return "Partial";
  }

  /** Calendar deadline vs today, but once balance is cleared do not keep showing Overdue. */
  function scheduleDueLabel(row: StatementRow): "Due" | "Overdue" | "Paid" {
    if (paymentStatusOf(row) === "Paid") return "Paid";
    return row.status;
  }

  const adjustPayPreview = useMemo(() => {
    if (!adjustRow) return { cur: 0, next: null as number | null };
    const cur = roundMoney(paidOf(adjustRow.key));
    return {
      cur,
      next: previewPaidAfterPayNow(adjustRow.totalDue, cur, adjustPayNowInput),
    };
  }, [adjustRow, adjustPayNowInput, transactions.payments, transactions.adjustments, paymentsByKey]);

  const dateRangeFiltered = useMemo(() => {
    const fromKey = fromDate.trim() || null;
    const toKey = toDate.trim() || null;
    return statements.filter((row) => {
      const startKey = formatIso(row.start);
      const endKey = formatIso(row.end);
      if (fromKey && endKey < fromKey) return false;
      if (toKey && startKey > toKey) return false;
      return true;
    });
  }, [statements, fromDate, toDate]);

  const activeStatements = useMemo(
    () =>
      dateRangeFiltered.filter((row) => {
        const fullyPaid = paymentStatusOf(row) === "Paid";
        const olderThanSixWeeks = isOlderThanDays(row.end, 42);
        return !(fullyPaid && olderThanSixWeeks);
      }),
    [dateRangeFiltered, paymentsByKey],
  );

  const historyStatements = useMemo(
    () =>
      dateRangeFiltered.filter((row) => {
        const fullyPaid = paymentStatusOf(row) === "Paid";
        const olderThanSixWeeks = isOlderThanDays(row.end, 42);
        return fullyPaid && olderThanSixWeeks;
      }),
    [dateRangeFiltered, paymentsByKey],
  );

  const listSource = viewMode === "active" ? activeStatements : historyStatements;
  const safePage = Math.min(page, Math.max(1, Math.ceil(listSource.length / perPage)));
  const paged = listSource.slice((safePage - 1) * perPage, safePage * perPage);
  const selected = selectedKey ? listSource.find((s) => s.key === selectedKey) ?? null : null;

  const selectedPerOrderBilling = useMemo(() => {
    if (!selected) return [];
    return selected.invoices.map((inv) => {
      const o = orders.find((x) => x.orderNo === inv.orderNo);
      const oid = o ? orderNumericId(o) : null;
      const invoiceAmt = inv.amount;
      const cap = o ? invoiceCapForStatement(o, "billing") : invoiceAmt;
      const net =
        oid != null ? netPaidAppliedOnOrder(oid, "billing", transactions.payments, transactions.adjustments) : 0;
      const due = Math.max(0, roundMoney(cap) - roundMoney(net));
      return {
        orderNo: inv.orderNo,
        orderDate: inv.orderDate,
        cap,
        invoiceAmt,
        net,
        due,
        hasOrder: Boolean(o),
      };
    });
  }, [selected, orders, transactions.payments, transactions.adjustments]);

  const statementBillingHistoryRows = useMemo(() => {
    if (!selected) return [];
    const key = selected.key;
    type H = {
      kind: "payment" | "adjustment";
      id: number;
      at: string;
      orderDate: string | null;
      orderLabel: string;
      amount: number;
      note: string;
    };
    const rows: H[] = [];
    for (const p of transactions.payments) {
      if (resolvePaymentTxnEffectiveType(p) !== "billing") continue;
      if (statementBucketKeyForTxn(p, orders, cycleConfig, "billing") !== key) continue;
      rows.push({
        kind: "payment",
        id: p.id,
        at: p.created_at || "",
        orderDate: p.order_date ?? null,
        orderLabel: p.order_no?.trim() ? String(p.order_no) : p.order_id != null ? `#${p.order_id}` : "—",
        amount: Number(p.amount ?? 0),
        note: p.note?.trim() ? p.note : "—",
      });
    }
    for (const a of transactions.adjustments) {
      if (a.type !== "billing") continue;
      if (statementBucketKeyForTxn(a, orders, cycleConfig, "billing") !== key) continue;
      rows.push({
        kind: "adjustment",
        id: a.id,
        at: a.created_at || "",
        orderDate: a.order_date ?? null,
        orderLabel: a.order_no?.trim() ? String(a.order_no) : a.order_id != null ? `#${a.order_id}` : "—",
        amount: Number(a.amount ?? 0),
        note: a.reason?.trim() ? a.reason : "—",
      });
    }
    rows.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : b.id - a.id));
    return rows;
  }, [selected, transactions.payments, transactions.adjustments, orders, cycleConfig]);

  useEffect(() => {
    if (!selected) setPaymentHistoryOpen(false);
  }, [selected]);

  function openAdjustModal(row: StatementRow) {
    setAdjustRow({ ...row, invoices: [...row.invoices] });
    setAdjustPayNowInput("");
    setSaveError(null);
    setSaveSuccess(null);
  }

  function saveAdjustedPayment() {
    const adj = adjustRow;
    if (!adj) return;
    if (!apiEnabled()) {
      setSaveError("Recording payments requires the API. Set VITE_API_BASE_URL and reload.");
      setSaveSuccess(null);
      return;
    }
    if (!adjustPayNowInput.trim()) {
      setSaveError(
        "Enter how much you are paying now (৳). Total paid after save is shown below; it is capped by total due. Use a negative number only to reduce recorded paid.",
      );
      setSaveSuccess(null);
      return;
    }
    if (!Number.isFinite(Number(adjustPayNowInput.trim()))) {
      setSaveError("Enter a valid number for the payment amount.");
      setSaveSuccess(null);
      return;
    }
    const current = roundMoney(paidOf(adj.key));
    const bounded = previewPaidAfterPayNow(adj.totalDue, current, adjustPayNowInput);
    if (bounded == null) {
      setSaveError("Could not compute new total paid. Check the amount paying now.");
      setSaveSuccess(null);
      return;
    }
    const delta = roundMoney(bounded - current);
    if (delta === 0) {
      setSaveError("That leaves total paid unchanged. Enter a different amount paying now, or cancel.");
      setSaveSuccess(null);
      return;
    }
    const cust = adj.customer.trim();
    let cycleOrders = ordersForStatementInvoices(adj.invoices, orders, cust);
    if (cycleOrders.length === 0 && adj.invoices.length > 0) {
      const loose = adj.invoices
        .map((inv) => orders.find((o) => o.orderNo === inv.orderNo))
        .filter((o): o is Order => Boolean(o));
      cycleOrders = [...new Map(loose.map((o) => [o.id, o])).values()].sort((a, b) =>
        a.orderDate.localeCompare(b.orderDate),
      );
    }
    if (cycleOrders.length === 0) {
      setSaveError("Unable to resolve orders for this statement. Please refresh and try again.");
      setSaveSuccess(null);
      return;
    }

    setSaveError(null);
    setSaveSuccess(null);

    const run = async () => {
      try {
        let paymentChunks: Array<{ orderId: number; amount: number }> = [];
        let adjustmentChunks: Array<{ orderId: number; amount: number }> = [];
        if (delta > 0.001) {
          const room = totalPaymentRoomOnOrders(
            cycleOrders,
            "billing",
            transactions.payments,
            transactions.adjustments,
          );
          if (delta > room + 0.02) {
            setSaveError(
              `You can record at most ৳ ${Math.round(room).toLocaleString("en-US")} against billing invoices in this cycle (per-order limits). Statement total due is ৳ ${Math.round(adj.totalDue).toLocaleString("en-US")} — if that includes previous-cycle carryover, record payments on those cycles or reduce total due before paying more here.`,
            );
            return;
          }
          const chunks = planPaymentIncreaseChunks(
            cycleOrders,
            "billing",
            delta,
            transactions.payments,
            transactions.adjustments,
          );
          if (chunks.length === 0) {
            setSaveError("No valid order IDs to record payments against.");
            return;
          }
          const sum = roundMoney(chunks.reduce((s, c) => s + c.amount, 0));
          if (sum + 0.02 < delta) {
            setSaveError(
              `Could not allocate ৳ ${Math.round(delta).toLocaleString("en-US")} across orders (allocated ৳ ${Math.round(sum).toLocaleString("en-US")}).`,
            );
            return;
          }
          paymentChunks = chunks.map((c) => ({ orderId: c.orderId, amount: c.amount }));
        } else if (delta < -0.001) {
          const adjChunks = planAdjustmentDecreaseChunks(
            cycleOrders,
            "billing",
            delta,
            transactions.payments,
            transactions.adjustments,
          );
          if (adjChunks.length === 0) {
            setSaveError("No recorded payments to reduce for these orders.");
            return;
          }
          const need = roundMoney(Math.abs(delta));
          const sum = roundMoney(adjChunks.reduce((s, c) => s + c.amount, 0));
          if (sum + 0.02 < need) {
            setSaveError(
              `Cannot reduce recorded payments by ৳ ${Math.round(need).toLocaleString("en-US")} — only ৳ ${Math.round(sum).toLocaleString("en-US")} can be adjusted back.`,
            );
            return;
          }
          adjustmentChunks = adjChunks.map((c) => ({ orderId: c.orderId, amount: c.amount }));
        } else {
          return;
        }
        await apiApplyStatementBooking({
          type: "billing",
          payments: paymentChunks,
          adjustments: adjustmentChunks,
          paymentNote: `Billing statement payment (${adj.customer})`,
          adjustmentReason: `Billing statement correction (${adj.customer})`,
        });
        const [payments, adjustments] = await Promise.all([apiListPayments(), apiListAdjustments()]);
        setTransactions({ payments, adjustments });
        await loadOrders();
        let msg = "Saved successfully.";
        if (
          viewMode === "active" &&
          roundMoney(bounded) >= roundMoney(adj.totalDue) - 0.01 &&
          isOlderThanDays(adj.end, 42)
        ) {
          setViewMode("history");
          setPage(1);
          setSelectedKey(null);
          msg = "Saved successfully. Fully paid statement moved to History.";
        }
        setSaveSuccess(msg);
        setAdjustRow(null);
        setAdjustPayNowInput("");
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "Failed to save adjustment");
      }
    };
    void run();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Billing cycle statements</h1>
        <p className="text-sm text-slate-600">
          Customer-wise cycle totals with previous due carry-over and due status. Previous due is unpaid balance
          from older cycles (after payments), not a second copy of old invoice totals.{" "}
          <span className="font-medium text-slate-800">
            Only orders that have a billing invoice generated are included
          </span>{" "}
          (separate from purchase invoices). Tables scroll when there are many rows or on narrow screens.
        </p>
        {saveSuccess ? <p className="mt-1 text-sm font-semibold text-emerald-700">{saveSuccess}</p> : null}
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
        <div className="grid gap-2 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">Cycle</p>
            <p className="text-sm font-semibold">{cycleConfig.label}</p>
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
          <label className="text-xs text-slate-600">
            From date
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
                setSelectedKey(null);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-slate-600">
            To date
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
                setSelectedKey(null);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
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
                <th className="px-4 py-3.5"># billing inv.</th>
                <th className="px-4 py-3.5 text-right">Total due</th>
                <th className="px-4 py-3.5 text-right">Paid (billing)</th>
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
                    selected?.key === r.key
                      ? "bg-muted"
                      : scheduleDueLabel(r) === "Overdue"
                        ? "bg-red-50"
                        : "bg-card"
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
                        scheduleDueLabel(r) === "Overdue"
                          ? "bg-red-100 text-red-700"
                          : scheduleDueLabel(r) === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {scheduleDueLabel(r)}
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
                        title="Record billing payment or billing adjustment for this cycle"
                      >
                        Adjust (billing)
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
          <h2 className="text-sm font-semibold">Billing statement details</h2>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
              {selected.customer} · {formatIso(selected.start)} to {formatIso(selected.end)} · Due{" "}
              {formatIso(selected.dueDate)}
            </div>
            <button
              type="button"
              onClick={() => setPaymentHistoryOpen(true)}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Payment history
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Totals below are from <strong>customer billing invoices</strong> in this cycle.{" "}
            <strong>Paid</strong> is net billing collections for this statement (supplier purchase side is separate).
          </p>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailStat
                label="Billing invoice total (cycle)"
                value={`৳ ${Math.round(selected.invoiceTotal).toLocaleString("en-US")}`}
              />
              <DetailStat
                label="Previous due carry-over"
                value={`৳ ${Math.round(selected.previousDue).toLocaleString("en-US")}`}
              />
              <DetailStat label="Total bill due" value={`৳ ${Math.round(selected.totalDue).toLocaleString("en-US")}`} />
              <DetailStat
                label="Paid (this cycle)"
                value={`৳ ${Math.round(paidOf(selected.key)).toLocaleString("en-US")}`}
              />
              <DetailStat label="Balance due" value={`৳ ${Math.round(balanceOf(selected)).toLocaleString("en-US")}`} />
              <DetailStat label="Payment status" value={paymentStatusOf(selected)} />
            </div>
          </div>

          <div className="table-scroll mt-3 max-h-[min(40vh,320px)] rounded-2xl border border-border shadow-inner">
            <table className="min-w-[720px] w-full text-left text-base">
              <caption className="px-3 py-2 text-left text-xs font-semibold text-slate-700">
                Per-order billing settlement (invoice date, cap, net paid, still due)
              </caption>
              <thead className="sticky top-0 z-10 border-b border-border bg-muted text-sm font-semibold uppercase tracking-wide text-foreground shadow-sm">
                <tr>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Order date</th>
                  <th className="px-3 py-2 text-right">Invoice cap</th>
                  <th className="px-3 py-2 text-right">Net paid (billing)</th>
                  <th className="px-3 py-2 text-right">Still due (order)</th>
                </tr>
              </thead>
              <tbody>
                {selectedPerOrderBilling.map((row) => (
                  <tr key={row.orderNo} className="border-t border-border bg-card">
                    <td className="px-3 py-3 font-semibold">
                      {row.orderNo}
                      {!row.hasOrder ? <span className="ml-1 text-xs font-normal text-amber-700">(order not in list)</span> : null}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-700">{row.orderDate}</td>
                    <td className="px-3 py-3 text-right">৳ {Math.round(row.cap).toLocaleString("en-US")}</td>
                    <td className="px-3 py-3 text-right">৳ {Math.round(row.net).toLocaleString("en-US")}</td>
                    <td className="px-3 py-3 text-right font-semibold">৳ {Math.round(row.due).toLocaleString("en-US")}</td>
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

      {paymentHistoryOpen && selected ? (
        <div
          className="fixed inset-0 z-[290] flex items-center justify-center bg-slate-900/35 p-4"
          onClick={() => setPaymentHistoryOpen(false)}
          role="presentation"
        >
          <div
            className="max-h-[min(85vh,720px)] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="billing-payment-history-title"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 id="billing-payment-history-title" className="text-lg font-bold text-slate-900">
                  Payment history
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Billing payments and adjustments in <strong>this statement&apos;s cycle bucket</strong> (same period as
                  the row you selected). Table From/To only filters which rows appear; this list always matches the
                  selected cycle.
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {selected.customer} · {formatIso(selected.start)} to {formatIso(selected.end)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentHistoryOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="table-scroll max-h-[min(60vh,520px)] overflow-auto px-2 pb-4">
              <table className="min-w-[640px] w-full text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
                  <tr>
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2 text-right">Amount (৳)</th>
                    <th className="px-3 py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {statementBillingHistoryRows.map((r) => (
                    <tr key={`${r.kind}-${r.id}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                        {formatPaymentHistoryWhen({ created_at: r.at, order_date: r.orderDate })}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            r.kind === "payment"
                              ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                              : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
                          }
                        >
                          {r.kind === "payment" ? "Payment" : "Adjustment"}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{r.orderLabel}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">
                        {r.kind === "adjustment" ? "−" : ""}
                        {Math.round(r.amount).toLocaleString("en-US")}
                      </td>
                      <td className="max-w-[220px] px-3 py-2 text-xs text-slate-700 break-words">{r.note}</td>
                    </tr>
                  ))}
                  {statementBillingHistoryRows.length === 0 ? (
                    <tr className="border-t border-slate-100">
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                        No billing payments or adjustments in this cycle bucket yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {adjustRow ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900">Adjust billing statement</h3>
            <p className="mt-1 text-sm text-slate-600">
              Type only <strong>this payment</strong> in the red field (৳ paying now). The gray field shows{" "}
              <strong>total paid after save</strong> (current paid + this payment, capped by total due) that is what the
              server records. Payments are split across orders; reducing paid uses a negative “paying now” amount.
              Per-order caps are enforced by the server.
            </p>
            <p className="mt-2 text-base text-slate-600">
              {adjustRow.customer} · {formatIso(adjustRow.start)} to {formatIso(adjustRow.end)}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Total due</p>
                <p className="font-semibold text-slate-900">৳ {Math.round(adjustRow.totalDue).toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Paid</p>
                <p className="font-semibold text-slate-900">৳ {Math.round(paidOf(adjustRow.key)).toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Balance</p>
                <p className="font-semibold text-slate-900">৳ {Math.round(balanceOf(adjustRow)).toLocaleString("en-US")}</p>
              </div>
            </div>
            <label className="mt-5 block text-sm font-semibold text-slate-800">
              <span className="text-red-600">Amount paying now (৳)</span>
              <input
                type="text"
                inputMode="decimal"
                value={adjustPayNowInput}
                onChange={(e) => setAdjustPayNowInput(e.target.value)}
                className="mt-2 w-full rounded-xl border-2 border-red-300 bg-red-50/50 px-4 py-3 text-lg font-semibold text-red-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
                placeholder="e.g. 20"
                autoComplete="off"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-600">
              Total paid after save (read-only — sent on Save)
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={
                  adjustPayPreview.next == null
                    ? adjustPayNowInput.trim() === ""
                      ? `৳ ${Math.round(adjustPayPreview.cur).toLocaleString("en-US")} (current enter amount above)`
                      : "— (invalid number)"
                    : `৳ ${Math.round(adjustPayPreview.next).toLocaleString("en-US")}`
                }
                className="mt-2 w-full cursor-default rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-lg font-semibold text-slate-900"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              {saveSuccess ? <p className="mr-auto text-sm text-emerald-700">{saveSuccess}</p> : null}
              {saveError ? <p className="mr-auto text-sm text-rose-600">{saveError}</p> : null}
              <button
                type="button"
                onClick={() => {
                  setAdjustRow(null);
                  setAdjustPayNowInput("");
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-base font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveAdjustedPayment()}
                className="rounded-lg bg-slate-700 px-4 py-2 text-base font-semibold text-white hover:bg-slate-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
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

function billingStatementAmount(o: { grandTotal?: number; billingSubtotal?: number }): number {
  return Number(o.grandTotal ?? o.billingSubtotal ?? 0) || 0;
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
