import type { Order, OrderLine } from "../types";
import { formatDeliveryWindow } from "../lib/deliveryWindow";

/** বাংলা ডেলিভারি চালান — শুধু বস্তু ও পরিমাণ, মূল্য ছাড়া। */
export function DeliveryChallanTemplate({ order }: { order: Order }) {
  const rows: OrderLine[] = order.lines;

  return (
    <div className="font-bn">
      <div className="flex min-h-[1080px] flex-col bg-white p-4 sm:p-6">
        <div className="print-challan-header flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-4">
          <div className="max-w-xl">
            <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">হোসেন মিট এন্ড কো.</h2>
            <p className="mt-2 text-sm font-bold text-slate-900 sm:text-base">
              মাংসসহ গৃহের সব ধরনের মুদি সামগ্রী, প্রসসড ও বাজার উপযোগী পণ্য
            </p>
            <p className="text-sm font-bold text-slate-900 sm:text-base">সরবরাহ করা হয়—খুচরা / পাইকারী -</p>
            <p className="text-sm font-bold text-slate-900 sm:text-base">আপনার দোরগোড়ায় ডেলিভারি করা হয়।</p>
            <p className="mt-4 text-xs text-slate-700 sm:text-sm">ভুলতা-গাউসিয়া, রূপগঞ্জ, নারায়ণগঞ্জ — ১৪৬০</p>
            <p className="text-xs text-slate-700 sm:text-sm">হটলাইন: +৮৮০১৫৭১ ২২৭৫৮৮</p>
          </div>
          <div className="ml-auto -mt-1 self-start text-right sm:-mt-2">
            <img src="/hmc-logo.png" alt="হোসেন মিট অ্যান্ড কো. লোগো" className="ml-auto h-24 w-auto object-contain sm:h-28" />
            <h3 className="mt-1 text-xl font-extrabold text-slate-900 sm:text-2xl">ডেলিভারি চালান</h3>
            <p className="mt-0.5 font-mono text-base font-bold text-blue-700 sm:text-lg">#{order.orderNo}</p>
          </div>
        </div>

        <div className="print-challan-body">
          <div className="mt-4 grid gap-3 print:mt-0 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">অর্ডারের তারিখ</p>
              <p className="font-semibold">{toBanglaDate(order.orderDate)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">ডেলিভারির তারিখ</p>
              <p className="font-semibold">{toBanglaDate(order.deliveryDate)}</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-500">সময়</p>
              <p className="font-semibold">{formatDeliveryWindow(order.deliveryTime)}</p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">প্রদানকারী</p>
              <p className="font-semibold">{order.contactPerson}</p>
              <p className="mt-0.5 text-sm text-slate-700">{order.phone}</p>
              <p className="mt-1 text-sm text-slate-700">{order.billingAddress}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">ডেলিভারি ঠিকানা</p>
              <p className="text-sm font-medium">{order.deliveryAddress}</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="divide-y divide-slate-100 print:hidden md:hidden">
              {rows.map((r) => (
                <div key={r.id} className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">ক্রমিক: {toBanglaNum(String(r.serial))}</p>
                      <p className="font-semibold">{r.itemNameBn}</p>
                    </div>
                    <p className="max-w-[14rem] rounded-lg bg-slate-50 px-2 py-1 text-left text-sm font-medium leading-relaxed whitespace-normal break-words">
                      {formatQtyBangla(r)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <table className="hidden w-full table-fixed text-left text-sm print:table md:table">
              <thead className="bg-slate-100 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="w-20 px-3 py-2 whitespace-nowrap">ক্রমিক</th>
                  <th className="px-3 py-2">পণ্যের নাম</th>
                  <th className="w-72 px-3 py-2 text-left whitespace-nowrap">পরিমাণ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{toBanglaNum(String(r.serial))}</td>
                    <td className="px-3 py-2 font-semibold">{r.itemNameBn}</td>
                    <td className="px-3 py-2 text-left whitespace-normal break-words leading-relaxed">{formatQtyBangla(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="print-challan-footer mt-24 sm:mt-32">
          <div className="flex items-end justify-between gap-12 sm:gap-24">
            <div className="text-left">
              <div className="h-0 w-32 border-t-2 border-black sm:w-44" />
              <p className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">অর্ডার প্রস্তুতকারী</p>
            </div>
            <div className="text-right">
              {order.signatureDataUrl ? (
                <div className="mb-2 flex justify-end">
                  <img src={order.signatureDataUrl} alt="Signature" className="h-16 max-w-[180px] object-contain" />
                </div>
              ) : null}
              <div className="ml-auto h-0 w-32 border-t-2 border-black sm:w-44" />
              <p className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">পক্ষে / কোম্পানি</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <div className="text-right leading-tight">
              <p className="text-2xl font-black tracking-tight text-slate-700 sm:text-3xl">questco</p>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-800 sm:text-sm">managed by : int&apos;l</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

function formatQtyBangla(line: OrderLine): string {
  const piece = parseFloat(line.piece || "0");
  const kg = parseFloat(line.kg || "0");
  const gram = parseFloat(line.gram || "0");
  if (piece > 0) return `${toBanglaNum(format2(piece))} পিচ`;
  const parts: string[] = [];
  if (kg > 0) parts.push(`${toBanglaNum(format2(kg))} কেজি`);
  if (gram > 0) parts.push(`${toBanglaNum(format2(gram))} গ্রাম`);
  return parts.join(" ") || "—";
}

function format2(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toBanglaDate(iso: string): string {
  return toBanglaNum(iso);
}
