import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Order } from "../types";
import { apiCreateOrder, apiDeleteOrder, apiEnabled, apiListOrders, apiUpdateOrder } from "../lib/api";
import { useAuth } from "./AuthContext";

interface OrdersState {
  orders: Order[];
  loadOrders: () => Promise<void>;
  upsertOrder: (o: Order) => void;
  deleteOrder: (id: string) => void;
  getById: (id: string) => Order | undefined;
}

const OrdersContext = createContext<OrdersState | null>(null);

const KEY = "gom_orders";

function load(): Order[] {
  if (apiEnabled()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Order[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(load);
  const { user } = useAuth();

  const loadOrders = useCallback(async () => {
    if (!apiEnabled()) return;
    if (!user?.id) return;
    try {
      const rows = await apiListOrders();
      setOrders(rows);
      localStorage.setItem(KEY, JSON.stringify(rows));
    } catch {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Order[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
          }
        }
      } catch {
        /* ignore */
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (!apiEnabled()) return;
    if (!user?.id) {
      setOrders([]);
      return;
    }
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Order[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    void loadOrders();
  }, [user?.id, loadOrders]);

  const upsertOrder = useCallback((o: Order) => {
    setOrders((prev) => {
      const i = prev.findIndex((x) => x.id === o.id);
      const next =
        i >= 0 ? [...prev.slice(0, i), o, ...prev.slice(i + 1)] : [o, ...prev];
      localStorage.setItem(KEY, JSON.stringify(next));
      if (apiEnabled()) {
        if (i >= 0) {
          void apiUpdateOrder(o.id, o)
            .then((updated) => {
              setOrders((curr) => {
                const merged = curr.map((x) => (x.id === o.id ? updated : x));
                localStorage.setItem(KEY, JSON.stringify(merged));
                return merged;
              });
            })
            .catch(() => {
              // If update fails for temp/local ids, fallback to create on backend.
              void apiCreateOrder(o)
                .then((created) => {
                  setOrders((curr) => {
                    const merged = curr.map((x) => (x.id === o.id ? created : x));
                    localStorage.setItem(KEY, JSON.stringify(merged));
                    return merged;
                  });
                })
                .catch(() => {
                  // Keep UI usable even when backend is offline.
                });
            });
        } else {
          void apiCreateOrder(o)
            .then((created) => {
              setOrders((curr) => {
                const merged = curr.map((x) => (x.id === o.id ? created : x));
                localStorage.setItem(KEY, JSON.stringify(merged));
                return merged;
              });
            })
            .catch(() => {
              // Keep UI usable even when backend is offline.
            });
        }
      }
      return next;
    });
  }, []);

  const getById = useCallback(
    (id: string) => orders.find((x) => x.id === id),
    [orders],
  );

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => {
      const next = prev.filter((x) => x.id !== id);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
    if (apiEnabled()) {
      void apiDeleteOrder(id).catch(() => {
        // Keep UI usable if backend is unreachable.
      });
    }
  }, []);

  const value = useMemo(
    () => ({ orders, loadOrders, upsertOrder, deleteOrder, getById }),
    [orders, loadOrders, upsertOrder, deleteOrder, getById],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders inside OrdersProvider");
  return ctx;
}
