import { Link } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";
import { StatusBadge } from "../components/StatusBadge";
import { useState } from "react";
import { PaginationControls } from "../components/PaginationControls";
import { ClipboardCheck, FileBadge2, FileText, ReceiptText } from "lucide-react";

export function ModeratorOrdersPage() {
  const { orders } = useOrders();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageList = orders.slice((safePage - 1) * pageSize, safePage * pageSize);
  const challanCount = orders.filter((o) => o.challanGenerated).length;
  const invoiceCount = orders.filter((o) => o.invoiceGenerated || o.status === "invoiced").length;
  const underReview = orders.filter((o) => o.status === "under_review").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Moderator panel</h1>
        <p className="mt-1 text-base font-medium text-slate-600">
          Edit quantities, add pricing, generate challan, finalize billing
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <MiniCard
          title="Under review"
          value={underReview}
          icon={ClipboardCheck}
          tone="from-amber-100 to-amber-50 text-amber-800 ring-amber-200"
        />
        <MiniCard
          title="Challan ready"
          value={challanCount}
          icon={FileText}
          tone="from-cyan-100 to-cyan-50 text-cyan-800 ring-cyan-200"
        />
        <MiniCard
          title="Invoice finalized"
          value={invoiceCount}
          icon={ReceiptText}
          tone="from-violet-100 to-violet-50 text-violet-800 ring-violet-200"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-card">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-base">
          <thead className="bg-indigo-100/80 text-sm uppercase tracking-wide text-indigo-900">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageList.map((o) => (
              <tr key={o.id} className="border-t border-indigo-100 bg-white/95">
                <td className="px-4 py-4 font-mono text-base font-semibold text-slate-900">{o.orderNo}</td>
                <td className="px-4 py-4 text-base font-semibold text-slate-800">{o.contactPerson}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/moderator/orders/${o.id}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-3.5 py-2 text-sm font-semibold text-white hover:from-slate-800 hover:to-indigo-700"
                  >
                    <FileBadge2 className="h-4 w-4" />
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        <div className="space-y-3 p-3 md:hidden">
          {pageList.map((o) => (
            <div key={o.id} className="rounded-2xl border border-indigo-200 bg-white p-3.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-slate-900">{o.orderNo}</p>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-700">Customer: {o.contactPerson}</p>
              <Link
                to={`/moderator/orders/${o.id}`}
                className="mt-3 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-800 px-3.5 py-2 text-sm font-semibold text-white"
              >
                <FileBadge2 className="h-4 w-4" />
                Open
              </Link>
            </div>
          ))}
        </div>
        {orders.length > 0 ? (
          <PaginationControls
            totalItems={orders.length}
            page={safePage}
            perPage={pageSize}
            onPageChange={setPage}
            onPerPageChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function MiniCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  icon: typeof ClipboardCheck;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br p-4 ring-1 ${tone}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  );
}
