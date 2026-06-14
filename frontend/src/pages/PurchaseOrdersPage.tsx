import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Eye, Plus } from "lucide-react";
import { apiListPurchaseOrders, type PurchaseOrder } from "../lib/api";

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

export function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiListPurchaseOrders({ status: statusFilter || undefined, page, perPage });
      setPos(res.data);
      setTotal(res.meta.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [statusFilter, page]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">{total} total purchase orders</p>
        </div>
        <Link
          to="/admin/purchase-orders/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          New PO
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {["", "draft", "confirmed", "partially_received", "received", "cancelled"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold border ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
          >
            {s === "" ? "All" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">PO Number</th>
              <th className="px-4 py-3 text-left">Supplier</th>
              <th className="px-4 py-3 text-left">Purchase Date</th>
              <th className="px-4 py-3 text-left">Expected Receipt</th>
              <th className="px-4 py-3 text-right">Total Cost</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : pos.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
                  <span>No purchase orders found.</span>
                </div>
              </td></tr>
            ) : pos.map((po) => (
              <tr key={po.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-mono font-semibold text-foreground">{po.poNumber}</td>
                <td className="px-4 py-3 font-medium">{po.supplierName}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(po.purchaseDate)}</td>
                <td className="px-4 py-3 text-muted-foreground">{po.expectedReceiptDate ? formatDate(po.expectedReceiptDate) : "—"}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">৳ {po.totalCost.toLocaleString("en-US")}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[po.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {STATUS_LABELS[po.status] ?? po.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/purchase-orders/${po.id}`} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted">
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Link>
                </td>
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
    </div>
  );
}

function formatDate(d: string): string {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
