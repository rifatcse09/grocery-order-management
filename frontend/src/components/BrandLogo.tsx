import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /**
   * Graphic mark (cow mark). Use only where a full lockup is required.
   * Invoices and challans render `/hmc-logo.png` in their own templates.
   */
  showMark?: boolean;
  /** Narrow header bar: shorter type, tagline only from `sm` up. */
  compact?: boolean;
};

/** Text-first brand block. Optional `showMark` for rare full lockups outside print templates. */
export function BrandLogo({ className = "", showMark = false, compact = false }: BrandLogoProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        showMark && "gap-3",
        className,
      )}
    >
      {showMark ? (
        <img
          src="/hmc-logo.png"
          alt=""
          className={cn(
            "w-auto shrink-0 object-contain",
            compact ? "h-8 sm:h-9" : "h-12 sm:h-14",
          )}
        />
      ) : null}
      <div className="min-w-0">
        <p
          className={cn(
            "font-bold leading-tight text-brand-dark",
            compact ? "text-sm sm:text-base" : "text-lg md:text-xl",
          )}
        >
          Hossein Meat &amp; Co.
        </p>
        <p
          className={cn(
            "font-bn leading-snug text-brand-muted",
            compact ? "mt-0.5 hidden text-[10px] sm:block sm:text-xs" : "mt-0.5 text-xs",
          )}
        >
          হোসেন মিট অ্যান্ড কো. — FRESH GROCERIES EVERYDAY
        </p>
      </div>
    </div>
  );
}
