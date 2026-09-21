import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import PageHeader from "../components/PageHeader";
import SeverityBadge from "../components/SeverityBadge";
import {
  ClipboardList, Clock, MapPin, X, CheckCircle2, Circle,
  AlertTriangle, FileText, Inbox,
} from "lucide-react";

// Building status flow, mapped to the statuses that already exist in mockData.
// URGENT = awaiting your upload, PROCESSING = AI/engineer reviewing,
// REVIEWED = fully reviewed (by engineer / authority).
const STATUS_FLOW = ["URGENT", "PROCESSING", "REVIEWED"];

const STATUS_META = {
  URGENT: { label: "Awaiting Your Upload", color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
  PROCESSING: { label: "AI / Engineer Reviewing", color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  REVIEWED: { label: "Reviewed", color: "#059669", bg: "rgba(5,150,105,0.10)" },
};

const STATUS_STEP_LABELS = ["Submitted", "AI Assessment", "Engineer / Authority Review", "Reviewed"];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.URGENT;
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide rounded-full border px-3 py-1"
      style={{ color: meta.color, background: meta.bg, borderColor: meta.color + "33" }}
    >
      {meta.label}
    </span>
  );
}

export default function TrackSubmissions() {
  const { user } = useAuth();
  const { buildings } = useData();
  const [selected, setSelected] = useState(null);

  const myBuildings = buildings.filter((b) => b.inspector === user?.name);

  // Sort: most recently inspected first, fallback to date field
  const sorted = [...myBuildings].sort((a, b) => {
    const aTime = new Date(a.inspectedAt || a.date || 0).getTime();
    const bTime = new Date(b.inspectedAt || b.date || 0).getTime();
    return bTime - aTime;
  });

  const stats = {
    total: myBuildings.length,
    awaiting: myBuildings.filter((b) => b.status === "URGENT").length,
    inReview: myBuildings.filter((b) => b.status === "PROCESSING").length,
    reviewed: myBuildings.filter((b) => b.status === "REVIEWED").length,
  };

  return (
    <div className="min-h-screen bg-[#F3FAF5]">
      <PageHeader
        title="Track My Submissions"
        subtitle="See the status of every building you've inspected or uploaded"
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Assigned", value: stats.total, color: "text-slate-800" },
            { label: "Awaiting Upload", value: stats.awaiting, color: "text-red-600" },
            { label: "In Review", value: stats.inReview, color: "text-purple-600" },
            { label: "Reviewed", value: stats.reviewed, color: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-emerald-100 rounded-xl py-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList size={18} /> My Buildings
          </h2>
          <span className="text-sm text-slate-500">{myBuildings.length} total</span>
        </div>

        {myBuildings.length === 0 ? (
          <div className="bg-white border border-dashed border-emerald-200 rounded-xl py-14 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <Inbox size={24} className="text-emerald-500" />
            </div>
            <p className="text-slate-800 font-semibold mb-1">No buildings assigned yet</p>
            <p className="text-sm text-slate-500">Buildings assigned to you will appear here once uploaded.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {sorted.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="text-left bg-white border border-emerald-100 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Building ID</p>
                    <p className="font-bold text-slate-800 text-[15px]">{b.id} — {b.name}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                  <Clock size={12} /> {b.inspectedAt ? new Date(b.inspectedAt).toLocaleString() : b.date}
                </p>

                {b.severity && <SeverityBadge severity={b.severity} size="sm" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <BuildingDetailModal building={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function BuildingDetailModal({ building, onClose }) {
  const currentStepIndex = STATUS_FLOW.indexOf(building.status);
  const checklist = building.inspectorChecklist || {};
  const checkedItems = Object.entries(checklist)
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-slate-900/20 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Building ID</p>
            <p className="font-bold text-slate-900 text-lg">{building.id} — {building.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={building.status} />
            {building.severity && <SeverityBadge severity={building.severity} size="sm" />}
            <span className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
              <Clock size={12} />
              {building.inspectedAt ? new Date(building.inspectedAt).toLocaleString() : building.date}
            </span>
          </div>

          {/* Status timeline */}
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Status Progress</p>
            <div className="flex items-center">
              {STATUS_STEP_LABELS.map((label, i) => (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5 w-16">
                    {i < currentStepIndex + 1 ? (
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    ) : (
                      <Circle size={20} className="text-slate-200" />
                    )}
                    <span
                      className={
                        "text-[9px] text-center font-semibold leading-tight " +
                        (i <= currentStepIndex ? "text-emerald-700" : "text-slate-400")
                      }
                    >
                      {label}
                    </span>
                  </div>
                  {i < STATUS_STEP_LABELS.length - 1 && (
                    <div
                      className={
                        "flex-1 h-0.5 mx-1 mb-4 rounded " +
                        (i < currentStepIndex ? "bg-emerald-500" : "bg-slate-200")
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">
              <MapPin size={13} /> Location
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">{building.address || building.name} ({building.zone})</p>
          </div>

          <div className="border border-slate-200 rounded-xl p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">
              <AlertTriangle size={13} /> Damage Type
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {checkedItems.length > 0 ? checkedItems.join(", ") : "Not recorded"}
            </p>
          </div>

          {(building.inspectorNotes || building.detection) && (
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">
                <FileText size={13} /> Description
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {building.inspectorNotes || building.detection}
              </p>
            </div>
          )}

          {building.recommendedAction && (
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">Recommended Action</p>
              <p className="text-sm text-slate-600 leading-relaxed">{building.recommendedAction}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-400 text-sm font-semibold rounded-lg py-2.5 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}