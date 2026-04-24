import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Lock,
  Menu,
  Settings,
  Package,
  UserRound,
  X,
  Users,
  UserCog,
  UserPlus,
  BookText,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "./BrandLogo";
import type { Role } from "../types";

const navFor: Record<
  Role,
  { to: string; label: string; icon: typeof LayoutDashboard }[]
> = {
  user: [
    { to: "/user/orders", label: "Orders", icon: ClipboardList },
    { to: "/user/orders/new", label: "New order", icon: Package },
    { to: "/user/invoices", label: "Invoices", icon: FileText },
  ],
  moderator: [
    { to: "/moderator/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/moderator/orders", label: "Orders", icon: ClipboardList },
    { to: "/moderator/ledger", label: "Ledger", icon: BookText },
  ],
  admin: [
    { to: "/admin", label: "Admin dashboard", icon: BarChart3 },
    { to: "/admin/statements", label: "Billing cycle statements", icon: FileText },
    { to: "/admin/outstanding", label: "Outstanding bills", icon: FileText },
    { to: "/admin/ledger", label: "Financial ledger", icon: BookText },
    { to: "/admin/orders", label: "Order list", icon: ClipboardList },
    { to: "/admin/users", label: "User list", icon: Users },
    { to: "/admin/moderators", label: "Moderator list", icon: UserCog },
    { to: "/admin/create", label: "Create user/moderator", icon: UserPlus },
  ],
};

export function AppShell() {
  const { user, logout, updateProfile, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [message, setMessage] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  if (!user) return <Outlet />;

  useEffect(() => {
    setName(user.name);
    setPhone(user.phone);
  }, [user.name, user.phone]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const items = navFor[user.role];
  const dedup = items.filter(
    (item, i, arr) => arr.findIndex((x) => x.to === item.to) === i,
  );

  return (
    <div className="min-h-screen bg-brand-surface text-brand-dark">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu overlay"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 border-r border-slate-200/80 bg-white py-4 shadow-sm transition-transform md:z-40 md:w-60 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="mb-4 flex items-center justify-between px-3 md:justify-center md:px-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {dedup.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to + label}
              to={to}
              title={label}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-brand-dark text-white shadow"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-6 md:py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <BrandLogo className="max-w-[58vw] md:max-w-[min(100%,320px)]" />
            </div>
            <div className="relative" ref={wrapRef}>
              <button
                type="button"
                onClick={() => setOpen((x) => !x)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-1.5 py-1 text-xs shadow-sm ring-2 ring-slate-100 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-[120px] truncate text-xs font-semibold sm:inline">
                  {user.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>

              <div
                className={`absolute right-0 mt-2 w-[86vw] max-w-72 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-lg transition-all duration-200 ${
                  open
                    ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none -translate-y-1 scale-95 opacity-0"
                }`}
              >
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <p className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] uppercase text-slate-500 ring-1 ring-slate-200">
                      {user.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfile(true);
                      setOpen(false);
                      setMessage("");
                    }}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4" />
                    Profile settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPassword(true);
                      setOpen(false);
                      setMessage("");
                    }}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <Lock className="h-4 w-4" />
                    Change password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate("/login", { replace: true });
                    }}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
          <Outlet />
        </main>
      </div>

      {showProfile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <UserRound className="h-4 w-4" />
              Profile settings
            </h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-slate-600">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = updateProfile({ name, phone });
                    setMessage(res.ok ? "Profile updated." : res.message ?? "Update failed.");
                    if (res.ok) setTimeout(() => setShowProfile(false), 700);
                  }}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showPassword ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Lock className="h-4 w-4" />
              Change password
            </h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs text-slate-600">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600">New password</label>
                <input
                  type="password"
                  value={nextPassword}
                  onChange={(e) => setNextPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              {message ? <p className="text-xs text-slate-600">{message}</p> : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(false)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = updatePassword(currentPassword, nextPassword);
                    setMessage(res.ok ? "Password updated." : res.message ?? "Update failed.");
                    if (res.ok) {
                      setCurrentPassword("");
                      setNextPassword("");
                      setTimeout(() => setShowPassword(false), 700);
                    }
                  }}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
