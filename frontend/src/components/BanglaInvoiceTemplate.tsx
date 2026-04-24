import type { Order, OrderLine } from "../types";
import { formatQtyLine } from "../lib/uiLabels";

function money(n: number) {
  return n.toLocaleString("en-US");
}

function toBanglaNum(input: string): string {
  const map: Record<string, string> = {
    "0": "০",
    "1": "১",
    "2": "২",
    "3": "৩",
    "4": "৪",
    "5": "৫",
    "6": "৬",
    "7": "৭",
    "8": "৮",
    "9": "৯",
  };
  return input.replace(/[0-9]/g, (d) => map[d] ?? d);
}

function moneyBn(n: number) {
  return toBanglaNum(money(n));
}

/** বাংলা ইনভয়েস — modern card layout inspired by sample UI. */
export function BanglaInvoiceTemplate({
  order,
  companyName = "হোসেন মিট অ্যান্ড কো.",
  companyNameBn = "হোসেন মিট অ্যান্ড কো.",
  companyTagline = "সকল প্রকার মুদি মালামাল সুলভ মূল্যে খুচরা ও পাইকারী বিক্রয় করা হয়।",
  companyTaglineBn = "সকল প্রকার মুদি ও তাজা পণ্য খুচরা ও পাইকারী।",
  companyAddress = "ভুলতা-গাউসিয়া, রূপগঞ্জ, নারায়ণগঞ্জ — ১৪৬০",
  hotline = "+৮৮০১৫৭১ ২২৭৫৮৮",
}: {
  order: Order;
  companyName?: string;
  companyNameBn?: string;
  companyTagline?: string;
  companyTaglineBn?: string;
  companyAddress?: string;
  hotline?: string;
}) {
  const sub = order.subtotal ?? 0;
  const pct = order.markupPercent ?? (sub <= 125_000 ? 20 : 15);
  const markup =
    order.subtotal != null && order.grandTotal != null
      ? order.grandTotal - order.subtotal
      : Math.round(sub * (pct / 100));
  const grand = order.grandTotal ?? sub + markup;
  const dueDate = order.deliveryDate;

  const rows: OrderLine[] =
    order.lines.length > 0
      ? order.lines
      : [
          {
            id: "x",
            serial: 1,
            categoryId: "pantry",
            itemId: "pantry-1",
            itemNameBn: "চাউল",
            itemNameEn: "Rice",
            kg: "50",
            gram: "",
            piece: "",
            unitPrice: 120,
            lineTotal: 6000,
          },
        ];

  const adjustedLineTotals = (() => {
    if (rows.length === 0) return [] as number[];
    const baseTotals = rows.map((r) => r.lineTotal ?? 0);
    if (markup <= 0) return baseTotals;

    const each = Math.floor(markup / rows.length);
    const remainder = markup - each * rows.length;

    return baseTotals.map((v, idx) => v + each + (idx < remainder ? 1 : 0));
  })();

  return (
    <div className="font-bn overflow-hidden rounded-3xl bg-slate-50 p-3 shadow-card print:rounded-none print:border-0 print:bg-transparent print:p-0 print:shadow-none sm:p-5">
      <div className="rounded-3xl bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-[0.05em] text-slate-900 sm:text-3xl">
              Invoice
            </h2>
            <p className="mt-1 font-mono text-base font-semibold text-blue-700 sm:text-lg">#{order.orderNo}</p>
            <p className="mt-1 text-sm text-slate-600">{companyName}</p>
            <p className="text-xs text-slate-500">{companyTagline}</p>
            <p className="text-xs text-slate-500">{companyTaglineBn}</p>
          </div>
          <img src="/hmc-logo.png" alt="HMC logo" className="ml-auto h-20 w-auto object-contain sm:h-24" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">বিল প্রদানকারী</p>
            <p className="text-base font-semibold">{companyNameBn}</p>
            <p className="mt-0.5 text-sm text-slate-700">{companyAddress}</p>
            <p className="mt-1 text-sm text-slate-700">হটলাইন: {hotline}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">বিল গ্রহীতা</p>
            <p className="text-base font-semibold">{order.contactPerson}</p>
            <p className="mt-0.5 text-sm text-slate-700">{order.phone}</p>
            <p className="mt-1 text-sm text-slate-700">{order.billingAddress}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">ইস্যুর তারিখ</p>
            <p className="font-semibold">{toBanglaNum(order.orderDate)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">পরিশোধের শেষ তারিখ</p>
            <p className="font-semibold">{toBanglaNum(dueDate)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <p className="text-xs text-slate-500">ডেলিভারি ঠিকানা</p>
            <p className="text-sm font-medium">{order.deliveryAddress}</p>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="divide-y divide-slate-100 print:hidden md:hidden">
            {rows.map((r, idx) => (
              <div key={r.id} className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">ক্রমিক: {toBanglaNum(String(r.serial))}</p>
                    <p className="font-semibold">{r.itemNameBn}</p>
                    <p className="text-xs text-slate-500">{r.itemNameEn}</p>
                  </div>
                  <p className="text-right text-sm font-semibold">৳ {moneyBn(adjustedLineTotals[idx] ?? 0)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 px-2 py-1">
                    <p className="text-slate-500">পরিমাণ</p>
                    <p className="font-medium">{formatQtyLine(r.kg, r.gram, r.piece)}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2 py-1 text-right">
                    <p className="text-slate-500">ইউনিট মূল্য</p>
                    <p className="font-medium">৳ {moneyBn(r.unitPrice ?? 0)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <table className="hidden w-full text-left text-sm print:table md:table">
            <thead className="bg-slate-100 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2">ক্রমিক</th>
                <th className="px-3 py-2">আইটেম</th>
                <th className="px-3 py-2">পরিমাণ</th>
                <th className="px-3 py-2 text-right">ইউনিট মূল্য</th>
                <th className="px-3 py-2 text-right">মোট মূল্য</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{toBanglaNum(String(r.serial))}</td>
                  <td className="px-3 py-2">
                    <p className="font-semibold">{r.itemNameBn}</p>
                    <p className="text-xs text-slate-500">{r.itemNameEn}</p>
                  </td>
                  <td className="px-3 py-2">{formatQtyLine(r.kg, r.gram, r.piece)}</td>
                  <td className="px-3 py-2 text-right">৳ {moneyBn(r.unitPrice ?? 0)}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    ৳ {moneyBn(adjustedLineTotals[idx] ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_300px]">
          <div />
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between text-base font-bold">
              <span>সর্বমোট</span>
              <span className="text-slate-900">৳ {moneyBn(grand)}</span>
            </div>
          </div>
        </div>

        {order.signatureDataUrl ? (
          <div className="mt-6 border-t border-dashed border-slate-200 pt-4">
            <p className="text-xs text-slate-500">গ্রাহকের স্বাক্ষর</p>
            <img src={order.signatureDataUrl} alt="Signature" className="mt-1 h-16 max-w-[200px] object-contain" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
