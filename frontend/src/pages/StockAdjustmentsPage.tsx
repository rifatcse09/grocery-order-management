import { useEffect, useState } from "react";
import { Plus, RotateCcw, ShieldAlert } from "lucide-react";
import {
  apiCreateDamagedStock,
  apiCreateStockReturn,
  apiListDamagedStock,
  apiListInventory,
  apiListStockReturns,
  apiListSuppliers,
  type DamagedStock,
  type InventoryItem,
  type StockReturn,
  type Supplier,
} from "../lib/api";

type Tab = "returns" | "damaged";

export function StockAdjustmentsPage() {
  const [tab, setTab] = useState<Tab>("returns");
  const [returns, setReturns] = useState<StockReturn[]>([]);
  const [damages, setDamages] = useState<DamagedStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invItems, setInvItems] = useState<InventoryItem[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      if (tab === "returns") {
        const res = await apiListStockReturns({ page, perPage });
        setReturns(res.data);
        setTotal(res.meta.total);
      } else {
        const res = await apiListDamagedStock({ page, perPage });
        setDamages(res.data);
        setTotal(res.meta.total);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [tab, page]);
  useEffect(() => {
    void apiListSuppliers({ active: true }).then(setSuppliers);
    void apiListInventory({ perPage: 200 }).then((r) => setInvItems(r.data));
  }, []);

  function openModal() {
    const today = todayStr();
    if (tab === "returns") {
      setForm({ itemCode: "", quantity: "", returnReason: "", returnDate: today, supplierId: "" });
    } else {
      setForm({ itemCode: "", quantity: "", damageReason: "", damageDate: today, notes: "" });
    }
    setSaveError("");
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      if (tab === "returns") {
        if (!form.itemCode || !form.quantity || !form.returnReason) { setSaveError("Item, quantity, and reason are required."); return; }
        await apiCreateStockReturn({
          itemCode: form.itemCode,
          quantity: parseFloat(form.quantity),
          supplierId: form.supplierId ? Number(form.supplierId) : undefined,
          returnReason: form.returnReason,
          returnDate: form.returnDate,
        });
      } else {
        if (!form.itemCode || !form.quantity || !form.damageReason) { setSaveError("Item, quantity, and reason are required."); return; }
        await apiCreateDamagedStock({
          itemCode: form.itemCode,
          quantity: parseFloat(form.quantity),
          damageReason: form.damageReason,
          damageDate: form.damageDate,
          notes: form.notes,
        });
      }
      setShowModal(false);
      await load();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Adjustments</h1>
          <p className="text-sm text-muted-foreground">Stock returns and damaged stock records</p>
        </div>
        <button type="button" onClick={openModal} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Record {tab === "returns" ? "Return" : "Damage"}
        </button>
      </div>

      <div className="flex gap-2 border-b border-border pb-1">
        <TabBtn active={tab === "returns"} onClick={() => { setTab("returns"); setPage(1); }}>
          <RotateCcw className="h-4 w-4" /> Stock Returns
        </TabBtn>
        <TabBtn active={tab === "damaged"} onClick={() => { setTab("damaged"); setPage(1); }}>
          <ShieldAlert className="h-4 w-4" /> Damaged Stock
        </TabBtn>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tab === "returns" ? (
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Recorded By</th>
              </tr>
            ) : (
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-left">Recorded By</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : tab === "returns" ? (
              returns.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No stock returns recorded yet.</td></tr>
              ) : returns.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.itemNameEn || r.itemNameBn || r.itemCode}</p>
                    <p className="text-xs text-muted-foreground">{r.itemCode}</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-amber-700">{r.quantity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.supplierName || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{r.returnReason}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(r.returnDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.createdByName}</td>
                </tr>
              ))
            ) : (
              damages.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No damaged stock recorded yet.</td></tr>
              ) : damages.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{d.itemNameEn || d.itemNameBn || d.itemCode}</p>
                    <p className="text-xs text-muted-foreground">{d.itemCode}</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-red-600">{d.quantity}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{d.damageReason}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(d.damageDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{d.notes || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.createdByName}</td>
                </tr>
              ))
            )}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h2 className="font-bold text-lg">Record {tab === "returns" ? "Stock Return" : "Damaged Stock"}</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Product *</label>
                <select value={form.itemCode} onChange={(e) => setForm({ ...form, itemCode: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Select product...</option>
                  {invItems.map((i) => <option key={i.itemCode} value={i.itemCode}>{i.itemNameEn || i.itemCode} (Stock: {i.quantityOnHand})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Quantity *</label>
                <input type="number" min="0.001" step="0.001" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="0" />
              </div>

              {tab === "returns" ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Supplier</label>
                    <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                      <option value="">None</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Return Reason *</label>
                    <textarea value={form.returnReason} onChange={(e) => setForm({ ...form, returnReason: e.target.value })} rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none" placeholder="Reason for return..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Return Date *</label>
                    <input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Damage Reason *</label>
                    <textarea value={form.damageReason} onChange={(e) => setForm({ ...form, damageReason: e.target.value })} rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none" placeholder="Describe the damage..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Damage Date *</label>
                    <input type="date" value={form.damageDate} onChange={(e) => setForm({ ...form, damageDate: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Additional Notes</label>
                    <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none" placeholder="Optional notes..." />
                  </div>
                </>
              )}
            </div>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Cancel</button>
              <button type="button" onClick={() => void handleSave()} disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-t-xl px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function formatDate(d: string): string {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
