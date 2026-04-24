import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { OrderLinesEditor } from "../components/OrderLinesEditor";
import { DeliveryChallanTemplate } from "../components/DeliveryChallanTemplate";
import { BanglaInvoiceTemplate } from "../components/BanglaInvoiceTemplate";
import { useCatalog } from "../context/CatalogContext";
import { useOrders } from "../context/OrdersContext";
import type { Order } from "../types";

function applyMarkup(sub: number): { pct: number; grand: number } {
  const pct = sub <= 125_000 ? 20 : 15;
  const markup = Math.round(sub * (pct / 100));
  return { pct, grand: sub + markup };
}

export function ModeratorOrderDetailPage() {
  const { id } = useParams();
  const { getById, upsertOrder } = useOrders();
  const { categories } = useCatalog();
  const base = id ? getById(id) : undefined;
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [printDoc, setPrintDoc] = useState<"challan" | "invoice" | null>(null);
  useEffect(() => {
    if (base) setOrder(base);
  }, [base]);

  if (!base || !order) {
    return (
      <p className="text-sm">
        Order not found. <Link to="/moderator/orders">Back to list</Link>
      </p>
    );
  }

  const save = () => upsertOrder(order);

  const genChallan = () => {
    const next = { ...order, challanGenerated: true, status: "under_review" as const };
    setOrder(next);
    upsertOrder(next);
  };

  const finalizeInvoice = () => {
    const sub = order.lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0);
    const { pct, grand } = applyMarkup(sub);
    const next: Order = {
      ...order,
      invoiceGenerated: true,
      status: "invoiced",
      subtotal: sub,
      markupPercent: pct,
      grandTotal: grand,
    };
    setOrder(next);
    upsertOrder(next);
  };

  const markDelivered = () => {
    const next: Order = {
      ...order,
      status: "delivered",
    };
    setOrder(next);
    upsertOrder(next);
  };

  const printWithTitle = (doc: "challan" | "invoice", title: string) => {
    const prevTitle = document.title;
    setPrintDoc(doc);
    document.title = title;
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintDoc(null);
        document.title = prevTitle;
      }, 100);
    }, 0);
  };

  return (
    <div className="space-y-8">
      <Link to="/moderator/orders" className="text-xs text-accent hover:underline">
        ← Orders
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNo}</h1>
          <p className="text-sm text-slate-600">{order.contactPerson}</p>
        </div>
        <button
          type="button"
          onClick={save}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          Save changes
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Lines &amp; pricing</h2>
        <OrderLinesEditor
          lines={order.lines}
          categories={categories}
          showPricing
          onChange={(lines) => setOrder({ ...order, lines })}
        />
      </section>

      <section className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={genChallan}
          disabled={Boolean(order.challanGenerated)}
          className="rounded-2xl bg-brand-dark px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          Generate challan (no prices)
        </button>
        <button
          type="button"
          onClick={markDelivered}
          disabled={order.status === "delivered" || order.status === "invoiced"}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-slate-800"
        >
          Mark delivery complete
        </button>
        <button
          type="button"
          onClick={finalizeInvoice}
          disabled={!order.challanGenerated || order.invoiceGenerated}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-slate-800"
        >
          Finalize invoice
        </button>
      </section>

      {order.challanGenerated ? (
        <section className="space-y-2">
          <h3 className="font-semibold">Challan preview</h3>
          <div className={printDoc === "invoice" ? "print:hidden" : "print-doc-only print:p-0"}>
            <DeliveryChallanTemplate order={order} />
          </div>
          <button
            type="button"
            onClick={() => printWithTitle("challan", `Challan-${order.orderNo}`)}
            className="rounded-xl bg-brand-dark px-4 py-2 text-sm font-medium text-white print:hidden"
          >
            Print challan / Save as PDF
          </button>
        </section>
      ) : null}

      {order.invoiceGenerated ? (
        <section className="space-y-2">
          <h3 className="font-semibold">E-invoice</h3>
          <div className={printDoc === "challan" ? "print:hidden" : "print-doc-only print:p-0"}>
            <BanglaInvoiceTemplate order={order} />
          </div>
          <button
            type="button"
            onClick={() => printWithTitle("invoice", `Invoice-${order.orderNo}`)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white print:hidden"
          >
            Print invoice / Save as PDF
          </button>
        </section>
      ) : null}
    </div>
  );
}
