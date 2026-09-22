import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Upload, ClipboardList, Map, Bell, Users, Settings, LogOut, ShieldCheck, User, Wrench,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { isVisibleToUser } from "../pages/Notifications";

const NAV_ITEMS = [
  { to: "/citizen", label: "My Reports", icon: ClipboardList, roles: ["Citizen", "citizen"] },
  { to: "/citizen/report", label: "Report Damage", icon: ShieldCheck, roles: ["Citizen", "citizen"] },
  { to: "/upload", label: "Upload Photo", icon: Upload, roles: ["Field Inspector"] },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Field Inspector", "Engineer", "Authority", "Citizen", "citizen"] },
  { to: "/inspections", label: "Inspections", icon: ClipboardList, roles: ["Field Inspector", "Engineer", "Authority"] },
  { to: "/map", label: "Damage Map", icon: Map, roles: ["Field Inspector", "Engineer", "Authority", "Citizen", "citizen"] },
  { to: "/onsite", label: "On-Site", icon: Wrench, roles: ["Engineer"] },
  { to: "/notifications", label: "Notifications", icon: Bell, roles: ["Field Inspector", "Engineer", "Authority", "Citizen", "citizen"] },
  { to: "/profile", label: "My Profile", icon: User, roles: ["Field Inspector", "Engineer", "Authority", "Citizen", "citizen"] },
  { to: "/users", label: "Users", icon: Users, roles: ["Authority"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["Authority"] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { notifications, buildings } = useData();
  const navigate = useNavigate();

  const userRoles = [
    user?.sessionRole,
    user?.role,
    user?.sessionRole?.toLowerCase(),
    user?.role?.toLowerCase(),
  ].filter(Boolean);

  const isAuthorityUser = userRoles.some((r) =>
    ["authority", "admin", "director", "lead", "hq"].includes(String(r).toLowerCase())
  );

  const isStaffUser = userRoles.some((r) =>
    ["authority", "admin", "director", "lead", "hq", "field inspector", "field_inspector", "inspector", "engineer"].includes(String(r).toLowerCase())
  );

  const items = NAV_ITEMS.filter((i) => {
    // Hide citizen-only links from Authority / Staff users
    if (["/citizen", "/citizen/report"].includes(i.to) && isStaffUser) {
      return false;
    }
    // Hide /upload and /onsite from Authority users (HQ / Admins do not upload field photos or perform repairs)
    if (["/upload", "/onsite"].includes(i.to) && isAuthorityUser) {
      return false;
    }
    if (isAuthorityUser) {
      return !["/citizen", "/citizen/report", "/upload", "/onsite"].includes(i.to);
    }
    return i.roles.some((r) =>
      userRoles.some((ur) => String(ur).toLowerCase() === String(r).toLowerCase())
    );
  });

  const userUnreadCount = notifications.filter((n) => {
    if (n.read) return false;
    return isVisibleToUser(n, user, buildings);
  }).length;

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <aside className="hidden sm:flex w-56 shrink-0 h-screen sticky top-0 bg-gradient-to-b from-emerald-500 to-blue-600 flex-col justify-between">
      {/* Top: logo + nav */}
      <div className="flex flex-col min-h-0">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/15 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={16} strokeWidth={2.5} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-sm text-white truncate block">DisasterGuard AI</span>
            <span className="text-[11px] text-cyan-50/80 truncate block">Damage Assessment</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4 overflow-y-auto min-h-0">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={17} className={isActive ? "text-blue-600" : "text-white/85"} />
                  <span className="truncate">{item.label}</span>
                  {item.to === "/notifications" && userUnreadCount > 0 && (
                    <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                      {userUnreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom: profile + logout, always pinned */}
      <div className="px-3 py-4 border-t border-white/15 flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-2.5 px-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[12px] font-bold text-blue-600 shrink-0 shadow-sm">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user?.name || "User"}
            </p>
            <p className="text-[11px] text-cyan-50/75 truncate">{user?.sessionRole || user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut size={17} className="shrink-0" />
          Log out
        </button>
      </div>
    </aside>
  );
}
