import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "./Layout";

function isUserAuthorized(user, roles) {
  if (!user) return false;
  if (!roles || roles.length === 0) return true;

  const userRoles = [
    user.sessionRole,
    user.role,
    user.sessionRole?.toLowerCase(),
    user.role?.toLowerCase(),
  ].filter(Boolean);

  const isAuthorityUser = userRoles.some((r) =>
    ["authority", "admin", "director", "lead", "hq"].includes(String(r).toLowerCase())
  );

  return roles.some((r) => {
    const cleanRole = String(r).toLowerCase();
    if (cleanRole === "authority" || cleanRole === "admin") {
      return isAuthorityUser;
    }
    return userRoles.some((ur) => String(ur).toLowerCase() === cleanRole);
  });
}

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !isUserAuthorized(user, roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
}