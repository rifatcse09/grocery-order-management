import { Link, useNavigate, useParams } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";
import { StatusBadge } from "../components/StatusBadge";
import { canEditOrder, validateLineQuantity } from "../lib/quantityRules";
import { formatQtyLine } from "../lib/uiLabels";
import { useMemo } from "react";

export function ReviewOrderPage() {
  const { id } = useParams();
  const { getById, upsertOrder } = useOrders();
  const navigate = useNavigate();
  const base = id ? getById(id) : undefined;

  const order = useMemo(() => {
    if (!base) return undefined;
    return { ...base };
  }, [base]);

  if (!order) {
    return (
      <p className="text-sm">
        Order not found.{" "}
        <Link className="text-accent underline" to="/user/orders">
          Back
        </Link>
      </p>
    );
  }

  const linesOk = order.lines.every(
    (l) => validateLineQuantity(l.kg, l.gram, l.piece) == null,
  );
  const deliveryOk = canEditOrder(order.deliveryDate);
  const signed = Boolean(order.signatureDataUrl);

  const confirm = () => {
    if (!linesOk || !deliveryOk || !signed) return;
    upsertOrder({ ...order, status: "submitted", signatureDataUrl: order.signatureDataUrl });
    navigate("/user/orders");
  };

  const saveAsDraft = () => {
    upsertOrder({ ...order, status: "draft", signatureDataUrl: order.signatureDataUrl });
    navigate("/user/orders");
  };

  return (
    <div className="space-y-6">
      <Link to={`/user/orders/${order.id}/edit`} className="text-xs text-accent hover:underline">
        ← Back to form
      </Link>
      <h1 className="text-2xl font-bold">Review before submit</h1>
      {!deliveryOk ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Delivery is within 48 hours submission is not allowed.
        </div>
      ) : null}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-lg font-semibold">{order.orderNo}</p>
            <p className="text-xs text-slate-500">
              {order.orderDate} · Delivery {order.deliveryDate}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Billing</p>
            <p>{order.billingAddress}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Delivery</p>
            <p>{order.deliveryAddress}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Contact</p>
            <p>
              {order.contactPerson} · {order.phone}
            </p>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[600px] w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">#</th>
                <th className="py-2">Item</th>
                <th className="py-2">Qty</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="py-2 font-mono text-xs">{l.serial}</td>
                  <td className="py-2">
                    <span className="font-medium">{l.itemNameEn}</span>
                    <span className="mt-0.5 block font-bn text-xs text-slate-600">{l.itemNameBn}</span>
                  </td>
                  <td className="py-2">{formatQtyLine(l.kg, l.gram, l.piece)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <h3 className="text-sm font-semibold">Signature</h3>
        {order.signatureDataUrl ? (
          <img
            src={order.signatureDataUrl}
            alt="Signature"
            className="mt-2 h-20 max-w-[220px] object-contain"
          />
        ) : (
          <p className="mt-2 text-sm text-amber-700">
            No signature found. Please add signature from Edit order page.
          </p>
        )}
      </div>

      {!linesOk ? (
        <p className="text-sm text-red-600">Some lines break quantity rules.</p>
      ) : null}
      {!signed ? <p className="text-sm text-amber-700">Signature is required.</p> : null}

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/user/orders/${order.id}/edit`}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50"
        >
          Edit order
        </Link>
        <button
          type="button"
          onClick={saveAsDraft}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50"
        >
          Save as draft
        </button>
        <button
          type="button"
          disabled={!linesOk || !deliveryOk || !signed}
          onClick={confirm}
          className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-40"
        >
          Confirm &amp; submit
        </button>
      </div>
    </div>
  );
}
