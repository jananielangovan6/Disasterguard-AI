import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck, ArrowLeft, User, Wrench, Shield, Mail, CheckCircle,
  X, Headphones, Globe, Phone, MapPin, Send, MessageSquare, AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getStoredUsers, saveSupportMessage, getCitizens } from "../data/mockData";
import { useData } from "../context/DataContext";
import axios from "../api/axiosConfig";

const ROLE_LABELS = {
  FIELD_INSPECTOR: "Field Inspector",
  ENGINEER: "Engineer",
  AI_OPERATOR: "Engineer",
  AUTHORITY: "Authority",
  ADMIN: "Authority",
  CITIZEN: "Public",
};

const ROLE_ICONS = {
  "Field Inspector": User,
  Engineer: Wrench,
  Authority: Shield,
  Public: Globe,
};

const ROLE_COLORS = {
  "Field Inspector": "text-emerald-700 bg-emerald-50 border-emerald-300",
  Engineer: "text-blue-700 bg-blue-50 border-blue-300",
  Authority: "text-amber-700 bg-amber-50 border-amber-300",
  Public: "text-slate-600 bg-slate-100 border-slate-300",
};

const HARDCODED_STAFF_ROLES = {
  "admin@disasterguard.org": "Authority",
  "swetha@disasterguard.org": "Engineer",
  "karthik@disasterguard.org": "Engineer",
  "divya@disasterguard.org": "Engineer",
  "arjun@disasterguard.org": "Engineer",
  "meena@disasterguard.org": "Engineer",
  "janani@disasterguard.org": "Field Inspector",
  "dhiyana@disasterguard.org": "Field Inspector",
};

