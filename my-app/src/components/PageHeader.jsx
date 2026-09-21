export default function PageHeader({ title, subtitle, right }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-7 py-5 shrink-0 bg-gradient-to-r from-emerald-500 to-blue-600">
      <div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-cyan-50/85 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
