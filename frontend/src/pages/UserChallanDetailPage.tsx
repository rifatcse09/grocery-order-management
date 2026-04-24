import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { DeliveryChallanTemplate } from "../components/DeliveryChallanTemplate";
import { useOrders } from "../context/OrdersContext";

export function UserChallanDetailPage() {
  const { id } = useParams();
  const { getById } = useOrders();
  const order = id ? getById(id) : undefined;

  useEffect(() => {
    if (!order) return;
    const prevTitle = document.title;
    document.title = `Challan-${order.orderNo}`;
    return () => {
      document.title = prevTitle;
    };
  }, [order]);

  if (!order || !order.challanGenerated) {
    return (
      <p className="text-sm">
        Challan not available yet. <Link to="/user/invoices">Back to documents</Link>
      </p>
    );
  }

  return (
    <div className="space-y-4 print:space-y-0">
      <Link to="/user/invoices" className="text-xs text-accent hover:underline">
        ← Billing documents
      </Link>
      <div className="print-doc-only print:p-0">
        <DeliveryChallanTemplate order={order} />
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
