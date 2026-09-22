import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCheck, AlertOctagon, AlertTriangle, CheckCircle2, Info, BellRing, Clock, Mail, Trash2 } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
 
const ICONS = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};
 
const STYLES = {
  critical: {
    border: "border-red-200",
    bg: "bg-red-50",
    iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
    dot: "bg-red-500",
    chip: "bg-red-100 text-red-700",
    ring: "ring-red-100",
  },
  warning: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-700",
    ring: "ring-amber-100",
  },
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-700",
    ring: "ring-emerald-100",
  },
  info: {
    border: "border-blue-200",
    bg: "bg-blue-50",
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    dot: "bg-blue-500",
    chip: "bg-blue-100 text-blue-700",
    ring: "ring-blue-100",
  },
};
 
const TYPE_LABELS = {
  critical: "Critical",
  warning: "Warning",
  success: "Success",
  info: "Info",
};
 
// Strict Role-Based & Record-Specific Notification Access Control
export function isVisibleToUser(n, user, buildings = []) {
  if (!user || !n) return false;

  const role = String(user.sessionRole || user.role || "").trim();
  const lowerRole = role.toLowerCase();
  const userName = String(user.name || "").trim().toLowerCase();
  const userEmail = String(user.email || "").trim().toLowerCase();
  const userId = user.id ? String(user.id).trim().toLowerCase() : null;
  const rawUserId = userId ? userId.replace(/^u/, "") : null;
  const userFirst = userName ? userName.split(" ")[0] : "";

  // 1. AUTHORITY: Receives HQ notifications, public citizen damage reports & high-priority system alerts
  if (["authority", "admin", "director", "lead", "hq"].includes(lowerRole)) {
    // Exclude personal citizen updates ("Report Progress Update: Your report...") and engineer assignment notices ("New Public Report Assignment: Authority assigned you...")
    if (n.title && (n.title.startsWith("Report Progress Update: Your report") || n.title.startsWith("New Public Report Assignment: Authority assigned you"))) {
      return false;
    }
    return true;
  }

  // Helper to check if a building belongs to this engineer
  const isAssignedBuilding = (bId) => {
    if (!bId || !buildings || buildings.length === 0) return false;
    const match = buildings.find(
      (b) => String(b.id) === String(bId) || String(b.buildingCode) === String(bId)
    );
    if (!match) return false;
    const engId = String(match.assignedEngineerId || "").toLowerCase();
    const engName = String(match.assignedEngineer || match.assignedEngineerName || "").toLowerCase();
    return (
      (engId && (engId === userId || engId === rawUserId)) ||
      (engName && (engName === userName || (userFirst && engName.includes(userFirst))))
    );
  };

  // 2. ENGINEER: Receives notifications ONLY for their assigned works & progress
  if (["engineer"].includes(lowerRole)) {
    // Direct recipient check
    if (n.recipientId && userId && (String(n.recipientId).toLowerCase() === userId || String(n.recipientId) === rawUserId)) return true;

    // Assigned building check
    if (n.buildingId || n.buildingCode) {
      if (isAssignedBuilding(n.buildingId || n.buildingCode)) return true;
    }

    // Explicit assigned engineer check
    if (n.assignedEngineerId && userId) {
      const targetEngId = String(n.assignedEngineerId).toLowerCase().replace(/^u/, "");
      if (targetEngId === rawUserId || String(n.assignedEngineerId).toLowerCase() === userId) return true;
    }
    if (n.assignedEngineerName) {
      const nEng = String(n.assignedEngineerName).trim().toLowerCase();
      if (nEng === userName || userName.includes(nEng) || nEng.includes(userName) || (userFirst && nEng.includes(userFirst))) return true;
    }

    return false;
  }

  // 3. FIELD INSPECTOR: Receives notifications ONLY for their inspected sites & field reports
  if (["field inspector", "field_inspector", "inspector"].includes(lowerRole)) {
    if (n.recipientId && userId && (String(n.recipientId).toLowerCase() === userId || String(n.recipientId) === rawUserId)) return true;
    if (n.inspectorId && userId && (String(n.inspectorId).toLowerCase() === userId || String(n.inspectorId) === rawUserId)) return true;
    if (n.inspectorName) {
      const nInsp = String(n.inspectorName).trim().toLowerCase();
      if (nInsp === userName || userName.includes(nInsp) || nInsp.includes(userName) || (userFirst && nInsp.includes(userFirst))) return true;
    }
    return false;
  }

  // 4. CITIZEN: Receives notifications ONLY about their submitted reports
  if (["citizen"].includes(lowerRole)) {
    if (n.reporterEmail && userEmail) {
      return String(n.reporterEmail).trim().toLowerCase() === userEmail;
    }
    if (n.recipientId && userId) {
      return String(n.recipientId).toLowerCase() === userId || String(n.recipientId) === rawUserId;
    }
    return false;
  }

  return false;
}
 
