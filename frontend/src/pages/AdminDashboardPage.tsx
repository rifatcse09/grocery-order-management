import { useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrdersContext";
import type { OrderStatus } from "../types";

const COLORS = ["#2563EB", "#FF5C35", "#10B981", "#F59E0B", "#8B5CF6", "#64748B"];

export function AdminDashboardPage() {
  const { orders } = useOrders();
  const { user } = useAuth();
  const [trendMode, setTrendMode] = useState<"weekly" | "monthly">("weekly");
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d" | "90d">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  const filterMeta = useMemo(() => {
    const customers = [...new Set(orders.map((o) => o.contactPerson).filter(Boolean))].sort();
    const categories = [...new Set(orders.flatMap((o) => o.lines.map((l) => l.categoryId)).filter(Boolean))].sort();
    const products = [...new Set(orders.flatMap((o) => o.lines.map((l) => l.itemNameEn || l.itemNameBn)).filter(Boolean))].sort();
    return { customers, categories, products };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(today);
    if (dateRange === "7d") from.setDate(from.getDate() - 7);
    if (dateRange === "30d") from.setDate(from.getDate() - 30);
    if (dateRange === "90d") from.setDate(from.getDate() - 90);

    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (customerFilter !== "all" && o.contactPerson !== customerFilter) return false;
      if (dateRange !== "all") {
        const d = parseIso(o.orderDate);
        if (!d || d.getTime() < from.getTime()) return false;
      }
      if (categoryFilter !== "all" && !o.lines.some((l) => l.categoryId === categoryFilter)) return false;
      if (
        productFilter !== "all" &&
        !o.lines.some((l) => (l.itemNameEn || l.itemNameBn) === productFilter)
      )
        return false;
      return true;
    });
  }, [orders, dateRange, statusFilter, customerFilter, categoryFilter, productFilter]);

  const stats = useMemo(() => {
    const byStatus = filteredOrders.reduce(
      (acc, o) => {
        acc[o.status] = (acc[o.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<OrderStatus, number>,
    );
    const totalSales = filteredOrders.reduce((s, o) => s + (o.grandTotal ?? 0), 0);
    const invoiced = filteredOrders.filter((o) => o.status === "invoiced").length;
    const avg = invoiced ? totalSales / invoiced : 0;
    const completed = filteredOrders.filter((o) => o.status === "invoiced" || o.status === "delivered").length;
    const completionRate = filteredOrders.length ? (completed / filteredOrders.length) * 100 : 0;
    const processDays = filteredOrders
      .map((o) => {
        const a = parseIso(o.orderDate);
        const b = parseIso(o.deliveryDate);
        if (!a || !b) return null;
        return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86_400_000));
      })
      .filter((x): x is number => x != null);
    const avgProcessing = processDays.length
      ? processDays.reduce((s, d) => s + d, 0) / processDays.length
      : 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const delayed = filteredOrders.filter((o) => {
      if (o.status === "invoiced" || o.status === "delivered") return false;
      const d = parseIso(o.deliveryDate);
      return Boolean(d && d.getTime() < now.getTime());
    }).length;
    return { byStatus, totalSales, invoiced, avg, completionRate, avgProcessing, delayed };
  }, [filteredOrders]);

  const categorySales = [
    { name: "Fresh produce", amount: 185000 },
    { name: "Dry store", amount: 240000 },
    { name: "Egg / meat / fish", amount: 310000 },
    { name: "Pantry", amount: 420000 },
    { name: "Spices", amount: 98000 },
    { name: "Household", amount: 54000 },
  ];

  const pieData = categorySales.map((c) => ({ name: c.name, value: c.amount }));
  const totalCat = pieData.reduce((s, p) => s + p.value, 0);

  const trendAnalytics = useMemo(() => {
    const invoiced = filteredOrders.filter((o) => o.status === "invoiced" && (o.grandTotal ?? 0) > 0);

    const weekMap = new Map<string, number>();
    const monthMap = new Map<string, number>();
    for (const o of invoiced) {
      const d = parseIso(o.orderDate);
      if (!d) continue;
      const weekStart = startOfWeek(d);
      const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(
        weekStart.getDate(),
      ).padStart(2, "0")}`;
      weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + (o.grandTotal ?? 0));

      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + (o.grandTotal ?? 0));
    }

    const weekly = [...weekMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([k, v]) => ({ label: k.slice(5), revenue: Math.round(v) }));

    const monthly = [...monthMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([k, v]) => ({ label: k, revenue: Math.round(v) }));

    const growth = (arr: Array<{ revenue: number }>) => {
      if (arr.length < 2) return 0;
      const prev = arr[arr.length - 2].revenue;
      const curr = arr[arr.length - 1].revenue;
      if (prev <= 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    const wow = growth(weekly);
    const mom = growth(monthly);

    const currentWeek = weekly[weekly.length - 1]?.revenue ?? 0;
    const previousWeek = weekly[weekly.length - 2]?.revenue ?? 0;
    const cycleDelta =
      previousWeek > 0 ? ((currentWeek - previousWeek) / previousWeek) * 100 : currentWeek > 0 ? 100 : 0;

    return { weekly, monthly, wow, mom, currentWeek, previousWeek, cycleDelta };
  }, [filteredOrders]);

  const trendData = trendMode === "weekly" ? trendAnalytics.weekly : trendAnalytics.monthly;

  const productInsights = useMemo(() => {
    const map = new Map<
      string,
      { name: string; orders: number; qtyScore: number; sales: number }
    >();

    filteredOrders.forEach((o) => {
      o.lines.forEach((l) => {
        const key = l.itemId || `${l.itemNameEn}-${l.itemNameBn}`;
        const qtyScore =
          (parseFloat(l.kg || "0") || 0) +
          (parseFloat(l.gram || "0") || 0) / 1000 +
          (parseFloat(l.piece || "0") || 0);
        const prev = map.get(key) ?? {
          name: l.itemNameEn || l.itemNameBn || "Unknown item",
          orders: 0,
          qtyScore: 0,
          sales: 0,
        };
        map.set(key, {
          name: prev.name,
          orders: prev.orders + 1,
          qtyScore: prev.qtyScore + qtyScore,
          sales: prev.sales + (l.lineTotal ?? 0),
        });
      });
    });

    const all = [...map.values()];
    const topSelling = [...all].sort((a, b) => b.sales - a.sales || b.qtyScore - a.qtyScore).slice(0, 5);
    const leastSelling = [...all].sort((a, b) => a.sales - b.sales || a.qtyScore - b.qtyScore).slice(0, 5);
    const frequent = [...all].sort((a, b) => b.orders - a.orders || b.qtyScore - a.qtyScore).slice(0, 5);
    return { topSelling, leastSelling, frequent };
  }, [filteredOrders]);

  const health =
    (stats.byStatus.draft ?? 0) > 5
      ? { label: "Warning", color: "text-amber-700", bg: "bg-amber-50" }
      : (stats.byStatus.submitted ?? 0) > 8
        ? { label: "Critical", color: "text-red-700", bg: "bg-red-50" }
        : { label: "Good", color: "text-emerald-700", bg: "bg-emerald-50" };

  const limited = user?.role === "moderator";
  const deliveryMetrics = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let delivered = 0;
    let upcoming = 0;
    let delayed = 0;
    filteredOrders.forEach((o) => {
      if (o.status === "delivered" || o.status === "invoiced") delivered += 1;
      const dd = parseIso(o.deliveryDate);
      if (dd && dd.getTime() >= now.getTime() && o.status !== "delivered" && o.status !== "invoiced") {
        upcoming += 1;
      }
      if (dd && dd.getTime() < now.getTime() && o.status !== "delivered" && o.status !== "invoiced") {
        delayed += 1;
      }
    });
    return { delivered, upcoming, delayed };
  }, [filteredOrders]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin dashboard</h1>
          <p className="text-sm text-brand-muted">
            Sales, receivables, categories, and order health overview.
          </p>
        </div>
      </div>

      <div
        className={`rounded-2xl border px-4 py-3 text-base sm:text-lg ${health.bg} border-slate-200 ${health.color}`}
      >
        Order health: <strong>{health.label}</strong> - Draft {stats.byStatus.draft ?? 0},
        Submitted {stats.byStatus.submitted ?? 0}, Under review{" "}
        {stats.byStatus.under_review ?? 0}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <Filter label="Date range">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as "all" | "7d" | "30d" | "90d")}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </Filter>
          <Filter label="Order status">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | OrderStatus)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under review</option>
              <option value="delivered">Delivered</option>
              <option value="invoiced">Invoiced</option>
            </select>
          </Filter>
          <Filter label="Customer">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All customers</option>
              {filterMeta.customers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Filter>
          <Filter label="Category">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All categories</option>
              {filterMeta.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Filter>
          <Filter label="Product">
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All products</option>
              {filterMeta.products.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Filter>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Today's sales" value="৳ 85,000" />
        <Stat title="Weekly sales" value="৳ 420,000" />
        <Stat title="Monthly sales" value="৳ 1,800,000" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Total orders" value={String(filteredOrders.length)} sub="Filtered scope" />
        <Stat
          title="Average order value"
          value={limited ? "—" : `৳ ${Math.round(stats.avg).toLocaleString("en-US")}`}
        />
        <Stat title="Invoiced count" value={String(stats.invoiced)} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat title="Order completion rate" value={`${stats.completionRate.toFixed(1)}%`} />
        <Stat title="Average processing time" value={`${stats.avgProcessing.toFixed(1)} days`} />
        <Stat title="Delayed orders" value={String(stats.delayed)} />
      </div>

      <div className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-white p-5 shadow-card">
        <h2 className="text-lg font-bold text-cyan-900">Order delivery status</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <StatusPill label="Delivered / Closed" value={deliveryMetrics.delivered} tone="good" />
          <StatusPill label="Upcoming deliveries" value={deliveryMetrics.upcoming} tone="warn" />
          <StatusPill label="Delayed deliveries" value={deliveryMetrics.delayed} tone="bad" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="text-base font-semibold">Sales by category</h2>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`৳ ${v.toLocaleString("en-US")}`, ""]} />
                <Legend wrapperStyle={{ fontSize: 14 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm text-slate-600">
            Total · ৳ {totalCat.toLocaleString("en-US")}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="text-sm font-semibold">Category bar chart</h2>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={90} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`৳ ${v.toLocaleString("en-US")}`, ""]} />
                <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Billing & revenue trends</h2>
          <div className="inline-flex rounded-xl border border-slate-200 p-1">
            <button
              type="button"
              onClick={() => setTrendMode("weekly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                trendMode === "weekly" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setTrendMode("monthly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                trendMode === "monthly" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <TrendKpi
            title="Growth (WoW)"
            value={`${trendAnalytics.wow >= 0 ? "+" : ""}${trendAnalytics.wow.toFixed(1)}%`}
            positive={trendAnalytics.wow >= 0}
          />
          <TrendKpi
            title="Growth (MoM)"
            value={`${trendAnalytics.mom >= 0 ? "+" : ""}${trendAnalytics.mom.toFixed(1)}%`}
            positive={trendAnalytics.mom >= 0}
          />
          <TrendKpi
            title="Billing cycle comparison"
            value={`${trendAnalytics.cycleDelta >= 0 ? "+" : ""}${trendAnalytics.cycleDelta.toFixed(1)}%`}
            positive={trendAnalytics.cycleDelta >= 0}
            sub={`Current: ৳ ${trendAnalytics.currentWeek.toLocaleString("en-US")} · Previous: ৳ ${trendAnalytics.previousWeek.toLocaleString("en-US")}`}
          />
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v: number) => [`৳ ${v.toLocaleString("en-US")}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#FF5C35" strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-card">
        <h2 className="text-lg font-bold text-indigo-900">Orders by status</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {(
            [
              "draft",
              "submitted",
              "under_review",
              "delivered",
              "invoiced",
            ] as OrderStatus[]
          ).map((st) => (
            <div
              key={st}
              className="flex items-center justify-between rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-sm"
            >
              <span className="text-sm font-semibold capitalize text-slate-700">{st.replace("_", " ")}</span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-sm font-bold text-indigo-800">
                {stats.byStatus[st] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-card">
        <h2 className="text-lg font-bold text-emerald-900">Product-level insights</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          <InsightList
            title="Top selling products"
            items={productInsights.topSelling}
            metricLabel="Sales"
            metric={(x) => `৳ ${Math.round(x.sales).toLocaleString("en-US")}`}
          />
          <InsightList
            title="Least selling products"
            items={productInsights.leastSelling}
            metricLabel="Sales"
            metric={(x) => `৳ ${Math.round(x.sales).toLocaleString("en-US")}`}
          />
          <InsightList
            title="Frequently ordered items"
            items={productInsights.frequent}
            metricLabel="Orders"
            metric={(x) => String(x.orders)}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="text-sm font-semibold">Statements & reports</h2>
        <p className="mt-1 text-xs text-slate-500">
          View filtered financial summary and export snapshot reports.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => downloadCsv(filteredOrders)}
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
          >
            Download CSV report
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
          >
            Print / Save PDF
          </button>
          <span className="text-xs text-slate-500">
            Paid vs outstanding (filtered): ৳ {Math.round(stats.totalSales).toLocaleString("en-US")} /{" "}
            ৳ {Math.max(0, Math.round(stats.totalSales - stats.avg * stats.invoiced)).toLocaleString("en-US")}
          </span>
        </div>
      </div>

    </div>
  );
}

function Stat({ title, value, sub }: { title: string; value: string; sub?: string }) {
  const isMoney = value.includes("৳");
  return (
    <div
      className={`rounded-3xl border p-5 shadow-card ${
        isMoney
          ? "border-indigo-200 bg-gradient-to-br from-indigo-50 to-white"
          : "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
      }`}
    >
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-2 text-3xl font-extrabold text-brand-dark">{value}</p>
      {sub ? <p className="text-xs text-slate-400">{sub}</p> : null}
    </div>
  );
}

function InsightList({
  title,
  items,
  metricLabel,
  metric,
}: {
  title: string;
  items: Array<{ name: string; orders: number; qtyScore: number; sales: number }>;
  metricLabel: string;
  metric: (x: { name: string; orders: number; qtyScore: number; sales: number }) => string;
}) {
  return (
    <div className="rounded-2xl border border-white bg-white/90 p-4 shadow-sm">
      <p className="text-base font-bold text-slate-800">{title}</p>
      <div className="mt-3 space-y-2.5">
        {items.map((x, idx) => (
          <div
            key={`${title}-${x.name}-${idx}`}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 text-sm"
          >
            <span className="truncate text-sm font-medium text-slate-700">
              {idx + 1}. {x.name}
            </span>
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
              {metricLabel}: {metric(x)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendKpi({
  title,
  value,
  positive,
  sub,
}: {
  title: string;
  value: string;
  positive: boolean;
  sub?: string;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2 ${
        positive ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
      }`}
    >
      <p className="text-xs text-slate-600">{title}</p>
      <p className={`text-lg font-bold ${positive ? "text-emerald-700" : "text-red-700"}`}>{value}</p>
      {sub ? <p className="text-[11px] text-slate-500">{sub}</p> : null}
    </div>
  );
}

function parseIso(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="text-xs text-slate-600">
      {label}
      {children}
    </label>
  );
}

function downloadCsv(rows: Array<{ orderNo: string; orderDate: string; contactPerson: string; status: string; grandTotal?: number }>) {
  const header = ["Order No", "Order Date", "Customer", "Status", "Grand Total"];
  const body = rows.map((r) => [
    r.orderNo,
    r.orderDate,
    r.contactPerson || "",
    r.status,
    String(r.grandTotal ?? 0),
  ]);
  const csv = [header, ...body]
    .map((line) => line.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "admin-dashboard-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function StatusPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "warn" | "bad";
}) {
  const style =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-red-200 bg-red-50 text-red-800";
  return (
    <div className={`rounded-2xl border px-3 py-3 ${style}`}>
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
