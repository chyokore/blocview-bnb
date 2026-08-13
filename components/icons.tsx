import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function SearchIcon(props: IconProps) { return <svg {...base} {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>; }
export function ArrowIcon(props: IconProps) { return <svg {...base} {...props}><path d="M5 12h14M14 7l5 5-5 5"/></svg>; }
export function CheckIcon(props: IconProps) { return <svg {...base} {...props}><path d="m5 12 4 4L19 6"/></svg>; }
export function ShieldIcon(props: IconProps) { return <svg {...base} {...props}><path d="M12 3 5 6v5c0 4.6 2.7 8.1 7 10 4.3-1.9 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>; }
export function ActivityIcon(props: IconProps) { return <svg {...base} {...props}><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>; }
export function ChevronIcon(props: IconProps) { return <svg {...base} {...props}><path d="m9 18 6-6-6-6"/></svg>; }
export function CloseIcon(props: IconProps) { return <svg {...base} {...props}><path d="M18 6 6 18M6 6l12 12"/></svg>; }
export function SlidersIcon(props: IconProps) { return <svg {...base} {...props}><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>; }