export default function Notifications() {
  const { notifications, markAllRead, deleteNotification, clearUserNotifications, showToast, buildings } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");

  function handleNotificationClick(n) {
    if (!n.read) {
      n.read = true;
    }

    const role = String(user?.sessionRole || user?.role || "").toLowerCase();

    // 1. Citizen Public Report Notification
    if (n.reportId) {
      if (role.includes("citizen")) {
        navigate("/citizen");
      } else {
        navigate(`/dashboard?reportId=${n.reportId}`);
      }
      return;
    }

    // 2. Building Site Assessment Notification
    const targetBuildingId = n.buildingId || (n.targetPath && n.targetPath.includes("/assessment/") && n.targetPath.split("/").pop());
    if (targetBuildingId) {
      const match = buildings.find(
        (b) =>
          b.id === targetBuildingId ||
          b.id === `A-${targetBuildingId}` ||
          String(b.assessmentId) === String(targetBuildingId) ||
          String(b.id).replace(/^A-/, "") === String(targetBuildingId).replace(/^A-/, "") ||
          (b.buildingCode && String(b.buildingCode).toLowerCase() === String(targetBuildingId).toLowerCase())
      );
      if (match) {
        navigate(`/assessment/${match.id}`);
        return;
      }
    }

    if (n.targetPath) {
      navigate(n.targetPath);
      return;
    }

    if (role.includes("inspector") || role.includes("engineer")) {
      navigate("/inspections");
      return;
    }

    if (role.includes("authority") || role.includes("admin")) {
      navigate("/dashboard");
      return;
    }

    if (role.includes("citizen")) {
      navigate("/citizen");
      return;
    }
  }

  // Only the notifications this user is actually allowed to see.
  const visibleNotifications = useMemo(
    () => notifications.filter((n) => isVisibleToUser(n, user, buildings)),
    [notifications, user, buildings]
  );
 
  const unreadCount = visibleNotifications.filter((n) => !n.read).length;
 
  const counts = visibleNotifications.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});
 
  const authorityCount = visibleNotifications.filter((n) => n.authority).length;
 
  const filtered =
    filter === "all"
      ? visibleNotifications
      : filter === "unread"
      ? visibleNotifications.filter((n) => !n.read)
      : filter === "authority"
      ? visibleNotifications.filter((n) => n.authority)
      : visibleNotifications.filter((n) => n.type === filter);
 
  const filterTabs = [
    { key: "all", label: "All", count: visibleNotifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    ...Object.keys(counts).map((type) => ({
      key: type,
      label: TYPE_LABELS[type] || type,
      count: counts[type],
    })),
    ...(authorityCount > 0
      ? [{ key: "authority", label: ["authority", "admin", "director", "lead", "hq"].includes(String(user?.sessionRole || user?.role || "").toLowerCase()) ? "HQ Alerts" : "Sent to Authority", count: authorityCount, icon: Mail }]
      : []),
  ];
 
  function handleMarkAllRead() {
    markAllRead();
    showToast?.("All notifications marked as read", "success");
  }

  function handleDeleteNotification(e, id) {
    e.stopPropagation();
    deleteNotification(id);
    showToast?.("Notification deleted", "info");
  }

  function handleClearAll() {
    const ids = visibleNotifications.map((n) => n.id);
    clearUserNotifications(ids);
    showToast?.("All notifications deleted", "info");
  }
 
  return (
    <div className="min-h-screen bg-[#F3FAF5]">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
      />
 
      <div className="max-w-4xl mx-auto px-6 py-8">
 
        {/* Summary banner */}
        <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-7 py-7">
          <div className="pointer-events-none absolute -top-12 -right-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-14 -left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
 
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 shadow-inner">
              <BellRing size={26} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-white leading-tight">
                {unreadCount > 0
                  ? `${unreadCount} new notification${unreadCount !== 1 ? "s" : ""} waiting`
                  : "You're all caught up 🎉"}
              </p>
              <p className="text-sm text-white/80 mt-0.5">
                Stay updated on inspections, AI assessments, and system alerts
              </p>
            </div>
          </div>
 
          {/* Mini stat pills inside banner */}
          {visibleNotifications.length > 0 && (
            <div className="relative z-10 flex flex-wrap gap-2.5 mt-5">
              {Object.entries(counts).map(([type, count]) => {
                const Icon = ICONS[type] || Info;
                return (
                  <div
                    key={type}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-white"
                  >
                    <Icon size={12} />
                    <span className="text-xs font-semibold">{count} {TYPE_LABELS[type] || type}</span>
                  </div>
                );
              })}
              {authorityCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-white">
                  <Mail size={12} />
                  <span className="text-xs font-semibold">{authorityCount} Sent to Authority</span>
                </div>
              )}
            </div>
          )}
        </div>
 
        {/* Filter tabs & Action buttons row */}
        {visibleNotifications.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white rounded-2xl border border-emerald-100 p-2 shadow-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              {filterTabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filter === tab.key
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "text-slate-600 hover:bg-emerald-50 hover:text-slate-900"
                    }`}
                  >
                    {TabIcon && <TabIcon size={13} />}
                    {tab.label}
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        filter === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3 w-full sm:w-auto justify-end">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/80 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 size={14} />
                Clear all
              </button>
            </div>
          </div>
        )}
 
        {/* Notifications list */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-emerald-100 py-16 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <BellRing size={24} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No notifications here</p>
              <p className="text-xs text-slate-400 mt-1">Try a different filter or check back later</p>
            </div>
          ) : (
            filtered.map((n) => {
              const Icon = ICONS[n.type] || Info;
              const style = STYLES[n.type] || STYLES.info;
 
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`relative flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer bg-white ${style.border}`}
                >
                  {/* Left accent bar for unread */}
                  {!n.read && (
                    <span
                      className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 rounded-full ${style.dot}`}
                    />
                  )}
 
                  {/* Icon badge - gradient circle */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ring-4 ${style.ring} ${style.iconBg}`}
                  >
                    <Icon size={20} className="text-white" />
                  </div>
 
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-snug text-slate-800 font-semibold">
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${style.dot} animate-pulse mt-1`} />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${style.chip}`}>
                          {TYPE_LABELS[n.type] || n.type}
                        </span>
                        {n.authority && (
                          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            <Mail size={9} />
                            Authority
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                          <Clock size={11} />
                          {n.meta}
                        </span>
                      </div>

                      {/* TRASH BIN DELETE BUTTON */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotification(e, n.id)}
                        title="Delete notification"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}