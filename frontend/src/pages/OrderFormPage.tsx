import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { OrderLinesEditor } from "../components/OrderLinesEditor";
import { SignatureCapture } from "../components/SignatureCapture";
import { useAuth } from "../context/AuthContext";
import { useCatalog } from "../context/CatalogContext";
import { useOrders } from "../context/OrdersContext";
import type { Order, OrderLine } from "../types";
import { nextOrderNo, todayIsoDate } from "../lib/orderNo";
import { canEditOrder, validateLineQuantity } from "../lib/quantityRules";

function newLine(categories: { id: string }[]): OrderLine {
  const cid = categories[0]?.id ?? "fresh";
  return {
    id: crypto.randomUUID(),
    serial: 1,
    categoryId: cid,
    itemId: "",
    itemNameBn: "",
    itemNameEn: "",
    kg: "",
    gram: "",
    piece: "",
  };
}

export function OrderFormPage() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories, addCustomItem } = useCatalog();
  const { orders, upsertOrder, getById } = useOrders();

  const [order, setOrder] = useState<Order | null>(null);
  const [addRowModal, setAddRowModal] = useState(false);
  const [addItemModal, setAddItemModal] = useState(false);
  const [pickCat, setPickCat] = useState(categories[0]?.id ?? "");
  const [pickItem, setPickItem] = useState("");
  const [customBn, setCustomBn] = useState("");
  const [customEn, setCustomEn] = useState("");

  useEffect(() => {
    if (!user) return;
    if (isNew) {
      const lines = [newLine(categories)];
      lines[0].serial = 1;
      const first = categories[0];
      const firstItem = first?.items[0];
      if (first && firstItem) {
        lines[0].categoryId = first.id;
        lines[0].itemId = firstItem.id;
        lines[0].itemNameBn = firstItem.nameBn;
        lines[0].itemNameEn = firstItem.nameEn;
      }
      setOrder({
        id: crypto.randomUUID(),
        ownerId: user.id,
        orderNo: nextOrderNo(orders),
        orderDate: todayIsoDate(),
        deliveryDate: todayIsoDate(),
        status: "draft",
        billingAddress: user.billingAddress,
        deliveryAddress: user.deliveryAddress,
        contactPerson: user.name,
        phone: user.phone,
        lines,
        signatureDataUrl: null,
      });
      return;
    }
    const existing = getById(id!);
    if (existing) setOrder({ ...existing });
  }, [isNew, id, user, categories, orders, getById]);

  const itemsOf = useMemo(() => {
    const c = categories.find((x) => x.id === pickCat);
    return c?.items ?? [];
  }, [categories, pickCat]);

  if (!order) {
    return (
      <p className="text-sm text-slate-600">
        Loading… or order not found.{" "}
        <Link to="/user/orders" className="text-accent underline">
          Back to list
        </Link>
      </p>
    );
  }

  // New and draft orders are always editable; non-draft orders lock inside 48h.
  const editWindowOk = isNew || order.status === "draft" || canEditOrder(order.deliveryDate);
  const linesOk =
    order.lines.length > 0 &&
    order.lines.every((l) => validateLineQuantity(l.kg, l.gram, l.piece) == null);

  const save = () => {
    upsertOrder(order);
    navigate("/user/orders");
  };

  const goReview = () => {
    if (!linesOk || !editWindowOk) return;
    upsertOrder(order);
    navigate(`/user/orders/${order.id}/review`);
  };

  const addFromCatalog = () => {
    const cat = categories.find((c) => c.id === pickCat);
    const it = cat?.items.find((i) => i.id === pickItem);
    if (!cat || !it) return;
    const line: OrderLine = {
      id: crypto.randomUUID(),
      serial: order.lines.length + 1,
      categoryId: cat.id,
      itemId: it.id,
      itemNameBn: it.nameBn,
      itemNameEn: it.nameEn,
      kg: "",
      gram: "",
      piece: "",
    };
    setOrder({ ...order, lines: [...order.lines, line] });
    setAddRowModal(false);
  };

  const saveNewItemOnly = () => {
    if (!pickCat || !customBn.trim() || !customEn.trim()) return;
    addCustomItem(pickCat, customBn.trim(), customEn.trim());
    setCustomBn("");
    setCustomEn("");
    setAddItemModal(false);
  };

  return (
    <div className="space-y-7">
      <div>
        <Link to="/user/orders" className="text-xs text-accent hover:underline">
          ← Orders
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-brand-dark sm:text-3xl">Order form</h1>
        <p className="mt-1 text-base font-medium text-slate-700">
          Order number and date are automatic. Quantities: kg and/or g, or pieces only.
        </p>
      </div>

      {!editWindowOk && !isNew ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Less than 48h to delivery — this order cannot be edited.
        </div>
      ) : null}

      <div className="grid gap-4 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-5 shadow-card sm:p-7 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-600">Order no.</p>
          <p className="font-mono text-xl font-bold text-slate-900">{order.orderNo}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-600">Date</p>
          <p className="font-mono text-lg font-semibold text-slate-900">{order.orderDate}</p>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-slate-700">Billing address</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base"
            rows={2}
            value={order.billingAddress}
            onChange={(e) => setOrder({ ...order, billingAddress: e.target.value })}
            disabled={!editWindowOk}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-slate-700">Delivery address</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base"
            rows={2}
            value={order.deliveryAddress}
            onChange={(e) => setOrder({ ...order, deliveryAddress: e.target.value })}
            disabled={!editWindowOk}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Delivery date</label>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base"
            value={order.deliveryDate}
            onChange={(e) => setOrder({ ...order, deliveryDate: e.target.value })}
            disabled={!editWindowOk}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Time window (text)</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base"
            value={order.deliveryTime ?? ""}
            onChange={(e) => setOrder({ ...order, deliveryTime: e.target.value })}
            placeholder="e.g. 10:00 — 12:00"
            disabled={!editWindowOk}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Contact person</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base"
            value={order.contactPerson}
            onChange={(e) => setOrder({ ...order, contactPerson: e.target.value })}
            disabled={!editWindowOk}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Phone</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base"
            value={order.phone}
            onChange={(e) => setOrder({ ...order, phone: e.target.value })}
            disabled={!editWindowOk}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-900">Line items</h2>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!editWindowOk}
            onClick={() => {
              setPickCat(categories[0]?.id ?? "");
              setPickItem(categories[0]?.items[0]?.id ?? "");
              setAddItemModal(true);
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm disabled:opacity-40"
          >
            + Add new item
          </button>
          <button
            type="button"
            disabled={!editWindowOk}
            onClick={() => {
              setPickCat(categories[0]?.id ?? "");
              setPickItem(categories[0]?.items[0]?.id ?? "");
              setAddRowModal(true);
            }}
            className="rounded-xl bg-brand-dark px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
          >
            + Add row
          </button>
        </div>
      </div>

      {!linesOk ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Some rows break quantity rules: use kg and/or g, or pieces only
            (কেজি/গ্রাম অথবা শুধু পিচ).
          </p>
        </div>
      ) : null}

      <OrderLinesEditor
        lines={order.lines}
        categories={categories}
        largeText
        onChange={(lines) => setOrder({ ...order, lines })}
      />

      <SignatureCapture
        value={order.signatureDataUrl}
        onChange={(url) => setOrder({ ...order, signatureDataUrl: url })}
      />

      <div className="grid gap-3 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={save}
          disabled={!editWindowOk || !linesOk}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold shadow-sm hover:bg-slate-50"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={!linesOk || !editWindowOk}
          onClick={goReview}
          className="rounded-2xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue to review →
        </button>
      </div>

      {addRowModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">Add line</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-600">Category (ধরন)</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={pickCat}
                  onChange={(e) => {
                    setPickCat(e.target.value);
                    const c = categories.find((x) => x.id === e.target.value);
                    setPickItem(c?.items[0]?.id ?? "");
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.nameBn})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-600">Item (বস্তু)</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={pickItem}
                  onChange={(e) => setPickItem(e.target.value)}
                >
                  {itemsOf.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nameEn} ({i.nameBn})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={addFromCatalog}
                className="w-full rounded-xl bg-brand-dark py-2 text-sm font-semibold text-white"
              >
                Add from catalog
              </button>
              <button
                type="button"
                onClick={() => setAddRowModal(false)}
                className="w-full rounded-xl py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {addItemModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">Add new item to category</h3>
            <p className="mt-1 text-xs text-slate-500">
              This saves the item for future orders (local demo catalog).
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-600">Category</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={pickCat}
                  onChange={(e) => setPickCat(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.nameBn})
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bn"
                placeholder="Name (Bangla)"
                value={customBn}
                onChange={(e) => setCustomBn(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Name (English)"
                value={customEn}
                onChange={(e) => setCustomEn(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveNewItemOnly}
                  className="flex-1 rounded-xl bg-brand-dark py-2 text-sm font-semibold text-white"
                >
                  Save item
                </button>
                <button
                  type="button"
                  onClick={() => setAddItemModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-sm text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
