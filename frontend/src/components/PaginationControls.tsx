import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationControls({
  totalItems,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
}: {
  totalItems: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pages = compactPages(safePage, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-3 py-3 text-xs text-slate-500 sm:px-4">
      <div className="flex items-center gap-2">
        <span>Rows</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(parseInt(e.target.value, 10))}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="inline-flex items-center rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`rounded-lg px-2.5 py-1 ${
                p === safePage
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="inline-flex items-center rounded-lg border border-slate-200 px-2 py-1 disabled:opacity-40"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <span className="ml-2">Go to</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          defaultValue={safePage}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const v = parseInt((e.currentTarget as HTMLInputElement).value, 10);
            if (Number.isFinite(v)) onPageChange(Math.min(totalPages, Math.max(1, v)));
          }}
          className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-xs"
        />
        <span>
          / {totalPages} ({totalItems})
        </span>
      </div>
    </div>
  );
}

function compactPages(current: number, total: number): Array<number | "..."> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, current, current - 1, current + 1]);
  const nums = Array.from(set).filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: Array<number | "..."> = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] - nums[i - 1] > 1) out.push("...");
    out.push(nums[i]);
  }
  return out;
}
