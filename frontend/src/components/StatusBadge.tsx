import type { OrderStatus } from "../types";

const styles: Record<OrderStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  submitted: "bg-blue-50 text-blue-700 ring-blue-200",
  under_review: "bg-amber-50 text-amber-800 ring-amber-200",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  invoiced: "bg-violet-50 text-violet-800 ring-violet-200",
};

const labels: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  delivered: "Delivered",
  invoiced: "Invoiced",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      <span>{labels[status]}</span>
    </span>
  );
}
