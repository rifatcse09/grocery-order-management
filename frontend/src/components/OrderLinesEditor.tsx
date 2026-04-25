import { Trash2 } from "lucide-react";
import type { CategoryDef, OrderLine } from "../types";
import { COL } from "../lib/uiLabels";

export function OrderLinesEditor({
  lines,
  onChange,
  categories,
  showPricing = false,
  largeText = false,
}: {
  lines: OrderLine[];
  onChange: (next: OrderLine[]) => void;
  categories: CategoryDef[];
  showPricing?: boolean;
  largeText?: boolean;
}) {
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const update = (id: string, patch: Partial<OrderLine>) => {
    onChange(
      lines.map((l) => {
        if (l.id !== id) return l;
        const merged = { ...l, ...patch };
        if (showPricing && merged.unitPrice != null && merged.unitPrice > 0) {
          merged.lineTotal = computeLineTotal(merged, merged.unitPrice);
        }
        return merged;
      }),
    );
  };

  const remove = (id: string) => {
    onChange(lines.filter((l) => l.id !== id).map((l, i) => ({ ...l, serial: i + 1 })));
  };

  return (
    <div
      className={`overflow-x-auto rounded-2xl border shadow-card ${
        showPricing
          ? "border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50"
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
              showPricing ? "bg-indigo-100/80 text-indigo-900" : "bg-slate-50 text-slate-500"
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
            {showPricing ? (
              <>
                <th className="px-3 py-3 text-right normal-case">{COL.unitPrice}</th>
                <th className="px-3 py-3 text-right normal-case">{COL.lineTotal}</th>
              </>
            ) : null}
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const cat = catMap.get(line.categoryId);
            return (
              <tr key={line.id} className={`${showPricing ? "border-t border-indigo-100 bg-white/95" : "border-t border-slate-100"} align-top`}>
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
                    className={`w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 ${largeText ? "text-base" : "text-sm"}`}
                    value={line.kg}
                    onChange={(e) => update(line.id, { kg: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className={`w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 ${largeText ? "text-base" : "text-sm"}`}
                    value={line.gram}
                    onChange={(e) => update(line.id, { gram: e.target.value })}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className={`w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 ${largeText ? "text-base" : "text-sm"}`}
                    value={line.piece}
                    onChange={(e) => update(line.id, { piece: e.target.value })}
                  />
                </td>
                {showPricing ? (
                  <>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm"
                        value={line.unitPrice ?? ""}
                        onChange={(e) => {
                          const unit = parseFloat(e.target.value) || 0;
                          const total = computeLineTotal(line, unit);
                          update(line.id, { unitPrice: unit, lineTotal: total });
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">
                      {line.lineTotal != null ? line.lineTotal.toFixed(0) : "—"}
                    </td>
                  </>
                ) : null}
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => remove(line.id)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
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

function computeLineTotal(line: OrderLine, unit: number): number {
  const kg = parseFloat(line.kg) || 0;
  const g = (parseFloat(line.gram) || 0) / 1000;
  const pc = parseFloat(line.piece) || 0;
  if (pc > 0) return Math.round(unit * pc * 100) / 100;
  return Math.round(unit * (kg + g) * 100) / 100;
}
