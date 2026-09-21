import { useState, useRef, useEffect } from "react";
import {
  Search,
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  MoreVertical,
  Users,
  X,
  UserCheck,
  UserX,
  Trash2,
  Phone,
  Hash,
  MapPin,
  Wrench,
  Pencil,
  Cake,
  Home,
  BadgeCheck,
  GraduationCap,
  HeartPulse,
  Copy,
  CheckCircle2,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import api from "../api/axiosConfig";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { getStoredUsers, saveStoredUsers, getCitizens, saveCitizens } from "../data/mockData";

const ROLE_STYLES = {
  "Field Inspector": { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", avatar: "from-emerald-500 to-emerald-700" },
  "Engineer": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", avatar: "from-blue-500 to-blue-700" },
  "Authority": { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", avatar: "from-amber-500 to-amber-700" },
  "Citizen": { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", avatar: "from-purple-500 to-purple-700" },
};

const ROLES = ["ALL", "Field Inspector", "Engineer", "Authority", "Citizen"];
const ASSIGNABLE_ROLES = ["Field Inspector", "Engineer", "Authority"];
const GENDERS = ["Male", "Female", "Other"];

// Backend stores roles as enum names (FIELD_INSPECTOR); the UI displays
// "Field Inspector" etc. These two maps convert between the two everywhere
// we talk to the API.
const ROLE_TO_BACKEND = {
  "Field Inspector": "FIELD_INSPECTOR",
  "Engineer": "ENGINEER",
  "Authority": "AUTHORITY",
};
const ROLE_FROM_BACKEND = {
  FIELD_INSPECTOR: "Field Inspector",
  ENGINEER: "Engineer",
  AUTHORITY: "Authority",
  ADMIN: "Authority",
  CITIZEN: "Citizen",
};

// Maps a UserResponse from the backend into the shape this page's JSX expects
function fromBackend(u) {
  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    personalEmail: u.personalEmail || u.email,
    phone: u.phone || "",
    role: ROLE_FROM_BACKEND[u.role] || u.role,
    status: u.status || "ACTIVE",
    gender: u.gender || "",
    dob: u.dob || "",
    address: u.address || "",
    employeeId: u.employeeId || "",
    designation: u.designation || "",
    experience: u.experience || "",
    qualification: u.qualification || "",
    zone: u.zone || "",
    specialization: u.specialization || "",
    emergencyContactName: u.emergencyContactName || "",
    emergencyContactPhone: u.emergencyContactPhone || "",
  };
}

const EMPTY_FORM = {
  // Personal
  name: "",
  gender: "",
  dob: "",
  // Contact
  email: "",
  personalEmail: "",
  phone: "",
  address: "",
  // Professional
  role: "Field Inspector",
  employeeId: "",
  designation: "",
  experience: "",
  qualification: "",
  zone: "",
  specialization: "",
  // Emergency contact
  emergencyContactName: "",
  emergencyContactPhone: "",
};
 
export default function ManageUsers() {
  const { addNotification } = useData();
  const { user: currentUser } = useAuth();
 
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' | 'edit'
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  // When Add User hits a duplicate email, we offer a shortcut to edit that
  // existing user (e.g. change their role) instead of blocking outright.
  const [duplicateUser, setDuplicateUser] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
 
  // Deactivate / Remove requires a reason before it goes through
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'deactivate' | 'remove', user }
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
 
  // Full read-only details panel (Authority uses this to see an engineer's
  // complete profile at a glance)
  const [viewingUser, setViewingUser] = useState(null);

  // Email Dispatcher Modal state (pops up to confirm & send real email to personal inbox)
  const [emailDispatcherData, setEmailDispatcherData] = useState(null);

  function loadUsers() {
    setLoading(true);
    const storedCitizens = getCitizens().map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      personalEmail: c.personalEmail || c.email,
      phone: c.phone || "",
      role: "Citizen",
      status: c.status || "ACTIVE",
      district: c.district || "",
    }));

    const storedAll = getStoredUsers();
    const staffEmails = new Set(storedAll.map((s) => s.email?.toLowerCase()));
    const uniqueCitizens = storedCitizens.filter((c) => !staffEmails.has(c.email?.toLowerCase()));
    const localCombined = [...storedAll, ...uniqueCitizens];

    const token = localStorage.getItem("token");
    if (!token || token.startsWith("offline_token")) {
      setUsers(localCombined);
      setLoading(false);
      return;
    }
    api
      .get("/users")
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map(fromBackend);
          const userMap = new Map();
          localCombined.forEach((u) => {
            if (u.email) userMap.set(u.email.toLowerCase(), u);
          });
          mapped.forEach((m) => {
            if (m.email) {
              const existing = userMap.get(m.email.toLowerCase());
              userMap.set(m.email.toLowerCase(), { ...(existing || {}), ...m });
            }
          });
          const merged = Array.from(userMap.values());
          setUsers(merged);
          saveStoredUsers(merged);
        } else {
          setUsers(localCombined);
        }
      })
      .catch(() => {
        setUsers(localCombined);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  // Real-time: refetch whenever any user changes anywhere
  useEffect(() => {
    window.addEventListener("qg:usersChanged", loadUsers);
    return () => window.removeEventListener("qg:usersChanged", loadUsers);
  }, []);

  // Sync viewingUser details modal in real-time when users state changes
  useEffect(() => {
    if (viewingUser) {
      const latest = users.find(
        (u) =>
          u.id === viewingUser.id ||
          (u.email && u.email.toLowerCase() === viewingUser.email?.toLowerCase()) ||
          (u.officialEmail && u.officialEmail.toLowerCase() === viewingUser.officialEmail?.toLowerCase())
      );
      if (latest) {
        setViewingUser(latest);
      }
    }
  }, [users]);
 
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
 
  // Lock background page scroll when any modal is active
  useEffect(() => {
    if (showModal || viewingUser || confirmAction) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal, viewingUser, confirmAction]);

  function updateForm(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }
 
  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesQuery =
      !query ||
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase());
    return matchesRole && matchesQuery;
  });
 
  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
 
  function generateDefaultEmployeeId() {
    let maxNum = 0;
    try {
      if (Array.isArray(users)) {
        users.forEach((u) => {
          const empIdStr = String(u?.employeeId || u?.id || "");
          const match = empIdStr.match(/(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        });
      }
    } catch {}
    const nextNum = Math.max(9, maxNum + 1);
    const padded = String(nextNum).padStart(3, "0");
    return `DG-${padded}`;
  }

  function openModal(e) {
    if (e && e.preventDefault) e.preventDefault();
    setModalMode("add");
    setEditingUserId(null);
    let defaultId = "DG-009";
    try {
      defaultId = generateDefaultEmployeeId();
    } catch {}
    setForm({
      ...EMPTY_FORM,
      employeeId: defaultId,
    });
    setError("");
    setDuplicateUser(null);
    setShowModal(true);
  }
 
  function openEditModal(u) {
    setModalMode("edit");
    setEditingUserId(u.id);
    setForm({
      name: u.name || "",
      gender: u.gender || "",
      dob: u.dob || "",
      email: u.email || "",
      personalEmail: u.personalEmail || "",
      phone: u.phone || "",
      address: u.address || "",
      role: u.role || "Field Inspector",
      employeeId: u.employeeId || "",
      designation: u.designation || "",
      experience: u.experience || "",
      qualification: u.qualification || "",
      zone: u.zone || "",
      specialization: u.specialization || "",
      emergencyContactName: u.emergencyContactName || "",
      emergencyContactPhone: u.emergencyContactPhone || "",
    });
    setError("");
    setDuplicateUser(null);
    setOpenMenuId(null);
    setShowModal(true);
  }

  function handleViewUser(u) {
    const latest = getStoredUsers();
    const cleanEmail = (u?.email || "").toLowerCase();
    const cleanOfficial = (u?.officialEmail || "").toLowerCase();
    const match = latest.find(
      (lu) =>
        String(lu.id) === String(u.id) ||
        (lu.email && lu.email.toLowerCase() === cleanEmail) ||
        (lu.officialEmail && lu.officialEmail.toLowerCase() === cleanEmail) ||
        (lu.email && lu.email.toLowerCase() === cleanOfficial)
    );
    setViewingUser(match || u);
  }
 
  function buildUserPayload() {
    return {
      fullName: String(form.name || "").trim(),
      email: String(form.email || "").trim(),
      personalEmail: String(form.personalEmail || "").trim(),
      gender: form.gender || "",
      dob: form.dob || "",
      phone: String(form.phone || "").trim(),
      address: String(form.address || "").trim(),
      role: ROLE_TO_BACKEND[form.role] || form.role,
      employeeId: String(form.employeeId || "").trim(),
      designation: String(form.designation || "").trim(),
      experience: String(form.experience || "").trim(),
      qualification: String(form.qualification || "").trim(),
      emergencyContactName: String(form.emergencyContactName || "").trim(),
      emergencyContactPhone: String(form.emergencyContactPhone || "").trim(),
      ...((form.role === "Engineer" || form.role === "Field Inspector") && {
        zone: String(form.zone || "").trim(),
      }),
      ...(form.role === "Engineer" && {
        specialization: String(form.specialization || "").trim(),
      }),
    };
  }

  function handleSubmitUser(e) {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setDuplicateUser(null);

    const name = String(form.name || "").trim();
    const officialEmail = String(form.email || "").trim().toLowerCase();
    let personalEmail = String(form.personalEmail || "").trim().toLowerCase();
    let phone = String(form.phone || "").trim();

    if (!name || !officialEmail) {
      setError("Please enter the user's Full Name and Official Email address.");
      return;
    }

    if (!officialEmail.includes("@")) {
      setError("Please enter a valid official email address.");
      return;
    }

    // Auto-fill personal email if left empty
    if (!personalEmail) {
      personalEmail = officialEmail;
    }

    // Auto-fill phone if left empty
    if (!phone) {
      phone = "+91 98400 12345";
    }

    const cleanEmpId = String(form.employeeId || "").trim().toLowerCase();
    const cleanOfficialEmail = officialEmail;
    const cleanPersonalEmail = personalEmail;
    const cleanPhoneDigits = phone.replace(/\D/g, "");

    // 1. STRICT EMPLOYEE ID DUPLICATE CHECK
    if (cleanEmpId) {
      const existingEmpId = users.find(
        (u) =>
          u.id !== editingUserId &&
          (
            (u.employeeId && String(u.employeeId).trim().toLowerCase() === cleanEmpId) ||
            (u.id && String(u.id).toLowerCase() === cleanEmpId)
          )
      );
      if (existingEmpId) {
        setError(`⚠️ Employee ID "${String(form.employeeId).trim()}" already exists in the system for staff member ${existingEmpId.name} (${existingEmpId.role || 'Staff'}). Please enter a unique Employee ID.`);
        setDuplicateUser(existingEmpId);
        return;
      }
    }

    // 2. STRICT OFFICIAL EMAIL DUPLICATE CHECK
    const existingOfficialEmail = users.find(
      (u) =>
        u.id !== editingUserId &&
        u.email &&
        String(u.email).toLowerCase() === cleanOfficialEmail
    );
    if (existingOfficialEmail) {
      setError(`⚠️ Official Email "${officialEmail}" already exists in the system for staff member ${existingOfficialEmail.name}.`);
      setDuplicateUser(existingOfficialEmail);
      return;
    }

    const fromEmail = "disasterguard26@gmail.com";
    const appPass = "hsruqaxyanfijnav"; // App password without spaces
    const assignedEmpId = String(form.employeeId || "").trim() || "DG-009";
    const loginUrl = `${window.location.origin}/login`;
    const subject = `DisasterGuard AI — Official Appointment & Onboarding Invitation for ${name} (${assignedEmpId})`;
    
    const bodyText = `Dear ${name},

Congratulations! You have been officially invited and appointed to join DisasterGuard AI as a ${form.role}.

YOUR OFFICIAL ASSIGNMENT & LOGIN CREDENTIALS:
--------------------------------------------------
• Full Name: ${name}
• Assigned Employee ID: ${assignedEmpId}
• Assigned Role: ${form.role}
• Official Staff Email (Portal Login ID): ${cleanOfficialEmail}
• Personal Email Address: ${cleanPersonalEmail}
• Default Portal Password: demo123
${form.designation.trim() ? `• Designation: ${form.designation.trim()}\n` : ""}${form.zone.trim() ? `• Assigned Zone: ${form.zone.trim()}\n` : ""}
CLICK TO LOG IN & COMPLETE YOUR PROFILE:
--------------------------------------------------
Portal Direct Login Link: ${loginUrl}

ACTION REQUIRED UPON FIRST LOGIN:
1. Open the DisasterGuard AI Portal Link: ${loginUrl}
2. Log in using your Official Email (${cleanOfficialEmail}) and Password (demo123).
3. Upon your first login, the portal will prompt you to complete your personal profile details (Gender, Date of Birth, Residential Address, Educational Qualification, and Emergency Contact).

Welcome to DisasterGuard AI!

Best regards,
DisasterGuard AI Response Directorate
Disaster Management Authority
From: ${fromEmail}`;

    // Real Onboarding Email Dispatcher function with FROM: disasterguard26@gmail.com
    const sendRealOnboardingEmail = () => {
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #059669, #2563eb); padding: 20px; border-radius: 10px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 22px;">DisasterGuard AI</h2>
            <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Official Staff Onboarding & Appointment Invitation</p>
          </div>
          <div style="padding: 20px 10px; color: #334155; line-height: 1.6;">
            <p style="font-size: 16px; font-weight: bold; color: #0f172a;">Dear ${name},</p>
            <p>You have been officially invited and appointed to join the <strong>DisasterGuard AI Structural Safety Response Team</strong> as a <strong>${form.role}</strong>.</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 6px;">
              <h3 style="margin-top: 0; color: #0f766e; font-size: 15px;">Your Official Credentials & Assignment:</h3>
              <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #1e293b;">
                <li><strong>Full Name:</strong> ${name}</li>
                <li><strong>Assigned Employee ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #047857; background: #e6f4ea; padding: 2px 6px; border-radius: 4px;">${assignedEmpId}</span></li>
                <li><strong>Assigned Role:</strong> ${form.role}</li>
                <li><strong>Official Staff Email:</strong> ${cleanOfficialEmail}</li>
                <li><strong>Personal Email:</strong> ${cleanPersonalEmail}</li>
                <li><strong>Default Login Password:</strong> <span style="font-family: monospace; font-weight: bold; color: #2563eb;">demo123</span></li>
              </ul>
            </div>

            <!-- Direct Clickable Portal Login Button -->
            <div style="text-align: center; margin: 25px 0;">
              <a href="${loginUrl}" target="_blank" style="background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                🔑 Click Here to Log In & Complete Profile
              </a>
              <p style="margin-top: 8px; font-size: 12px; color: #64748b;">
                Direct Portal Link: <a href="${loginUrl}" style="color: #2563eb;">${loginUrl}</a>
              </p>
            </div>

            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px;">📋 Action Required — Fill Personal Details Upon Login:</h4>
              <p style="margin: 0; font-size: 13px; color: #1e3a8a;">
                Please log into the <strong>DisasterGuard AI Portal</strong> using your Official Email (<code>${cleanOfficialEmail}</code>) and Password (<code>demo123</code>). Upon your first login, the portal will prompt you to fill in your personal details (Gender, Date of Birth, Residential Address, Educational Qualification, and Emergency Contact).
              </p>
            </div>

            <p style="font-size: 14px; color: #475569;">Welcome to DisasterGuard AI!</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
              Sent automatically by <strong>DisasterGuard AI Authority</strong> (<code>${fromEmail}</code>)
            </p>
          </div>
        </div>
      `;

      // 1. Dispatch Real Gmail SMTP Email via Local Node Email Server (http://localhost:5000/api/send-email)
      fetch("http://localhost:5000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: cleanPersonalEmail,
          subject: subject,
          body: bodyText,
          html: htmlBody,
        })
      })
      .then((res) => res.json())
      .then((data) => console.log("✅ Gmail SMTP Real Delivery Result:", data))
      .catch((err) => console.error("Gmail SMTP Local Dispatch Error:", err));

      // 2. Dispatch Direct SMTPJS Email from disasterguard26@gmail.com
      try {
        if (window.Email && window.Email.send) {
          window.Email.send({
            Host: "smtp.gmail.com",
            Username: fromEmail,
            Password: appPass,
            To: cleanPersonalEmail,
            From: `DisasterGuard AI <${fromEmail}>`,
            Subject: subject,
            Body: htmlBody,
          }).catch(() => {});
        }
      } catch {}

      // 2. Dispatch FormSubmit.co API with reply-to disasterguard26@gmail.com
      fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cleanPersonalEmail)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: subject,
          _replyto: fromEmail,
          "From Email": fromEmail,
          "Recipient Name": name,
          "Assigned Role": form.role,
          "Employee ID": assignedEmpId,
          "Official Staff Email": cleanOfficialEmail,
          "Personal Email": cleanPersonalEmail,
          "Default Password": "demo123",
          message: bodyText
        })
      }).catch(() => {});

      // Web3Forms fallback optional
      try {
        if (window.Web3Forms) {
          fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              access_key: "6f52e252-9445-4c07-9b2f-7c15e8b4e72a",
              to_email: cleanPersonalEmail,
              from_name: `DisasterGuard AI (${fromEmail})`,
              subject: subject,
              name: name,
              message: bodyText,
            })
          }).catch(() => {});
        }
      } catch {}

      // 4. Open Gmail Web Compose tab directly with FROM disasterguard26@gmail.com pre-filled
      try {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(cleanPersonalEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
        window.open(gmailUrl, "_blank");
      } catch {}
    };

    // Dispatch real email client trigger to personal email
    sendRealOnboardingEmail();

    if (modalMode === "add") {
      const newUser = {
        id: 'u_' + Date.now(),
        name,
        email: cleanOfficialEmail,
        personalEmail: cleanPersonalEmail,
        phone,
        role: form.role,
        status: "ACTIVE",
        password: "demo123",
        ...form,
        employeeId: form.employeeId.trim() || generateDefaultEmployeeId(),
        isNewUser: true,
        profileCompleted: false,
      };

      // 1. Immediately update UI state & local persistence cleanly
      const currentStaff = getStoredUsers().filter((u) => u.role !== "Citizen");
      const updatedStaff = [newUser, ...currentStaff.filter((u) => u.email?.toLowerCase() !== cleanOfficialEmail)];
      saveStoredUsers(updatedStaff);

      const storedCitizens = getCitizens().map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        personalEmail: c.personalEmail || c.email,
        phone: c.phone || "",
        role: "Citizen",
        status: c.status || "ACTIVE",
        district: c.district || "",
      }));

      setUsers([...updatedStaff, ...storedCitizens]);

      // 2. Dispatch custom event for real-time app update
      window.dispatchEvent(new CustomEvent("qg:usersChanged"));

      // 3. Notify in-app system
      if (addNotification) {
        addNotification({
          type: "success",
          title: `Staff Added: ${name}`,
          meta: `Assigned as ${form.role} (${cleanOfficialEmail})`,
          roles: ["Authority"]
        });
      }

      // 4. Close modal, set email dispatcher modal & show toast immediately
      setShowModal(false);
      setEmailDispatcherData({
        name,
        officialEmail: cleanOfficialEmail,
        personalEmail: cleanPersonalEmail,
        role: form.role,
        employeeId: newUser.employeeId,
        subject,
        bodyText,
      });
      showToast(`✓ Staff member ${name} (${newUser.employeeId}) added successfully!`, "success");

      // 5. Non-blocking API sync
      const token = localStorage.getItem("token");
      if (token && !token.startsWith("offline_token")) {
        api.post("/users", buildUserPayload()).catch(() => {});
      }
      return;
    }
 
    // Edit mode
    const previousUser = users.find((u) => u.id === editingUserId);
    const roleChanged = previousUser && previousUser.role !== form.role;

    const updatedUserObj = {
      ...previousUser,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      personalEmail: form.personalEmail.trim().toLowerCase(),
      phone: form.phone.trim(),
      role: form.role,
      gender: form.gender,
      dob: form.dob,
      address: form.address,
      employeeId: form.employeeId,
      designation: form.designation,
      experience: form.experience,
      qualification: form.qualification,
      zone: form.zone,
      specialization: form.specialization,
      emergencyContactName: form.emergencyContactName,
      emergencyContactPhone: form.emergencyContactPhone,
    };

    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === editingUserId ? updatedUserObj : u));
      saveStoredUsers(updated);
      return updated;
    });

    if (roleChanged) {
      addNotification({
        type: "info",
        title: `Your role has been updated to ${form.role}.`,
        meta: `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        recipientId: editingUserId,
      });
    }

    setShowModal(false);
  }
 
  // Activating is a simple, no-reason-needed action.
  // Deactivating needs a reason, so it routes through the confirm modal.
  function toggleStatus(id) {
    const u = users.find((x) => x.id === id);
    setOpenMenuId(null);
 
    if (!u) return;
 
    if (u.status === "ACTIVE") {
      setConfirmAction({ type: "deactivate", user: u });
      setReason("");
      setReasonError("");
    } else {
      api
        .patch(`/users/${id}/status`, { status: "ACTIVE" })
        .then(() => {
          setUsers((prev) =>
            prev.map((x) => (x.id === id ? { ...x, status: "ACTIVE" } : x))
          );
          addNotification({
            type: "success",
            title: "Your account has been reactivated.",
            meta: `Just now | ${currentUser?.name || "Authority"}`,
            recipientId: id,
          });
        })
        .catch((err) => console.error("Could not reactivate user:", err));
    }
  }
 
  function handleRemove(id) {
    const u = users.find((x) => x.id === id);
    setOpenMenuId(null);
    if (!u) return;
    setConfirmAction({ type: "remove", user: u });
    setReason("");
    setReasonError("");
  }
 
  function confirmReasonAction() {
    if (!reason.trim()) {
      setReasonError("Please enter a valid reason for account action.");
      return;
    }

    const { type, user: targetUser } = confirmAction;

    // Dispatch official email notification to personal email address with reason given by Authority
    api.post("/auth/send-deletion-email", {
      personalEmail: targetUser.personalEmail || targetUser.email,
      officialEmail: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      action: type,
      reason: reason.trim(),
      assignedBy: currentUser?.name || "Authority Admin",
    }).catch(() => {});

    if (type === "deactivate") {
      api
        .patch(`/users/${targetUser.id}/status`, {
          status: "INACTIVE",
          reason: reason.trim(),
        })
        .catch(() => {});

      setUsers((prev) => {
        const updated = prev.map((x) =>
          x.id === targetUser.id ? { ...x, status: "INACTIVE" } : x
        );
        if (targetUser.role === "Citizen") {
          const updatedCitizens = getCitizens().map((c) =>
            c.id === targetUser.id || c.email?.toLowerCase() === targetUser.email?.toLowerCase()
              ? { ...c, status: "INACTIVE" }
              : c
          );
          saveCitizens(updatedCitizens);
        } else {
          saveStoredUsers(updated.filter((u) => u.role !== "Citizen"));
        }
        return updated;
      });

      addNotification({
        type: "warning",
        title: `Your account has been deactivated. Reason: ${reason.trim()}`,
        meta: `Just now | ${currentUser?.name || "Authority"}`,
        recipientId: targetUser.id,
      });
      setConfirmAction(null);
      setReason("");
    } else if (type === "remove") {
      api.delete(`/users/${targetUser.id}`).catch(() => {});

      setUsers((prev) => {
        const updated = prev.filter((x) => x.id !== targetUser.id);
        if (targetUser.role === "Citizen") {
          const updatedCitizens = getCitizens().filter(
            (c) => c.id !== targetUser.id && c.email?.toLowerCase() !== targetUser.email?.toLowerCase()
          );
          saveCitizens(updatedCitizens);
        } else {
          saveStoredUsers(updated.filter((u) => u.role !== "Citizen"));
        }
        return updated;
      });

      addNotification({
        type: "critical",
        title: `Your account has been removed. Reason: ${reason.trim()}`,
        meta: `Just now | ${currentUser?.name || "Authority"}`,
        recipientId: targetUser.id,
      });
      setConfirmAction(null);
      setReason("");
    }
  }
 
  return (
    <div className="h-full overflow-y-auto bg-[#F3FAF5] relative">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} users registered`}
      />
 
      <div className="p-5 sm:p-8 max-w-7xl mx-auto flex flex-col gap-6 pb-24">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-emerald-100 rounded-xl px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Total Users</p>
            <p className="text-2xl font-bold text-slate-900 font-mono mt-1">{users.length}</p>
          </div>
          <div className="bg-white border border-emerald-100 rounded-xl px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Active</p>
            <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">{activeCount}</p>
          </div>
          <div className="bg-white border border-emerald-100 rounded-xl px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Roles</p>
            <p className="text-2xl font-bold text-blue-600 font-mono mt-1">{ASSIGNABLE_ROLES.length}</p>
          </div>
          <div className="bg-white border border-emerald-100 rounded-xl px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Inactive</p>
            <p className="text-2xl font-bold text-red-500 font-mono mt-1">{users.length - activeCount}</p>
          </div>
        </div>
 
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 bg-white border border-emerald-100 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-emerald-400 transition-all flex-1 sm:max-w-sm">
            <Search size={16} className="text-emerald-600 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>
 
          <button
            type="button"
            onClick={openModal}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-all active:scale-[0.98] shrink-0 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>
 
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                roleFilter === r
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-emerald-100 text-slate-600 hover:bg-emerald-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
 
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="bg-white border border-emerald-100 rounded-xl py-12 text-center">
              <Users size={28} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No users found.</p>
            </div>
          ) : (
            filtered.map((u) => {
              const style = ROLE_STYLES[u.role] || ROLE_STYLES["Field Inspector"];
              return (
                <div
                  key={u.id}
                  className={`group bg-white hover:border-emerald-300 border border-emerald-100 rounded-xl px-5 py-4 flex items-center justify-between gap-4 transition-all duration-200 relative ${
                    u.status === "INACTIVE" ? "opacity-60" : ""
                  }`}
                >
                  <div
                    onClick={() => handleViewUser(u)}
                    className="flex items-center gap-4 min-w-0 cursor-pointer"
                  >
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${style.avatar} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                    >
                      {u.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate hover:text-emerald-600 transition-colors">{u.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 truncate flex-wrap">
                        <Mail size={11} className="shrink-0" />
                        {u.email}
                        {u.phone && (
                          <>
                            <span className="text-slate-300">•</span>
                            <Phone size={11} className="shrink-0" />
                            {u.phone}
                          </>
                        )}
                      </div>
                      {(u.employeeId || u.designation || u.experience || u.zone || u.specialization) && (
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                          {u.employeeId && (
                            <span className="flex items-center gap-1">
                              <Hash size={10} /> {u.employeeId}
                            </span>
                          )}
                          {u.designation && (
                            <span className="flex items-center gap-1">
                              <BadgeCheck size={10} /> {u.designation}
                            </span>
                          )}
                          {u.experience && (
                            <span className="flex items-center gap-1">
                              {u.experience} yrs exp
                            </span>
                          )}
                          {u.zone && (
                            <span className="flex items-center gap-1">
                              <MapPin size={10} /> {u.zone}
                            </span>
                          )}
                          {u.specialization && (
                            <span className="flex items-center gap-1">
                              <Wrench size={10} /> {u.specialization}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
 
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`hidden sm:flex items-center gap-1.5 text-[11px] font-mono font-semibold px-3 py-1.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
                    >
                      <Shield size={11} />
                      {u.role}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border ${
                        u.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-red-50 text-red-600 border-red-200"
                      }`}
                    >
                      {u.status}
                    </span>
 
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                        className="w-8 h-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <MoreVertical size={15} />
                      </button>
 
                      {openMenuId === u.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-9 z-10 w-48 bg-white border border-emerald-100 rounded-xl shadow-lg py-1.5"
                        >
                          <button
                            onClick={() => {
                              setViewingUser(u);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Users size={14} className="text-emerald-500" />
                            View Details
                          </button>
                          <button
                            onClick={() => openEditModal(u)}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Pencil size={14} className="text-blue-500" />
                            Edit User
                          </button>
                          <button
                            onClick={() => toggleStatus(u.id)}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 transition-colors"
                          >
                            {u.status === "ACTIVE" ? (
                              <>
                                <UserX size={14} className="text-red-500" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck size={14} className="text-emerald-500" />
                                Activate
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRemove(u.id)}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                            Remove User
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
 
      {/* Add / Edit User modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto overscroll-contain"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-auto bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto overscroll-contain border border-slate-100"
          >
            <div className="flex items-center justify-between pb-3 mb-4 sticky top-0 bg-white z-20 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === "edit" ? "Edit User" : "Add New User"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
 
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitUser(); }} className="flex flex-col gap-5">
              {/* Section 1: Authority Assignment Details */}
              <div className="flex flex-col gap-4">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                  <ShieldCheck size={14} /> Official Staff Assignment (Authority Input)
                </p>

                {/* 1. Full Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1 block">
                    1. Employee Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="e.g. Karthick R"
                    className="w-full border border-emerald-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400 text-sm text-slate-800"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 2. Employee ID */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      2. Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.employeeId}
                      onChange={(e) => updateForm("employeeId", e.target.value)}
                      placeholder="e.g. DG-009"
                      className="w-full border border-emerald-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-mono text-slate-800"
                      required
                    />
                  </div>

                  {/* 3. Post / Designation */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      3. Post / Designation <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.designation}
                      onChange={(e) => updateForm("designation", e.target.value)}
                      placeholder="e.g. Senior Structural Engineer"
                      className="w-full border border-emerald-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400 text-sm text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 4. Official Email */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      4. Official Email (Portal Login) <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.email}
                      disabled={modalMode === "edit"}
                      onChange={(e) => updateForm("email", e.target.value)}
                      placeholder="e.g. karthik@disasterguard.org"
                      className={`w-full border border-emerald-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400 text-sm text-slate-800 ${
                        modalMode === "edit" ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""
                      }`}
                      required
                    />
                  </div>

                  {/* 5. Personal Email */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      5. Personal Email (Onboarding Mail) <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.personalEmail}
                      onChange={(e) => updateForm("personalEmail", e.target.value)}
                      placeholder="e.g. karthik.personal@gmail.com"
                      className="w-full border border-emerald-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400 text-sm text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 6. Role */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">
                      6. Role of the User <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) => updateForm("role", e.target.value)}
                      className="w-full border border-emerald-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-semibold text-slate-800 bg-white"
                      required
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">Mobile Phone Number</label>
                    <input
                      value={form.phone}
                      onChange={(e) => updateForm("phone", e.target.value)}
                      placeholder="e.g. 98765 43210"
                      className="w-full border border-emerald-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400 text-sm text-slate-800"
                    />
                  </div>
                </div>

                {(form.role === "Engineer" || form.role === "Field Inspector") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Assigned Zone / Area</label>
                      <input
                        value={form.zone}
                        onChange={(e) => updateForm("zone", e.target.value)}
                        placeholder="e.g. Zone B"
                        className="w-full border border-emerald-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400 text-sm text-slate-800"
                      />
                    </div>
                    {form.role === "Engineer" && (
                      <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">Specialization</label>
                        <input
                          value={form.specialization}
                          onChange={(e) => updateForm("specialization", e.target.value)}
                          placeholder="e.g. Structural Engineering"
                          className="w-full border border-emerald-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400 text-sm text-slate-800"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-red-500 font-medium">{error}</p>
                  {duplicateUser && (
                    <button
                      onClick={() => openEditModal(duplicateUser)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 text-left underline"
                    >
                      Edit {duplicateUser.name}'s account instead (change role, etc.)
                    </button>
                  )}
                </div>
              )}

              <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-slate-100 mt-2 z-10">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl py-3.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  {modalMode === "edit" ? "Save Changes" : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
 
      {/* Deactivate / Remove reason modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {confirmAction.type === "deactivate" ? "Deactivate Account" : "Remove Account"}
              </h3>
              <button
                onClick={() => setConfirmAction(null)}
                className="w-8 h-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-2">
              {confirmAction.type === "deactivate" ? "Deactivating" : "Permanently Removing"}{" "}
              <span className="font-semibold text-slate-900">{confirmAction.user.name}</span> ({confirmAction.user.role}).
            </p>
            <p className="text-xs text-slate-500 mb-4 bg-slate-50 border border-slate-200 rounded-lg p-2.5 leading-relaxed">
              An official email notification will be dispatched to their personal email address (<strong className="text-emerald-700">{confirmAction.user.personalEmail || confirmAction.user.email}</strong>) containing the valid reason submitted below.
            </p>

            <label className="text-xs font-bold text-slate-600 mb-1.5 block uppercase tracking-wide">
              Mandatory Action Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError("");
              }}
              rows={3}
              placeholder="e.g. Employee resigned from department / Account flagged per official audit..."
              className="w-full border border-emerald-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-400 text-sm text-slate-800 resize-none"
            />
            {reasonError && <p className="text-xs text-red-500 font-medium mt-1.5">{reasonError}</p>}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 border border-emerald-100 text-slate-600 hover:bg-emerald-50 font-semibold text-sm rounded-xl py-2.5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReasonAction}
                className={`flex-1 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors ${
                  confirmAction.type === "remove"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                {confirmAction.type === "deactivate" ? "Deactivate & Send Email" : "Remove & Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Full Details view panel */}
      {viewingUser && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setViewingUser(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                    (ROLE_STYLES[viewingUser.role] || ROLE_STYLES["Field Inspector"]).avatar
                  } flex items-center justify-center text-white font-bold text-base shrink-0`}
                >
                  {viewingUser.name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{viewingUser.name}</h3>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border mt-0.5 ${
                      (ROLE_STYLES[viewingUser.role] || ROLE_STYLES["Field Inspector"]).bg
                    } ${(ROLE_STYLES[viewingUser.role] || ROLE_STYLES["Field Inspector"]).text} ${
                      (ROLE_STYLES[viewingUser.role] || ROLE_STYLES["Field Inspector"]).border
                    }`}
                  >
                    <Shield size={11} />
                    {viewingUser.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="w-8 h-8 rounded-lg hover:bg-emerald-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
 
            <div className="flex flex-col gap-5">
              {/* Onboarding Status Badge */}
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                viewingUser.profileCompleted || (viewingUser.dob && viewingUser.address)
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                <span>Onboarding Profile Status:</span>
                <span className="font-bold flex items-center gap-1">
                  {viewingUser.profileCompleted || (viewingUser.dob && viewingUser.address) ? (
                    <>✓ Profile Fully Completed ({viewingUser.profileCompletedAt || 'Active'})</>
                  ) : (
                    <>⏳ Onboarding Pending (First-Time User Setup Required)</>
                  )}
                </span>
              </div>
 
              {/* Personal Details */}
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2.5">Personal Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailField label="Gender" value={viewingUser.gender} />
                  <DetailField label="Date of Birth" value={viewingUser.dob} />
                </div>
              </div>
 
              {/* Contact Details */}
              <div className="border-t border-emerald-100 pt-4">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2.5">Contact Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailField label="Official Email" value={viewingUser.email} icon={Mail} />
                  <DetailField label="Personal Email" value={viewingUser.personalEmail} icon={Mail} />
                  <DetailField label="Phone" value={viewingUser.phone} icon={Phone} />
                  <DetailField label="Address" value={viewingUser.address} icon={Home} />
                </div>
              </div>
 
              {/* Professional Details (Staff Only - Hidden for Citizens) */}
              {viewingUser.role !== "Citizen" && viewingUser.role !== "CITIZEN" && (
                <div className="border-t border-emerald-100 pt-4">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2.5">Professional Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <DetailField label="Employee ID" value={viewingUser.employeeId || viewingUser.id} icon={Hash} />
                    <DetailField label="Designation / Post" value={viewingUser.designation} icon={BadgeCheck} />
                    <DetailField label="Experience" value={viewingUser.experience ? `${viewingUser.experience} years` : ""} />
                    <DetailField label="Qualification" value={viewingUser.qualification} icon={GraduationCap} />
                    <DetailField label="Zone / Area" value={viewingUser.zone} icon={MapPin} />
                    <DetailField label="Specialization" value={viewingUser.specialization} icon={Wrench} />
                  </div>
                </div>
              )}
 
              {/* Emergency Contact */}
              <div className="border-t border-emerald-100 pt-4">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2.5 flex items-center gap-1">
                  <HeartPulse size={12} /> Emergency Contact
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailField label="Contact Person Name" value={viewingUser.emergencyContactName} />
                  <DetailField label="Emergency Phone" value={viewingUser.emergencyContactPhone} icon={Phone} />
                </div>
              </div>
 
              <div className="flex gap-3 border-t border-emerald-100 pt-4">
                <button
                  onClick={() => setViewingUser(null)}
                  className="flex-1 border border-emerald-100 text-slate-600 hover:bg-emerald-50 font-semibold text-sm rounded-xl py-2.5 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const u = viewingUser;
                    setViewingUser(null);
                    openEditModal(u);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors flex items-center justify-center gap-2"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Email Dispatcher Modal */}
      {emailDispatcherData && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setEmailDispatcherData(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-emerald-100 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <Mail size={22} />
                <h3 className="text-lg font-bold text-slate-900">
                  Send Onboarding Email to Personal Inbox
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEmailDispatcherData(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 leading-relaxed">
                <p className="font-bold text-sm text-emerald-950 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Staff Member Registered: {emailDispatcherData.name} ({emailDispatcherData.employeeId})
                </p>
                <p className="text-slate-600 mt-1">
                  Invitation email queued for personal email address: <strong className="text-emerald-700 underline">{emailDispatcherData.personalEmail}</strong>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 font-mono flex flex-col gap-1 max-h-36 overflow-y-auto">
                <p className="font-bold text-slate-900">Preview Onboarding Letter:</p>
                <p className="whitespace-pre-wrap text-slate-600">{emailDispatcherData.bodyText}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailDispatcherData.personalEmail)}&su=${encodeURIComponent(emailDispatcherData.subject)}&body=${encodeURIComponent(emailDispatcherData.bodyText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95 text-center"
                >
                  <Mail size={16} />
                  Open Gmail & Send to Inbox
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(emailDispatcherData.bodyText);
                    showToast("✓ Onboarding letter copied to clipboard!", "success");
                  }}
                  className="flex-1 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Copy size={16} />
                  Copy Invitation Text
                </button>
              </div>

              <button
                type="button"
                onClick={() => setEmailDispatcherData(null)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 text-center py-1 font-semibold cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
function DetailField({ label, value, icon: Icon }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-slate-800 flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-slate-400 shrink-0" />}
        {value ? value : <span className="text-slate-300">Not provided</span>}
      </p>
    </div>
  );
}
 