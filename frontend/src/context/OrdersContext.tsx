import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Order } from "../types";
import { dummyOrders } from "../data/dummyOrders";

interface OrdersState {
  orders: Order[];
  upsertOrder: (o: Order) => void;
  getById: (id: string) => Order | undefined;
}

const OrdersContext = createContext<OrdersState | null>(null);

const KEY = "gom_orders";

function load(): Order[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Order[];
  } catch {
    /* ignore */
  }
  return dummyOrders;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(load);

  const upsertOrder = useCallback((o: Order) => {
    setOrders((prev) => {
      const i = prev.findIndex((x) => x.id === o.id);
      const next =
        i >= 0 ? [...prev.slice(0, i), o, ...prev.slice(i + 1)] : [o, ...prev];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getById = useCallback(
    (id: string) => orders.find((x) => x.id === id),
    [orders],
  );

  const value = useMemo(
    () => ({ orders, upsertOrder, getById }),
    [orders, upsertOrder, getById],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders inside OrdersProvider");
  return ctx;
}
