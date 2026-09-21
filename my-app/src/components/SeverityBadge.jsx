import { SEVERITY_META } from "../data/mockData";

export default function SeverityBadge({ severity, size = "md" }) {
  const meta = SEVERITY_META[severity] || SEVERITY_META.MINOR;
  const sizing = size === "sm" ? "text-[10px] px-2.5 py-0.5" : "text-[11px] px-3 py-1";

  return (
    <span
      className={`font-mono font-semibold uppercase rounded-full border ${sizing}`}
      style={{ color: meta.color, background: meta.bg, borderColor: meta.color + "33" }}
    >
      {meta.label}
    </span>
  );
}
