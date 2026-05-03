import { useEffect, useMemo, useState } from "react";
import { PaginationControls } from "../components/PaginationControls";
import { useOrders } from "../context/OrdersContext";
import { useAuth } from "../context/AuthContext";
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

interface PurchaseStatementRow {
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

/** After save we use this cumulative total (current paid + pay now), clamped to [0, totalDue]. */
function previewPaidAfterPayNow(totalDue: number, currentPaid: number, payNowRaw: string): number | null {
  const t = payNowRaw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  const sum = Math.round((currentPaid + n) * 100) / 100;
  return Math.round(Math.min(totalDue, Math.max(0, sum)) * 100) / 100;
}

export function PurchaseBillingStatementsPage() {
  const { orders, loadOrders } = useOrders();
  const { user } = useAuth();
  const [customer, setCustomer] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewMode, setViewMode] = useState<"active" | "history">("active");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  /** Snapshot when opening the modal so save still works after statements[] recomputes (payments, cycle config). */
  const [adjustRow, setAdjustRow] = useState<PurchaseStatementRow | null>(null);

  const [transactions, setTransactions] = useState<{ payments: PaymentTxn[]; adjustments: AdjustmentTxn[] }>({
    payments: [],
    adjustments: [],
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [adjustPayNowInput, setAdjustPayNowInput] = useState("");
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const canAdjust = user?.role === "admin";
  const [cycleConfig, setCycleConfig] = useState<BillingCycleConfig>(DEFAULT_BILLING_CYCLE_CONFIG);

  const customers = useMemo(
    () =>
      [...new Set(orders.map((o) => o.contactPerson?.trim()).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b)),
      ),
    [orders],
  );

  const viewingForGenerator = user?.role === "moderator" ? "moderator" : "all";

  const purchaseOrders = useMemo(() => {
    return orders
      .filter((o) => o.purchaseInvoiceGenerated)
      .filter((o) =>
        viewingForGenerator === "all"
          ? true
          : (o.purchaseInvoiceGeneratedBy ?? "admin") === viewingForGenerator,
      )
      .filter((o) => (customer === "all" ? true : o.contactPerson === customer))
      .filter((o) => (o.purchaseSubtotal ?? getPurchaseSubtotalFallback(o)) > 0)
      .sort((a, b) => a.orderDate.localeCompare(b.orderDate));
  }, [orders, customer, viewingForGenerator]);

  useEffect(() => {
    if (!apiEnabled()) return;
    void apiGetBillingCycleConfig()
      .then(setCycleConfig)
      .catch(() => {
        /* keep defaults */
      });
  }, []);

  useEffect(() => {
    if (!user || !apiEnabled()) return;
    void Promise.all([apiListPayments(), apiListAdjustments()])
      .then(([payments, adjustments]) => setTransactions({ payments, adjustments }))
      .catch(() => setTransactions({ payments: [], adjustments: [] }));
  }, [user, cycleConfig.cycleDays, cycleConfig.weekStartDay]);

  const paymentsByKey = useMemo(() => {
    const map = new Map<string, number>();
    transactions.payments
      .filter((txn) => resolvePaymentTxnEffectiveType(txn) === "purchase")
      .forEach((txn) => {
        const meta = resolveStatementTxnBucketMeta(txn, orders);
        if (!meta) return;
        const dt = parseIso(meta.orderDateKey);
        if (!dt) return;
        const cycleStart = startOfCycle(dt, cycleConfig.cycleDays, cycleConfig.weekStartDay);
        const key = `${formatIso(cycleStart)}::${meta.customer}::${viewingForGenerator}`;
        map.set(key, (map.get(key) ?? 0) + Number(txn.amount || 0));
      });
    transactions.adjustments
      .filter((txn) => txn.type === "purchase")
      .forEach((txn) => {
        const meta = resolveStatementTxnBucketMeta(txn, orders);
        if (!meta) return;
        const dt = parseIso(meta.orderDateKey);
        if (!dt) return;
        const cycleStart = startOfCycle(dt, cycleConfig.cycleDays, cycleConfig.weekStartDay);
        const key = `${formatIso(cycleStart)}::${meta.customer}::${viewingForGenerator}`;
        map.set(key, (map.get(key) ?? 0) - Number(txn.amount || 0));
      });
    return map;
  }, [transactions, viewingForGenerator, cycleConfig, orders]);

  const statements = useMemo(() => {
    const cycleDays = cycleConfig.cycleDays;
    const weekStart = cycleConfig.weekStartDay;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bucket = new Map<
      string,
      { customer: string; start: Date; end: Date; total: number; invoices: PurchaseStatementRow["invoices"] }
    >();

    for (const o of purchaseOrders) {
      const d = parseIso(o.orderDate);
      if (!d) continue;
      const start = startOfCycle(d, cycleDays, weekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + cycleDays - 1);
      const c = (o.contactPerson ?? "").trim() || "Unknown customer";
      const key = `${formatIso(start)}::${c}::${viewingForGenerator}`;
      const prev = bucket.get(key);
      const amount = o.purchaseSubtotal ?? getPurchaseSubtotalFallback(o);
      bucket.set(key, {
        customer: c,
        start,
        end,
        total: (prev?.total ?? 0) + amount,
        invoices: [...(prev?.invoices ?? []), { orderNo: o.orderNo, orderDate: o.orderDate, amount }],
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

    const rows: PurchaseStatementRow[] = withCarry.map((s) => {
      const dueDate = new Date(s.end);
      dueDate.setDate(dueDate.getDate() + cycleDays);
      const status: PurchaseStatementRow["status"] = dueDate.getTime() < today.getTime() ? "Overdue" : "Due";
      return { ...s, dueDate, status };
    });

    return rows.sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [purchaseOrders, cycleConfig, paymentsByKey, viewingForGenerator]);

  function paidOf(key: string): number {
    return Math.max(0, paymentsByKey.get(key) ?? 0);
  }

  function balanceOf(row: PurchaseStatementRow): number {
    return Math.max(0, roundMoney(row.totalDue) - roundMoney(paidOf(row.key)));
  }

  function paymentStatusOf(row: PurchaseStatementRow): "Paid" | "Partial" | "Unpaid" {
    const paid = roundMoney(paidOf(row.key));
    const due = roundMoney(row.totalDue);
    if (paid <= 0) return "Unpaid";
    if (paid >= due - 0.01) return "Paid";
    return "Partial";
  }

  /** Calendar deadline vs today, but once balance is cleared do not keep showing Overdue. */
  function scheduleDueLabel(row: PurchaseStatementRow): "Due" | "Overdue" | "Paid" {
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

  /** Calendar YYYY-MM-DD overlap (matches cycle boundaries from formatIso; avoids UTC drift from parseIso on date inputs). */
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

  const selectedPerOrderPurchase = useMemo(() => {
    if (!selected) return [];
    return selected.invoices.map((inv) => {
      const o = purchaseOrders.find((x) => x.orderNo === inv.orderNo);
      const oid = o ? orderNumericId(o) : null;
      const invoiceAmt = inv.amount;
      const cap = o ? invoiceCapForStatement(o, "purchase") : invoiceAmt;
      const net =
        oid != null ? netPaidAppliedOnOrder(oid, "purchase", transactions.payments, transactions.adjustments) : 0;
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
  }, [selected, purchaseOrders, transactions.payments, transactions.adjustments]);

  const statementPurchaseHistoryRows = useMemo(() => {
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
      if (resolvePaymentTxnEffectiveType(p) !== "purchase") continue;
      if (statementBucketKeyForTxn(p, orders, cycleConfig, "purchase", viewingForGenerator) !== key) continue;
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
      if (a.type !== "purchase") continue;
      if (statementBucketKeyForTxn(a, orders, cycleConfig, "purchase", viewingForGenerator) !== key) continue;
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
  }, [selected, transactions.payments, transactions.adjustments, orders, cycleConfig, viewingForGenerator]);

  useEffect(() => {
    if (!selected) setPaymentHistoryOpen(false);
  }, [selected]);

  useEffect(() => {
    setPage(1);
    setSelectedKey(null);
  }, [customer, fromDate, toDate, viewMode]);

  function openAdjustModal(row: PurchaseStatementRow) {
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
    if (!canAdjust) {
      setSaveError("Only an admin account can record purchase payments.");
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
    let cycleOrders = ordersForStatementInvoices(adj.invoices, purchaseOrders, cust);
    if (cycleOrders.length === 0 && adj.invoices.length > 0) {
      const loose = adj.invoices
        .map((inv) => purchaseOrders.find((o) => o.orderNo === inv.orderNo))
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
            "purchase",
            transactions.payments,
            transactions.adjustments,
          );
          if (delta > room + 0.02) {
            setSaveError(
              `You can record at most ৳ ${Math.round(room).toLocaleString("en-US")} against purchase invoices in this cycle (per-order limits). Statement total due is ৳ ${Math.round(adj.totalDue).toLocaleString("en-US")} — if that includes previous-cycle carryover, record payments on those cycles first.`,
            );
            return;
          }
          const chunks = planPaymentIncreaseChunks(
            cycleOrders,
            "purchase",
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
            "purchase",
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
          type: "purchase",
          payments: paymentChunks,
          adjustments: adjustmentChunks,
          paymentNote: `Purchase statement payment (${adj.customer})`,
          adjustmentReason: `Purchase statement correction (${adj.customer})`,
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
        <h1 className="text-2xl font-bold">Purchase billing cycle statements</h1>
        <p className="text-sm text-slate-600">
          Customer-wise totals are grouped by the <strong>billing cycle</strong> from admin settings (see Cycle
          below). <strong>From</strong> / <strong>To</strong> narrow statement rows whose period overlaps those
          calendar dates. Previous due is unpaid balance from older cycles (after payments), not a duplicate of old
          invoice totals.{" "}
          <span className="font-medium text-slate-800">
            Only orders with a purchase invoice are included
          </span>{" "}
          (separate from customer billing invoices).
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

          <label className="text-xs text-slate-600">
            From date
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
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
                <th className="px-4 py-3.5"># purchase inv.</th>
                <th className="px-4 py-3.5 text-right">Total due</th>
                <th className="px-4 py-3.5 text-right">Paid (purchase)</th>
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
                  <td className="px-3 py-3.5 text-right font-semibold">৳ {Math.round(r.totalDue).toLocaleString("en-US")}</td>
                  <td className="px-3 py-3.5 text-right">৳ {Math.round(paidOf(r.key)).toLocaleString("en-US")}</td>
                  <td className="px-3 py-3.5 text-right font-semibold">৳ {Math.round(balanceOf(r)).toLocaleString("en-US")}</td>
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
                      {canAdjust ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAdjustModal(r);
                          }}
                          className="relative z-[1] inline-flex rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
                          title="Record purchase payment or purchase adjustment for this cycle"
                        >
                          Adjust (purchase)
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 ? (
                <tr className="border-t border-border bg-card">
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                    {viewMode === "active" ? "No active purchase statements found." : "No history purchase statements found."}
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
          <h2 className="text-sm font-semibold">Purchase statement details</h2>
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
            Totals below are from <strong>purchase invoices</strong> in this cycle.{" "}
            <strong>Paid</strong> is net purchase collections for this statement (customer billing is separate).
          </p>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <DetailStat
                label="Purchase invoice total (cycle)"
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
                Per-order purchase settlement (invoice date, cap, net paid, still due — same payments as ledger when book
                = Supplier)
              </caption>
              <thead className="sticky top-0 z-10 border-b border-border bg-muted text-sm font-semibold uppercase tracking-wide text-foreground shadow-sm">
                <tr>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Order date</th>
                  <th className="px-3 py-2 text-right">Invoice cap</th>
                  <th className="px-3 py-2 text-right">Net paid (purchase)</th>
                  <th className="px-3 py-2 text-right">Still due (order)</th>
                </tr>
              </thead>
              <tbody>
                {selectedPerOrderPurchase.map((row) => (
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
          Click <strong>View</strong> in any statement row to open details.
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
            aria-labelledby="purchase-payment-history-title"
          >
            <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 id="purchase-payment-history-title" className="text-lg font-bold text-slate-900">
                  Payment history
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Purchase payments and adjustments in <strong>this statement&apos;s cycle bucket</strong> (same period
                  as the row you selected). Table From/To only filters which rows appear; this list always matches the
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
                  {statementPurchaseHistoryRows.map((r) => (
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
                  {statementPurchaseHistoryRows.length === 0 ? (
                    <tr className="border-t border-slate-100">
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                        No purchase payments or adjustments in this cycle bucket yet.
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
            <h3 className="text-2xl font-bold text-slate-900">Adjust purchase statement</h3>
            <p className="mt-1 text-sm text-slate-600">
              Type only <strong>this payment</strong> in the red field (৳ paying now). The gray field shows{" "}
              <strong>total paid after save</strong> (current paid + this payment, capped by total due) that is what the
              server records. Extra amount is split across orders as purchase payments; reducing paid uses a negative
              “paying now” amount. Per-order caps still apply.
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
            <div className="mt-6 flex justify-end gap-2">
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

function getPurchaseSubtotalFallback(order: { lines: Array<{ lineTotal?: number }> }) {
  return order.lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0);
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

