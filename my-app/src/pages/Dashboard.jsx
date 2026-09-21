import { useAuth } from "../context/AuthContext";
import FieldInspectorDashboard from "./FieldInspectorDashboard";
import EngineerDashboard from "./EngineerDashboard";
import CommandDashboard from "./CommandDashboard";
import CitizenDashboard from "./CitizenDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  const r1 = String(user?.role || "").toUpperCase();
  const r2 = String(user?.sessionRole || "").toUpperCase();

  if (r1 === "CITIZEN" || r2 === "CITIZEN" || r1 === "PUBLIC" || r2 === "PUBLIC") {
    return <CitizenDashboard />;
  }
  if (
    r1 === "ENGINEER" ||
    r2 === "ENGINEER" ||
    r1.includes("ENGINEER") ||
    r2.includes("ENGINEER")
  ) {
    return <EngineerDashboard />;
  }
  if (
    r1 === "AUTHORITY" ||
    r2 === "AUTHORITY" ||
    r1 === "ADMIN" ||
    r2 === "ADMIN" ||
    r1 === "DIRECTOR" ||
    r2 === "DIRECTOR"
  ) {
    return <CommandDashboard />;
  }
  return <FieldInspectorDashboard />;
}