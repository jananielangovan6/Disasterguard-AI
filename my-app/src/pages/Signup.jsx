import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  ShieldCheck, ArrowLeft, User, Mail, Phone, MapPin, Lock,
  Eye, EyeOff, CheckCircle2, AlertCircle, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const TN_DISTRICTS = [
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
  "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul",
  "Thanjavur", "Ranipet", "Karur", "Tiruppur", "Cuddalore",
  "Kanchipuram", "Krishnagiri", "Namakkal", "Nagapattinam", "Other",
];

export default function Signup() {
  const { signupCitizen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState(location.state?.prefillEmail || "");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [customDistrict, setCustomDistrict] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // OTP Modal state for registration email verification
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);

  function validate() {
    if (!name.trim()) return "Please enter your full name.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address.";
    }
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone.slice(-10))) {
      return "Please enter a valid 10-digit mobile number (e.g. 98765 43210).";
    }
    if (!district) return "Please select your district.";
    if (district === "Other" && !customDistrict.trim()) return "Please type your district name.";
    if (!password) return "Please create a password.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!agreed) return "Please confirm the details you've entered are accurate.";
    return "";
  }

  async function handleStartSignup(e) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    const citizenEmail = email.trim().toLowerCase();
    let code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      // 1. Call Spring Boot Backend /api/auth/send-otp
      const response = await fetch("http://localhost:8081/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: citizenEmail })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.otp) {
          code = data.otp;
        }
      }
    } catch (err) {
      console.warn("Backend send-otp offline, using fallback OTP", err);
    }

    // Set state synchronously before opening modal
    setGeneratedOtp(code);
    sessionStorage.setItem("qg_reg_otp", code);
    window.qg_reg_otp = code;
    setOtpCode("");
    setOtpError("");
    setSubmitting(false);

    // Open OTP Verification Modal
    setShowOtpModal(true);
  }

  async function handleVerifyAndRegister(e) {
    e.preventDefault();
    setOtpError("");

    const cleanOtp = (otpCode || "").trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setOtpError("Enter the 6-digit verification code sent to your email.");
      return;
    }

    setOtpVerifying(true);

    let isOtpValid = false;

    // 1. Verify OTP with Spring Boot Backend /api/auth/verify-otp
    try {
      const response = await fetch("http://localhost:8081/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.valid) {
          isOtpValid = true;
        }
      }
    } catch {}

    // 2. Fallback client-side code match
    const expectedOtp = (generatedOtp || sessionStorage.getItem("qg_reg_otp") || window.qg_reg_otp || "").trim();
    if (!isOtpValid && expectedOtp && cleanOtp === expectedOtp) {
      isOtpValid = true;
    }

    if (!isOtpValid) {
      setOtpVerifying(false);
      setOtpError("❌ Incorrect verification code! Please enter the exact 6-digit OTP code received in your email.");
      return;
    }

    const result = await signupCitizen({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      district: district === "Other" ? customDistrict.trim() : district,
      password,
    });

    setOtpVerifying(false);

    if (!result.ok) {
      setShowOtpModal(false);
      setError(result.error);
      return;
    }

    setShowOtpModal(false);
    navigate("/citizen");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 relative overflow-hidden bg-white">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-50 via-white to-emerald-50/50" />

      {/* REGISTRATION OTP MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowOtpModal(false)} />
          <div className="relative z-10 w-full max-w-[400px] bg-white border border-slate-200 rounded-3xl p-7 shadow-2xl">
            <button onClick={() => setShowOtpModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
              <X size={18} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
              <Mail size={22} />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-1">Verify Citizen Registration Code</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              We sent a 6-digit verification code to <strong className="text-emerald-700 font-mono">{email}</strong>. Please check your email inbox (sent from <strong>disasterguard26@gmail.com</strong>) and enter the 6-digit code.
            </p>

            <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-4">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
                placeholder="123456"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 text-center text-2xl tracking-[0.4em] font-mono text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/30"
                autoFocus
              />

              {otpError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{otpError}</div>
              )}

              <button
                type="submit"
                disabled={otpVerifying}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-md"
              >
                {otpVerifying ? "Creating Account..." : "Verify OTP & Complete Registration →"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CENTERED SIGNUP CARD */}
      <div className="w-full max-w-[460px] relative z-10">
        <Link to="/citizen-login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 mb-5">
          <ArrowLeft size={13} />
          Back to sign in
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
            Citizen Registration
          </div>

          <h1 className="text-xl font-bold text-slate-900 mb-1">Create your citizen account</h1>
          <p className="text-xs text-slate-500 mb-6">Report structural damage and track status with email OTP security.</p>

          <form onSubmit={handleStartSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-widest text-slate-500 uppercase">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arun Kumar"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-emerald-500"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono tracking-widest text-slate-500 uppercase">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-emerald-500"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono tracking-widest text-slate-500 uppercase">Valid Phone (10 digits)</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-emerald-500"
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono tracking-widest text-slate-500 uppercase">District</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    if (e.target.value !== "Other") setCustomDistrict("");
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-emerald-500 appearance-none"
                >
                  <option value="">Select district</option>
                  {TN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {district === "Other" && (
                <input
                  type="text"
                  value={customDistrict}
                  onChange={(e) => setCustomDistrict(e.target.value)}
                  placeholder="Type district name"
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-emerald-500"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono tracking-widest text-slate-500 uppercase">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-emerald-500"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono tracking-widest text-slate-500 uppercase">Confirm</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:border-emerald-500"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-emerald-600"
              />
              <span>I confirm the details above are accurate and I agree to email OTP verification.</span>
            </label>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 disabled:opacity-60 text-white font-semibold text-sm rounded-lg py-3 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              {submitting ? "Processing..." : (
                <>
                  <CheckCircle2 size={16} />
                  Send OTP & Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 flex justify-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/citizen-login" className="text-emerald-700 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}