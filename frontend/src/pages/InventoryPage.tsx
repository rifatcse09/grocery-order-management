import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Settings } from "lucide-react";
import {
  apiListInventory,
  apiListSuppliers,
  apiManualStockAdjustment,
  apiSetInventoryThreshold,
  type InventoryItem,
  type Supplier,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";

export function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "master_admin";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 50;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [thresholdModal, setThresholdModal] = useState<InventoryItem | null>(null);
  const [thresholdValue, setThresholdValue] = useState("");
  const [thresholdSupplier, setThresholdSupplier] = useState("");

  const [adjustModal, setAdjustModal] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiListInventory({ query, lowStock: lowStockOnly, page, perPage });
      setItems(res.data);
      setTotal(res.meta.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [query, lowStockOnly, page]);
  useEffect(() => { void apiListSuppliers({ active: true }).then(setSuppliers); }, []);

  function openThreshold(item: InventoryItem) {
    setThresholdValue(String(item.minThreshold));
    setThresholdSupplier(item.supplierId ? String(item.supplierId) : "");
    setSaveMsg("");
    setThresholdModal(item);
  }

  async function saveThreshold() {
    if (!thresholdModal) return;
    setSaving(true);
    try {
      await apiSetInventoryThreshold(thresholdModal.itemCode, parseFloat(thresholdValue) || 0, thresholdSupplier ? Number(thresholdSupplier) : undefined);
      setSaveMsg("Saved!");
      await load();
      setTimeout(() => setThresholdModal(null), 500);
    } catch { setSaveMsg("Failed to save."); }
    finally { setSaving(false); }
  }

  function openAdjust(item: InventoryItem) {
    setAdjustQty("");
    setAdjustNotes("");
    setSaveMsg("");
    setAdjustModal(item);
  }

  async function saveAdjust() {
    if (!adjustModal) return;
    const qty = parseFloat(adjustQty);
    if (!qty) { setSaveMsg("Enter a non-zero quantity."); return; }
    setSaving(true);
    try {
      await apiManualStockAdjustment(adjustModal.itemCode, qty, adjustNotes);
      setSaveMsg("Adjusted!");
      await load();
      setTimeout(() => setAdjustModal(null), 500);
    } catch { setSaveMsg("Failed to adjust."); }
    finally { setSaving(false); }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">{total} products tracked</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder="Search by name or code..."
          className="flex-1 min-w-[200px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }} className="rounded" />
          Low stock only
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-right">On Hand</th>
              <th className="px-4 py-3 text-right">Avg. Unit Cost</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3 text-right">Min Threshold</th>
              <th className="px-4 py-3 text-left">Supplier</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No inventory items found. Receive purchase orders to populate inventory.</td></tr>
            ) : items.map((item) => (
              <tr key={item.itemCode} className={`hover:bg-muted/30 ${item.isLowStock ? "bg-amber-50/50" : ""}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {item.isLowStock && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                    <div>
                      <p className="font-medium text-foreground">{item.itemNameEn || item.itemNameBn || item.itemCode}</p>
                      <p className="text-xs text-muted-foreground">{item.itemCode}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                  <span className={item.quantityOnHand === 0 ? "text-red-600" : item.isLowStock ? "text-amber-600" : "text-emerald-700"}>
                    {item.quantityOnHand.toLocaleString("en-US")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">৳ {item.avgUnitCost.toFixed(2)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">৳ {item.inventoryValue.toLocaleString("en-US")}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{item.minThreshold > 0 ? item.minThreshold : "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.supplierName || "—"}</td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => openThreshold(item)} className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted" title="Set threshold">
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => openAdjust(item)} className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted">
                        Adjust
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} · {total} items</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-border px-3 py-1 text-xs disabled:opacity-40 hover:bg-muted">Prev</button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-border px-3 py-1 text-xs disabled:opacity-40 hover:bg-muted">Next</button>
          </div>
        </div>
      )}

      {thresholdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h2 className="font-bold text-lg">Set Low Stock Threshold</h2>
            <p className="text-sm text-muted-foreground">{thresholdModal.itemNameEn || thresholdModal.itemCode}</p>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Minimum Threshold</label>
              <input type="number" min="0" step="0.001" value={thresholdValue} onChange={(e) => setThresholdValue(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Default Supplier</label>
              <select value={thresholdSupplier} onChange={(e) => setThresholdSupplier(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <option value="">None</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {saveMsg && <p className="text-sm text-emerald-600">{saveMsg}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setThresholdModal(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Cancel</button>
              <button type="button" onClick={() => void saveThreshold()} disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h2 className="font-bold text-lg">Manual Stock Adjustment</h2>
            <p className="text-sm text-muted-foreground">
              {adjustModal.itemNameEn || adjustModal.itemCode} · Current: {adjustModal.quantityOnHand}
            </p>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Quantity (+ to add, − to deduct)</label>
              <input type="number" step="0.001" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. 10 or -5" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes *</label>
              <textarea value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none" placeholder="Reason for adjustment..." />
            </div>
            {saveMsg && <p className="text-sm text-emerald-600">{saveMsg}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAdjustModal(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Cancel</button>
              <button type="button" onClick={() => void saveAdjust()} disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
