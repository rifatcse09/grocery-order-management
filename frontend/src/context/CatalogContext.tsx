import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CatalogItem, CategoryDef } from "../types";
import { seedCatalog } from "../data/catalog";

interface CatalogState {
  categories: CategoryDef[];
  addCustomItem: (categoryId: string, nameBn: string, nameEn: string) => CatalogItem | null;
}

const CatalogContext = createContext<CatalogState | null>(null);

const STORAGE_KEY = "gom_custom_catalog";

function loadMerged(): CategoryDef[] {
  const map = new Map<string, CategoryDef>();
  for (const c of seedCatalog) {
    map.set(c.id, { ...c, items: [...c.items] });
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return Array.from(map.values());
    const extra = JSON.parse(raw) as Record<string, CatalogItem[]>;
    for (const [cid, items] of Object.entries(extra)) {
      const cat = map.get(cid);
      if (cat) {
        const ids = new Set(cat.items.map((i) => i.id));
        for (const it of items) {
          if (!ids.has(it.id)) cat.items.push(it);
        }
      }
    }
  } catch {
    /* ignore */
  }
  return Array.from(map.values());
}

function persistCustom(categories: CategoryDef[]) {
  const extra: Record<string, CatalogItem[]> = {};
  for (const c of categories) {
    const custom = c.items.filter((i) => i.id.startsWith("custom-"));
    if (custom.length) extra[c.id] = custom;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(extra));
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryDef[]>(loadMerged);

  const addCustomItem = useCallback((categoryId: string, nameBn: string, nameEn: string) => {
    const bn = nameBn.trim();
    const en = nameEn.trim();
    if (!bn || !en) return null;
    const id = `custom-${categoryId}-${Date.now()}`;
    const item: CatalogItem = { id, categoryId, nameBn: bn, nameEn: en };
    setCategories((prev) => {
      const next = prev.map((c) =>
        c.id === categoryId ? { ...c, items: [...c.items, item] } : c,
      );
      persistCustom(next);
      return next;
    });
    return item;
  }, []);

  const value = useMemo(
    () => ({ categories, addCustomItem }),
    [categories, addCustomItem],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog inside CatalogProvider");
  return ctx;
}
