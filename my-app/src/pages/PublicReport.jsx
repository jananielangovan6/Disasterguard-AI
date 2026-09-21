import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2,
  LockKeyhole, CheckCircle2, AlertCircle, UserPlus, X, Phone, Smartphone, MessageSquare, Clock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { findCitizenByEmail, getCitizens } from "../data/mockData";

export default function PublicReport() {
  const { loginCitizen } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUnregistered, setIsUnregistered] = useState(false);

  // Citizen OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  useEffect(() => {
    let interval;
    if (showOtpModal && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, resendTimer]);

  async function handleResendEmailOtp() {
    setResendTimer(60);
    setOtpError("");
    const cleanEmail = email.trim().toLowerCase();
    let code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const response = await fetch("http://localhost:8081/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.otp) code = data.otp;
      }
    } catch {}

    setGeneratedOtp(code);
  }

  async function handleStartLogin(e) {
    e.preventDefault();
    setError("");
    setIsUnregistered(false);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      setError("Enter your password to continue.");
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    let code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const response = await fetch("http://localhost:8081/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.otp) code = data.otp;
      }
    } catch {}

    setGeneratedOtp(code);
    setLoading(false);
    setOtpCode("");
    setOtpError("");
    setResendTimer(60);
    setShowOtpModal(true);
  }

  async function handleConfirmOtp(e) {
    e.preventDefault();
    setOtpError("");

    const cleanCode = (otpCode || "").trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanCode || cleanCode.length !== 6) {
      setOtpError("Enter the 6-digit verification code.");
      return;
    }

    setOtpVerifying(true);

    let isOtpValid = false;

    // 1. Verify OTP with Spring Boot Backend /api/auth/verify-otp
    try {
      const response = await fetch("http://localhost:8081/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanCode })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.valid) {
          isOtpValid = true;
        }
      }
    } catch {}

    // 2. Fallback client-side code match
    if (!isOtpValid && generatedOtp && cleanCode === generatedOtp.trim()) {
      isOtpValid = true;
    }

    if (!isOtpValid) {
      setOtpVerifying(false);
      setOtpError("❌ Incorrect OTP code! Please enter the exact 6-digit code received in your email.");
      return;
    }

    const result = await loginCitizen(cleanEmail, password);
    setOtpVerifying(false);

    if (!result.ok) {
      setShowOtpModal(false);
      setError(result.error);
      if (result.isUnregistered) {
        setIsUnregistered(true);
      }
      return;
    }

    setShowOtpModal(false);
    navigate("/citizen");
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between relative overflow-hidden bg-white">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-50 via-white to-emerald-50/50" />

      {/* CITIZEN OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowOtpModal(false)} />
          <div className="relative z-10 w-full max-w-[420px] bg-white border border-slate-200 rounded-3xl p-7 shadow-2xl">
            <button onClick={() => setShowOtpModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
              <Mail size={22} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-1">
              Verify Citizen Email OTP
            </h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              We sent a 6-digit login verification code to your email <strong className="text-emerald-700 font-mono">{email}</strong>. Please check your email inbox (sent from <strong>disasterguard26@gmail.com</strong>) and enter the 6-digit code.
            </p>

            <form onSubmit={handleConfirmOtp} className="flex flex-col gap-4">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
                placeholder="123456"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-center text-2xl tracking-[0.4em] font-mono text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/30"
                autoFocus
              />

              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock size={12} /> Valid for 10 mins
                </span>
                {resendTimer > 0 ? (
                  <span className="text-slate-400">Resend email in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendEmailOtp}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Resend Email OTP
                  </button>
                )}
              </div>

              {otpError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{otpError}</div>
              )}

              <button
                type="submit"
                disabled={otpVerifying}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-md"
              >
                {otpVerifying ? "Verifying Email OTP..." : "Verify Email OTP & Sign In →"}
              </button>

              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                <Mail size={14} /> Open Gmail Inbox
              </a>
            </form>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg">
            <ShieldCheck size={18} color="#fff" />
          </div>
          <span className="font-bold text-slate-900 text-base tracking-tight">DisasterGuard AI</span>
        </Link>
        <Link to="/" className="text-sm text-slate-500 hover:text-emerald-600 font-medium">
          ← Back to home
        </Link>
      </header>

      {/* Main login area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <div className="relative bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-8 sm:p-9">
            <div className="relative flex flex-col items-center text-center mb-7">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4">
                <ShieldCheck size={26} color="#fff" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Citizen Portal Sign In
              </h1>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Sign in with Email OTP verification to report damage and track submissions.
              </p>
            </div>

            {error && (
              <div className={`relative flex flex-col gap-2 rounded-2xl p-4 mb-5 text-xs font-semibold ${
                isUnregistered
                  ? "bg-amber-50 border-2 border-amber-300 text-amber-900 shadow-md"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}>
                <div className="flex items-start gap-2">
                  <AlertCircle size={18} className={`shrink-0 mt-0.5 ${isUnregistered ? "text-amber-600" : "text-red-600"}`} />
                  <div>
                    <p className="font-bold text-sm leading-snug">{isUnregistered ? "Citizen Account Required" : "Sign In Error"}</p>
                    <p className="mt-1 leading-relaxed">{error}</p>
                  </div>
                </div>
                {isUnregistered && (
                  <button
                    type="button"
                    onClick={() => navigate("/citizen-signup", { state: { prefillEmail: email } })}
                    className="mt-2 w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                  >
                    <UserPlus size={16} /> Create New Citizen Account Now ➔
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleStartLogin} className="relative space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white/70 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-500 font-medium cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-emerald-600"
                />
                Keep me signed in on this device
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-70"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Verifying credentials…</>
                ) : (
                  <>Send OTP & Sign In <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div className="relative flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">New Citizen?</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <Link
              to="/citizen-signup"
              className="relative w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-700 font-bold text-sm transition-all"
            >
              <UserPlus size={16} /> Create a Citizen Account
            </Link>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Field Inspector, Engineer, or Authority?{" "}
            <Link to="/login" className="text-slate-600 font-semibold hover:text-emerald-700 hover:underline">
              Staff sign in
            </Link>
          </p>
        </div>
      </main>

      <footer className="relative z-10 text-center py-6">
        <p className="text-xs text-slate-500 font-medium">© 2026 DisasterGuard AI Assessment System</p>
      </footer>
    </div>
  );
}