export default function Login() {
  const { login } = useAuth();
  const { addNotification } = useData();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState("input");
  const [forgotError, setForgotError] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showHelp, setShowHelp] = useState(false);
  const [helpTab, setHelpTab] = useState("contacts"); // "contacts" | "form"
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportMsg, setSupportMsg] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportError, setSupportError] = useState("");

  // Dynamic role detection state
  const [displayRole, setDisplayRole] = useState(null);
  const debounceRef = useRef(null);

  const RoleIcon = displayRole ? ROLE_ICONS[displayRole] : null;

  function handleEmailChange(val) {
    setEmail(val);
    setError("");
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setDisplayRole(null);
      return;
    }

    // 1. Direct synchronous check for default staff accounts
    if (HARDCODED_STAFF_ROLES[trimmed]) {
      setDisplayRole(HARDCODED_STAFF_ROLES[trimmed]);
      return;
    }

    // 2. Check stored Users list for any Authority-created official or personal email address or employeeId
    const staffUsers = getStoredUsers();
    const staffMatch = staffUsers.find(
      (u) =>
        u.email?.toLowerCase() === trimmed ||
        u.officialEmail?.toLowerCase() === trimmed ||
        u.personalEmail?.toLowerCase() === trimmed ||
        u.employeeId?.toLowerCase() === trimmed
    );
    if (staffMatch) {
      const roleName =
        staffMatch.role === "ADMIN" || staffMatch.role === "AUTHORITY" || staffMatch.role === "Authority"
          ? "Authority"
          : staffMatch.role === "ENGINEER" || staffMatch.role === "Engineer"
          ? "Engineer"
          : staffMatch.role === "FIELD_INSPECTOR" || staffMatch.role === "Field Inspector"
          ? "Field Inspector"
          : staffMatch.role === "CITIZEN" || staffMatch.role === "Citizen"
          ? "Public"
          : staffMatch.role;
      setDisplayRole(roleName);
      return;
    }

    // 3. Check Citizens list
    const citizens = getCitizens();
    const citizenMatch = citizens.find((c) => c.email?.toLowerCase() === trimmed || c.phone === trimmed);
    if (citizenMatch) {
      setDisplayRole("Public");
      return;
    }

    // 4. Robust keyword & pattern matching on email address (catches admin, swetha, janani, etc.)
    if (
      trimmed.includes("admin") ||
      trimmed.includes("authority") ||
      trimmed.includes("director") ||
      trimmed.includes("hq") ||
      trimmed.startsWith("admin@")
    ) {
      setDisplayRole("Authority");
    } else if (
      trimmed.includes("swetha") ||
      trimmed.includes("karthik") ||
      trimmed.includes("divya") ||
      trimmed.includes("arjun") ||
      trimmed.includes("meena") ||
      trimmed.includes("engineer") ||
      trimmed.startsWith("engineer@")
    ) {
      setDisplayRole("Engineer");
    } else if (
      trimmed.includes("janani") ||
      trimmed.includes("dhiyana") ||
      trimmed.includes("inspector") ||
      trimmed.includes("field") ||
      trimmed.startsWith("inspector@")
    ) {
      setDisplayRole("Field Inspector");
    } else {
      // ANY OTHER EMAIL AUTOMATICALLY DETECTS AS PUBLIC
      setDisplayRole("Public");
    }
  }, [email]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Enter your email address and password to continue.");
      return;
    }

    setSubmitting(true);

    const result = await login(email.trim().toLowerCase(), password, displayRole);

    if (result.ok) {
      setSubmitting(false);
      if (result.role === "CITIZEN") {
        navigate("/citizen");
      } else if (result.role === "AUTHORITY" || result.role === "ADMIN") {
        navigate("/command");
      } else if (result.role === "ENGINEER") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
      return;
    }

    setSubmitting(false);
    setError(result.error);
  }

  function openForgot() {
    setForgotEmail(email || "");
    setForgotStep("input");
    setForgotError("");
    setOtp("");
    setGeneratedOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowForgot(true);
  }

  function closeForgot() {
    setShowForgot(false);
    setForgotEmail("");
    setForgotStep("input");
    setForgotError("");
    setOtp("");
    setGeneratedOtp("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setForgotError("");
    const cleanForgotEmail = forgotEmail.trim().toLowerCase();
    if (!cleanForgotEmail || !cleanForgotEmail.includes("@")) {
      setForgotError("Please enter a valid email address.");
      return;
    }
    setForgotStep("sending");

    let code = Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Call Spring Boot Backend /api/auth/send-otp (Sends Real Gmail via JavaMailSender from disasterguard26@gmail.com)
    try {
      const response = await fetch("http://localhost:8081/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanForgotEmail })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.otp) {
          code = data.otp;
        }
      }
    } catch {}

    setForgotStep("otp");
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setForgotError("");
    const cleanOtp = (otp || "").trim();
    const expectedOtp = (generatedOtp || "").trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setForgotError("Enter the full 6-digit verification code.");
      return;
    }
    if (!expectedOtp || cleanOtp !== expectedOtp) {
      setForgotError("❌ Incorrect verification code! Please enter the exact 6-digit code sent to your email.");
      return;
    }
    setForgotStep("newpassword");
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setForgotError("");
    if (!newPassword || newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("Passwords don't match.");
      return;
    }
    
    // Update local user password
    const users = getStoredUsers();
    const cleanForgotEmail = forgotEmail.trim().toLowerCase();
    const updatedUsers = users.map((u) => u.email.toLowerCase() === cleanForgotEmail ? { ...u, password: newPassword } : u);
    localStorage.setItem('qg_users', JSON.stringify(updatedUsers));

    setForgotStep("done");
  }

  function handleSupportSubmit(e) {
    e.preventDefault();
    setSupportError("");

    if (!supportName.trim() || !supportEmail.trim() || !supportMsg.trim()) {
      setSupportError("Please enter your name, email, and message.");
      return;
    }

    if (supportPhone.trim() && !/^[6-9]\d{9}$/.test(supportPhone.trim().replace(/\D/g, "").slice(-10))) {
      setSupportError("Please enter a valid 10-digit mobile number.");
      return;
    }

    saveSupportMessage({
      name: supportName.trim(),
      email: supportEmail.trim().toLowerCase(),
      phone: supportPhone.trim(),
      message: supportMsg.trim(),
    });

    addNotification({
      type: "info",
      title: `New login support ticket submitted by ${supportName.trim()}`,
      meta: `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      roles: ["Authority"],
    });

    setSupportSubmitted(true);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 relative overflow-hidden bg-white">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-50 via-white to-emerald-50/50" />

      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16,185,129,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.7) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 40%, black 40%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 40%, black 40%, transparent 85%)",
        }}
      />

      <div className="pointer-events-none absolute -top-32 left-1/4 w-[560px] h-[560px] bg-emerald-300/25 blur-[120px] rounded-full z-0" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-[520px] h-[520px] bg-blue-300/25 blur-[120px] rounded-full z-0" />

      {/* FORGOT PASSWORD MODAL */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeForgot} />
          <div className="relative z-10 w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl p-7 shadow-2xl">
            <button onClick={closeForgot} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center mb-4 shadow-md">
              <Mail size={22} color="#fff" />
            </div>

            {forgotStep === "input" && (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Reset your password</h2>
                <p className="text-xs text-slate-500 mb-5">Enter your email address — we'll generate your 6-digit OTP code.</p>
                <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">Email Address</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                      placeholder="admin@disasterguard.org"
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
                      autoFocus
                    />
                  </div>
                  {forgotError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{forgotError}</div>
                  )}
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg py-2.5">
                    Generate Code →
                  </button>
                </form>
              </>
            )}

            {forgotStep === "sending" && (
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-800">Generating verification OTP...</p>
              </div>
            )}

            {forgotStep === "otp" && (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Enter Verification OTP</h2>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  We have sent a 6-digit OTP verification code to <strong className="text-emerald-700 font-mono">{forgotEmail}</strong>. Please check your email and enter the 6-digit code below.
                </p>

                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setForgotError(""); }}
                    placeholder="123456"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-center text-xl tracking-[0.4em] font-mono text-slate-900 outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  {forgotError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{forgotError}</div>
                  )}
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg py-2.5">
                    Verify Code →
                  </button>
                </form>
              </>
            )}

            {forgotStep === "newpassword" && (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Set New Password</h2>
                <p className="text-xs text-slate-500 mb-4">Choose a new secure password for your account.</p>
                <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 characters)"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  {forgotError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{forgotError}</div>
                  )}
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg py-2.5 mt-2">
                    Update Password →
                  </button>
                </form>
              </>
            )}

            {forgotStep === "done" && (
              <div className="flex flex-col items-center text-center py-4">
                <CheckCircle size={36} className="text-emerald-600 mb-3" />
                <h2 className="text-base font-bold text-slate-900 mb-1">Password Updated!</h2>
                <p className="text-xs text-slate-500 mb-5">You can now sign in with your new password.</p>
                <button onClick={closeForgot} className="w-full bg-emerald-600 text-white font-semibold text-sm rounded-lg py-2.5">
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REAL HELP & SUPPORT MODAL */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
          <div className="relative z-10 w-full max-w-[480px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Headphones size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Administrator & Help Portal</h2>
                <p className="text-xs text-slate-500">Official Support & Emergency Contacts</p>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-200 mb-5">
              <button
                onClick={() => { setHelpTab("contacts"); setSupportSubmitted(false); }}
                className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
                  helpTab === "contacts" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Admin Contacts
              </button>
              <button
                onClick={() => { setHelpTab("form"); setSupportSubmitted(false); }}
                className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all ${
                  helpTab === "form" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Send Support Ticket
              </button>
            </div>

            {helpTab === "contacts" && (
              <div className="flex flex-col gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Rajan K</p>
                    <span className="text-[10px] font-semibold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Authority Director</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Disaster Response & Control HQ</p>
                  <div className="flex flex-col gap-1.5 mt-3 pt-2.5 border-t border-slate-200 text-xs">
                    <a href="mailto:admin@disasterguard.org" className="flex items-center gap-2 text-emerald-700 hover:underline">
                      <Mail size={13} /> admin@disasterguard.org
                    </a>
                    <a href="tel:+919876543210" className="flex items-center gap-2 text-blue-700 hover:underline">
                      <Phone size={13} /> +91 98765 43210 (24/7 Helpline)
                    </a>
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin size={13} /> Command Control Center, Block A
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">Swetha S</p>
                    <span className="text-[10px] font-semibold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Lead Engineer</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Seismic Safety & Structural Assessments</p>
                  <div className="flex flex-col gap-1.5 mt-3 pt-2.5 border-t border-slate-200 text-xs">
                    <a href="mailto:swetha@disasterguard.org" className="flex items-center gap-2 text-emerald-700 hover:underline">
                      <Mail size={13} /> swetha@disasterguard.org
                    </a>
                    <a href="tel:+919444012345" className="flex items-center gap-2 text-blue-700 hover:underline">
                      <Phone size={13} /> +91 94440 12345
                    </a>
                  </div>
                </div>
              </div>
            )}

            {helpTab === "form" && (
              supportSubmitted ? (
                <div className="flex flex-col items-center text-center py-6">
                  <CheckCircle size={36} className="text-emerald-600 mb-2" />
                  <h3 className="text-base font-bold text-slate-900">Ticket Submitted Successfully!</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Your request has been delivered to the response authority. An administrator will contact you shortly.
                  </p>
                  <button onClick={() => setShowHelp(false)} className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg">
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="flex flex-col gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Your Full Name</label>
                    <input
                      type="text"
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      placeholder="e.g. Arun Kumar"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Your Email</label>
                      <input
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Valid Phone (10 digits)</label>
                      <input
                        type="tel"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        placeholder="98765 43210"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Issue / Message</label>
                    <textarea
                      rows={3}
                      value={supportMsg}
                      onChange={(e) => setSupportMsg(e.target.value)}
                      placeholder="Describe your login issue or support query..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {supportError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-1.5">
                      <AlertCircle size={13} /> {supportError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg py-2.5 flex items-center justify-center gap-1.5 mt-1"
                  >
                    <Send size={13} /> Submit Support Request
                  </button>
                </form>
              )
            )}
          </div>
        </div>
      )}

      {/* LOGIN FORM CARD */}
      <div className="w-full max-w-[440px] relative z-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 mb-5">
          <ArrowLeft size={13} />
          Back to home
        </Link>

        <div
          className="rounded-2xl p-8 sm:p-9 border border-white shadow-2xl shadow-slate-900/10"
          style={{
            background: "rgba(255,255,255,0.75)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
              <ShieldCheck size={18} strokeWidth={2.5} color="#fff" />
            </div>
            <span className="font-bold text-[15px] text-slate-900">DisasterGuard AI</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px] font-semibold mb-5 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Secure Portal Access
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-1">Sign in to your account</h1>
          <p className="text-xs text-slate-500 mb-6">Staff portal for Authority, Engineers, and Field Inspectors.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-widest text-slate-500 uppercase">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="admin@disasterguard.org"
                className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
                autoComplete="email"
              />
            </div>

            {/* Auto-Detected Role Badge */}
            <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              displayRole ? ROLE_COLORS[displayRole] : "bg-slate-50 border-slate-200 text-slate-400"
            }`}>
              {displayRole && RoleIcon ? (
                <>
                  <RoleIcon size={15} />
                  <span>Role detected: <strong>{displayRole}</strong></span>
                  <span className="ml-auto text-xs opacity-75 font-semibold">✓ Auto-Detected</span>
                </>
              ) : (
                <span className="text-xs text-slate-400">Role will appear after entering your email</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono tracking-widest text-slate-500 uppercase">Password</label>
                <button type="button" onClick={openForgot} className="text-xs text-blue-600 hover:text-blue-700 hover:underline">
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-semibold text-sm rounded-lg py-3 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-blue-500 transition-all"
            >
              {submitting ? "Signing in..." : "Sign in securely →"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 flex justify-center">
            <button
              onClick={() => { setShowHelp(true); setHelpTab("contacts"); }}
              className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-emerald-700"
            >
              <Headphones size={13} />
              Need Help Signing In? Support Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
