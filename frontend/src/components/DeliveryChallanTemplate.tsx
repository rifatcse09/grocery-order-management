import type { Order, OrderLine } from "../types";

/** বাংলা ডেলিভারি চালান — শুধু বস্তু ও পরিমাণ, মূল্য ছাড়া। */
export function DeliveryChallanTemplate({ order }: { order: Order }) {
  const rows: OrderLine[] = order.lines;

  return (
    <div className="font-bn">
      <div className="bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">ডেলিভারি চালান</h2>
            <p className="mt-1 font-mono text-base font-semibold text-blue-700 sm:text-lg">
              #{order.orderNo}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              সকল প্রকার মুদি মালামাল সুলভ মূল্যে খুচরা ও পাইকারী বিক্রয় করা হয়।
            </p>
            <p className="text-xs text-slate-500">ভুলতা-গাউসিয়া, রূপগঞ্জ, নারায়ণগঞ্জ — ১৪৬০</p>
            <p className="text-xs text-slate-500">হটলাইন: +৮৮০১৫৭১ ২২৭৫৮৮</p>
          </div>
          <img src="/hmc-logo.png" alt="হোসেন লোগো" className="ml-auto h-16 w-auto object-contain sm:h-20" />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
            <p className="font-semibold">{order.deliveryTime ?? "___________"}</p>
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
          <div className="divide-y divide-slate-100 md:hidden">
            {rows.map((r) => (
              <div key={r.id} className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">ক্রমিক: {toBanglaNum(String(r.serial))}</p>
                    <p className="font-semibold">{r.itemNameBn}</p>
                    <p className="text-xs text-slate-500">{r.itemNameEn}</p>
                  </div>
                  <p className="rounded-lg bg-slate-50 px-2 py-1 text-sm font-medium">{formatQtyBangla(r)}</p>
                </div>
              </div>
            ))}
          </div>

          <table className="hidden w-full text-left text-sm md:table">
            <thead className="bg-slate-100 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-2">ক্রমিক</th>
                <th className="px-3 py-2">পণ্যের নাম</th>
                <th className="px-3 py-2">পরিমাণ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{toBanglaNum(String(r.serial))}</td>
                  <td className="px-3 py-2">
                    <p className="font-semibold">{r.itemNameBn}</p>
                    <p className="text-xs text-slate-500">{r.itemNameEn}</p>
                  </td>
                  <td className="px-3 py-2">{formatQtyBangla(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-16 sm:mt-20">
          <div className="w-44 border-t border-slate-900 pt-1 text-sm sm:w-56 sm:text-base">
            অর্ডার প্রদানকারী
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
  if (piece > 0) return `${toBanglaNum(line.piece)} পিচ`;
  const parts: string[] = [];
  if (kg > 0) parts.push(`${toBanglaNum(line.kg)} কেজি`);
  if (gram > 0) parts.push(`${toBanglaNum(line.gram)} গ্রাম`);
  return parts.join(" ") || "—";
}

function toBanglaDate(iso: string): string {
  return toBanglaNum(iso);
}
