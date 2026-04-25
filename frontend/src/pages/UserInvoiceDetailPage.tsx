import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { BanglaInvoiceTemplate } from "../components/BanglaInvoiceTemplate";
import { useOrders } from "../context/OrdersContext";

export function UserInvoiceDetailPage() {
  const { id } = useParams();
  const { getById } = useOrders();
  const order = id ? getById(id) : undefined;

  useEffect(() => {
    if (!order) return;
    const prevTitle = document.title;
    document.body.classList.add("print-isolated");
    document.title = `Invoice-${order.orderNo}`;
    return () => {
      document.body.classList.remove("print-isolated");
      document.title = prevTitle;
    };
  }, [order]);

  if (!order) {
    return (
      <p className="text-sm">
        Not found. <Link to="/user/invoices">Back to list</Link>
      </p>
    );
  }

  return (
    <div className="space-y-4 print:space-y-0">
      <Link to="/user/invoices" className="text-xs text-accent hover:underline">
        ← Invoices
      </Link>
      <div className="print-invoice-only print:p-0">
        <BanglaInvoiceTemplate order={order} />
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-xl bg-brand-dark px-4 py-2 text-sm font-medium text-white print:hidden"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
