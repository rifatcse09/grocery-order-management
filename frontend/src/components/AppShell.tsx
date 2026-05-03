import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  BookText,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrdersContext";
import { BrandLogo } from "./BrandLogo";
import {
  moderatorNewSubmittedCount,
  NOTIFICATIONS_EVENT,
  readAdminNotifyOrderIds,
} from "../lib/orderNotifications";
import type { Role } from "../types";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navFor: Record<
  Role,
  { to: string; label: string; icon: typeof LayoutDashboard }[]
> = {
  user: [
    { to: "/user/orders", label: "Orders", icon: ClipboardList },
    { to: "/user/orders/new", label: "New order", icon: Package },
    { to: "/user/invoices", label: "Invoices", icon: FileText },
    { to: "/user/catalog/categories", label: "Category list", icon: BookText },
    { to: "/user/catalog/products", label: "Product list", icon: Package },
  ],
  moderator: [
    { to: "/moderator/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/moderator/orders", label: "Order list", icon: ClipboardList },
    { to: "/moderator/purchase-statements", label: "Purchase statements", icon: FileText },
    { to: "/moderator/catalog/categories", label: "Category list", icon: Package },
    { to: "/moderator/catalog/products", label: "Product list", icon: Package },
  ],
  admin: [
    { to: "/admin", label: "Admin dashboard", icon: BarChart3 },
    { to: "/admin/orders", label: "Order list", icon: ClipboardList },
    { to: "/admin/purchase-pending-bills", label: "Purchase pending bills", icon: FileText },
    { to: "/admin/purchase-statements", label: "Purchase statements", icon: FileText },
    { to: "/admin/statements", label: "Billing cycle statements", icon: FileText },
    { to: "/admin/outstanding", label: "Pending bills", icon: FileText },
    { to: "/admin/ledger", label: "Financial ledger", icon: BookText },
    { to: "/admin/catalog/categories", label: "Category list", icon: BookText },
    { to: "/admin/catalog/products", label: "Product list", icon: Package },
    { to: "/admin/users", label: "User list", icon: Users },
    { to: "/admin/moderators", label: "Moderator list", icon: UserCog },
    { to: "/admin/create", label: "Create user/moderator", icon: UserPlus },
  ],
};

