import { useEffect, useState } from "react";
import { Building2, Edit2, Plus, Search, Trash2 } from "lucide-react";
import {
  apiCreateSupplier,
  apiDeactivateSupplier,
  apiListSuppliers,
  apiUpdateSupplier,
  type Supplier,
  type SupplierPayload,
} from "../lib/api";

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; supplier?: Supplier } | null>(null);
  const [form, setForm] = useState<SupplierPayload>({ name: "", contactPerson: "", phone: "", email: "", address: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiListSuppliers({ query, active: showInactive ? undefined : true });
      setSuppliers(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [query, showInactive]);

  function openCreate() {
    setForm({ name: "", contactPerson: "", phone: "", email: "", address: "", notes: "" });
    setError("");
    setModal({ mode: "create" });
  }

  function openEdit(s: Supplier) {
    setForm({ name: s.name, contactPerson: s.contactPerson, phone: s.phone, email: s.email, address: s.address, notes: s.notes, isActive: s.isActive });
    setError("");
    setModal({ mode: "edit", supplier: s });
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Supplier name is required."); return; }
    setSaving(true);
    setError("");
    try {
      if (modal?.mode === "create") {
        await apiCreateSupplier(form);
      } else if (modal?.supplier) {
        await apiUpdateSupplier(modal.supplier.id, form);
      }
      setModal(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(s: Supplier) {
    if (!confirm(`Deactivate supplier "${s.name}"?`)) return;
    try {
      await apiDeactivateSupplier(s.id);
      await load();
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Manage supplier master list</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add supplier
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suppliers..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded" />
          Show inactive
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-right">POs</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No suppliers found.</td></tr>
            ) : suppliers.map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                    {s.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.contactPerson || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.phone || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.email || "—"}</td>
                <td className="px-4 py-3 text-right">{s.poCount}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => openEdit(s)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {s.isActive && (
                      <button type="button" onClick={() => void handleDeactivate(s)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600" title="Deactivate">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold">{modal.mode === "create" ? "Add Supplier" : "Edit Supplier"}</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Supplier Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. ABC Wholesale Ltd." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Contact Person</label>
                <input value={form.contactPerson ?? ""} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Phone</label>
                <input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="+880..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
                <input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Address</label>
                <input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Address" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes</label>
                <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none" placeholder="Optional notes..." />
              </div>
              {modal.mode === "edit" && (
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="supplier-active" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                  <label htmlFor="supplier-active" className="text-sm">Active</label>
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Cancel</button>
              <button type="button" onClick={() => void handleSave()} disabled={saving} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
