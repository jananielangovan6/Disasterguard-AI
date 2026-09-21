import { NavLink } from "react-router-dom";
import { LayoutDashboard, Upload, ClipboardList, Map, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard, roles: ["Field Inspector", "Engineer", "Authority"] },
  { to: "/upload", label: "Upload", icon: Upload, roles: ["Field Inspector"] },
  { to: "/inspections", label: "Inspect", icon: ClipboardList, roles: ["Field Inspector", "Engineer", "Authority"] },
  { to: "/map", label: "Map", icon: Map, roles: ["Field Inspector", "Engineer", "Authority"] },
  { to: "/notifications", label: "Alerts", icon: Bell, roles: ["Field Inspector", "Engineer", "Authority"] },
];

export default function MobileNav() {
  const { user } = useAuth();
  const { unreadCount } = useData();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user?.sessionRole)).slice(0, 5);

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-stretch h-16 shadow-[0_-2px_10px_rgba(15,23,42,0.04)]">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium relative transition-colors duration-200 ${
              isActive ? "text-emerald-600" : "text-slate-400"
            }`
          }
        >
          <item.icon size={18} />
          {item.label}
          {item.to === "/notifications" && unreadCount > 0 && (
            <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-red-500 border border-white" />
          )}
        </NavLink>
      ))}
    </nav>
  );
}
