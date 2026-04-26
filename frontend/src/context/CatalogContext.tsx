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
  addCategory: (nameBn: string, nameEn: string) => CategoryDef | null;
  updateCategory: (categoryId: string, nameBn: string, nameEn: string) => boolean;
  deleteCategory: (categoryId: string) => boolean;
  updateItem: (itemId: string, nameBn: string, nameEn: string) => boolean;
  deleteItem: (itemId: string) => boolean;
}

const CatalogContext = createContext<CatalogState | null>(null);

const STORAGE_FULL_KEY = "gom_catalog_full";
const STORAGE_KEY = "gom_custom_catalog";
const STORAGE_CAT_KEY = "gom_custom_categories";

function loadMerged(): CategoryDef[] {
  try {
    const rawFull = localStorage.getItem(STORAGE_FULL_KEY);
    if (rawFull) {
      const parsed = JSON.parse(rawFull) as CategoryDef[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore parse errors */
  }
  const map = new Map<string, CategoryDef>();
  for (const c of seedCatalog) {
    map.set(c.id, { ...c, items: [...c.items] });
  }
  try {
    const rawCats = localStorage.getItem(STORAGE_CAT_KEY);
    if (rawCats) {
      const customCats = JSON.parse(rawCats) as CategoryDef[];
      for (const c of customCats) {
        if (!map.has(c.id)) map.set(c.id, { ...c, items: [...(c.items ?? [])] });
      }
    }
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

function persistCatalog(categories: CategoryDef[]) {
  localStorage.setItem(STORAGE_FULL_KEY, JSON.stringify(categories));
  // keep legacy custom buckets in sync for older clients
  const extra: Record<string, CatalogItem[]> = {};
  for (const c of categories) {
    const custom = c.items.filter((i) => i.id.startsWith("custom-"));
    if (custom.length) extra[c.id] = custom;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(extra));
  localStorage.setItem(
    STORAGE_CAT_KEY,
    JSON.stringify(categories.filter((c) => c.id.startsWith("custom-cat-"))),
  );
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
      persistCatalog(next);
      return next;
    });
    return item;
  }, []);

  const addCategory = useCallback((nameBn: string, nameEn: string) => {
    const bn = nameBn.trim();
    const en = nameEn.trim();
    if (!bn || !en) return null;
    const id = `custom-cat-${Date.now()}`;
    const category: CategoryDef = { id, nameBn: bn, nameEn: en, items: [] };
    setCategories((prev) => {
      const next = [...prev, category];
      persistCatalog(next);
      return next;
    });
    return category;
  }, []);

  const updateCategory = useCallback((categoryId: string, nameBn: string, nameEn: string) => {
    const bn = nameBn.trim();
    const en = nameEn.trim();
    if (!bn || !en) return false;
    let changed = false;
    setCategories((prev) => {
      const next = prev.map((c) => {
        if (c.id !== categoryId) return c;
        changed = true;
        return { ...c, nameBn: bn, nameEn: en };
      });
      if (changed) persistCatalog(next);
      return next;
    });
    return changed;
  }, []);

  const deleteCategory = useCallback((categoryId: string) => {
    let changed = false;
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== categoryId);
      changed = next.length !== prev.length;
      if (changed) persistCatalog(next);
      return next;
    });
    return changed;
  }, []);

  const updateItem = useCallback((itemId: string, nameBn: string, nameEn: string) => {
    const bn = nameBn.trim();
    const en = nameEn.trim();
    if (!bn || !en) return false;
    let changed = false;
    setCategories((prev) => {
      const next = prev.map((c) => {
        let catChanged = false;
        const items = c.items.map((i) => {
          if (i.id !== itemId) return i;
          catChanged = true;
          changed = true;
          return { ...i, nameBn: bn, nameEn: en };
        });
        return catChanged ? { ...c, items } : c;
      });
      if (changed) persistCatalog(next);
      return next;
    });
    return changed;
  }, []);

  const deleteItem = useCallback((itemId: string) => {
    let changed = false;
    setCategories((prev) => {
      const next = prev.map((c) => {
        const items = c.items.filter((i) => i.id !== itemId);
        if (items.length !== c.items.length) {
          changed = true;
          return { ...c, items };
        }
        return c;
      });
      if (changed) persistCatalog(next);
      return next;
    });
    return changed;
  }, []);

  const value = useMemo(
    () => ({
      categories,
      addCustomItem,
      addCategory,
      updateCategory,
      deleteCategory,
      updateItem,
      deleteItem,
    }),
    [categories, addCustomItem, addCategory, updateCategory, deleteCategory, updateItem, deleteItem],
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
