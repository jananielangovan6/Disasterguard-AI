import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  HeartPulse,
  GraduationCap,
  Home,
  Cake,
  BadgeCheck,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { getStoredUsers, saveStoredUsers, setCurrentUser } from "../data/mockData";

export default function OnboardingModal() {
  const { user, setUser } = useAuth();
  const { showToast } = useData() || {};
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  // Form state for personal onboarding profile details
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [experience, setExperience] = useState("");
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [zone, setZone] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || user.role === "CITIZEN" || user.role === "Citizen") {
      setShow(false);
      return;
    }

    const defaultStaffEmails = [
      "admin@disasterguard.org",
      "janani@disasterguard.org",
      "swetha@disasterguard.org",
      "dhiyana@disasterguard.org",
      "karthik@disasterguard.org"
    ];

    const cleanEmail = (user.email || "").toLowerCase();
    if (defaultStaffEmails.includes(cleanEmail)) {
      setShow(false);
      return;
    }

    // Check if user has completed onboarding profile
    const storedUsers = getStoredUsers();
    const currentUserMatch = storedUsers.find(
      (u) =>
        (u.id && String(u.id) === String(user.id)) ||
        (u.email && u.email.toLowerCase() === cleanEmail) ||
        (u.officialEmail && u.officialEmail.toLowerCase() === cleanEmail)
    );

    // Mandatory onboarding: Show modal if staff member hasn't completed profile yet
    if (currentUserMatch && (!currentUserMatch.profileCompleted || currentUserMatch.isNewUser)) {
      setShow(true);
      // Pre-fill whatever exists
      setGender(currentUserMatch.gender || "");
      setDob(currentUserMatch.dob || "");
      setAddress(currentUserMatch.address || "");
      setExperience(currentUserMatch.experience || "");
      setQualification(currentUserMatch.qualification || "");
      setSpecialization(currentUserMatch.specialization || "");
      setZone(currentUserMatch.zone || "");
      setEmergencyContactName(currentUserMatch.emergencyContactName || "");
      setEmergencyContactPhone(currentUserMatch.emergencyContactPhone || "");
    } else if (user.isNewUser && !user.profileCompleted) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [user]);

  if (!show || !user) return null;

  function handleSubmitProfile(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (!gender || !dob || !address.trim() || !qualification.trim() || !emergencyContactName.trim() || !emergencyContactPhone.trim()) {
      if (showToast) showToast("⚠️ All fields marked with * are mandatory. Please fill in your personal details to enter portal.", "warning");
      return;
    }

    setSubmitting(true);

    const storedUsers = getStoredUsers();
    const updatedUsers = storedUsers.map((u) => {
      if (
        (u.id && String(u.id) === String(user.id)) ||
        (u.email && u.email.toLowerCase() === user.email?.toLowerCase()) ||
        (u.officialEmail && u.officialEmail.toLowerCase() === user.email?.toLowerCase())
      ) {
        return {
          ...u,
          gender: gender || "Not Specified",
          dob: dob || "Not Specified",
          address: String(address || "").trim(),
          experience: String(experience || "").trim() || "0",
          qualification: String(qualification || "").trim(),
          specialization: String(specialization || u.specialization || "").trim(),
          zone: String(zone || u.zone || "").trim(),
          emergencyContactName: String(emergencyContactName || "").trim(),
          emergencyContactPhone: String(emergencyContactPhone || "").trim(),
          ...(newPassword ? { password: newPassword } : {}),
          isNewUser: false,
          profileCompleted: true,
          profileCompletedAt: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        };
      }
      return u;
    });

    saveStoredUsers(updatedUsers);

    // Update current user session
    const updatedUserMatch = updatedUsers.find(
      (u) =>
        (u.id && String(u.id) === String(user.id)) ||
        (u.email && u.email.toLowerCase() === user.email?.toLowerCase())
    );

    const updatedSessionUser = {
      ...user,
      ...(updatedUserMatch || {}),
      gender,
      dob,
      address,
      qualification,
      emergencyContactName,
      emergencyContactPhone,
      isNewUser: false,
      profileCompleted: true,
    };

    setCurrentUser(updatedSessionUser);
    if (typeof setUser === "function") setUser(updatedSessionUser);

    // Trigger real-time event for Authority manage users page
    window.dispatchEvent(new Event("qg:usersChanged"));

    setSubmitting(false);
    setShow(false);
    if (showToast) {
      showToast("🎉 Personal details saved successfully! Access granted to your portal.", "success");
    }

    // Navigate cleanly to the user's main dashboard
    const roleStr = String(user?.sessionRole || user?.role || "").toUpperCase();
    if (roleStr.includes("AUTHORITY") || roleStr.includes("ADMIN") || roleStr.includes("DIRECTOR")) {
      navigate("/command");
    } else {
      navigate("/dashboard");
    }
  }

  function handleSkipAndProceed() {
    const storedUsers = getStoredUsers();
    const updatedUsers = storedUsers.map((u) => {
      if (
        (u.id && String(u.id) === String(user.id)) ||
        (u.email && u.email.toLowerCase() === user.email?.toLowerCase())
      ) {
        return {
          ...u,
          isNewUser: false,
          profileCompleted: true,
        };
      }
      return u;
    });

    saveStoredUsers(updatedUsers);

    const updatedUserMatch = updatedUsers.find(
      (u) =>
        (u.id && String(u.id) === String(user.id)) ||
        (u.email && u.email.toLowerCase() === user.email?.toLowerCase())
    );

    if (updatedUserMatch) {
      const updatedSessionUser = {
        ...user,
        ...updatedUserMatch,
        isNewUser: false,
        profileCompleted: true,
      };
      setCurrentUser(updatedSessionUser);
      if (typeof setUser === "function") setUser(updatedSessionUser);
    }

    setShow(false);

    const roleStr = String(user?.sessionRole || user?.role || "").toUpperCase();
    if (roleStr.includes("AUTHORITY") || roleStr.includes("ADMIN") || roleStr.includes("DIRECTOR")) {
      navigate("/command");
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 sm:p-8 my-8 border border-emerald-100">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Complete Staff Onboarding Profile</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                First-Time Setup
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome <strong>{user.name}</strong>! Admin has registered your account ({user.employeeId || "Staff"}). Please enter your personal details to activate your portal.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmitProfile} className="space-y-5">
          
          {/* Section 1: Personal Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} /> Personal Information
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 bg-white"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Cake size={13} /> Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Home size={13} /> Residential Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Door No, Street, Landmark, City, Pincode"
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 bg-white resize-none"
                required
              />
            </div>
          </div>

          {/* Section 2: Professional & Qualifications */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={14} /> Qualifications & Background
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Qualification <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. B.E. Civil / M.Tech Structural"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Specialization</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Seismic Retrofitting"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Assigned Zone</label>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="e.g. Zone B / HQ"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Emergency Contact Details */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse size={14} /> Emergency Contact Person
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Ramesh S (Spouse / Parent)"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="e.g. 98765 43210"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 4: Optional Change Password */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
              <Lock size={13} className="text-slate-400" /> Change Login Password (Optional)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep default (demo123)"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 bg-white"
            />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl py-3.5 shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={18} />
              {submitting ? "Saving Profile..." : "Submit Personal Profile & Enter Portal →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
