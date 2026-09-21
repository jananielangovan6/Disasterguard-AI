import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import PageHeader from "../components/PageHeader";
import { SEVERITY_META } from "../data/mockData";

export default function FieldInspectorDashboard() {
  const { user } = useAuth();
  const { buildings } = useData();
  const navigate = useNavigate();

  const uName = String(user?.name || "").trim().toLowerCase();
  const uEmail = String(user?.email || "").trim().toLowerCase();
  const uId = String(user?.id || "").trim().toLowerCase();

  const myBuildings = buildings.filter((b) => {
    const bInsp = String(b.inspector || b.inspectorName || "").trim().toLowerCase();
    const bInspId = String(b.inspectorId || "").trim().toLowerCase();

    if (!bInsp && !bInspId) return true; // Show uploaded site assessments

    const matchesName = uName && (bInsp.includes(uName) || uName.includes(bInsp) || (bInsp.split(" ")[0] && uName.includes(bInsp.split(" ")[0])));
    const matchesEmail = uEmail && bInsp.includes(uEmail.split("@")[0]);
    const matchesId = uId && (bInspId === uId || bInspId === `u${uId.replace(/^u/, "")}`);

    return matchesName || matchesEmail || matchesId;
  });

  const stats = {
    assigned: myBuildings.length,
    uploaded: myBuildings.filter((b) => Boolean(b.imageUrl) || b.status !== "URGENT").length,
    pendingAI: myBuildings.filter((b) => b.status === "PROCESSING" || b.status === "PENDING").length,
    critical: myBuildings.filter((b) => b.severity === "DESTROYED" || b.severity === "SEVERE").length,
  };

  const STAT_KEYS = [
    { key: "assigned", label: "Assigned", color: "text-slate-900" },
    { key: "uploaded", label: "Uploaded", color: "text-emerald-600" },
    { key: "pendingAI", label: "Pending AI", color: "text-amber-500" },
    { key: "critical", label: "Critical", color: "text-red-600" },
  ];

  return (
    <div className="h-full flex flex-col bg-[#F3FAF5]">
      <PageHeader
        title="Field Dashboard"
        right={
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/90 font-medium">{user?.name || "Inspector"}</span>
            <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-[11px] font-bold text-white">
              {user?.name?.[0] ?? "?"}
            </div>
          </div>
        }
      />

      <div className="p-5 sm:p-7 flex flex-col gap-6 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STAT_KEYS.map((c) => (
            <div
              key={c.key}
              className="bg-white border border-emerald-100 rounded-xl px-4 sm:px-5 py-4 flex flex-col gap-1"
            >
              <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">{c.label}</span>
              <span className={`text-2xl font-bold font-mono ${c.color}`}>{stats[c.key]}</span>
            </div>
          ))}
        </div>



        <div className="bg-white border border-emerald-100 rounded-xl">
          <div className="px-5 py-4 border-b border-emerald-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">My Assignments</h2>
            <button onClick={() => navigate("/inspections")} className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline">
              View all
            </button>
          </div>
          <div className="divide-y divide-emerald-50">
            {myBuildings.length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-500 text-center">No buildings assigned to you yet.</p>
            ) : (
              myBuildings.slice(0, 6).map((b) => {
                const meta = SEVERITY_META[b?.severity] || SEVERITY_META.MODERATE;
                return (
                  <button
                    key={b.id}
                    onClick={() => navigate(`/assessment/${b.id}`)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-emerald-50/40 transition-colors text-left gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta?.color || "#94A3B8" }} />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-900 font-medium truncate">{b.id} | {b.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {b.imageUrl
                            ? (b.status === "REVIEWED" ? "Reviewed" : "Images uploaded")
                            : (b.status === "URGENT" ? "Upload pending" : b.status === "PROCESSING" ? "Images uploaded" : "Reviewed")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-semibold uppercase px-2.5 py-1 rounded-md shrink-0 border ${
                        b.status === "URGENT"
                          ? "bg-red-50 text-red-600 border-red-200"
                          : b.status === "PROCESSING"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : "bg-emerald-50 text-emerald-600 border-emerald-200"
                      }`}
                    >
                      {b.status}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}