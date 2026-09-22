import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  TrendingUp,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Layers,
  FileText,
  Users,
  Radio,
  X,
  Phone,
  User,
  Hash,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import PageHeader from "../components/PageHeader";
import api from "../api/axiosConfig";
import { getStoredUsers } from "../data/mockData";

// Maps a public report's checklist keys (set by CitizenReportForm) to
// human-readable labels for the detail modal.
const CHECKLIST_LABELS = {
  wallCracks: "Wall Cracks",
  roofDamage: "Roof Damage",
  foundationDamage: "Foundation Damage",
  tiltingStructure: "Tilting Structure",
  collapsedSection: "Collapsed Section",
  fireDamage: "Fire Damage",
  waterFloodDamage: "Water / Flood Damage",
  electricalHazard: "Electrical Hazard",
  gasLeakSmell: "Gas Leak Smell",
  brokenWindows: "Broken Windows / Glass",
};

function getSeverityBadge(severity) {
  switch (severity) {
    case "DESTROYED":
      return "bg-red-100 text-red-700";
    case "SEVERE":
      return "bg-orange-100 text-orange-700";
    case "MODERATE":
      return "bg-yellow-100 text-yellow-700";
    case "MINOR":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-500";
  }
}

function getReportStatusBadge(status) {
  switch (status) {
    case "Pending":
      return "bg-amber-100 text-amber-700";
    case "Verified":
      return "bg-blue-100 text-blue-700";
    case "Resolved":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-500";
  }
}

