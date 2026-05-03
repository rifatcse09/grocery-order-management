import { Trash2 } from "lucide-react";
import type { CategoryDef, OrderLine } from "../types";
import { billedAmountsForLine } from "../lib/billingLineAmounts";
import { computePurchaseLineTotal } from "../lib/invoiceFlow";
import { COL } from "../lib/uiLabels";

export function OrderLinesEditor({
  lines,
  onChange,
  categories,
  showPricing = false,
  largeText = false,
  billingMarkupsByCategory,
  globalBillingMarkupPercent = 0,
  /** When true, entire editor is read-only (legacy). */
  linesLocked = false,
  /** When true, kg / g / pcs cannot change (defaults to same as `linesLocked` if omitted). */
  quantityLocked: quantityLockedProp,
  /** When true, cost unit, billing markup columns, delete row locked (defaults to same as `linesLocked` if omitted). */
  pricingLocked: pricingLockedProp,
}: {
  lines: OrderLine[];
  onChange: (next: OrderLine[]) => void;
  categories: CategoryDef[];
  showPricing?: boolean;
  largeText?: boolean;
  billingMarkupsByCategory?: Record<string, number>;
  /** Used with category map when computing billing columns (matches invoice). */
  globalBillingMarkupPercent?: number;
  linesLocked?: boolean;
  quantityLocked?: boolean;
  pricingLocked?: boolean;
}) {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const lockAll = Boolean(linesLocked);
  const quantityLocked = lockAll || Boolean(quantityLockedProp);
  const pricingLocked = lockAll || Boolean(pricingLockedProp);

  const update = (id: string, patch: Partial<OrderLine>) => {
    if (lockAll) return;
    if (
      quantityLocked &&
      ("kg" in patch || "gram" in patch || "piece" in patch || "instructions" in patch)
    ) {
      return;
    }
    if (pricingLocked && ("unitPrice" in patch || "lineTotal" in patch)) return;
    onChange(
      lines.map((l) => {
        if (l.id !== id) return l;
        const merged = { ...l, ...patch };
        if (showPricing) {
          if (merged.unitPrice != null && merged.unitPrice > 0) {
            merged.lineTotal = computePurchaseLineTotal(merged, merged.unitPrice);
          } else {
            merged.lineTotal = undefined;
          }
        }
        return merged;
      }),
    );
  };

  const remove = (id: string) => {
    if (pricingLocked) return;
    onChange(lines.filter((l) => l.id !== id).map((l, i) => ({ ...l, serial: i + 1 })));
  };

  return (
    <div
      className={`table-scroll rounded-2xl border shadow-card ${
        showPricing
          ? "border-border bg-muted"
          : "border-slate-200 bg-white"
      }`}
    >
      <table
        className={`min-w-[720px] w-full border-collapse ${
          showPricing ? "text-base" : largeText ? "text-base" : "text-sm"
        }`}
      >
        <thead>
          <tr
            className={`text-left font-semibold uppercase tracking-wide ${
              showPricing ? "bg-muted text-foreground" : "bg-slate-50 text-slate-500"
            } ${
              showPricing || largeText ? "text-sm" : "text-xs"
            }`}
          >
            <th className="px-3 py-3 normal-case">{COL.serial}</th>
            <th className="px-3 py-3 normal-case">{COL.category}</th>
            <th className="px-3 py-3 normal-case">{COL.item}</th>
            <th className="px-3 py-3 normal-case">{COL.kg}</th>
            <th className="px-3 py-3 normal-case">{COL.gram}</th>
            <th className="px-3 py-3 normal-case">{COL.piece}</th>
            <th className="px-3 py-3 normal-case">Instructions</th>
            {showPricing ? (
              <>
                <th className="px-3 py-3 text-right normal-case">Cost unit (required)</th>
                <th className="px-3 py-3 text-right normal-case">{COL.lineTotal}</th>
                {billingMarkupsByCategory ? (
                  <>
                    <th className="px-3 py-3 text-right normal-case">Markup %</th>
                    <th className="px-3 py-3 text-right normal-case">After markup unit</th>
                    <th className="px-3 py-3 text-right normal-case">After markup total</th>
                  </>
                ) : null}
              </>
            ) : null}
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const cat = catMap.get(line.categoryId);
            const markupPctFromCat = Number(billingMarkupsByCategory?.[line.categoryId] ?? globalBillingMarkupPercent);
            const { billedUnit: billingUnit, billedLine: billingLineTotal, pct: computedPct } =
              billingMarkupsByCategory != null
                ? billedAmountsForLine(line, billingMarkupsByCategory, globalBillingMarkupPercent)
                : { billedUnit: null as number | null, billedLine: null as number | null, pct: 0 };
            const markupPct =
              line.markupPercent != null && Number.isFinite(Number(line.markupPercent))
                ? Number(line.markupPercent)
                : markupPctFromCat || computedPct;
            return (
              <tr key={line.id} className={`${showPricing ? "border-t border-border bg-card" : "border-t border-slate-100"} align-top`}>
                <td className={`px-3 py-2 font-mono text-slate-600 ${largeText ? "text-base" : "text-sm"}`}>
                  {line.serial}
                </td>
                <td className={`px-3 py-2 text-slate-800 ${largeText ? "text-base" : "text-sm"}`}>
                  {cat ? (
                    <>
                      <span className="font-medium">{cat.nameEn}</span>
                      <span className={`mt-0.5 block font-bn text-slate-500 ${largeText ? "text-sm" : "text-xs"}`}>
                        {cat.nameBn}
                      </span>
                    </>
                  ) : (
                    line.categoryId
                  )}
                </td>
                <td className={`px-3 py-2 ${largeText ? "text-base" : "text-sm"}`}>
                  <div className="font-medium">{line.itemNameEn}</div>
                  <div className={`font-bn text-slate-600 ${largeText ? "text-sm" : "text-xs"}`}>{line.itemNameBn}</div>
                </td>
                <td className="px-3 py-2">
                  <input
                    readOnly={quantityLocked}
                    disabled={quantityLocked}
                    className={`w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 disabled:cursor-not-allowed disabled:bg-slate-100 ${largeText ? "text-base" : "text-sm"}`}
                    value={line.kg}
                    onChange={(e) => {
                      const kg = e.target.value;
                      const hasWeight = (parseFloat(kg) || 0) > 0 || (parseFloat(line.gram) || 0) > 0;
                      update(line.id, { kg, piece: hasWeight ? "" : line.piece });
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    readOnly={quantityLocked}
                    disabled={quantityLocked}
                    className={`w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 disabled:cursor-not-allowed disabled:bg-slate-100 ${largeText ? "text-base" : "text-sm"}`}
                    value={line.gram}
                    onChange={(e) => {
                      const gram = e.target.value;
                      const hasWeight = (parseFloat(line.kg) || 0) > 0 || (parseFloat(gram) || 0) > 0;
                      update(line.id, { gram, piece: hasWeight ? "" : line.piece });
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    readOnly={quantityLocked}
                    disabled={quantityLocked}
                    className={`w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 disabled:cursor-not-allowed disabled:bg-slate-100 ${largeText ? "text-base" : "text-sm"}`}
                    value={line.piece}
                    onChange={(e) => {
                      const piece = e.target.value;
                      const hasPiece = (parseFloat(piece) || 0) > 0;
                      update(line.id, { piece, kg: hasPiece ? "" : line.kg, gram: hasPiece ? "" : line.gram });
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    readOnly={quantityLocked}
                    disabled={quantityLocked}
                    className={`w-52 rounded-lg border border-slate-200 bg-white px-2 py-1.5 disabled:cursor-not-allowed disabled:bg-slate-100 ${largeText ? "text-base" : "text-sm"}`}
                    value={line.instructions ?? ""}
                    onChange={(e) => update(line.id, { instructions: e.target.value })}
                    placeholder="Particulars / instructions"
                  />
                </td>
                {showPricing ? (
                  <>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="text"
                        inputMode="decimal"
                        readOnly={pricingLocked}
                        disabled={pricingLocked}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-700"
                        value={line.unitPrice == null ? "" : String(line.unitPrice)}
                        placeholder="0"
                        onChange={(e) => {
                          if (pricingLocked) return;
                          const raw = e.target.value.trim().replace(",", ".");
                          if (raw === "" || raw === ".") {
                            update(line.id, { unitPrice: undefined, lineTotal: undefined });
                            return;
                          }
                          const unit = parseFloat(raw);
                          if (!Number.isFinite(unit) || unit < 0) return;
                          const total = computePurchaseLineTotal(line, unit);
                          update(line.id, { unitPrice: unit, lineTotal: total });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">
                      {line.lineTotal != null ? line.lineTotal.toFixed(0) : "—"}
                    </td>
                    {billingMarkupsByCategory ? (
                      <>
                        <td className="px-3 py-2 text-right text-sm font-semibold text-amber-700">{markupPct}%</td>
                        <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-blue-700">
                          {billingUnit != null ? billingUnit.toFixed(0) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-blue-700">
                          {billingLineTotal != null ? billingLineTotal.toFixed(0) : "—"}
                        </td>
                      </>
                    ) : null}
                  </>
                ) : null}
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => remove(line.id)}
                    disabled={pricingLocked}
                    className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    title="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

