import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Minus, Plus, Save } from "lucide-react";
import {
  apiCreatePurchaseOrder,
  apiGetPurchaseOrder,
  apiListSuppliers,
  apiUpdatePurchaseOrder,
  type POCreatePayload,
  type Supplier,
} from "../lib/api";
import { useCatalog } from "../context/CatalogContext";

type LineForm = {
  itemCode: string;
  itemNameEn: string;
  itemNameBn: string;
  quantity: string;
  unitCost: string;
};

const emptyLine = (): LineForm => ({ itemCode: "", itemNameEn: "", itemNameBn: "", quantity: "", unitCost: "" });

export function PurchaseOrderFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { categories } = useCatalog();
  const catalogItems = categories.flatMap((c) => c.items);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [expectedReceiptDate, setExpectedReceiptDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [lines, setLines] = useState<LineForm[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [itemSearch, setItemSearch] = useState<string[]>([""]);

  useEffect(() => {
    void apiListSuppliers({ active: true }).then(setSuppliers);
    if (isEdit && id) {
      void apiGetPurchaseOrder(Number(id)).then((po) => {
        setSupplierId(String(po.supplierId));
        setPurchaseDate(po.purchaseDate);
        setExpectedReceiptDate(po.expectedReceiptDate ?? "");
        setRemarks(po.remarks);
        setLines((po.lines ?? []).map((l) => ({
          itemCode: l.itemCode,
          itemNameEn: l.itemNameEn,
          itemNameBn: l.itemNameBn,
          quantity: String(l.quantity),
          unitCost: String(l.unitCost),
        })));
        setItemSearch((po.lines ?? []).map((l) => l.itemNameEn || l.itemCode));
      });
    }
  }, [id, isEdit]);

  function addLine() { setLines((l) => [...l, emptyLine()]); setItemSearch((s) => [...s, ""]); }
  function removeLine(idx: number) { setLines((l) => l.filter((_, i) => i !== idx)); setItemSearch((s) => s.filter((_, i) => i !== idx)); }

  function setLineField(idx: number, field: keyof LineForm, val: string) {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: val } : l));
  }

  function selectItem(idx: number, code: string) {
    const item = catalogItems.find((ci) => ci.id === code || ci.id === code);
    if (item) {
      setLines((prev) => prev.map((l, i) => i === idx ? { ...l, itemCode: item.id, itemNameEn: item.nameEn || "", itemNameBn: item.nameBn || "" } : l));
      setItemSearch((prev) => prev.map((s, i) => i === idx ? (item.nameEn || item.nameBn || item.id) : s));
    }
  }

  const totalCost = lines.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unitCost) || 0), 0);

  async function handleSave() {
    if (!supplierId) { setError("Please select a supplier."); return; }
    const validLines = lines.filter((l) => l.itemCode.trim() && parseFloat(l.quantity) > 0 && parseFloat(l.unitCost) > 0);
    if (validLines.length === 0) { setError("Add at least one valid line item."); return; }

    setSaving(true);
    setError("");
    const payload: POCreatePayload = {
      supplierId: Number(supplierId),
      purchaseDate,
      expectedReceiptDate: expectedReceiptDate || undefined,
      remarks: remarks || undefined,
      lines: validLines.map((l) => ({
        itemCode: l.itemCode,
        itemNameEn: l.itemNameEn,
        itemNameBn: l.itemNameBn,
        quantity: parseFloat(l.quantity),
        unitCost: parseFloat(l.unitCost),
      })),
    };

    try {
      let po;
      if (isEdit && id) {
        po = await apiUpdatePurchaseOrder(Number(id), payload);
      } else {
        po = await apiCreatePurchaseOrder(payload);
      }
      navigate(`/admin/purchase-orders/${po.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const filteredCatalog = (search: string) =>
    search.length < 1
      ? catalogItems.slice(0, 10)
      : catalogItems.filter((ci) =>
          ci.nameEn?.toLowerCase().includes(search.toLowerCase()) ||
          ci.nameBn?.includes(search) ||
          ci.id.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{isEdit ? "Edit Purchase Order" : "New Purchase Order"}</h1>
        <p className="text-sm text-muted-foreground">Fill in the details below</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-foreground">Order Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Supplier *</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <option value="">Select supplier...</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Purchase Date *</label>
            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Expected Receipt Date</label>
            <input type="date" value={expectedReceiptDate} onChange={(e) => setExpectedReceiptDate(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Remarks</label>
            <input value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Optional remarks..." />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Line Items</h2>
          <button type="button" onClick={addLine} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
            <Plus className="h-3.5 w-3.5" /> Add row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                <th className="py-2 pr-3 text-left">Product</th>
                <th className="py-2 pr-3 text-right w-28">Quantity</th>
                <th className="py-2 pr-3 text-right w-32">Unit Cost (৳)</th>
                <th className="py-2 pr-3 text-right w-32">Total (৳)</th>
                <th className="py-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-2 pr-3">
                    <div className="relative">
                      <input
                        value={itemSearch[idx] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemSearch((prev) => prev.map((s, i) => i === idx ? val : s));
                          if (val === "") setLineField(idx, "itemCode", "");
                        }}
                        placeholder="Search product..."
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
                      />
                      {(itemSearch[idx] ?? "").length > 0 && !line.itemCode && (
                        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg">
                          {filteredCatalog(itemSearch[idx] ?? "").map((ci) => (
                            <button
                              key={ci.id}
                              type="button"
                              onMouseDown={() => selectItem(idx, ci.id)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                            >
                              <span className="font-medium">{ci.nameEn || ci.nameBn}</span>
                              <span className="ml-2 text-xs text-muted-foreground">{ci.id}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={line.quantity}
                      onChange={(e) => setLineField(idx, "quantity", e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitCost}
                      onChange={(e) => setLineField(idx, "unitCost", e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums font-medium">
                    {((parseFloat(line.quantity) || 0) * (parseFloat(line.unitCost) || 0)).toFixed(2)}
                  </td>
                  <td className="py-2">
                    {lines.length > 1 && (
                      <button type="button" onClick={() => removeLine(idx)} className="rounded-lg p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={3} className="py-2 text-right font-semibold text-sm">Total Cost:</td>
                <td className="py-2 pr-3 text-right font-bold text-base tabular-nums">৳ {totalCost.toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => navigate(-1)} className="rounded-xl border border-border px-5 py-2 text-sm font-semibold hover:bg-muted">Cancel</button>
        <button type="button" onClick={() => void handleSave()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : (isEdit ? "Update PO" : "Create PO")}
        </button>
      </div>
    </div>
  );
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