export function AppShell() {
  const { user, logout, updateProfile, updatePassword } = useAuth();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifTick, setNotifTick] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [billingAddress, setBillingAddress] = useState(user?.billingAddress ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState(user?.deliveryAddress ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [message, setMessage] = useState("");
  const [dark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("gom-theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      window.localStorage.setItem("gom-theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  useEffect(() => {
    const bump = () => setNotifTick((t) => t + 1);
    window.addEventListener(NOTIFICATIONS_EVENT, bump);
    return () => window.removeEventListener(NOTIFICATIONS_EVENT, bump);
  }, []);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone);
    setBillingAddress(user.billingAddress);
    setDeliveryAddress(user.deliveryAddress);
  }, [user?.name, user?.phone, user?.billingAddress, user?.deliveryAddress, user]);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "user") return;
    const needsProfile =
      !user.phone.trim() || !user.billingAddress.trim() || !user.deliveryAddress.trim();
    if (needsProfile) {
      setShowProfile(true);
      setMessage("Please complete profile before creating orders.");
    }
  }, [user]);

  const orderNotifyCount = useMemo(() => {
    void notifTick;
    if (!user) return 0;
    if (user.role === "admin") return readAdminNotifyOrderIds().length;
    if (user.role === "moderator") return moderatorNewSubmittedCount(orders);
    return 0;
  }, [notifTick, user, orders]);

  if (!user) return <Outlet />;

  const items = navFor[user.role];
  const dedup = items.filter(
    (item, i, arr) => arr.findIndex((x) => x.to === item.to) === i,
  );
  const activeNavTo = useMemo(() => {
    const path = location.pathname;
    const matches = dedup
      .filter(({ to }) => path === to || path.startsWith(`${to}/`))
      .sort((a, b) => b.to.length - a.to.length);
    return matches[0]?.to ?? null;
  }, [dedup, location.pathname]);

  const ordersPath =
    user.role === "admin" ? "/admin/orders" : user.role === "moderator" ? "/moderator/orders" : "/user/orders";
  const primaryCta =
    user.role === "user"
      ? { to: "/user/orders/new", label: "New order", Icon: Plus }
      : user.role === "moderator"
        ? { to: "/moderator/orders", label: "Orders", Icon: ClipboardList }
        : { to: "/admin/orders", label: "Orders", Icon: ClipboardList };
  const PrimaryIcon = primaryCta.Icon;
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || user.name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mobileNavOpen ? (
        <Button
          type="button"
          variant="ghost"
          className="fixed inset-0 z-40 h-auto min-h-0 w-full rounded-none bg-slate-900 p-0 md:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu overlay"
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-border bg-card py-4 shadow-sm transition-all max-md:bg-background max-md:shadow-xl md:z-40",
          sidebarCollapsed ? "md:w-20" : "md:w-60",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="mb-4 flex items-center justify-between px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-primary">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="hidden text-primary md:inline-flex"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {dedup.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to + label}
              to={to}
              title={label}
              onClick={() => setMobileNavOpen(false)}
              className={() =>
                cn(
                  buttonVariants({
                    variant: "ghost",
                    size: "sm",
                  }),
                  "h-auto w-full justify-start gap-3 rounded-xl py-2.5",
                  to === activeNavTo &&
                    "bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
                  sidebarCollapsed && "md:justify-center md:gap-0 md:px-2",
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={cn(sidebarCollapsed && "md:hidden")}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-2 pt-3">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-auto w-full justify-start gap-3 rounded-xl py-2.5 font-semibold text-destructive hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950",
              sidebarCollapsed && "md:justify-center md:gap-0 md:px-2",
            )}
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            title="Logout"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn(sidebarCollapsed && "md:hidden")}>Logout</span>
          </Button>
        </div>
      </aside>

      <div className={cn("min-h-screen bg-muted", sidebarCollapsed ? "md:pl-20" : "md:pl-60")}>
        <header className="sticky top-0 z-30 border-b border-border bg-white shadow-sm dark:border-border dark:bg-zinc-950">
          <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5">
            <div className="flex min-w-0 items-center gap-2 md:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileNavOpen(true)}
                className="shrink-0 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <BrandLogo compact className="hidden min-w-0 shrink-0 sm:block md:max-w-[min(52vw,320px)]" />
            </div>
            <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-1.5">
              <Button
                type="button"
                size="sm"
                className="h-9 max-w-[11rem] gap-1.5 truncate rounded-md bg-slate-700 px-2.5 font-semibold text-white shadow-sm hover:bg-slate-600 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-100 sm:max-w-none sm:px-3"
                onClick={() => navigate(primaryCta.to)}
              >
                <PrimaryIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{primaryCta.label}</span>
              </Button>
              <Separator orientation="vertical" className="mx-0.5 hidden h-7 sm:block" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 shrink-0 text-muted-foreground"
                onClick={() => navigate(ordersPath)}
                aria-label={
                  orderNotifyCount > 0
                    ? `${orderNotifyCount} notification${orderNotifyCount === 1 ? "" : "s"}`
                    : "Notifications"
                }
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {orderNotifyCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950" />
                ) : null}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 rounded-full border-border bg-white px-1.5 shadow-sm hover:bg-muted dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
                      {initials}
                    </span>
                    <span className="hidden max-w-[120px] truncate text-xs font-semibold sm:inline">
                      {(() => {
                        const p = user.name.trim().split(/\s+/).filter(Boolean);
                        if (p.length >= 2) return `${p[0]} ${p[1].slice(0, 1)}.`;
                        return user.name;
                      })()}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-2">
                  <DropdownMenuLabel className="px-2 py-2 font-normal">
                    <p className="text-sm font-semibold leading-tight text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onSelect={() => {
                      setShowProfile(true);
                      setMessage("");
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setShowPassword(true);
                      setMessage("");
                    }}
                  >
                    <Lock className="h-4 w-4" />
                    Change password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive data-[highlighted]:bg-red-50 data-[highlighted]:text-destructive dark:data-[highlighted]:bg-red-950"
                    onSelect={() => {
                      logout();
                      navigate("/login", { replace: true });
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-screen-2xl px-4 py-5 md:px-6 md:py-8">
          <Outlet />
        </main>
      </div>

      <Dialog
        open={showProfile}
        onOpenChange={(o) => {
          if (!o) setMessage("");
          setShowProfile(o);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              Profile settings
            </DialogTitle>
            <DialogDescription>Update name, phone, billing and delivery address.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-billing">Billing address</Label>
              <Input
                id="profile-billing"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-delivery">Delivery address</Label>
              <Input
                id="profile-delivery"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </div>
            {message ? <p className="text-xs text-emerald-600 dark:text-emerald-400">{message}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowProfile(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const res = await updateProfile({
                  name,
                  phone,
                  billingAddress,
                  deliveryAddress,
                });
                setMessage(res.ok ? "Profile updated." : res.message ?? "Update failed.");
                if (res.ok) setTimeout(() => setShowProfile(false), 700);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPassword}
        onOpenChange={(o) => {
          if (!o) setMessage("");
          setShowPassword(o);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Change password
            </DialogTitle>
            <DialogDescription>Enter your current password and a new password.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="pwd-current">Current password</Label>
              <Input
                id="pwd-current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pwd-next">New password</Label>
              <Input
                id="pwd-next"
                type="password"
                value={nextPassword}
                onChange={(e) => setNextPassword(e.target.value)}
              />
            </div>
            {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowPassword(false)}>
              Close
            </Button>
            <Button
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
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
