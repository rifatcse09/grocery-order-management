import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

export function AdminCreateAccountPage() {
  const { createAccountByAdmin, user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "moderator" as Role,
    billingAddress: "",
    deliveryAddress: "",
  });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = await createAccountByAdmin({
      name: form.name,
      phone: form.phone,
      email: form.email,
      password: form.password,
      role: form.role,
      billingAddress: form.billingAddress.trim() || undefined,
      deliveryAddress: form.deliveryAddress.trim() || undefined,
    });
    if (!result.ok) {
      setMsg({ type: "err", text: result.message ?? "Failed to create account." });
      return;
    }
    setMsg({ type: "ok", text: `${form.role} account created.` });
    setForm({
      name: "",
      phone: "",
      email: "",
      password: "",
      role: "moderator",
      billingAddress: "",
      deliveryAddress: "",
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create user / moderator</h1>
      <div className="max-w-xl rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
        <form className="space-y-2" onSubmit={onSubmit}>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Business (billing) address <span className="font-normal normal-case text-slate-400">— optional</span>
            </label>
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Invoice / billing address"
              value={form.billingAddress}
              onChange={(e) => setForm((p) => ({ ...p, billingAddress: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Delivery address <span className="font-normal normal-case text-slate-400">— optional</span>
            </label>
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Default delivery address"
              value={form.deliveryAddress}
              onChange={(e) => setForm((p) => ({ ...p, deliveryAddress: e.target.value }))}
              rows={3}
            />
          </div>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as Role }))}
          >
            <option value="moderator">Moderator</option>
            <option value="user">User</option>
            {user?.role === "admin" || user?.role === "master_admin" ? (
              <option value="admin">Administrator</option>
            ) : null}
            {user?.role === "master_admin" ? <option value="master_admin">Master administrator</option> : null}
          </select>
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-dark px-3 py-2 text-sm font-medium text-white"
          >
            Create account
          </button>
        </form>
        {msg ? (
          <p className={`mt-2 text-xs ${msg.type === "ok" ? "text-emerald-700" : "text-red-600"}`}>
            {msg.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
