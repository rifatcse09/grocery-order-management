import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2 } from "lucide-react";
import { apiGetSupplierHistory, type PurchaseOrder, type Supplier } from "../lib/api";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", confirmed: "Confirmed", partially_received: "Partially Received", received: "Received", cancelled: "Cancelled",
};
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600", confirmed: "bg-blue-100 text-blue-700",
  partially_received: "bg-amber-100 text-amber-700", received: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

export function SupplierHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    supplier: Supplier;
    purchaseOrders: PurchaseOrder[];
    totalBilled: number;
    totalPaid: number;
    outstandingBalance: number;
    totalUnitsPurchased: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void apiGetSupplierHistory(Number(id))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-16 text-center text-muted-foreground">Loading...</div>;
  if (!data) return <div className="py-16 text-center text-muted-foreground">Supplier not found.</div>;

  const { supplier, purchaseOrders, totalBilled, totalPaid, outstandingBalance } = data;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="rounded-xl border border-border p-2 hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {supplier.contactPerson && <span>{supplier.contactPerson} · </span>}
            {supplier.phone && <span>{supplier.phone}</span>}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Purchase Orders" value={String(supplier.poCount)} />
        <StatCard label="Total Billed" value={`৳ ${totalBilled.toLocaleString("en-US")}`} />
        <StatCard label="Total Paid" value={`৳ ${totalPaid.toLocaleString("en-US")}`} color="emerald" />
        <StatCard label="Outstanding Balance" value={`৳ ${outstandingBalance.toLocaleString("en-US")}`} color={outstandingBalance > 0 ? "amber" : "emerald"} />
      </div>

      {supplier.address && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Address</p>
          <p>{supplier.address}</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted px-4 py-3">
          <h2 className="font-semibold text-foreground">Purchase Orders ({purchaseOrders.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="border-b border-border text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2 text-left">PO Number</th>
                <th className="px-4 py-2 text-left">Purchase Date</th>
                <th className="px-4 py-2 text-left">Expected Receipt</th>
                <th className="px-4 py-2 text-right">Total Cost</th>
                <th className="px-4 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchaseOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No purchase orders yet.</td></tr>
              ) : purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-semibold">{po.poNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(po.purchaseDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{po.expectedReceiptDate ? formatDate(po.expectedReceiptDate) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">৳ {po.totalCost.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[po.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {STATUS_LABELS[po.status] ?? po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "slate" }: { label: string; value: string; color?: string }) {
  const colors: Record<string, string> = {
    slate: "bg-slate-50 border-slate-200",
    emerald: "bg-emerald-50 border-emerald-200",
    amber: "bg-amber-50 border-amber-200",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color] ?? colors.slate}`}>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function formatDate(d: string): string {
  if (!d) return "—";
  const parts = d.split("-");
  return parts.length !== 3 ? d : `${parts[2]}/${parts[1]}/${parts[0]}`;
}
