import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  CheckCircle2,
  ClipboardCheck,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import PageHeader from "../components/PageHeader";
import SeverityBadge from "../components/SeverityBadge";
import { SEVERITY_META } from "../data/mockData";

export function isAssignedToEngineer(b, user) {
  if (!b || !user) return false;

  const userId = user.id ? String(user.id).trim().toLowerCase() : "";
  const rawUserId = userId.replace(/^u/, "");
  const userName = user.name ? String(user.name).trim().toLowerCase() : "";
  const userEmail = user.email ? String(user.email).trim().toLowerCase() : "";
  const userFirst = userName.split(" ")[0] || "";

  const engId = b.assignedEngineerId != null ? String(b.assignedEngineerId).trim().toLowerCase() : "";
  const rawEngId = engId.replace(/^u/, "");
  const engName = b.assignedEngineer ? String(b.assignedEngineer).trim().toLowerCase() : "";
  const engEmail = b.assignedEngineerEmail ? String(b.assignedEngineerEmail).trim().toLowerCase() : "";
  const reviewedBy = b.reviewedBy ? String(b.reviewedBy).trim().toLowerCase() : "";

  // 1. ID Match
  if (engId && (engId === userId || rawEngId === rawUserId)) return true;

  // 2. Email Match
  if (engEmail && engEmail === userEmail) return true;
  if (userEmail && engName.includes(userEmail.split("@")[0])) return true;

  // 3. Name Match
  if (engName) {
    if (engName === userName || userName.includes(engName) || engName.includes(userName)) return true;
    if (userFirst && engName.split(" ")[0] === userFirst) return true;
  }

  // 4. Reviewed By Match
  if (reviewedBy) {
    if (reviewedBy === userName || userName.includes(reviewedBy) || reviewedBy.includes(userName)) return true;
    if (userFirst && reviewedBy.split(" ")[0] === userFirst) return true;
  }

  return false;
}

