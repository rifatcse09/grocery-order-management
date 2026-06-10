import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, BarChart3, Package, RefreshCw } from "lucide-react";
import { apiGetInventoryDashboard, type InventoryItem, type StockMovement } from "../lib/api";

const TX_TYPE_LABELS: Record<string, string> = {
  purchase_receipt: "Purchase Receipt",
  order_fulfillment: "Order Fulfillment",
  stock_return: "Stock Return",
  damaged_stock: "Damaged Stock",
  manual_adjustment: "Manual Adjustment",
};

const TX_TYPE_COLORS: Record<string, string> = {
  purchase_receipt: "bg-emerald-100 text-emerald-700",
  order_fulfillment: "bg-blue-100 text-blue-700",
  stock_return: "bg-amber-100 text-amber-700",
  damaged_stock: "bg-red-100 text-red-700",
  manual_adjustment: "bg-purple-100 text-purple-700",
};

export function InventoryDashboardPage() {
  const [data, setData] = useState<{
    totalInventoryValue: number;
    totalUnitsInStock: number;
    lowStockItemsCount: number;
    totalUniqueProducts: number;
    lowStockItems: InventoryItem[];
    recentMovements: StockMovement[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setData(await apiGetInventoryDashboard()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <div className="py-16 text-center text-muted-foreground">Loading inventory dashboard...</div>;

  if (!data) return (
    <div className="py-16 text-center space-y-2">
      <Package className="h-12 w-12 mx-auto text-muted-foreground/40" />
      <p className="text-muted-foreground">No inventory data yet. Create purchase orders and receive items to track stock.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time stock overview</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Total Inventory Value"
          value={`৳ ${data.totalInventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          tone="blue"
        />
        <MetricCard
          icon={<Package className="h-5 w-5" />}
          label="Total Units in Stock"
          value={data.totalUnitsInStock.toLocaleString("en-US")}
          tone="emerald"
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Low Stock Items"
          value={String(data.lowStockItemsCount)}
          tone={data.lowStockItemsCount > 0 ? "amber" : "emerald"}
        />
        <MetricCard
          icon={<Package className="h-5 w-5" />}
          label="Total Unique Products"
          value={String(data.totalUniqueProducts)}
          tone="slate"
        />
      </div>

      {data.lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="border-b border-amber-200 bg-amber-100 px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="font-semibold text-amber-900">Low Stock Alert</h2>
            <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">{data.lowStockItems.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="border-b border-amber-200 text-xs font-semibold text-amber-700 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-right">Current Stock</th>
                  <th className="px-4 py-2 text-right">Min Threshold</th>
                  <th className="px-4 py-2 text-left">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {data.lowStockItems.map((item) => (
                  <tr key={item.itemCode} className="bg-white/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.itemNameEn || item.itemNameBn || item.itemCode}</p>
                      <p className="text-xs text-muted-foreground">{item.itemCode}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold tabular-nums ${item.quantityOnHand === 0 ? "text-red-600" : "text-amber-700"}`}>
                        {item.quantityOnHand.toLocaleString("en-US")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{item.minThreshold.toLocaleString("en-US")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.supplierName || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted px-4 py-3">
          <h2 className="font-semibold text-foreground">Recent Stock Movements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="border-b border-border text-xs font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-center">Type</th>
                <th className="px-4 py-2 text-right">In</th>
                <th className="px-4 py-2 text-right">Out</th>
                <th className="px-4 py-2 text-right">Balance</th>
                <th className="px-4 py-2 text-left">Reference</th>
                <th className="px-4 py-2 text-left">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recentMovements.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No stock movements yet.</td></tr>
              ) : data.recentMovements.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.itemNameEn || m.itemNameBn || m.itemCode}</p>
                    <p className="text-xs text-muted-foreground">{m.itemCode}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TX_TYPE_COLORS[m.transactionType] ?? "bg-slate-100 text-slate-600"}`}>
                      {TX_TYPE_LABELS[m.transactionType] ?? m.transactionType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {m.quantityIn > 0 ? <span className="text-emerald-700 font-semibold flex items-center justify-end gap-1"><ArrowUp className="h-3 w-3" />{m.quantityIn}</span> : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {m.quantityOut > 0 ? <span className="text-red-600 font-semibold flex items-center justify-end gap-1"><ArrowDown className="h-3 w-3" />{m.quantityOut}</span> : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{m.balanceAfter.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.referenceNo || m.referenceType || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.userName || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "blue" | "emerald" | "amber" | "slate" }) {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <div className="flex items-center gap-2 mb-3">{icon}<p className="text-xs font-semibold uppercase tracking-wide">{label}</p></div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function formatDateTime(dt: string): string {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
