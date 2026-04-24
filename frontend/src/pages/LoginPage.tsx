import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

const roleCards: { role: Role; title: string; hint: string }[] = [
  {
    role: "user",
    title: "Procurement requester",
    hint: "Create orders and view invoices",
  },
  {
    role: "moderator",
    title: "Supplier / Moderator",
    hint: "Quantities, pricing, challan & billing",
  },
  {
    role: "admin",
    title: "Administrator",
    hint: "Full analytics & reports",
  },
];

const demoCreds: Record<Role, { email: string; password: string }> = {
  user: { email: "user@demo.local", password: "demo123" },
  moderator: { email: "moderator@demo.local", password: "demo123" },
  admin: { email: "admin@demo.local", password: "demo123" },
};

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [error, setError] = useState("");

  const go = () => {
    const res = login(email, password, role);
    if (!res.ok) {
      setError(res.message ?? "Sign in failed.");
      return;
    }
    if (role === "user") navigate("/user/orders", { replace: true });
    else if (role === "moderator") navigate("/moderator/orders", { replace: true });
    else navigate("/admin", { replace: true });
  };

  const goSignup = () => {
    const res = register({
      name,
      phone,
      email,
      password,
      billingAddress,
      deliveryAddress,
    });
    if (!res.ok) {
      setError(res.message ?? "Sign up failed.");
      return;
    }
    navigate("/user/orders", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface via-white to-accent-soft">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
        <div className="mb-8 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card">
          <BrandLogo className="mb-8" />
          <div className="mb-4 flex rounded-xl bg-slate-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              className={`flex-1 rounded-lg px-3 py-2 font-semibold ${
                mode === "signin" ? "bg-white shadow" : "text-slate-500"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setRole("user");
                setError("");
              }}
              className={`flex-1 rounded-lg px-3 py-2 font-semibold ${
                mode === "signup" ? "bg-white shadow" : "text-slate-500"
              }`}
            >
              Sign up
            </button>
          </div>
          <h1 className="text-2xl font-bold text-brand-dark">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            {mode === "signin"
              ? "Use your role account to sign in. For demo roles, any password works."
              : "New registration is for procurement requester (user role)."}
          </p>

          {mode === "signin" ? (
            <div className="mt-6 grid gap-3">
              {roleCards.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => {
                    setRole(r.role);
                    setEmail(demoCreds[r.role].email);
                    setPassword(demoCreds[r.role].password);
                    setError("");
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    role === r.role
                      ? "border-brand-orange bg-brand-orange/5 ring-2 ring-brand-orange/40"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="text-base font-semibold">{r.title}</p>
                  <p className="mt-1 text-xs text-brand-muted">{r.hint}</p>
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {mode === "signup" ? (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-600">Full name</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-orange/30 focus:ring-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Phone</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-orange/30 focus:ring-2"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801XXXXXXXXX"
                  />
                </div>
              </>
            ) : null}
            <div>
              <label className="text-xs font-medium text-slate-600">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-orange/30 focus:ring-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-orange/30 focus:ring-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {mode === "signup" ? (
              <>
                <div>
                  <label className="text-xs font-medium text-slate-600">Billing address</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-orange/30 focus:ring-2"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Billing address"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Delivery address</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-orange/30 focus:ring-2"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Delivery address"
                  />
                </div>
              </>
            ) : null}
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            {mode === "signin" ? (
              <button
                type="button"
                onClick={go}
                className="w-full rounded-xl bg-brand-orange py-2.5 text-sm font-semibold text-white shadow hover:bg-[#e54d2e]"
              >
                Sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={goSignup}
                className="w-full rounded-xl bg-brand-orange py-2.5 text-sm font-semibold text-white shadow hover:bg-[#e54d2e]"
              >
                Create account
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-slate-500">
          Front-end prototype · Laravel API in a later phase
        </p>
      </div>
    </div>
  );
}
