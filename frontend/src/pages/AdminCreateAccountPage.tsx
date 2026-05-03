import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export function AdminCreateAccountPage() {
  const { createAccountByAdmin } = useAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "moderator" as "moderator" | "user",
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
    });
    if (!result.ok) {
      setMsg({ type: "err", text: result.message ?? "Failed to create account." });
      return;
    }
    setMsg({ type: "ok", text: `${form.role} account created.` });
    setForm({ name: "", phone: "", email: "", password: "", role: "moderator" });
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
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as "moderator" | "user" }))}
          >
            <option value="moderator">Moderator</option>
            <option value="user">User</option>
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
