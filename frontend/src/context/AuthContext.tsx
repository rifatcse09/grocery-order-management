import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Role, SessionUser } from "../types";
import {
  apiCreateUser,
  apiEnabled,
  apiListUsers,
  apiLogin,
  apiRegister,
  apiUpdateProfile,
} from "../lib/api";

interface AuthState {
  user: SessionUser | null;
  login: (email: string, password: string, role: Role) => Promise<{ ok: boolean; message?: string }>;
  register: (payload: RegisterPayload) => Promise<{ ok: boolean; message?: string }>;
  createAccountByAdmin: (payload: AdminCreatePayload) => Promise<{ ok: boolean; message?: string }>;
  listAccounts: () => SessionUser[];
  updateProfile: (patch: {
    name: string;
    phone: string;
    billingAddress: string;
    deliveryAddress: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  updatePassword: (currentPassword: string, nextPassword: string) => { ok: boolean; message?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const SESSION_KEY = "gom_session";
const ACCOUNTS_KEY = "gom_accounts";
const TOKEN_KEY = "gom_token";

interface Account extends SessionUser {
  password: string;
}

interface RegisterPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  billingAddress: string;
  deliveryAddress: string;
}

interface AdminCreatePayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: Exclude<Role, "admin">;
  billingAddress?: string;
  deliveryAddress?: string;
}

const demoProfiles: Record<Role, Account> = {
  user: {
    id: "u1",
    name: "Rafi Ahmed",
    email: "user@demo.local",
    password: "demo123",
    phone: "+8801711000000",
    role: "user",
    billingAddress: "Dhanmondi, Dhaka-1209",
    deliveryAddress: "Gulshan-2, Dhaka-1212",
  },
  moderator: {
    id: "m1",
    name: "Demo Moderator",
    email: "moderator@demo.local",
    password: "demo123",
    phone: "+8801811000000",
    role: "moderator",
    billingAddress: "—",
    deliveryAddress: "—",
  },
  admin: {
    id: "a1",
    name: "Demo Admin",
    email: "admin@demo.local",
    password: "demo123",
    phone: "+8801911000000",
    role: "admin",
    billingAddress: "—",
    deliveryAddress: "—",
  },
};

function toSession(account: Account): SessionUser {
  const { password: _password, ...session } = account;
  return session;
}

function loadAccounts(): Account[] {
  const defaults = [demoProfiles.user, demoProfiles.moderator, demoProfiles.admin];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Array<Partial<Account>>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed
          .filter((a): a is Partial<Account> & { id: string; email: string; role: Role } =>
            Boolean(a && a.id && a.email && a.role),
          )
          .map((a) => {
            const fallback = defaults.find((d) => d.id === a.id || d.email === a.email);
            return {
              id: a.id,
              name: a.name ?? fallback?.name ?? "User",
              email: a.email,
              password: a.password ?? fallback?.password ?? "demo123",
              phone: a.phone ?? fallback?.phone ?? "",
              role: a.role,
              billingAddress: a.billingAddress ?? fallback?.billingAddress ?? "",
              deliveryAddress: a.deliveryAddress ?? fallback?.deliveryAddress ?? "",
            } satisfies Account;
          });

        // Keep built-in demo accounts always available for quick role login.
        const merged = [...normalized];
        for (const d of defaults) {
          if (!merged.some((a) => a.id === d.id)) merged.push(d);
        }
        return merged;
      }
    }
  } catch {
    /* ignore */
  }
  return defaults;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>(loadAccounts);
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw) as SessionUser;
    } catch {
      /* ignore */
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (!apiEnabled() || !user || user.role !== "admin") return;
    void apiListUsers()
      .then((rows) => {
        setAccounts(
          rows.map((a) => ({
            ...a,
            password: "",
          })),
        );
      })
      .catch(() => {
        // Keep local snapshot if API listing fails.
      });
  }, [user]);

  const login = useCallback(
    async (email: string, password: string, role: Role) => {
      if (apiEnabled()) {
        try {
          const res = await apiLogin({ email, password, role });
          setUser(res.user);
          localStorage.setItem(SESSION_KEY, JSON.stringify(res.user));
          localStorage.setItem(TOKEN_KEY, res.token);
          return { ok: true };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : "Sign in failed." };
        }
      }
      const emailNorm = email.trim().toLowerCase();
      const fallbackEmail = demoProfiles[role].email.toLowerCase();
      const targetEmail = emailNorm || fallbackEmail;
      const accountFromStore = accounts.find(
        (a) => a.role === role && a.email.toLowerCase() === targetEmail,
      );
      const account = accountFromStore ?? demoProfiles[role];

      const isBuiltInDemo = account.id === demoProfiles[role].id;
      const passwordOk = isBuiltInDemo
        ? password.trim().length > 0 || password === demoProfiles[role].password
        : account.password === password;

      if (!passwordOk) {
        return {
          ok: false,
          message: isBuiltInDemo
            ? "Enter any password for demo login."
            : "Invalid password.",
        };
      }
      const next = toSession(account);
      setUser(next);
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return { ok: true };
    },
    [accounts],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      if (apiEnabled()) {
        try {
          const res = await apiRegister(payload);
          setUser(res.user);
          localStorage.setItem(SESSION_KEY, JSON.stringify(res.user));
          localStorage.setItem(TOKEN_KEY, res.token);
          return { ok: true };
        } catch (error) {
          return { ok: false, message: error instanceof Error ? error.message : "Sign up failed." };
        }
      }
      const emailNorm = payload.email.trim().toLowerCase();
      if (!emailNorm || !payload.password.trim()) {
        return { ok: false, message: "Email and password are required." };
      }
      if (accounts.some((a) => a.email.toLowerCase() === emailNorm)) {
        return { ok: false, message: "Email already exists." };
      }
      const account: Account = {
        id: `u-${Date.now()}`,
        role: "user",
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        email: emailNorm,
        password: payload.password,
        billingAddress: payload.billingAddress.trim(),
        deliveryAddress: payload.deliveryAddress.trim(),
      };
      setAccounts((prev) => [account, ...prev]);
      const session = toSession(account);
      setUser(session);
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { ok: true };
    },
    [accounts],
  );

  const createAccountByAdmin = useCallback(
    async (payload: AdminCreatePayload) => {
      if (apiEnabled()) {
        try {
          const created = await apiCreateUser(payload);
          setAccounts((prev) => [{ ...created, password: "" }, ...prev.filter((p) => p.id !== created.id)]);
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Failed to create account.",
          };
        }
      }
      if (!user || user.role !== "admin") {
        return { ok: false, message: "Only admin can create accounts." };
      }
      const emailNorm = payload.email.trim().toLowerCase();
      if (!emailNorm || !payload.password.trim() || !payload.name.trim()) {
        return { ok: false, message: "Name, email and password are required." };
      }
      if (accounts.some((a) => a.email.toLowerCase() === emailNorm)) {
        return { ok: false, message: "Email already exists." };
      }
      const account: Account = {
        id: `${payload.role}-${Date.now()}`,
        role: payload.role,
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        email: emailNorm,
        password: payload.password.trim(),
        billingAddress: payload.billingAddress?.trim() || "—",
        deliveryAddress: payload.deliveryAddress?.trim() || "—",
      };
      setAccounts((prev) => [account, ...prev]);
      return { ok: true };
    },
    [accounts, user],
  );

  const listAccounts = useCallback(() => accounts.map((a) => toSession(a)), [accounts]);

  const updateProfile = useCallback(
    async (patch: {
      name: string;
      phone: string;
      billingAddress: string;
      deliveryAddress: string;
    }) => {
      if (!user) return { ok: false, message: "No active session." };
      const name = patch.name.trim();
      const phone = patch.phone.trim();
      const billingAddress = patch.billingAddress.trim();
      const deliveryAddress = patch.deliveryAddress.trim();
      if (!name) return { ok: false, message: "Name is required." };

      if (apiEnabled()) {
        try {
          const updated = await apiUpdateProfile({
            name,
            phone,
            billingAddress,
            deliveryAddress,
          });
          setAccounts((prev) =>
            prev.map((a) => (a.id === user.id ? { ...a, ...updated } : a)),
          );
          setUser(updated);
          localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
          return { ok: true };
        } catch (error) {
          return {
            ok: false,
            message: error instanceof Error ? error.message : "Profile update failed.",
          };
        }
      }

      setAccounts((prev) =>
        prev.map((a) =>
          a.id === user.id
            ? { ...a, name, phone, billingAddress, deliveryAddress }
            : a,
        ),
      );
      const next = { ...user, name, phone, billingAddress, deliveryAddress };
      setUser(next);
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return { ok: true };
    },
    [user],
  );

  const updatePassword = useCallback(
    (currentPassword: string, nextPassword: string) => {
      if (!user) return { ok: false, message: "No active session." };
      const found = accounts.find((a) => a.id === user.id);
      if (!found) return { ok: false, message: "Account not found." };
      if (found.password !== currentPassword) {
        return { ok: false, message: "Current password is incorrect." };
      }
      if (nextPassword.trim().length < 6) {
        return { ok: false, message: "New password must be at least 6 characters." };
      }
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === user.id ? { ...a, password: nextPassword.trim() } : a,
        ),
      );
      return { ok: true };
    },
    [accounts, user],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      createAccountByAdmin,
      listAccounts,
      updateProfile,
      updatePassword,
      logout,
    }),
    [
      user,
      login,
      register,
      createAccountByAdmin,
      listAccounts,
      updateProfile,
      updatePassword,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
