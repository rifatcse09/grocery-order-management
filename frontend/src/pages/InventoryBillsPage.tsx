import { useEffect, useState } from "react";
import { apiGetInventoryBill, apiListInventoryBills, apiListSuppliers, apiPayInventoryBill, type InventoryBill, type Supplier } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Receipt } from "lucide-react";

const STATUS_LABELS: Record<string, string> = { pending: "Pending", partially_paid: "Partially Paid", fully_paid: "Fully Paid" };
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  partially_paid: "bg-blue-100 text-blue-700",
  fully_paid: "bg-emerald-100 text-emerald-700",
};

export function InventoryBillsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "master_admin";

  const [bills, setBills] = useState<InventoryBill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [payModal, setPayModal] = useState<InventoryBill | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(today());
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [payHistory, setPayHistory] = useState<{ id: number; amount: number; paymentDate: string; note: string; createdByName: string }[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiListInventoryBills({ status: statusFilter || undefined, supplierId: supplierFilter ? Number(supplierFilter) : undefined, page, perPage });
      setBills(res.data);
      setTotal(res.meta.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [statusFilter, supplierFilter, page]);
  useEffect(() => { void apiListSuppliers({ active: true }).then(setSuppliers); }, []);

  async function openPayModal(bill: InventoryBill) {
    setPayModal(bill);
    setPayAmount(String(bill.balance));
    setPayDate(today());
    setPayNote("");
    setPayError("");
    try {
      const res = await apiGetInventoryBill(bill.id);
      setPayHistory(res.payments);
    } catch { setPayHistory([]); }
  }

  async function handlePay() {
    if (!payModal) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { setPayError("Enter a valid payment amount."); return; }
    setPaying(true);
    setPayError("");
    try {
      const updated = await apiPayInventoryBill(payModal.id, amount, payDate, payNote);
      setBills((prev) => prev.map((b) => b.id === updated.id ? updated : b));
      setPayModal(null);
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : "Payment failed.");
    } finally {
      setPaying(false);
    }
  }

  const totalUnpaid = bills.reduce((s, b) => s + b.balance, 0);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Bills (Inventory)</h1>
          <p className="text-sm text-muted-foreground">Bills auto-generated from received purchase orders</p>
        </div>
        {totalUnpaid > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm">
            <span className="text-amber-600 font-semibold">Outstanding:</span>{" "}
            <span className="font-bold tabular-nums">৳ {totalUnpaid.toLocaleString("en-US")}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={supplierFilter} onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
          <option value="">All suppliers</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Bill No.</th>
              <th className="px-4 py-3 text-left">PO Number</th>
              <th className="px-4 py-3 text-left">Supplier</th>
              <th className="px-4 py-3 text-left">Due Date</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-center">Status</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Receipt className="h-8 w-8 text-muted-foreground/40" />
                  <span>No bills found. Bills are auto-generated when POs are fully received.</span>
                </div>
              </td></tr>
            ) : bills.map((b) => (
              <tr key={b.id} className={`hover:bg-muted/30 ${b.status === "pending" ? "bg-amber-50/30" : ""}`}>
                <td className="px-4 py-3 font-mono font-semibold">{b.billNo}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{b.poNumber}</td>
                <td className="px-4 py-3 font-medium">{b.supplierName}</td>
                <td className="px-4 py-3 text-muted-foreground">{b.dueDate ? formatDate(b.dueDate) : "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums">৳ {b.amount.toLocaleString("en-US")}</td>
                <td className="px-4 py-3 text-right tabular-nums text-emerald-700">৳ {b.paidAmount.toLocaleString("en-US")}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">৳ {b.balance.toLocaleString("en-US")}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status]}`}>
                    {STATUS_LABELS[b.status]}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    {b.status !== "fully_paid" && (
                      <button type="button" onClick={() => void openPayModal(b)} className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                        Record Payment
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-border px-3 py-1 text-xs disabled:opacity-40 hover:bg-muted">Prev</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-border px-3 py-1 text-xs disabled:opacity-40 hover:bg-muted">Next</button>
          </div>
        </div>
      )}

      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold">Record Payment — {payModal.billNo}</h2>
            <p className="text-sm text-muted-foreground">{payModal.supplierName} · {payModal.poNumber}</p>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Bill Amount</p>
                <p className="font-bold">৳ {payModal.amount.toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Paid So Far</p>
                <p className="font-bold text-emerald-700">৳ {payModal.paidAmount.toLocaleString("en-US")}</p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-600">Balance Due</p>
                <p className="font-bold text-amber-700">৳ {payModal.balance.toLocaleString("en-US")}</p>
              </div>
            </div>

            {payHistory.length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-muted border-b">Payment History</p>
                {payHistory.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 border-b border-border last:border-0 text-sm">
                    <span className="text-muted-foreground">{formatDate(p.paymentDate)} · {p.createdByName}</span>
                    <span className="font-semibold text-emerald-700">৳ {p.amount.toLocaleString("en-US")}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Payment Amount (৳) *</label>
                <input type="number" min="0.01" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Payment Date *</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Note</label>
                <input value={payNote} onChange={(e) => setPayNote(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Optional note..." />
              </div>
            </div>

            {payError && <p className="text-sm text-red-600">{payError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setPayModal(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Cancel</button>
              <button type="button" onClick={() => void handlePay()} disabled={paying} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {paying ? "Saving..." : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(d: string): string {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
