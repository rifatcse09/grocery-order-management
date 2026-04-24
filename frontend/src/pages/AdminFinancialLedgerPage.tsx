import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrdersContext";
import { PaginationControls } from "../components/PaginationControls";

const PAYMENTS_KEY = "gom_statement_payments";

export function AdminFinancialLedgerPage() {
  const { orders } = useOrders();
  const { user } = useAuth();
  const limited = user?.role === "moderator";
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Invoice" | "Payment">("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const rows = useMemo(() => {
    const ledger: Array<{
      date: string;
      customer: string;
      ref: string;
      type: "Invoice" | "Payment";
      debit: number;
      credit: number;
    }> = [];

    orders
      .filter((o) => o.status === "invoiced" && (o.grandTotal ?? 0) > 0)
      .forEach((o) => {
        ledger.push({
          date: o.orderDate,
          customer: o.contactPerson || "Unknown",
          ref: o.orderNo,
          type: "Invoice",
          debit: o.grandTotal ?? 0,
          credit: 0,
        });
      });

    try {
      const raw = localStorage.getItem(PAYMENTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        Object.entries(parsed).forEach(([k, v]) => {
          const customer = k.split("::")[1] || "Unknown";
          const amount = Number(v);
          if (!Number.isFinite(amount) || amount <= 0) return;
          ledger.push({
            date: new Date().toISOString().slice(0, 10),
            customer,
            ref: "Statement payment",
            type: "Payment",
            debit: 0,
            credit: amount,
          });
        });
      }
    } catch {
      /* ignore parse errors */
    }

    ledger.sort((a, b) => a.date.localeCompare(b.date));
    let balance = 0;
    return ledger.map((r) => {
      balance += r.debit - r.credit;
      return { ...r, balance: Math.max(0, balance) };
    });
  }, [orders]);

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const closing = Math.max(0, totalDebit - totalCredit);
  const customers = [...new Set(rows.map((r) => r.customer))].sort((a, b) => a.localeCompare(b));

  const filtered = rows.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (customerFilter !== "all" && r.customer !== customerFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.customer.toLowerCase().includes(q) ||
      r.ref.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      r.type.toLowerCase().includes(q)
    );
  });

  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / perPage)));
  const pagedRows = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Financial ledger</h1>
        <p className="text-sm text-slate-600">
          Invoice debits, statement-wise payments, and running balance.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <LedgerCard title="Total debit (invoices)" value={limited ? "—" : `৳ ${Math.round(totalDebit).toLocaleString("en-US")}`} />
        <LedgerCard title="Total credit (payments)" value={limited ? "—" : `৳ ${Math.round(totalCredit).toLocaleString("en-US")}`} />
        <LedgerCard title="Closing balance" value={limited ? "—" : `৳ ${Math.round(closing).toLocaleString("en-US")}`} />
      </div>

      <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-4 shadow-card">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          <label className="text-xs text-slate-600">
            Search
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="customer / reference / date"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-slate-600">
            Type
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as "all" | "Invoice" | "Payment");
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All types</option>
              <option value="Invoice">Invoice</option>
              <option value="Payment">Payment</option>
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Customer
            <select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All customers</option>
              {customers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-600">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2 text-right">Debit</th>
              <th className="px-3 py-2 text-right">Credit</th>
              <th className="px-3 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((r, i) => (
              <tr key={`${r.ref}-${i}`} className="border-t border-slate-100">
                <td className="px-3 py-2">{r.date}</td>
                <td className="px-3 py-2">{r.customer}</td>
                <td className="px-3 py-2">{r.ref}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.type === "Invoice" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {r.type}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">{limited ? "—" : `৳ ${Math.round(r.debit).toLocaleString("en-US")}`}</td>
                <td className="px-3 py-2 text-right">{limited ? "—" : `৳ ${Math.round(r.credit).toLocaleString("en-US")}`}</td>
                <td className="px-3 py-2 text-right font-semibold">{limited ? "—" : `৳ ${Math.round(r.balance).toLocaleString("en-US")}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <PaginationControls
          totalItems={filtered.length}
          page={safePage}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(size) => {
            setPerPage(size);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

function LedgerCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-4 shadow-card">
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  );
}
