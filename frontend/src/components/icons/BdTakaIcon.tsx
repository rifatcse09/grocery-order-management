import { forwardRef } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

export const BdTakaIcon = forwardRef<SVGSVGElement, LucideProps>(function BdTakaIcon(props, ref) {
  return (
    <svg ref={ref} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M6 7h12" />
      <path d="M6 11h8" />
      <path d="M10 11c2.8 0 5 2 5 4.5 0 2.7-2.2 4.5-5 4.5H6" />
    </svg>
  );
}) as LucideIcon;
