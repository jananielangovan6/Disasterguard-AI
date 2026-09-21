import { useState, useEffect } from "react";
import { useData } from "../context/DataContext";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  error: XCircle,
};

const COLORS = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  error: "border-red-200 bg-red-50 text-red-700",
};

const ICON_COLORS = {
  success: "text-emerald-600",
  warning: "text-amber-600",
  info: "text-blue-600",
  error: "text-red-600",
};

export function showToast(message, variant = "info") {
  window.dispatchEvent(
    new CustomEvent("qg:toast", { detail: { message, variant } })
  );
}

export default function Toast() {
  const { toast: contextToast } = useData();
  const [localToast, setLocalToast] = useState(null);

  useEffect(() => {
    function handleCustomToast(e) {
      if (e.detail) {
        setLocalToast(e.detail);
        setTimeout(() => setLocalToast(null), 4000);
      }
    }
    window.addEventListener("qg:toast", handleCustomToast);
    return () => window.removeEventListener("qg:toast", handleCustomToast);
  }, []);

  const activeToast = localToast || contextToast;
  if (!activeToast) return null;

  const Icon = ICONS[activeToast.variant] || Info;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div
        className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
          COLORS[activeToast.variant] || COLORS.info
        }`}
      >
        <Icon size={16} className={`shrink-0 ${ICON_COLORS[activeToast.variant] || ICON_COLORS.info}`} />
        {activeToast.message}
      </div>
    </div>
  );
}
