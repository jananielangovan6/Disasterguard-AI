import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  HeartPulse,
  Save,
  CheckCircle2,
  Lock,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { getStoredUsers, saveStoredUsers, setCurrentUser } from "../data/mockData";

export default function UserProfile() {
  const { user, setUser } = useAuth();
  const { showToast } = useData() || {};

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [designation, setDesignation] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [zone, setZone] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch latest user data from local storage
    const storedUsers = getStoredUsers();
    const cleanEmail = (user.email || "").toLowerCase();
    const currentMatch =
      storedUsers.find(
        (u) =>
          (u.id && String(u.id) === String(user.id)) ||
          (u.email && u.email.toLowerCase() === cleanEmail) ||
          (u.officialEmail && u.officialEmail.toLowerCase() === cleanEmail)
      ) || user;

    setName(currentMatch.name || user.name || "");
    setEmail(currentMatch.email || currentMatch.officialEmail || user.email || "");
    setPersonalEmail(currentMatch.personalEmail || user.personalEmail || "");
    setPhone(currentMatch.phone || user.phone || "");
    setGender(currentMatch.gender || user.gender || "");
    setDob(currentMatch.dob || user.dob || "");
    setAddress(currentMatch.address || user.address || "");
    setQualification(currentMatch.qualification || user.qualification || "");
    setExperience(currentMatch.experience || user.experience || "");
    setDesignation(currentMatch.designation || user.designation || "");
    setSpecialization(currentMatch.specialization || user.specialization || "");
    setZone(currentMatch.zone || user.zone || "");
    setEmergencyContactName(currentMatch.emergencyContactName || user.emergencyContactName || "");
    setEmergencyContactPhone(currentMatch.emergencyContactPhone || user.emergencyContactPhone || "");
  }, [user]);

  function handleSaveProfile(e) {
    if (e && e.preventDefault) e.preventDefault();
    setSaving(true);

    const cleanEmail = (user?.email || "").toLowerCase();
    const storedUsers = getStoredUsers();

    let found = false;
    const updatedUsers = storedUsers.map((u) => {
      if (
        (u.id && String(u.id) === String(user?.id)) ||
        (u.email && u.email.toLowerCase() === cleanEmail) ||
        (u.officialEmail && u.officialEmail.toLowerCase() === cleanEmail)
      ) {
        found = true;
        return {
          ...u,
          name: name.trim(),
          phone: phone.trim(),
          personalEmail: personalEmail.trim(),
          gender: gender || "Not Specified",
          dob: dob || "Not Specified",
          address: address.trim(),
          qualification: qualification.trim(),
          experience: experience.trim(),
          designation: designation.trim(),
          specialization: specialization.trim(),
          zone: zone.trim(),
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
          ...(newPassword ? { password: newPassword } : {}),
          profileCompleted: true,
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    if (!found && user) {
      updatedUsers.push({
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        personalEmail: personalEmail.trim(),
        gender: gender || "Not Specified",
        dob: dob || "Not Specified",
        address: address.trim(),
        qualification: qualification.trim(),
        experience: experience.trim(),
        designation: designation.trim(),
        specialization: specialization.trim(),
        zone: zone.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        ...(newPassword ? { password: newPassword } : {}),
        profileCompleted: true,
        updatedAt: new Date().toISOString(),
      });
    }

    saveStoredUsers(updatedUsers);

    // Update active user session state
    const updatedSessionUser = {
      ...user,
      name: name.trim(),
      phone: phone.trim(),
      personalEmail: personalEmail.trim(),
      gender: gender || "Not Specified",
      dob: dob || "Not Specified",
      address: address.trim(),
      qualification: qualification.trim(),
      experience: experience.trim(),
      designation: designation.trim(),
      specialization: specialization.trim(),
      zone: zone.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      profileCompleted: true,
    };

    setCurrentUser(updatedSessionUser);
    setUser(updatedSessionUser);

    // Dispatch real-time event for Authority Manage Users screen
    window.dispatchEvent(new Event("qg:usersChanged"));

    setSaving(false);
    setNewPassword("");
    if (showToast) {
      showToast("🎉 Profile & personal details updated successfully! Synchronized with Admin User Database.", "success");
    }
  }

  const roleStr = user?.sessionRole || user?.role || "Staff Member";
  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F3FAF5] pb-12">
      <PageHeader
        title="My Profile & Personal Details"
        subtitle="Manage your personal information, contact details, and emergency preferences"
      />

      <main className="max-w-5xl mx-auto px-6 py-8">
        
        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 mb-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-500/20 shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{name || "User Profile"}</h1>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {roleStr}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>Employee ID: <strong>{user?.employeeId || "DG-STAFF"}</strong></span>
                <span>•</span>
                <span>Official Email: <strong>{email}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-xs text-emerald-800 font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600" /> Account Active & Verified
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* Section 1: Basic & Personal Info */}
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <User size={16} /> Personal Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Official Work Email</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Personal Email</label>
                <input
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  placeholder="e.g. personal@gmail.com"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Residential Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter complete door no, street name, locality, city, pincode"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Section 2: Professional Details (Staff Only) */}
          {!(roleStr === "Citizen" || roleStr === "CITIZEN" || roleStr === "Public") && (
            <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Briefcase size={16} /> Professional Profile
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Educational Qualification</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. M.Tech Structural Engineering (IIT Madras)"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Years of Experience</label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 8 Years"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Job Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Structural Auditor"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Specialization / Expertise</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Seismic Retrofitting & Foundation Audits"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Assigned Zone</label>
                  <input
                    type="text"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="e.g. Zone B (Coimbatore North)"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Emergency Contacts */}
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <HeartPulse size={16} /> Emergency Contact
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Emergency Contact Name & Relation</label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Senthil Kumar (Spouse)"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Emergency Contact Phone Number</label>
                <input
                  type="text"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="e.g. +91 94440 88776"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Password Security */}
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock size={16} /> Login Password (Optional Change)
            </h2>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep your current password"
                className="w-full sm:w-1/2 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl px-6 py-3 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save size={18} />
              {saving ? "Saving Changes..." : "Save Profile Details →"}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
