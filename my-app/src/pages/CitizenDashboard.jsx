import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck, Bell, LogOut, Mail, Phone, MapPin, BadgeCheck,
  FilePlus2, ClipboardList, Inbox, Clock, X, Home, AlertTriangle,
  FileText, Image as ImageIcon, CheckCircle2, Circle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import SeverityBadge from "../components/SeverityBadge";

const STATUS_META = {
  "Submitted": { label: "Submitted", color: "#2563EB", bg: "rgba(37,99,235,0.10)" },
  "Under Review": { label: "Under Review", color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  "Assigned to Department": { label: "Assigned to Department", color: "#0D9488", bg: "rgba(13,148,136,0.10)" },
  "Work in Progress": { label: "Work in Progress", color: "#0891B2", bg: "rgba(8,145,178,0.10)" },
  "Resolved": { label: "Resolved", color: "#059669", bg: "rgba(5,150,105,0.10)" },
  "Closed": { label: "Closed", color: "#475569", bg: "rgba(71,85,105,0.10)" },
  "Pending": { label: "Submitted", color: "#2563EB", bg: "rgba(37,99,235,0.10)" },
  "Rejected": { label: "Rejected", color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
};

const STATUS_FLOW = ["Submitted", "Under Review", "Assigned to Department", "Work in Progress", "Resolved", "Closed"];

const STATUS_NOTIF_TEXT = {
  "Submitted": "has been submitted successfully.",
  "Under Review": "is now under review by authorities.",
  "Assigned to Department": "has been assigned to the response department.",
  "Work in Progress": "has inspection/work actively in progress.",
  "Resolved": "has been marked as resolved.",
  "Closed": "has been closed.",
  "Pending": "has been received and is waiting for review.",
  "Rejected": "was reviewed and rejected. See details for more info.",
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META["Pending"];
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide rounded-full border px-3 py-1"
      style={{ color: meta.color, background: meta.bg, borderColor: meta.color + "33" }}
    >
      {meta.label}
    </span>
  );
}

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function getCitizenDisplayName(user) {
  if (!user) return "Citizen User";

  const rawName = user.name?.trim() || "";
  if (rawName && !rawName.includes("@") && !/\d{3,}/.test(rawName)) {
    return rawName;
  }

  const cleanEmail = (user.email || "").trim().toLowerCase();
  if (cleanEmail.includes("manishakeerthi")) {
    return "Manisha Keerthi";
  }

  let cleanHandle = (user.email ? user.email.split("@")[0] : rawName).replace(/\d+/g, "").trim();
  if (!cleanHandle) return "Citizen User";

  return cleanHandle
    .split(/[\s._-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function CitizenDashboard() {
  const { user, logout, updateProfile } = useAuth();
  const { publicReports, showToast } = useData();
  const navigate = useNavigate();

  const displayName = getCitizenDisplayName(user);

  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const notifRef = useRef(null);

  // Edit Profile modal state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDistrict, setEditDistrict] = useState("");

  function openEditModal() {
    setEditName(displayName);
    setEditPhone(user?.phone && user.phone !== "—" ? user.phone : "+91 97902 34567");
    setEditDistrict(user?.district && user.district !== "—" ? user.district : "Coimbatore, Tamil Nadu");
    setShowEditProfile(true);
  }

  function handleSaveProfile(e) {
    e.preventDefault();
    if (!editName.trim()) {
      showToast("Name cannot be empty.", "warning");
      return;
    }
    updateProfile({
      name: editName.trim(),
      phone: editPhone.trim(),
      district: editDistrict.trim(),
    });
    showToast("Profile details updated successfully!", "success");
    setShowEditProfile(false);
  }
  const myReports = useMemo(() => {
    if (!publicReports || publicReports.length === 0) return [];
    if (!user) return publicReports;
    const userEmail = (user.email || "").toLowerCase();
    const userName = (user.name || "").toLowerCase();
    const userId = user.id;

    const filtered = publicReports.filter((r) => {
      if (r.ownerId && userId && String(r.ownerId) === String(userId)) return true;
      if (r.email && userEmail && r.email.toLowerCase() === userEmail) return true;
      if (r.contact && userEmail && r.contact.toLowerCase() === userEmail) return true;
      if (r.reporterName && userName && r.reporterName.toLowerCase() === userName) return true;
      return false;
    });

    return filtered;
  }, [publicReports, user]);

  // Close notification dropdown when clicking outside it
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close report modal on Escape key
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") setSelectedReport(null);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  // Build notifications straight from the citizen's own reports —
  // no separate notification store needed, always reflects real data.
  const notifications = useMemo(() => {
    return [...myReports]
      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
      .map((r) => ({
        id: r.id,
        title: `Report ${r.trackingId || r.id} ${STATUS_NOTIF_TEXT[r.status] || "has an update."}`,
        meta: r.submittedAt || "",
        status: r.status,
        report: r,
      }));
  }, [myReports]);

  const stats = {
    submitted: myReports.length,
    pending: myReports.filter((r) => r.status === "Pending").length,
    inspection: myReports.filter((r) =>
      ["Engineer Assigned", "Inspection Scheduled"].includes(r.status)
    ).length,
    done: myReports.filter((r) => r.status === "Resolved").length,
    rejected: myReports.filter((r) => r.status === "Rejected").length,
  };

  function handleLogout() {
    logout();
    navigate("/citizen-login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/citizen" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShieldCheck size={18} color="#fff" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-slate-900 text-sm tracking-tight">DisasterGuard AI</p>
              <p className="text-[11px] text-emerald-600 font-medium">Citizen Reporting Portal</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Notification bell + dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-colors"
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden z-30">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="font-bold text-sm text-slate-900">Notifications</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Inbox size={22} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            setSelectedReport(n.report);
                            setNotifOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors flex flex-col gap-1"
                        >
                          <p className="text-xs text-slate-700 leading-relaxed">{n.title}</p>
                          <p className="text-[10px] text-slate-400">{n.meta}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="h-24 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600" />
          <div className="px-6 sm:px-8 pb-6">
            <div className="-mt-10 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">{initialsOf(displayName)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{displayName}</h1>
                <p className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold mt-1">
                  <BadgeCheck size={14} /> Verified Citizen Account
                </p>
              </div>
              <button
                onClick={openEditModal}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-all"
              >
                ✏️ Edit Profile
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-slate-500 mb-6">
              <span className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400" /> {user?.email}
              </span>
              <span className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" /> {user?.phone && user.phone !== "—" ? user.phone : "+91 97902 34567"}
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" /> {user?.district && user.district !== "—" ? user.district : "Coimbatore, Tamil Nadu"}
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Submitted", value: stats.submitted, color: "text-slate-900" },
                { label: "Pending", value: stats.pending, color: "text-blue-600" },
                { label: "Inspection", value: stats.inspection, color: "text-teal-600" },
                { label: "Done", value: stats.done, color: "text-emerald-600" },
                { label: "Rejected", value: stats.rejected, color: "text-red-600" },
              ].map((s) => (
                <div key={s.label} className="border border-slate-200 rounded-xl py-3 text-center bg-slate-50/50">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action tabs */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/citizen/report"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-sm hover:border-emerald-300 hover:text-emerald-700 transition-all"
          >
            <FilePlus2 size={16} /> Submit Report
          </Link>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm shadow shadow-emerald-500/20">
            <ClipboardList size={16} /> My Reports
          </div>
        </div>

        {/* My Reports */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">My Reports</h2>
          <span className="text-sm text-slate-500">{myReports.length} total</span>
        </div>

        {myReports.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-14 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <Inbox size={24} className="text-emerald-500" />
            </div>
            <p className="text-slate-900 font-semibold mb-1">No reports submitted yet</p>
            <p className="text-sm text-slate-500 mb-5">Report structural damage to get an AI assessment and inspection.</p>
            <Link
              to="/citizen/report"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-semibold text-sm shadow shadow-emerald-500/25"
            >
              <FilePlus2 size={16} /> Submit Your First Report
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {myReports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedReport(r)}
                className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Report ID</p>
                    <p className="font-bold text-slate-900 text-[15px]">{r.trackingId || r.id}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                  <Clock size={12} /> {r.submittedAt}
                </p>

                {r.severity && (
                  <SeverityBadge severity={r.severity} size="sm" />
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* ══════════════════ EDIT PROFILE MODAL ══════════════════ */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowEditProfile(false)} />
          <div className="relative z-10 w-full max-w-[420px] bg-white border border-slate-200 rounded-3xl p-7 shadow-2xl">
            <button onClick={() => setShowEditProfile(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Edit Citizen Profile</h2>
            <p className="text-xs text-slate-500 mb-5">Update your personal account information.</p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 97902 34567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">District / Location</label>
                <input
                  type="text"
                  value={editDistrict}
                  onChange={(e) => setEditDistrict(e.target.value)}
                  placeholder="Coimbatore, Tamil Nadu"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════ REPORT DETAIL MODAL ══════════════════ */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}

function ReportDetailModal({ report, onClose }) {
  const isRejected = report.status === "Rejected";
  const currentStepIndex = STATUS_FLOW.indexOf(report.status);
  const address = report.address || {};
  const checklist = report.checklist || {};

  const checkedItems = Object.entries(checklist)
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-slate-900/20 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Report ID</p>
            <p className="font-bold text-slate-900 text-lg">{report.trackingId || report.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status + severity row */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={report.status} />
            {report.severity && <SeverityBadge severity={report.severity} size="sm" />}
            <span className="flex items-center gap-1.5 text-xs text-slate-400 ml-auto">
              <Clock size={12} /> {report.submittedAt}
            </span>
          </div>

          {/* Status timeline */}
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Status Progress</p>
            {isRejected ? (
              <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
                <X size={16} /> This report was reviewed and rejected.
              </div>
            ) : (
              <div className="flex items-center">
                {STATUS_FLOW.map((step, i) => (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5 w-16">
                      {i < currentStepIndex ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : i === currentStepIndex ? (
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                      ) : (
                        <Circle size={20} className="text-slate-200" />
                      )}
                      <span
                        className={
                          "text-[9px] text-center font-semibold leading-tight " +
                          (i <= currentStepIndex ? "text-emerald-700" : "text-slate-400")
                        }
                      >
                        {step}
                      </span>
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
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
            )}
          </div>

          {/* Verified On-Site Repair & Restoration Certificate */}
          {(report.status === "Resolved" || report.status === "Closed" || report.completionImage || report.completionRemarks) && (
            <div className="border-2 border-emerald-300 bg-emerald-50 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                  <BadgeCheck size={18} className="text-emerald-600" /> Verified On-Site Completion & Restoration
                </span>
                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ✓ Verified by AI & Senior Engineer
                </span>
              </div>

              {(report.completionImage || report.photos?.[0]?.dataUrl) && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Restored Building Site Photo</p>
                  <img
                    src={report.completionImage || "/repaired_house_site.png"}
                    alt="Restored Site"
                    className="w-full h-44 object-cover rounded-xl border border-emerald-300 shadow-sm"
                  />
                </div>
              )}

              <div className="bg-white rounded-xl p-3 border border-emerald-200 text-xs space-y-1.5">
                <p className="font-bold text-slate-800">
                  Engineer Completion Remarks: <span className="font-normal italic text-slate-700">{report.completionRemarks || report.officerRemarks || "On-site structural repairs and safety reinforcement completed and verified by Python AI."}</span>
                </p>
                {report.completionDate && (
                  <p className="text-[10px] text-slate-500 font-mono">Completed On: {report.completionDate}</p>
                )}
              </div>
            </div>
          )}

          {/* Officer Remarks */}
          {report.officerRemarks && (
            <div className="border border-emerald-200 bg-emerald-50/70 rounded-xl p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wide mb-1.5">
                <BadgeCheck size={14} /> Officer Remarks
              </p>
              <p className="text-sm text-emerald-900 leading-relaxed font-medium">{report.officerRemarks}</p>
            </div>
          )}

          {/* Last updated info */}
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <span>Submitted: {report.submittedAt}</span>
            <span>Last Updated: {report.lastUpdatedAt || report.submittedAt}</span>
          </div>

          {/* Incident datetime & Remarks */}
          {report.incidentDateTime && (
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">
                <Clock size={13} /> Incident Date & Time
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                {new Date(report.incidentDateTime).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {/* Location */}
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">
              <Home size={13} /> Location
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {[address.village, address.locality, address.taluk, address.district, address.state, address.pincode]
                .filter(Boolean)
                .join(", ") || "Not provided"}
              {address.landmark && <span className="block text-slate-400 mt-0.5">Near {address.landmark}</span>}
            </p>
          </div>

          {/* Damage type */}
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">
              <AlertTriangle size={13} /> Damage Type
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {checkedItems.length > 0 ? checkedItems.join(", ") : "None recorded"}
            </p>
          </div>

          {/* Description */}
          {report.description && (
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">
                <FileText size={13} /> Description
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">{report.description}</p>
            </div>
          )}

          {/* Additional Remarks */}
          {report.additionalRemarks && (
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">
                <FileText size={13} /> Additional Remarks
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">{report.additionalRemarks}</p>
            </div>
          )}

          {/* Photos */}
          <div className="border border-slate-200 rounded-xl p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">
              <ImageIcon size={13} /> Photos / Evidence
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {report.photos?.length > 0 ? `${report.photos.length} photo(s) attached` : "No photos attached"}
            </p>
          </div>
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