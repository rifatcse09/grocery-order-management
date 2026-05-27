import { AlertTriangle, FileStack } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatMetricCard } from "../components/StatMetricCard";
import { useOrders } from "../context/OrdersContext";
import { PaginationControls } from "../components/PaginationControls";
import { BdTakaIcon } from "../components/icons/BdTakaIcon";
import {
  apiApplyStatementBooking,
  apiEnabled,
  apiListAdjustments,
  apiListPayments,
  type AdjustmentTxn,
  type PaymentTxn,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  invoiceCapForStatement,
  netPaidAppliedOnOrder,
  orderNumericId,
  planAdjustmentDecreaseChunks,
  planPaymentIncreaseChunks,
  totalPaymentRoomOnOrders,
} from "../lib/statementPaymentAllocation";
import { formatDateDdMmYyyy, formatDateDdMmYyyyOrDash } from "../lib/formatDisplayDate";
import {
  formatStatementAmount,
  orderInvoiceRemainingExact,
  previewPaidAfterPayNow,
  roundMoney,
} from "../lib/statementMoney";
import type { Order } from "../types";

type Range = "all" | "7d" | "30d" | "90d";

export function AdminPurchasePendingBillsPage() {
  const { orders, loadOrders } = useOrders();
  const { user } = useAuth();
  const [range, setRange] = useState<Range>("all");
  const [customer, setCustomer] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [transactions, setTransactions] = useState<{ payments: PaymentTxn[]; adjustments: AdjustmentTxn[] }>({
    payments: [],
    adjustments: [],
  });
  const [adjustOrder, setAdjustOrder] = useState<Order | null>(null);
  const [adjustPayNowInput, setAdjustPayNowInput] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const viewingForGenerator = user?.role === "moderator" ? "moderator" : "all";
  const canAdjust = user?.role === "admin" || user?.role === "master_admin";

  useEffect(() => {
    if (!user || !apiEnabled()) return;
    void Promise.all([apiListPayments(), apiListAdjustments()])
      .then(([payments, adjustments]) => setTransactions({ payments, adjustments }))
      .catch(() => setTransactions({ payments: [], adjustments: [] }));
  }, [user]);

  const purchaseInvoiced = useMemo(
    () =>
      orders
        .filter((o) => o.purchaseInvoiceGenerated && (o.purchaseSubtotal ?? 0) > 0)
        .filter((o) =>
          viewingForGenerator === "all"
            ? true
            : (o.purchaseInvoiceGeneratedBy ?? "admin") === viewingForGenerator,
        ),
    [orders, viewingForGenerator],
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
        const rangeAnchor = (o.purchaseInvoiceCreatedAt ?? "").trim() || o.orderDate;
        const d = parseIso(rangeAnchor);
        return Boolean(d && d.getTime() >= from.getTime());
      })
      .map((o) => {
        const invoiceAt = (o.purchaseInvoiceCreatedAt ?? "").trim();
        const issue = parseIso(invoiceAt || o.orderDate) ?? new Date();
        const due = new Date(issue);
        due.setDate(due.getDate() + 7);
        const diff = Math.floor((now.getTime() - due.getTime()) / 86400000);
        const overdueDays = diff > 0 ? diff : 0;
        const oid = orderNumericId(o);
        const cap = invoiceCapForStatement(o, "purchase");
        const net =
          oid != null ? netPaidAppliedOnOrder(oid, "purchase", transactions.payments, transactions.adjustments) : 0;
        const remaining = orderInvoiceRemainingExact(cap, net);
        return {
          id: o.id,
          order: o,
          orderNo: o.orderNo,
          customer: o.contactPerson || "Unknown",
          invoiceDateDisplay: formatDateDdMmYyyyOrDash(invoiceAt || ""),
          issue,
          due,
          cap,
          netPaid: net,
          remaining,
          overdueDays,
          isOverdue: overdueDays > 0,
        };
      })
      .sort((a, b) => a.issue.getTime() - b.issue.getTime());

    return invoiceRows.filter((r) => r.remaining >= 0.01).sort((a, b) => b.issue.getTime() - a.issue.getTime());
  }, [purchaseInvoiced, range, customer, transactions]);

  const adjustPayPreview = useMemo(() => {
    if (!adjustOrder) return { cur: 0, cap: 0, next: null as number | null };
    const oid = orderNumericId(adjustOrder);
    const cap = invoiceCapForStatement(adjustOrder, "purchase");
    const cur =
      oid != null ? netPaidAppliedOnOrder(oid, "purchase", transactions.payments, transactions.adjustments) : 0;
    return {
      cur,
      cap,
      next: previewPaidAfterPayNow(cap, cur, adjustPayNowInput),
    };
  }, [adjustOrder, adjustPayNowInput, transactions.payments, transactions.adjustments]);

  const totalUnpaid = roundMoney(rows.reduce((s, r) => s + r.remaining, 0));
  const pendingCount = rows.length;
  const overdueCount = rows.filter((r) => r.isOverdue).length;
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * perPage, safePage * perPage);

  useEffect(() => {
    setPage(1);
  }, [range, customer]);

  function openAdjustModal(order: Order) {
    setAdjustOrder(order);
    setAdjustPayNowInput("");
    setSaveError(null);
    setSaveSuccess(null);
  }

  function saveOrderPurchaseBooking() {
    const order = adjustOrder;
    if (!order) return;
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
        "Enter how much you are paying now (৳). Total paid after save is capped by the invoice amount. Use a negative number only to reduce recorded paid.",
      );
      setSaveSuccess(null);
      return;
    }
    if (!Number.isFinite(Number(adjustPayNowInput.trim()))) {
      setSaveError("Enter a valid number for the payment amount.");
      setSaveSuccess(null);
      return;
    }
    const oid = orderNumericId(order);
    if (oid == null) {
      setSaveError("This order has no valid ID for the server.");
      setSaveSuccess(null);
      return;
    }
    const cap = invoiceCapForStatement(order, "purchase");
    const current = netPaidAppliedOnOrder(oid, "purchase", transactions.payments, transactions.adjustments);
    const bounded = previewPaidAfterPayNow(cap, current, adjustPayNowInput);
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

    const cycleOrders = [order];
    setSaveError(null);
    setSaveSuccess(null);

    const run = async () => {
      try {
        let paymentChunks: Array<{ orderId: number; amount: number }> = [];
        let adjustmentChunks: Array<{ orderId: number; amount: number }> = [];
        if (delta > 0.001) {
          const room = totalPaymentRoomOnOrders(cycleOrders, "purchase", transactions.payments, transactions.adjustments);
          if (delta > room + 0.02) {
            setSaveError(
              `You can record at most ৳ ${formatStatementAmount(room)} against this purchase invoice (per-order cap).`,
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
            setSaveError("No valid order ID to record payment against.");
            return;
          }
          const sum = roundMoney(chunks.reduce((s, c) => s + c.amount, 0));
          if (sum + 0.02 < delta) {
            setSaveError(
              `Could not allocate ৳ ${formatStatementAmount(delta)} (allocated ৳ ${formatStatementAmount(sum)}).`,
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
            setSaveError("No recorded payments to reduce for this order.");
            return;
          }
          const need = roundMoney(Math.abs(delta));
          const sum = roundMoney(adjChunks.reduce((s, c) => s + c.amount, 0));
          if (sum + 0.02 < need) {
            setSaveError(
              `Cannot reduce recorded payments by ৳ ${formatStatementAmount(need)} — only ৳ ${formatStatementAmount(sum)} can be adjusted back.`,
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
          paymentNote: `Purchase payment (${order.orderNo})`,
          adjustmentReason: `Purchase correction (${order.orderNo})`,
        });
        const [payments, adjustments] = await Promise.all([apiListPayments(), apiListAdjustments()]);
        setTransactions({ payments, adjustments });
        await loadOrders();
        setSaveSuccess("Saved successfully.");
        setAdjustOrder(null);
        setAdjustPayNowInput("");
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "Failed to save");
      }
    };
    void run();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Purchase pending bills</h1>
        <p className="text-sm text-slate-600">
          Unpaid purchase invoices (ledger-accurate balances).{" "}
          {canAdjust ? (
            <>
              Record payments and corrections here — purchase statements are read-only for cycle totals.
            </>
          ) : (
            <>
              Only invoices you generated are listed. An admin records payments on this screen; purchase statements are
              read-only for cycle totals.
            </>
          )}
        </p>
        {saveSuccess && !adjustOrder ? (
          <p className="mt-1 text-sm font-semibold text-emerald-700">{saveSuccess}</p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatMetricCard
          title="Total unpaid amount"
          value={`৳ ${formatStatementAmount(totalUnpaid)}`}
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
          <table className="min-w-[1040px] w-full text-left text-base">
            <thead className="sticky top-0 z-10 border-b border-border bg-muted text-sm font-semibold uppercase tracking-wide text-foreground shadow-sm">
              <tr>
                <th className="px-3 py-2">Invoice / Order</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2 whitespace-nowrap">Invoice date</th>
                <th className="px-3 py-2 whitespace-nowrap">Order date</th>
                <th className="px-3 py-2 whitespace-nowrap">Delivery date</th>
                <th className="px-3 py-2">Due date</th>
                <th className="px-3 py-2 text-right">Invoice</th>
                <th className="px-3 py-2 text-right">Net paid</th>
                <th className="px-3 py-2 text-right">Remaining</th>
                <th className="px-3 py-2">Overdue</th>
                {canAdjust ? <th className="px-3 py-2 text-right">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((r) => (
                <tr key={r.id} className={`border-t border-border ${r.isOverdue ? "bg-red-50" : "bg-card"}`}>
                  <td className="px-3 py-3.5 font-semibold">{r.orderNo}</td>
                  <td className="px-3 py-3.5 font-medium">{r.customer}</td>
                  <td className="px-3 py-3.5 whitespace-nowrap">{r.invoiceDateDisplay}</td>
                  <td className="px-3 py-3.5 whitespace-nowrap">{formatDateDdMmYyyyOrDash(r.order.orderDate)}</td>
                  <td className="px-3 py-3.5 whitespace-nowrap">{formatDateDdMmYyyyOrDash(r.order.deliveryDate)}</td>
                  <td className="px-3 py-3.5">{formatDateDdMmYyyy(formatIso(r.due))}</td>
                  <td className="px-3 py-3.5 text-right tabular-nums">৳ {formatStatementAmount(r.cap)}</td>
                  <td className="px-3 py-3.5 text-right tabular-nums">৳ {formatStatementAmount(r.netPaid)}</td>
                  <td className="px-3 py-3.5 text-right font-semibold tabular-nums">
                    ৳ {formatStatementAmount(r.remaining)}
                  </td>
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
                  {canAdjust ? (
                    <td className="px-3 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openAdjustModal(r.order)}
                        className="inline-flex rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-sm hover:bg-blue-100"
                        title="Record purchase payment or reduce recorded paid"
                      >
                        Settle
                      </button>
                    </td>
                  ) : null}
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

      {adjustOrder ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900">Settle purchase invoice</h3>
            <p className="mt-1 text-sm text-slate-600">
              Enter <strong>this payment</strong> in the red field (৳ paying now). The gray field shows{" "}
              <strong>total paid after save</strong> (current + this payment, capped by invoice amount). Use a negative
              “paying now” to record a correction that reduces paid.
            </p>
            <p className="mt-2 text-base text-slate-600">
              {adjustOrder.orderNo} · {adjustOrder.contactPerson}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Invoice amount</p>
                <p className="font-semibold tabular-nums text-slate-900">
                  ৳ {formatStatementAmount(adjustPayPreview.cap)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Paid (net)</p>
                <p className="font-semibold tabular-nums text-slate-900">
                  ৳ {formatStatementAmount(adjustPayPreview.cur)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-slate-500">Balance</p>
                <p className="font-semibold tabular-nums text-slate-900">
                  ৳ {formatStatementAmount(orderInvoiceRemainingExact(adjustPayPreview.cap, adjustPayPreview.cur))}
                </p>
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
                placeholder="e.g. 20 or 0.50"
                autoComplete="off"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-600">
              Total paid after save (read-only)
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={
                  adjustPayPreview.next == null
                    ? adjustPayNowInput.trim() === ""
                      ? `৳ ${formatStatementAmount(adjustPayPreview.cur)} (enter amount above)`
                      : "— (invalid number)"
                    : `৳ ${formatStatementAmount(adjustPayPreview.next)}`
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
                  setAdjustOrder(null);
                  setAdjustPayNowInput("");
                  setSaveError(null);
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-base font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveOrderPurchaseBooking()}
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
