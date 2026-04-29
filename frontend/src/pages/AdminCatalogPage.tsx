import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmActionModal } from "../components/ConfirmActionModal";
import { useCatalog } from "../context/CatalogContext";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrdersContext";
import { PaginationControls } from "../components/PaginationControls";
import {
  appendCategoryMarkupHistory,
  loadCategoryMarkupHistory,
  loadCategoryMarkupSettings,
  saveCategoryMarkupSettings,
} from "../lib/categoryMarkupSettings";

type CatalogView = "all" | "categories" | "products";

export function AdminCatalogPage({ view = "all" }: { view?: CatalogView }) {
  const { user } = useAuth();
  const { orders } = useOrders();
  const { categories, addCategory, addCustomItem, updateCategory, deleteCategory, updateItem, deleteItem } = useCatalog();
  const [newCatBn, setNewCatBn] = useState("");
  const [newCatEn, setNewCatEn] = useState("");
  const [itemCat, setItemCat] = useState("");
  const [itemBn, setItemBn] = useState("");
  const [itemEn, setItemEn] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editBn, setEditBn] = useState("");
  const [editEn, setEditEn] = useState("");
  const [message, setMessage] = useState("");
  const [catQuery, setCatQuery] = useState("");
  const [catPage, setCatPage] = useState(1);
  const [catPerPage, setCatPerPage] = useState(10);
  const [itemQuery, setItemQuery] = useState("");
  const [itemPage, setItemPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [pendingDelete, setPendingDelete] = useState<
    { type: "category"; id: string; name: string } | { type: "item"; id: string; name: string } | null
  >(null);
  const [categoryMarkups, setCategoryMarkups] = useState<Record<string, number>>(loadCategoryMarkupSettings);
  const [markupHistory, setMarkupHistory] = useState(loadCategoryMarkupHistory);

  const sorted = useMemo(
    () => [...categories].sort((a, b) => `${a.nameEn}${a.nameBn}`.localeCompare(`${b.nameEn}${b.nameBn}`)),
    [categories],
  );
  const role = user?.role ?? "user";
  const canAddCategory = role === "admin" || role === "moderator";
  const canAddItem = role === "admin";
  const canEditDelete = role === "admin";
  const canViewProducts = canAddItem || role === "user";
  const showCategories = view === "all" || view === "categories";
  const showProducts = (view === "all" || view === "products") && canViewProducts;

  const itemRows = useMemo(
    () =>
      sorted.flatMap((c) =>
        c.items.map((i) => ({
          ...i,
          categoryNameEn: c.nameEn,
          categoryNameBn: c.nameBn,
        })),
      ),
    [sorted],
  );

  const usedItemIds = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) =>
      o.lines.forEach((l) => {
        if (l.itemId) set.add(l.itemId);
      }),
    );
    return set;
  }, [orders]);

  const usedCategoryIds = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) =>
      o.lines.forEach((l) => {
        if (l.categoryId) set.add(l.categoryId);
      }),
    );
    return set;
  }, [orders]);

  const filteredCategories = useMemo(() => {
    const q = catQuery.trim().toLowerCase();
    return sorted.filter((c) => {
      if (!q) return true;
      return c.nameEn.toLowerCase().includes(q) || c.nameBn.toLowerCase().includes(q);
    });
  }, [sorted, catQuery]);

  const safeCatPage = Math.min(catPage, Math.max(1, Math.ceil(filteredCategories.length / catPerPage)));
  const pagedCategories = filteredCategories.slice((safeCatPage - 1) * catPerPage, safeCatPage * catPerPage);

  const filteredItems = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    return itemRows.filter((i) => {
      if (!q) return true;
      return (
        i.nameEn.toLowerCase().includes(q) ||
        i.nameBn.toLowerCase().includes(q) ||
        i.categoryNameEn.toLowerCase().includes(q) ||
        i.categoryNameBn.toLowerCase().includes(q)
      );
    });
  }, [itemRows, itemQuery]);

  const safeItemPage = Math.min(itemPage, Math.max(1, Math.ceil(filteredItems.length / itemPerPage)));
  const pagedItems = filteredItems.slice((safeItemPage - 1) * itemPerPage, safeItemPage * itemPerPage);

  const saveCategory = () => {
    const created = addCategory(newCatBn, newCatEn);
    if (!created) {
      setMessage("Enter both Bangla and English names for category.");
      return;
    }
    setNewCatBn("");
    setNewCatEn("");
    setItemCat(created.id);
    setMessage(`Category added: ${created.nameEn}`);
  };

  const saveItem = () => {
    const target = itemCat || sorted[0]?.id || "";
    const created = addCustomItem(target, itemBn, itemEn);
    if (!created) {
      setMessage("Select category and enter both Bangla and English names for item.");
      return;
    }
    setItemBn("");
    setItemEn("");
    setMessage(`Item added: ${created.nameEn}`);
  };

  const startEditCategory = (id: string, bn: string, en: string) => {
    setEditingCatId(id);
    setEditBn(bn);
    setEditEn(en);
  };
  const startEditItem = (id: string, bn: string, en: string) => {
    setEditingItemId(id);
    setEditBn(bn);
    setEditEn(en);
  };
  const saveEditCategory = (id: string) => {
    const ok = updateCategory(id, editBn, editEn);
    setMessage(ok ? "Category updated." : "Category update failed.");
    setEditingCatId(null);
    setEditBn("");
    setEditEn("");
  };
  const saveEditItem = (id: string) => {
    const ok = updateItem(id, editBn, editEn);
    setMessage(ok ? "Item updated." : "Item update failed.");
    setEditingItemId(null);
    setEditBn("");
    setEditEn("");
  };
  const removeCategory = (id: string, itemsCount: number) => {
    if (itemsCount > 0) {
      setMessage("Delete all items from this category first.");
      return;
    }
    if (usedCategoryIds.has(id)) {
      setMessage("Category is used in orders and cannot be deleted.");
      return;
    }
    const category = sorted.find((c) => c.id === id);
    setPendingDelete({ type: "category", id, name: category?.nameEn ?? "this category" });
  };
  const removeItem = (id: string) => {
    if (usedItemIds.has(id)) {
      setMessage("This item is used in orders and cannot be deleted.");
      return;
    }
    const item = itemRows.find((i) => i.id === id);
    setPendingDelete({ type: "item", id, name: item?.nameEn ?? "this item" });
  };

  const setCategoryMarkup = (categoryId: string, value: string) => {
    const pct = Number(value);
    const safe = Number.isFinite(pct) && pct >= 0 ? pct : 0;
    const prevPct = Number(categoryMarkups[categoryId] ?? 0);
    if (prevPct === safe) return;
    const next = { ...categoryMarkups, [categoryId]: safe };
    setCategoryMarkups(next);
    saveCategoryMarkupSettings(next);
    setMarkupHistory(
      appendCategoryMarkupHistory({
        categoryId,
        previousPercent: prevPct,
        nextPercent: safe,
      }),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {view === "categories" ? "Category list" : view === "products" ? "Product list" : "Catalog list"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {role === "admin"
            ? "Admin can add, edit, and delete categories and products/items."
            : canAddCategory
              ? "Moderator can add categories. Product list is hidden."
              : "User can view product and category lists."}
        </p>
      </div>

      {showCategories && canAddCategory ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Add category</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={newCatBn}
              onChange={(e) => setNewCatBn(e.target.value)}
              placeholder="Category name (Bangla)"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              value={newCatEn}
              onChange={(e) => setNewCatEn(e.target.value)}
              placeholder="Category name (English)"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={saveCategory}
            className="mt-3 rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600"
          >
            Save category
          </button>
        </section>
      ) : null}

      {showProducts && canAddItem ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Add product/item</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <select
              value={itemCat}
              onChange={(e) => setItemCat(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select category</option>
              {sorted.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn} ({c.nameBn})
                </option>
              ))}
            </select>
            <input
              value={itemBn}
              onChange={(e) => setItemBn(e.target.value)}
              placeholder="Item name (Bangla)"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              value={itemEn}
              onChange={(e) => setItemEn(e.target.value)}
              placeholder="Item name (English)"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={saveItem}
            className="mt-3 rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600"
          >
            Save product
          </button>
        </section>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{message}</div>
      ) : null}

      {role === "admin" ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Billing markup settings (category-wise)</h2>
          <p className="mt-1 text-sm text-slate-600">
            This markup % is added to purchase line prices when admin generates customer billing invoice.
          </p>
          <div className="table-scroll mt-3 rounded-2xl border border-border">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide text-foreground">
                <tr>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Category (Bangla)</th>
                  <th className="px-3 py-2 text-right">Markup %</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => (
                  <tr key={`markup-${c.id}`} className="border-t border-border bg-card">
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{c.nameEn}</td>
                    <td className="px-3 py-2.5 font-bn text-slate-700">{c.nameBn}</td>
                    <td className="px-3 py-2.5 text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={categoryMarkups[c.id] ?? 0}
                        onChange={(e) => setCategoryMarkup(c.id, e.target.value)}
                        className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-slate-900">Markup rate history</h3>
          <div className="table-scroll mt-2 rounded-2xl border border-border">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide text-foreground">
                <tr>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Previous %</th>
                  <th className="px-3 py-2 text-right">New %</th>
                  <th className="px-3 py-2">Changed at</th>
                </tr>
              </thead>
              <tbody>
                {markupHistory.slice(0, 30).map((h) => {
                  const cat = sorted.find((c) => c.id === h.categoryId);
                  return (
                    <tr key={h.id} className="border-t border-border bg-card">
                      <td className="px-3 py-2.5 font-medium text-slate-800">
                        {cat ? `${cat.nameEn} (${cat.nameBn})` : h.categoryId}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600">{h.previousPercent}%</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-slate-900">{h.nextPercent}%</td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {new Date(h.changedAtIso).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {markupHistory.length === 0 ? (
                  <tr className="border-t border-border bg-card">
                    <td colSpan={4} className="px-3 py-8 text-center text-sm text-slate-500">
                      No markup history yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {showCategories ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-base font-semibold text-slate-900">Category list</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={catQuery}
            onChange={(e) => {
              setCatQuery(e.target.value);
              setCatPage(1);
            }}
            placeholder="Search category..."
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="text-xs text-slate-500 flex items-center">
            Showing {filteredCategories.length} categories
          </div>
        </div>
        <div className="table-scroll mt-3 rounded-2xl border border-border">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide text-foreground">
              <tr>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Category (Bangla)</th>
                <th className="px-3 py-2">Items count</th>
                <th className="px-3 py-2">Used in orders</th>
                {canEditDelete ? <th className="px-3 py-2 text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {pagedCategories.map((c) => (
                <tr key={c.id} className="border-t border-border bg-card">
                  <td className="px-3 py-2.5 font-semibold text-slate-900">
                    {editingCatId === c.id ? (
                      <input
                        value={editEn}
                        onChange={(e) => setEditEn(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      />
                    ) : (
                      c.nameEn
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-bn text-slate-700">
                    {editingCatId === c.id ? (
                      <input
                        value={editBn}
                        onChange={(e) => setEditBn(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-bn"
                      />
                    ) : (
                      c.nameBn
                    )}
                  </td>
                  <td className="px-3 py-2.5">{c.items.length}</td>
                  <td className="px-3 py-2.5">{usedCategoryIds.has(c.id) ? "Yes" : "No"}</td>
                  {canEditDelete ? (
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex gap-1">
                        {editingCatId === c.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEditCategory(c.id)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCatId(null)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditCategory(c.id, c.nameBn, c.nameEn)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                              title="Edit category"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCategory(c.id, c.items.length)}
                              className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"
                              title="Delete category"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
              {pagedCategories.length === 0 ? (
                <tr className="border-t border-border bg-card">
                  <td
                    colSpan={canEditDelete ? 5 : 4}
                    className="px-3 py-8 text-center text-sm text-slate-500"
                  >
                    No categories match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {filteredCategories.length > 0 ? (
          <PaginationControls
            totalItems={filteredCategories.length}
            page={safeCatPage}
            perPage={catPerPage}
            onPageChange={setCatPage}
            onPerPageChange={(size) => {
              setCatPerPage(size);
              setCatPage(1);
            }}
          />
        ) : null}
        </section>
      ) : null}

      {showProducts ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold text-slate-900">Product list</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={itemQuery}
              onChange={(e) => {
                setItemQuery(e.target.value);
                setItemPage(1);
              }}
              placeholder="Search product..."
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="text-xs text-slate-500 flex items-center">
              Showing {filteredItems.length} products
            </div>
          </div>
          <div className="table-scroll mt-3 rounded-2xl border border-border">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide text-foreground">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Product (Bangla)</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Used in orders</th>
                  {canEditDelete ? <th className="px-3 py-2 text-right">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((i) => (
                  <tr key={i.id} className="border-t border-border bg-card">
                    <td className="px-3 py-2.5 font-medium text-slate-900">
                      {editingItemId === i.id ? (
                        <input
                          value={editEn}
                          onChange={(e) => setEditEn(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        />
                      ) : (
                        i.nameEn
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-bn text-slate-700">
                      {editingItemId === i.id ? (
                        <input
                          value={editBn}
                          onChange={(e) => setEditBn(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-bn"
                        />
                      ) : (
                        i.nameBn
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {i.categoryNameEn} ({i.categoryNameBn})
                    </td>
                    <td className="px-3 py-2.5">{usedItemIds.has(i.id) ? "Yes" : "No"}</td>
                    {canEditDelete ? (
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex gap-1">
                          {editingItemId === i.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveEditItem(i.id)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItemId(null)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditItem(i.id, i.nameBn, i.nameEn)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                                title="Edit item"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(i.id)}
                                className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"
                                title="Delete item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {pagedItems.length === 0 ? (
                  <tr className="border-t border-border bg-card">
                    <td
                      colSpan={canEditDelete ? 5 : 4}
                      className="px-3 py-8 text-center text-sm text-slate-500"
                    >
                      No products match your filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {filteredItems.length > 0 ? (
            <PaginationControls
              totalItems={filteredItems.length}
              page={safeItemPage}
              perPage={itemPerPage}
              onPageChange={setItemPage}
              onPerPageChange={(size) => {
                setItemPerPage(size);
                setItemPage(1);
              }}
            />
          ) : null}
        </section>
      ) : null}

      <ConfirmActionModal
        open={Boolean(pendingDelete)}
        title={pendingDelete?.type === "category" ? "Delete category" : "Delete item"}
        description={
          pendingDelete
            ? `Are you sure you want to delete ${pendingDelete.name}? This action cannot be undone.`
            : ""
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          const ok =
            pendingDelete.type === "category"
              ? deleteCategory(pendingDelete.id)
              : deleteItem(pendingDelete.id);
          setMessage(
            ok
              ? pendingDelete.type === "category"
                ? "Category deleted."
                : "Item deleted."
              : pendingDelete.type === "category"
                ? "Category delete failed."
                : "Item delete failed.",
          );
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
