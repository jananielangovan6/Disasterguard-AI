import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Building2,
  MapPin,
  ShieldCheck,
  ArrowRight,
  ArrowUpDown,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import PageHeader from "../components/PageHeader";
import SeverityBadge from "../components/SeverityBadge";
import { isAssignedToEngineer } from "./EngineerDashboard";
import { getDamagedBuildingSvgDataUrl } from "../data/mockData";

const SEVERITIES = [
  "ALL",
  "DESTROYED",
  "SEVERE",
  "MODERATE",
  "MINOR",
];

const SORT_OPTIONS = [
  { key: "riskDesc", label: "Risk Score (High → Low)" },
  { key: "riskAsc", label: "Risk Score (Low → High)" },
  { key: "latest", label: "Latest Inspected First" },
  { key: "idAsc", label: "Building ID" },
];

export default function InspectionsList() {
  const { user } = useAuth();
  const { buildings } = useData();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [myOnly, setMyOnly] = useState(false);
  const [sortBy, setSortBy] = useState("riskDesc");
  const [sortOpen, setSortOpen] = useState(false);

  const userRoles = [user?.sessionRole, user?.role].filter(Boolean);
  const isEngineer = userRoles.some(
    (r) => String(r).toLowerCase().includes("engineer")
  );
  const isInspector = userRoles.some(
    (r) => String(r).toLowerCase().includes("inspector")
  );
  const isAuthority = userRoles.some((r) =>
    ["authority", "admin", "director", "lead", "hq"].includes(String(r).toLowerCase())
  );

  const filtered = buildings.filter((b) => {
    const matchesFilter = filter === "ALL" || b.severity === filter;

    // Strict role-based scoping:
    // - Engineers MUST see ONLY buildings assigned to them by Authority
    // - Field Inspectors MUST see ONLY buildings uploaded by them
    // - Authority sees all buildings
    let matchesMine = true;
    if (isEngineer) {
      matchesMine = isAssignedToEngineer(b, user);
    } else if (isInspector) {
      const uName = String(user?.name || "").trim().toLowerCase();
      const uEmail = String(user?.email || "").trim().toLowerCase();
      const uId = String(user?.id || "").trim().toLowerCase();
      const bInsp = String(b.inspector || b.inspectorName || "").trim().toLowerCase();
      const bInspId = String(b.inspectorId || "").trim().toLowerCase();

      matchesMine =
        !bInsp ||
        (uName && (bInsp.includes(uName) || uName.includes(bInsp) || (bInsp.split(" ")[0] && uName.includes(bInsp.split(" ")[0])))) ||
        (uEmail && bInsp.includes(uEmail.split("@")[0])) ||
        (uId && (bInspId === uId || bInspId === `u${uId.replace(/^u/, "")}`));
    } else if (myOnly) {
      matchesMine = isAssignedToEngineer(b, user);
    }

    const matchesQuery =
      !query ||
      b.id.toLowerCase().includes(query.toLowerCase()) ||
      b.name.toLowerCase().includes(query.toLowerCase());

    return matchesFilter && matchesMine && matchesQuery;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aRisk = Number(a.riskScore) || 0;
    const bRisk = Number(b.riskScore) || 0;

    switch (sortBy) {
      case "riskAsc":
        return aRisk - bRisk;
      case "latest": {
        const aTime = new Date(a.inspectedAt || a.date || 0).getTime();
        const bTime = new Date(b.inspectedAt || b.date || 0).getTime();
        return bTime - aTime;
      }
      case "idAsc":
        return a.id.localeCompare(b.id);
      case "riskDesc":
      default:
        return bRisk - aRisk;
    }
  });

  const currentSortLabel = SORT_OPTIONS.find((s) => s.key === sortBy)?.label;

  return (
    <div className="min-h-screen bg-[#F3FAF5]">

      <PageHeader
        title="Building Inspections"
        subtitle={`${sorted.length} of ${buildings.length} Buildings`}
      />

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Search + Filters */}

        <div className="bg-white rounded-xl border border-emerald-100 p-4 mb-6">

          <div className="flex flex-col sm:flex-row gap-3">

            <div className="flex-1 flex items-center gap-3 bg-[#F3FAF5] rounded-lg border border-emerald-100 px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-400">

              <Search
                size={16}
                className="text-emerald-600"
              />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Building..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
              />

            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-2 bg-[#F3FAF5] border border-emerald-100 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-emerald-100/60 transition-all whitespace-nowrap"
              >
                <ArrowUpDown size={14} className="text-emerald-600" />
                {currentSortLabel}
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-1.5 bg-white border border-emerald-100 rounded-xl shadow-lg shadow-slate-900/10 overflow-hidden z-30 min-w-[220px]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.key);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sortBy === opt.key
                          ? "bg-emerald-600 text-white font-semibold"
                          : "text-slate-700 hover:bg-emerald-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* My Inspections Only toggle */}
            <button
              type="button"
              onClick={() => setMyOnly((v) => !v)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                myOnly
                  ? "bg-emerald-600 text-white"
                  : "bg-[#F3FAF5] border border-emerald-100 text-slate-700 hover:bg-emerald-100/60"
              }`}
            >
              <UserCheck size={14} />
              My Inspections Only
            </button>

          </div>

          {/* Severity filter chips */}
          <div className="flex flex-wrap gap-2 mt-4">

            {SEVERITIES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === s
                    ? "bg-emerald-600 text-white"
                    : "bg-[#F3FAF5] border border-emerald-100 text-slate-700 hover:bg-emerald-100/60"
                }`}
              >
                {s}
              </button>
            ))}

          </div>

        </div>

        {/* Inspection Cards */}

        <div className="space-y-4">

          {sorted.length === 0 ? (

            <div className="bg-white rounded-xl border border-emerald-100 py-12 text-center">

              <h2 className="text-xl font-semibold text-slate-700">
                No Buildings Found
              </h2>

              <p className="text-slate-500 mt-2">
                Try another search or filter.
              </p>

            </div>

          ) : (

           sorted.map((b) => (
  <div
    key={b.id}
    onClick={() => navigate(`/assessment/${b.id}`)}
    className="cursor-pointer bg-white border border-emerald-100 rounded-xl hover:border-emerald-300 transition-all duration-200 px-5 py-4"
  >
    <div className="flex items-center justify-between">

      {/* Left Section */}
      <div className="flex items-center gap-3">

        <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shrink-0 relative group">
          <img
            src={
              (b.imageUrl && String(b.imageUrl).trim() !== "" && !b.imageUrl.includes("data:image/svg+xml") ? b.imageUrl : null) ||
              (b.images && Array.isArray(b.images) && b.images.length > 0 && String(b.images[0]).trim() !== "" && !b.images[0].includes("data:image/svg+xml") ? b.images[0] : null) ||
              "/damaged_house_site.png"
            }
            alt={b.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/damaged_house_site.png";
            }}
          />
        </div>

        <div>

          <h2 className="text-base font-semibold text-slate-800">
            {b.id}
          </h2>

          <p className="text-sm text-slate-500">
            {b.name}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">

            {(b.address || b.areaLandmark) && (
              <div className="flex items-center gap-1">
                <MapPin size={13} />
                {b.address || b.areaLandmark}
              </div>
            )}

            <div className="flex items-center gap-1">
              <ShieldCheck size={13} />
              Inspector: {b.inspector || b.inspectorName || "Field Inspector"}
            </div>

            <div className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
              <UserCheck size={12} className="text-blue-600" />
              Assigned Engineer: {b.assignedEngineer || b.assignedEngineerName || "Unassigned"}
            </div>

          </div>

        </div>

      </div>

      {/* Right Section */}

      <div className="flex items-center gap-4">

        <SeverityBadge severity={b.severity} />

        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center min-w-[65px]">

          <p className="text-[10px] uppercase text-red-500">
            Risk
          </p>

          <h3 className="text-lg font-bold text-red-600">
            {Number(b.riskScore ?? b.risk_score ?? 0).toFixed(1)}
          </h3>

        </div>

        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">

          <ArrowRight
            size={16}
            className="text-emerald-700"
          />

        </div>

      </div>

    </div>
  </div>
           ))
                     )}

        </div>

      </div>

    </div>
  );
}