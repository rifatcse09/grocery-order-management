import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { apiListStockMovements, type StockMovement } from "../lib/api";

const TX_TYPE_LABELS: Record<string, string> = {
  purchase_receipt: "Purchase Receipt",
  order_fulfillment: "Order Fulfillment",
  stock_return: "Stock Return",
  damaged_stock: "Damaged Stock",
  manual_adjustment: "Manual Adjustment",
};

const TX_TYPE_COLORS: Record<string, string> = {
  purchase_receipt: "bg-emerald-100 text-emerald-700",
  order_fulfillment: "bg-blue-100 text-blue-700",
  stock_return: "bg-amber-100 text-amber-700",
  damaged_stock: "bg-red-100 text-red-700",
  manual_adjustment: "bg-purple-100 text-purple-700",
};

export function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [itemCodeFilter, setItemCodeFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 30;

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiListStockMovements({ type: typeFilter || undefined, itemCode: itemCodeFilter || undefined, page, perPage });
      setMovements(res.data);
      setTotal(res.meta.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [typeFilter, itemCodeFilter, page]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stock Movement History</h1>
        <p className="text-sm text-muted-foreground">Complete inventory ledger · {total} records</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={itemCodeFilter}
          onChange={(e) => { setItemCodeFilter(e.target.value); setPage(1); }}
          placeholder="Filter by item code..."
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm w-48"
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {Object.entries(TX_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date & Time</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-right">In</th>
                <th className="px-4 py-3 text-right">Out</th>
                <th className="px-4 py-3 text-right">Balance After</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No stock movements found.</td></tr>
              ) : movements.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{formatDateTime(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.itemNameEn || m.itemNameBn || m.itemCode}</p>
                    <p className="text-xs text-muted-foreground">{m.itemCode}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TX_TYPE_COLORS[m.transactionType] ?? "bg-slate-100 text-slate-600"}`}>
                      {TX_TYPE_LABELS[m.transactionType] ?? m.transactionType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {m.quantityIn > 0 ? (
                      <span className="text-emerald-700 font-semibold flex items-center justify-end gap-1">
                        <ArrowUp className="h-3 w-3" />{m.quantityIn.toLocaleString("en-US")}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {m.quantityOut > 0 ? (
                      <span className="text-red-600 font-semibold flex items-center justify-end gap-1">
                        <ArrowDown className="h-3 w-3" />{m.quantityOut.toLocaleString("en-US")}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{m.balanceAfter.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{m.referenceNo || m.referenceType || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.supplierName || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.userName || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function formatDateTime(dt: string): string {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
