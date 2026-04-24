/** Shared brand logo using provided client asset. */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/hmc-logo.png"
        alt="Hossen Meat & Co. logo"
        className="h-14 w-auto shrink-0 object-contain"
      />
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-brand-dark">Hossen Meat &amp; Co.</p>
        <p className="font-bn text-xs text-brand-muted">হোসেন মিট অ্যান্ড কো. · Groceries &amp; fresh</p>
      </div>
    </div>
  );
}
