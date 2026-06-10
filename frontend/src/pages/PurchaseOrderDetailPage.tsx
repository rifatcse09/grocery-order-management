import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Edit2,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import {
  apiCancelPurchaseOrder,
  apiConfirmPurchaseOrder,
  apiGetPurchaseOrder,
  apiReceivePurchaseOrder,
  type PurchaseOrder,
} from "../lib/api";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  partially_received: "Partially Received",
  received: "Received",
  cancelled: "Cancelled",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  confirmed: "bg-blue-100 text-blue-700",
  partially_received: "bg-amber-100 text-amber-700",
  received: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiptDate, setReceiptDate] = useState(today());
  const [receiveQtys, setReceiveQtys] = useState<Record<number, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGetPurchaseOrder(Number(id));
      setPo(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [id]);

  async function handleConfirm() {
    if (!po) return;
    if (!confirm("Confirm this purchase order?")) return;
    setActing(true);
    try { setPo(await apiConfirmPurchaseOrder(po.id)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed."); }
    finally { setActing(false); }
  }

  async function handleCancel() {
    if (!po) return;
    if (!confirm("Cancel this purchase order? This cannot be undone.")) return;
    setActing(true);
    try { setPo(await apiCancelPurchaseOrder(po.id)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed."); }
    finally { setActing(false); }
  }

  function openReceiveModal() {
    if (!po) return;
    const defaults: Record<number, string> = {};
    (po.lines ?? []).forEach((l) => {
      const pending = l.quantity - l.receivedQuantity;
      defaults[l.id!] = pending > 0 ? String(pending) : "0";
    });
    setReceiveQtys(defaults);
    setReceiptDate(today());
    setShowReceiveModal(true);
  }

  async function handleReceive() {
    if (!po) return;
    const lines = Object.entries(receiveQtys)
      .map(([lid, qty]) => ({ lineId: Number(lid), receivedQuantity: parseFloat(qty) || 0 }))
      .filter((l) => l.receivedQuantity > 0);
    if (lines.length === 0) { setError("Enter quantities to receive."); return; }

    const overReceived = lines.find((l) => {
      const poLine = (po.lines ?? []).find((pl) => pl.id === l.lineId);
      return poLine && l.receivedQuantity > poLine.pendingQuantity;
    });
    if (overReceived) { setError("Cannot receive more than pending quantity for a line."); return; }

    setActing(true);
    setError("");
    try {
      const updated = await apiReceivePurchaseOrder(po.id, { receiptDate, lines });
      setPo(updated);
      setShowReceiveModal(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setActing(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-muted-foreground">Loading...</div>;
  if (!po) return <div className="py-16 text-center text-muted-foreground">Purchase order not found.</div>;

  const lines = po.lines ?? [];
  const totalReceived = lines.reduce((s, l) => s + l.receivedQuantity, 0);
  const totalOrdered = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="rounded-xl border border-border p-2 hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold font-mono text-foreground">{po.poNumber}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[po.status]}`}>
              {STATUS_LABELS[po.status]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{po.supplierName} · Created by {po.createdByName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {po.status === "draft" && (
            <>
              <Link to={`/admin/purchase-orders/${po.id}/edit`} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">
                <Edit2 className="h-4 w-4" /> Edit
              </Link>
              <button type="button" onClick={() => void handleConfirm()} disabled={acting} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                <CheckCircle2 className="h-4 w-4" /> Confirm PO
              </button>
            </>
          )}
          {(po.status === "confirmed" || po.status === "partially_received") && (
            <button type="button" onClick={openReceiveModal} disabled={acting} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              <Truck className="h-4 w-4" /> Receive Items
            </button>
          )}
          {(po.status === "draft" || po.status === "confirmed") && (
            <button type="button" onClick={() => void handleCancel()} disabled={acting} className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">
              <XCircle className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Supplier" value={po.supplierName} />
        <InfoCard label="Purchase Date" value={formatDate(po.purchaseDate)} />
        <InfoCard label="Expected Receipt" value={po.expectedReceiptDate ? formatDate(po.expectedReceiptDate) : "Not set"} />
        <InfoCard label="Total Cost" value={`৳ ${po.totalCost.toLocaleString("en-US")}`} bold />
      </div>

      {po.remarks && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Remarks</p>
          <p className="text-sm">{po.remarks}</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Package className="h-4 w-4" /> Line Items
          </h2>
          <span className="text-xs text-muted-foreground">
            Received {totalReceived.toFixed(3)} / {totalOrdered.toFixed(3)} units
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="border-b border-border text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-right">Ordered</th>
                <th className="px-4 py-2 text-right">Received</th>
                <th className="px-4 py-2 text-right">Pending</th>
                <th className="px-4 py-2 text-right">Unit Cost</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lines.map((l) => (
                <tr key={l.id} className={l.pendingQuantity <= 0 ? "bg-emerald-50/50" : ""}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{l.itemNameEn || l.itemNameBn || l.itemCode}</p>
                    <p className="text-xs text-muted-foreground">{l.itemCode}</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.quantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">{l.receivedQuantity}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {l.pendingQuantity > 0 ? (
                      <span className="text-amber-700 font-medium">{l.pendingQuantity.toFixed(3)}</span>
                    ) : (
                      <span className="text-emerald-600">✓</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">৳ {l.unitCost.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">৳ {l.totalCost.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted">
                <td colSpan={5} className="px-4 py-2 text-right font-bold">Grand Total</td>
                <td className="px-4 py-2 text-right font-bold tabular-nums">৳ {po.totalCost.toLocaleString("en-US")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold">Receive Items</h2>
            <p className="text-sm text-muted-foreground">Enter the quantity received for each item today.</p>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Receipt Date</label>
              <input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </div>

            <div className="space-y-2">
              {lines.filter((l) => l.pendingQuantity > 0).map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{l.itemNameEn || l.itemNameBn || l.itemCode}</p>
                    <p className="text-xs text-muted-foreground">Pending: {l.pendingQuantity.toFixed(3)}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={l.pendingQuantity}
                    step="0.001"
                    value={receiveQtys[l.id!] ?? ""}
                    onChange={(e) => setReceiveQtys((prev) => ({ ...prev, [l.id!]: e.target.value }))}
                    className="w-28 rounded-xl border border-border bg-white px-3 py-1.5 text-sm text-right"
                  />
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowReceiveModal(false); setError(""); }} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Cancel</button>
              <button type="button" onClick={() => void handleReceive()} disabled={acting} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {acting ? "Saving..." : "Confirm Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm ${bold ? "text-lg font-bold text-foreground" : "font-medium text-foreground"}`}>{value}</p>
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