export default function CommandDashboard() {
  const { user } = useAuth();
  const {
    buildings,
    unreadCount,
    showToast,
    publicReports,
    updatePublicReportStatus,
    assignEngineer: assignEngineerApi,
  } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Per-building engineer selection (before assign is clicked)
  const [engineerSelections, setEngineerSelections] = useState({});
  const [editingAssignment, setEditingAssignment] = useState({});

  // Which public report's full-detail modal is open (null = closed)
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const reportIdParam = searchParams.get("reportId");
    if (reportIdParam && publicReports.length > 0) {
      const match = publicReports.find((r) => r.trackingId === reportIdParam || String(r.id) === String(reportIdParam));
      if (match) {
        setSelectedReport(match);
      }
    }
  }, [searchParams, publicReports]);

  // Real engineers, loaded from the backend (replaces mock USERS)
  const [engineers, setEngineers] = useState([]);

  function loadEngineers() {
    const stored = getStoredUsers()
      .filter((u) => (u.role === "Engineer" || u.role === "ENGINEER") && u.status !== "INACTIVE")
      .map((u) => ({ id: u.id, name: u.name || u.fullName, email: u.email }));

    api
      .get("/users")
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const remoteEngs = res.data
            .filter((u) => (u.role === "ENGINEER" || u.role === "Engineer") && u.status !== "INACTIVE")
            .map((u) => ({ id: u.id, name: u.fullName || u.name, email: u.email }));

          const mergedMap = new Map();
          // Remote first, then overlay local stored engineers so newly created engineers are ALWAYS preserved
          remoteEngs.forEach((e) => mergedMap.set(e.email ? e.email.toLowerCase() : String(e.id), e));
          stored.forEach((e) => mergedMap.set(e.email ? e.email.toLowerCase() : String(e.id), e));

          setEngineers(Array.from(mergedMap.values()));
          return;
        }
        setEngineers(stored);
      })
      .catch(() => {
        setEngineers(stored);
      });
  }

  useEffect(() => {
    loadEngineers();
    window.addEventListener("qg:usersChanged", loadEngineers);
    window.addEventListener("qg:buildingsChanged", loadEngineers);
    return () => {
      window.removeEventListener("qg:usersChanged", loadEngineers);
      window.removeEventListener("qg:buildingsChanged", loadEngineers);
    };
  }, []);

  // Real-time: refetch the engineer list whenever any user changes anywhere
  useEffect(() => {
    window.addEventListener("qg:usersChanged", loadEngineers);
    return () => window.removeEventListener("qg:usersChanged", loadEngineers);
  }, []);

  function getEngineerName(id) {
    return engineers.find((e) => e.id === id || String(e.id) === String(id))?.name || "Engineer";
  }

  function handleSelectEngineer(buildingId, engineerId) {
    setEngineerSelections((prev) => ({ ...prev, [buildingId]: engineerId }));
  }

  function assignEngineer(buildingId) {
    const engineerId = engineerSelections[buildingId];

    if (!engineerId) {
      showToast("Please select an engineer from the dropdown first!", "warning");
      return;
    }

    const building = buildings.find((b) => b.id === buildingId);
    if (!building) return;

    assignEngineerApi(building.assessmentId || building.id, engineerId, user?.name)
      .then(() => {
        showToast(`✓ Assigned to ${getEngineerName(engineerId)}`, "success");
        setEngineerSelections((prev) => {
          const next = { ...prev };
          delete next[buildingId];
          return next;
        });
        setEditingAssignment((prev) => ({ ...prev, [buildingId]: false }));
      })
      .catch((err) => {
        console.error("Could not assign engineer:", err);
        showToast("Could not assign engineer. Try again.", "error");
      });
  }

  function getStatusBadge(b) {
    if (b.status === "COMPLETED" || b.status === "WORK_COMPLETED") {
      return { label: "Work Completed", classes: "bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold" };
    }
    if (b.engineerVerified || b.status === "ENGINEER_REVIEWED") {
      return { label: "✓ Engineer Verified", classes: "bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold" };
    }
    if (b.assignedEngineer) {
      return { label: "In Progress", classes: "bg-blue-100 text-blue-700" };
    }
    return { label: "Unassigned", classes: "bg-slate-100 text-slate-500" };
  }

  // Set of all busy engineer IDs and Names currently assigned to an active building OR active public report
  const busyEngineerIdentifiers = new Set();
  buildings.forEach((bld) => {
    const isAssigned = Boolean(bld.assignedEngineer || bld.assignedEngineerId);
    const isCompleted = bld.status === "COMPLETED" || bld.status === "WORK_COMPLETED";

    // If engineer is assigned and work is not 100% completed, mark engineer as BUSY!
    if (isAssigned && !isCompleted) {
      if (bld.assignedEngineerId) {
        const idStr = String(bld.assignedEngineerId).toLowerCase();
        busyEngineerIdentifiers.add(idStr);
        busyEngineerIdentifiers.add(`u${idStr.replace(/^u/, "")}`);
        busyEngineerIdentifiers.add(idStr.replace(/^u/, ""));
      }
      if (bld.assignedEngineer) {
        const full = String(bld.assignedEngineer).trim().toLowerCase();
        busyEngineerIdentifiers.add(full);
        const simpleName = full.split("(")[0].split("—")[0].trim();
        if (simpleName) busyEngineerIdentifiers.add(simpleName);
      }
    }
  });

  (publicReports || []).forEach((pr) => {
    const isAssigned = Boolean(pr.assignedEngineer);
    const isDone = pr.status === "Resolved" || pr.status === "Closed" || pr.status === "Rejected";

    if (isAssigned && !isDone) {
      const full = String(pr.assignedEngineer).trim().toLowerCase();
      busyEngineerIdentifiers.add(full);
      const simpleName = full.split("(")[0].trim();
      if (simpleName) busyEngineerIdentifiers.add(simpleName);
    }
  });

  // Filter out engineers who are ALREADY ASSIGNED to a building so they NEVER appear in dropdown
  const availableEngineers = engineers.filter((eng) => {
    const engIdStr = String(eng.id).toLowerCase();
    const engNameStr = String(eng.name).trim().toLowerCase();
    const isBusy =
      busyEngineerIdentifiers.has(engIdStr) ||
      busyEngineerIdentifiers.has(`u${engIdStr.replace(/^u/, "")}`) ||
      busyEngineerIdentifiers.has(engIdStr.replace(/^u/, "")) ||
      busyEngineerIdentifiers.has(engNameStr) ||
      Array.from(busyEngineerIdentifiers).some((b) => b && (engNameStr.includes(b) || b.includes(engNameStr)));
    return !isBusy;
  });

  const stats = {
    totalAssessed: buildings.length,
    destroyed: buildings.filter((b) => b.severity === "DESTROYED").length,
    severe: buildings.filter((b) => b.severity === "SEVERE").length,
    pending: buildings.filter((b) => b.status === "PROCESSING").length,
  };

  const tiles = [
    {
      key: "totalAssessed",
      label: "Total Assessed",
      icon: TrendingUp,
      gradient: "from-blue-500 to-blue-700",
      text: "text-blue-600",
    },
    {
      key: "destroyed",
      label: "Destroyed",
      icon: AlertOctagon,
      gradient: "from-red-500 to-rose-700",
      text: "text-red-600",
    },
    {
      key: "severe",
      label: "Severe",
      icon: AlertTriangle,
      gradient: "from-orange-500 to-amber-600",
      text: "text-orange-600",
    },
    {
      key: "pending",
      label: "Pending",
      icon: Building2,
      gradient: "from-amber-400 to-amber-600",
      text: "text-amber-500",
    },
  ];

  const criticalBuildings = buildings
    .filter((b) => b.severity === "DESTROYED")
    .slice(0, 5);

  const zoneMap = buildings.reduce((acc, b) => {
    const zone = b.zone || "Unassigned";
    if (!acc[zone]) acc[zone] = { total: 0, destroyed: 0, severe: 0, riskSum: 0 };
    acc[zone].total += 1;
    acc[zone].riskSum += b.riskScore || 0;
    if (b.severity === "DESTROYED") acc[zone].destroyed += 1;
    if (b.severity === "SEVERE") acc[zone].severe += 1;
    return acc;
  }, {});

  const zones = Object.entries(zoneMap)
    .map(([zone, data]) => ({
      zone,
      ...data,
      avgRisk: data.total ? data.riskSum / data.total : 0,
    }))
    .sort((a, b) => b.avgRisk - a.avgRisk);

  const severityCounts = {
    DESTROYED: buildings.filter((b) => b.severity === "DESTROYED").length,
    SEVERE: buildings.filter((b) => b.severity === "SEVERE").length,
    MODERATE: buildings.filter((b) => b.severity === "MODERATE").length,
    MINOR: buildings.filter((b) => b.severity === "MINOR").length,
  };

  const totalSeverityCount =
    Object.values(severityCounts).reduce((a, b) => a + b, 0) || 1;

  const severityBars = [
    { key: "DESTROYED", label: "Destroyed", color: "bg-red-500", text: "text-red-600" },
    { key: "SEVERE", label: "Severe", color: "bg-orange-500", text: "text-orange-600" },
    { key: "MODERATE", label: "Moderate", color: "bg-yellow-500", text: "text-yellow-600" },
    { key: "MINOR", label: "Minor", color: "bg-emerald-500", text: "text-emerald-600" },
  ];

  return (
    <div className="min-h-screen bg-[#F3FAF5]">
      <PageHeader
        title="Command Center"
        right={
          <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
            <span className="text-xs font-semibold text-white">
              {user?.name} | Authority
            </span>
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6 flex flex-col gap-6">

        <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Assign Engineer</h2>
            <span className="text-xs text-slate-400">
              {buildings.length} buildings
            </span>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {buildings.map((b) => {
              const badge = getStatusBadge(b);
              const isAssigned = !!b.assignedEngineer;

              return (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 border rounded-xl p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{b.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400 font-mono">{b.id}</span>
                      <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-100 flex items-center gap-1">
                        <MapPin size={10} className="text-red-500" />
                        Damaged Region: {b.damagedRegion || "Left Facade & Load-Bearing Wall"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${badge.classes}`}
                  >
                    {badge.label}
                  </span>

                  {isAssigned && !editingAssignment[b.id] ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-sm">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        Assigned to {b.assignedEngineer}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingAssignment((prev) => ({ ...prev, [b.id]: true }))}
                        className="text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-xl px-3 py-2 transition-all"
                      >
                        Reassign
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={engineerSelections[b.id] || ""}
                        onChange={(e) => handleSelectEngineer(b.id, e.target.value)}
                        className={`border rounded-xl p-2.5 text-sm bg-white font-semibold outline-none transition-all ${
                          engineerSelections[b.id] ? "border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900" : "border-slate-300 text-slate-700"
                        }`}
                      >
                        <option value="">Select Engineer to {isAssigned ? "Reassign" : "Assign"}</option>
                        {availableEngineers.length === 0 ? (
                          <option value="" disabled>No Available Engineers (All Busy)</option>
                        ) : (
                          availableEngineers.map((eng) => (
                            <option key={eng.id} value={eng.id}>
                              {eng.name}
                            </option>
                          ))
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() => assignEngineer(b.id)}
                        className={`rounded-xl font-bold px-4 py-2.5 text-sm whitespace-nowrap transition-all shadow-sm ${
                          engineerSelections[b.id]
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        }`}
                      >
                        {isAssigned ? "Confirm Reassign" : "Assign"}
                      </button>
                      {editingAssignment[b.id] && (
                        <button
                          type="button"
                          onClick={() => setEditingAssignment((prev) => ({ ...prev, [b.id]: false }))}
                          className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Public Damage Reports */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Public Damage Reports</h2>
            {publicReports.length > 0 && (
              <span className="text-xs text-slate-400">
                Click a row to view full details
              </span>
            )}
          </div>

          {publicReports.length === 0 ? (
            <p className="text-slate-500">
              No public reports submitted.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Tracking ID</th>
                    <th className="text-left py-3">Location</th>
                    <th className="text-left py-3">Zone</th>
                    <th className="text-left py-3">Severity</th>
                    <th className="text-left py-3">Reporter</th>
                    <th className="text-left py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {publicReports.map((report) => (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className="border-b cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 font-mono text-xs text-slate-500">
                        {report.trackingId || report.id}
                      </td>
                      <td className="py-3">{report.buildingName || "-"}</td>
                      <td className="py-3">{report.zone || "-"}</td>
                      <td className="py-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getSeverityBadge(
                            report.severity
                          )}`}
                        >
                          {report.severity || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="py-3">{report.reporterName || "-"}</td>
                      <td className="py-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getReportStatusBadge(
                            report.status
                          )}`}
                        >
                          {report.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stat tiles */}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tiles.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.key}
                className="group relative overflow-hidden bg-white border border-emerald-100 rounded-2xl px-5 py-4 shadow-sm"
              >
                <div
                  className={`absolute -right-4 -top-4 w-16 h-16 rounded-full bg-gradient-to-br ${s.gradient} opacity-10`}
                />
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3`}
                >
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  {s.label}
                </span>
                <p className={`text-2xl font-bold mt-1 ${s.text}`}>
                  {stats[s.key]}
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Critical Buildings</h2>

          <div className="space-y-3">
            {criticalBuildings.map((b) => (
              <button
                key={b.id}
                onClick={() => navigate(`/assessment/${b.id}`)}
                className="w-full flex justify-between items-center p-4 rounded-xl hover:bg-slate-50 border"
              >
                <div className="text-left">
                  <p className="font-medium">
                    {b.id} | {b.name}
                  </p>
                  <p className="text-xs text-slate-400">{b.zone}</p>
                </div>

                <span className="text-red-600 font-semibold">
                  Risk {Number(b.riskScore ?? b.risk_score ?? 0).toFixed(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Severity Distribution</h2>

          <div className="space-y-4">
            {severityBars.map((s) => {
              const count = severityCounts[s.key];
              const pct = Math.round((count / totalSeverityCount) * 100);

              return (
                <div key={s.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{s.label}</span>
                    <span>{pct}%</span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full">
                    <div
                      className={`h-full rounded-full ${s.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Quick Actions</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "View Inspections",
                path: "/inspections",
                icon: FileText,
              },
              {
                label: "Damage Map",
                path: "/map",
                icon: MapPin,
              },
              {
                label: "Manage Users",
                path: "/users",
                icon: Users,
              },
              {
                label: "Notifications",
                path: "/notifications",
                icon: AlertTriangle,
              },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="border rounded-xl py-5 flex flex-col items-center gap-2 hover:bg-slate-50"
              >
                <a.icon size={20} />
                <span className="text-xs font-semibold">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Public report full-detail modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-1">
                  <Hash size={12} /> {selectedReport.trackingId || selectedReport.id}
                </p>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedReport.buildingName || "Unnamed location"}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getSeverityBadge(
                      selectedReport.severity
                    )}`}
                  >
                    {selectedReport.severity || "UNKNOWN"}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getReportStatusBadge(
                      selectedReport.status
                    )}`}
                  >
                    {selectedReport.status || "Pending"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Authority Status & Remarks Update Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" /> Update Report Lifecycle & Officer Remarks
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Lifecycle Status</label>
                    <select
                      defaultValue={selectedReport.status || "Submitted"}
                      id="reportStatusSelect"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      <option value="Submitted">1. Submitted</option>
                      <option value="Under Review">2. Under Review</option>
                      <option value="Assigned to Department">3. Assigned to Department</option>
                      <option value="Work in Progress">4. Work in Progress</option>
                      <option value="Resolved">5. Resolved</option>
                      <option value="Closed">6. Closed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Officer Remarks / Updates for Citizen</label>
                    <textarea
                      id="officerRemarksInput"
                      defaultValue={selectedReport.officerRemarks || ""}
                      rows={2}
                      placeholder="e.g. Field inspection team dispatched. Evacuation advised..."
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const newStatus = document.getElementById("reportStatusSelect")?.value || "Submitted";
                      const remarks = document.getElementById("officerRemarksInput")?.value || "";
                      updatePublicReportStatus?.(selectedReport.id, newStatus, remarks);
                      setSelectedReport((prev) => prev ? { ...prev, status: newStatus, officerRemarks: remarks } : null);
                      showToast?.(`Report ${selectedReport.trackingId || selectedReport.id} updated to ${newStatus}`, "success");
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    Save Status & Remarks Update
                  </button>
                </div>
              </div>

              {/* Engineer Assignment Box */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Users size={14} className="text-emerald-600" /> Assign / Reassign Structural Engineer</span>
                  {selectedReport.assignedEngineer && (
                    <button
                      type="button"
                      onClick={() => setSelectedReport((prev) => prev ? { ...prev, assignedEngineer: null } : null)}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Reassign Engineer
                    </button>
                  )}
                </p>
                {selectedReport.assignedEngineer ? (
                  <div className="flex items-center justify-between gap-2 text-sm font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-300 rounded-lg px-3.5 py-2">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" /> Assigned Engineer: {selectedReport.assignedEngineer}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedReport((prev) => prev ? { ...prev, assignedEngineer: null } : null)}
                      className="text-xs font-bold bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded-md shadow-sm transition-all"
                    >
                      Reassign
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      id="publicReportEngineerSelect"
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Senior Structural Engineer</option>
                      {availableEngineers.length === 0 ? (
                        <option value="" disabled>No Available Engineers (All Busy / Assigned)</option>
                      ) : (
                        availableEngineers.map((eng) => (
                          <option key={eng.id} value={eng.id}>
                            {eng.name} — {eng.email || "Engineer"}
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const sel = document.getElementById("publicReportEngineerSelect")?.value;
                        if (!sel) {
                          showToast?.("Please select an engineer from the list.", "warning");
                          return;
                        }
                        const eng = availableEngineers.find((e) => String(e.id) === String(sel) || e.name === sel);
                        const engName = eng?.name || sel;
                        updatePublicReportStatus?.(selectedReport.id, "Assigned to Department", `Assigned to Senior Engineer: ${engName}`, {
                          assignedEngineer: engName,
                          assignedEngineerName: engName,
                          assignedEngineerId: eng?.id || sel,
                          assignedEngineerEmail: eng?.email
                        });
                        setSelectedReport((prev) => prev ? { ...prev, status: "Assigned to Department", assignedEngineer: engName, assignedEngineerId: eng?.id || sel } : null);
                        showToast?.(`Report assigned to ${engName}`, "success");
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shrink-0"
                    >
                      Assign Engineer
                    </button>
                  </div>
                )}
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                  <MapPin size={13} /> Address
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {[
                    selectedReport.address?.locality,
                    selectedReport.address?.village,
                    selectedReport.address?.taluk,
                    selectedReport.address?.district,
                    selectedReport.address?.state,
                    selectedReport.address?.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Not provided"}
                </p>
                {selectedReport.address?.landmark && (
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Landmark: {selectedReport.address.landmark}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3">
                  <User size={15} className="text-emerald-600" />
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                      Reporter
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedReport.reporterName || "Anonymous"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3">
                  <Phone size={15} className="text-emerald-600" />
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                      Contact
                    </p>
                    <p className="text-sm font-medium text-slate-800">
                      {selectedReport.contact || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                  <AlertTriangle size={13} /> Damage Checklist
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {Object.entries(selectedReport.checklist || {})
                    .filter(([, checked]) => checked)
                    .map(([key]) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 text-sm text-slate-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                      >
                        <AlertTriangle size={13} className="text-red-500" />
                        {CHECKLIST_LABELS[key] || key}
                      </div>
                    ))}
                  {Object.values(selectedReport.checklist || {}).every((v) => !v) && (
                    <p className="text-sm text-slate-400">No damage types selected</p>
                  )}
                </div>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                  <FileText size={13} /> Description
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedReport.description || "No description provided"}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2">
                  <ImageIcon size={13} /> Photos
                </p>
                {selectedReport.photos && selectedReport.photos.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {selectedReport.photos.map((p, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        {p.dataUrl ? (
                          <img src={p.dataUrl} alt={p.name || `Photo ${i+1}`} className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
                        ) : (
                          <span className="text-xs text-slate-600 bg-slate-100 rounded-lg px-3 py-1.5">{p.name || p}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No photos attached</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