export default function EngineerDashboard() {
  const { user } = useAuth();
  const { buildings, publicReports } = useData();
  const navigate = useNavigate();

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    function handleUpdate() {
      forceUpdate((prev) => prev + 1);
    }

    window.addEventListener("qg:buildingsChanged", handleUpdate);
    window.addEventListener("qg:publicReportsChanged", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("qg:buildingsChanged", handleUpdate);
      window.removeEventListener("qg:publicReportsChanged", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Map public reports to building structure for seamless display
  const mappedPublicReports = (publicReports || []).map((r) => ({
    id: r.trackingId || `REP-${r.id}`,
    assessmentId: r.id,
    name: r.buildingName || `${r.district || "Citizen"} Damage Report`,
    zone: r.zone || r.district || "District Zone",
    severity: r.severity || "MODERATE",
    riskScore: r.severity === "DESTROYED" ? 92.5 : r.severity === "SEVERE" ? 82.0 : 65.0,
    coords: r.coords || { lat: 10.9254, lng: 76.9681 },
    inspector: r.reporterName || "Public Citizen",
    date: r.submittedAt || r.lastUpdatedAt || "Recently",
    detection: r.description || "Public damage report submitted by citizen.",
    recommendedAction: "Structural Inspection & Evacuation",
    status: r.status === "Resolved" ? "COMPLETED" : "PROCESSING",
    imageUrl: r.photos?.[0]?.dataUrl || r.photos?.[0] || "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop",
    assignedEngineer: r.assignedEngineer || r.assignedEngineerName,
    assignedEngineerId: r.assignedEngineerId,
    assignedEngineerEmail: r.assignedEngineerEmail,
    isPublicReport: true,
  }));

  const allItems = [...buildings, ...mappedPublicReports];

  // STRICT ASSIGNMENT SCOPING: ONLY show reports/buildings explicitly assigned to THIS engineer by Authority!
  const myBuildings = allItems.filter((b) => isAssignedToEngineer(b, user));

  const reviewed = myBuildings.filter(
    (b) =>
      Boolean(b.engineerVerified) ||
      b.status === "REVIEWED" ||
      b.status === "ENGINEER_REVIEWED" ||
      b.status === "COMPLETED" ||
      b.status === "WORK_COMPLETED"
  );

  const needsReview = myBuildings.filter(
    (b) => !reviewed.some((r) => r.id === b.id)
  );

  const breakdown = Object.keys(SEVERITY_META).map((key) => ({
    key,
    meta: SEVERITY_META[key],
    count: myBuildings.filter((b) => b.severity === key).length,
  }));

  const stats = {
    assigned: myBuildings.length,
    needsReview: needsReview.length,
    destroyed: myBuildings.filter((b) => b.severity === "DESTROYED").length,
    reviewed: reviewed.length,
  };

  const STAT_CARDS = [
    {
      label: "My Assigned",
      value: stats.assigned,
      icon: ClipboardCheck,
      accent: "text-blue-600",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      border: "border-blue-200",
      ring: "ring-1 ring-blue-100",
    },
    {
      label: "Needs Review",
      value: stats.needsReview,
      icon: AlertTriangle,
      accent: "text-orange-500",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      border: "border-orange-200",
      ring: "",
    },
    {
      label: "Destroyed",
      value: stats.destroyed,
      icon: Flame,
      accent: "text-red-600",
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      border: "border-red-100",
      ring: "",
    },
    {
      label: "Reviewed",
      value: stats.reviewed,
      icon: CheckCircle2,
      accent: "text-emerald-600",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      border: "border-emerald-100",
      ring: "",
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#F3FAF5]">
      <PageHeader
        title="Engineer Dashboard"
        right={
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              {user?.name} | Engineer
            </span>
            <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-[11px] font-semibold text-blue-700">
              {user?.name?.[0] ?? "?"}
            </div>
          </div>
        }
      />

      <div className="p-4 sm:p-6 lg:p-7 flex flex-col gap-5 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CARDS.map((s) => (
            <div
              key={s.label}
              className={`bg-white border ${s.border} rounded-xl px-4 py-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow ${s.ring}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  {s.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg ${s.iconBg} flex items-center justify-center`}
                >
                  <s.icon size={14} className={s.iconColor} />
                </div>
              </div>
              <span className={`text-3xl font-bold font-mono ${s.accent}`}>
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {needsReview.length > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl px-5 py-4 flex items-center justify-between shadow-lg shadow-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <ShieldAlert size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {needsReview.length} building
                  {needsReview.length > 1 ? "s" : ""} waiting for review
                </p>
                <p className="text-xs text-white/70 mt-0.5">
                  Review AI assessment and override severity
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/assessment/${needsReview[0].id}`)}
              className="shrink-0 bg-white text-orange-600 font-semibold text-xs rounded-lg px-4 py-2"
            >
              Review Now
            </button>
          </div>
        )}

        <div className="bg-white border border-emerald-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              My Assigned Buildings
            </h2>
          </div>

          <div className="divide-y divide-slate-50">
            {myBuildings.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <ClipboardCheck
                  size={28}
                  className="text-slate-300 mx-auto mb-2"
                />
                <p className="text-sm text-slate-400">
                  No buildings assigned yet
                </p>
              </div>
            ) : (
              myBuildings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => navigate(`/assessment/${b.id}`)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {b.id} | {b.name}
                      </p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        b.engineerVerified || b.status === "ENGINEER_REVIEWED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {b.engineerVerified || b.status === "ENGINEER_REVIEWED" ? "AI + Engineer Verified" : "AI Assessed (Pending Review)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium">{b.zone}</span>
                      <span className="text-xs text-slate-400">• Risk Score: {b.riskScore}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                        👷 Assigned Engineer: {b.assignedEngineer || b.assignedEngineerName || user?.name || "Structural Engineer"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={b.severity} size="sm" />
                    <ChevronRight size={14} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}