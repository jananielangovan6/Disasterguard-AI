import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Toast from "./components/Toast";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CommandDashboard from "./pages/CommandDashboard";
import Upload from "./pages/Upload";
import BuildingAssessment from "./pages/BuildingAssessment";
import InspectionsList from "./pages/InspectionsList";
import DamageMap from "./pages/DamageMap";
import Report from "./pages/Report";
import Notifications from "./pages/Notifications";
import ManageUsers from "./pages/ManageUsers";
import AppSettings from "./pages/AppSettings";
import UserProfile from "./pages/UserProfile";
import PublicReport from "./pages/PublicReport";
import PublicDamageReportPage from "./pages/PublicDamageReportPage";
import Signup from "./pages/Signup";
import CitizenDashboard from "./pages/CitizenDashboard";
import CitizenReportForm from "./pages/CitizenReportForm";
import TrackSubmissions from "./pages/TrackSubmissions";
import OnSiteRepair from "./pages/OnSiteRepair";

import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/public-report" element={<PublicDamageReportPage />} />

            {/* CITIZEN ROUTES */}
            <Route path="/citizen-login" element={<PublicReport />} />
            <Route path="/citizen-signup" element={<Signup />} />
            <Route path="/citizen" element={<ErrorBoundary><CitizenDashboard /></ErrorBoundary>} />
            <Route path="/citizen/report" element={<ErrorBoundary><CitizenReportForm /></ErrorBoundary>} />

            {/* PROTECTED ROUTES (staff) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
  path="/my-submissions"
  element={
    <ProtectedRoute>
      <TrackSubmissions />
    </ProtectedRoute>
  }
/>

            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />

            <Route
              path="/assessment/:id"
              element={
                <ProtectedRoute>
                  <BuildingAssessment />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inspections"
              element={
                <ProtectedRoute>
                  <InspectionsList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <DamageMap />
                </ProtectedRoute>
              }
            />

            <Route
              path="/onsite"
              element={
                <ProtectedRoute roles={["Engineer"]}>
                  <OnSiteRepair />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports/:id"
              element={
                <ProtectedRoute>
                  <Report />
                </ProtectedRoute>
              }
            />

            <Route
              path="/command"
              element={
                <ProtectedRoute roles={["Authority"]}>
                  <CommandDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute roles={["Authority"]}>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppSettings />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Landing />} />
          </Routes>

          <Toast />
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}