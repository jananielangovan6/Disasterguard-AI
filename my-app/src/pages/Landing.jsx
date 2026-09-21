import { Link } from "react-router-dom";
import {
  ShieldCheck, MapPin, Users,
  Phone, Mail, ChevronRight, Building2,
  Siren, ClipboardList, BarChart3, ArrowRight,
  Zap, Globe, Target, Layers, CheckCircle2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();
  const reportTarget = user?.role === "CITIZEN" ? "/citizen/report" : "/citizen-login";
  function handleNavClick(e, id) {
    e.preventDefault();
    var el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck size={18} color="#fff" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight">DisasterGuard AI</span>
              <span className="hidden sm:inline text-emerald-600/70 text-xs ml-2">/ AI-Powered Structural Damage Intelligence</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["About", "Features", "How It Works", "Contact"].map(function (n) {
              var id = n.toLowerCase().replace(/\s+/g, "-");
              return (
                <a
                  key={n}
                  href={"#" + id}
                  onClick={function (e) { handleNavClick(e, id); }}
                  className="text-sm text-slate-600 hover:text-emerald-600 transition-colors font-medium"
                >
                  {n}
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Link to={user?.role === "CITIZEN" ? "/citizen/report" : "/citizen-login"}
              className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold transition-all px-4 py-2.5 rounded-xl shadow-sm">
              Public Damage Report & Citizen Portal
            </Link>
            <Link to="/login"
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-slate-900/20">
              Authority / Staff Login →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-20 pb-16 bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-400/10 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute top-20 right-0 w-[400px] h-[400px] bg-blue-400/10 blur-3xl rounded-full" />

        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />

        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 text-xs font-semibold mb-6 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI-Powered Structural Damage Assessment
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-5">
              AI-Based Structural Damage{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                Assessment
              </span>{" "}
              
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8">
              DisasterGuard AI enables field inspectors, structural engineers, and
              disaster management authorities to rapidly assess structural damage
              after earthquakes and cyclones. Using AI-powered image analysis, the
              platform classifies damage severity, prioritizes unsafe structures,
              generates inspection reports, and supports faster disaster response —
              all within one intelligent platform.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              <Link to={user?.role === "CITIZEN" ? "/citizen/report" : "/citizen-login"}
                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/25 text-sm">
                Public Damage Report & Citizen Portal <ArrowRight size={16} />
              </Link>
              <Link to="/login"
                className="flex items-center gap-2 px-6 py-3.5 border-2 border-slate-900 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md text-sm">
                Authority & Staff Login →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
              {[
                { value: "2.4M+", label: "Data Points Analyzed" },
                { value: "94%", label: "Detection Accuracy" },
                { value: "500+", label: "Buildings Assessed" },
                { value: "48h", label: "Avg Response Time" },
              ].map(function (s) {
                return (
                  <div key={s.label} className="bg-white px-6 py-5 text-center">
                    <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">About DisasterGuard AI</p>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-5">
                Why we built this platform
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mb-4">
                After a natural disaster,the biggest challenge isn't just
                the damage itself — it's the chaos of coordinating hundreds of
                inspections, engineers, and relief resources across a wide area
                in the critical first 48 hours.
              </p>
              <p className="text-slate-600 text-base leading-relaxed mb-8">
                DisasterGuard AI replaces paper checklists and scattered phone
                calls with a single connected system: field inspectors capture
                data on-site, AI instantly flags severity, engineers verify
                remotely, and authorities see everything on one live dashboard —
                so relief reaches the right buildings first.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Target, title: "Faster Triage", desc: "AI classifies damage severity in seconds, not days." },
                  { icon: Layers, title: "One Unified System", desc: "Inspectors, engineers, and authorities work from the same live data." },
                  { icon: CheckCircle2, title: "Built for Accountability", desc: "Every report is timestamped, geo-tagged, and auditable." },
                ].map(function (item) {
                  var Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                        <p className="text-slate-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
              <h3 className="font-bold text-slate-900 text-lg mb-6">Who uses DisasterGuard AI?</h3>
              <div className="space-y-5">
                {[
                  { role: "Field Inspectors", desc: "Visit affected sites, photograph structural damage, and submit standardized on-site reports in minutes.", color: "bg-emerald-100 text-emerald-700" },
                  { role: "Structural Engineers", desc: "Remotely review AI-flagged reports, add technical assessments, and prioritize repair recommendations.", color: "bg-blue-100 text-blue-700" },
                  { role: "Government Authorities", desc: "Monitor every district in real time, allocate relief resources, and approve official damage reports.", color: "bg-amber-100 text-amber-700" },
                ].map(function (u) {
                  return (
                    <div key={u.role} className="bg-white border border-slate-200 rounded-xl p-5">
                      <span className={"inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded mb-2 " + u.color}>
                        {u.role}
                      </span>
                      <p className="text-sm text-slate-600 leading-relaxed">{u.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Platform Features</p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              Everything your team needs
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              From first responders on the ground to command center authorities —
              every role has a purpose-built toolset.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Building2,
                title: "Building Damage Assessment",
                desc: "AI-powered structural analysis from photo uploads. Auto-classifies risk as Destroyed / Severe / Moderate / Minor.",
                tag: "Field Inspector",
                tagColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
              },
              {
                icon: MapPin,
                title: "Real-Time Damage Map",
                desc: "Live GIS map showing affected zones, building status overlays, and field team positions across districts.",
                tag: "Engineer",
                tagColor: "text-blue-700 bg-blue-50 border-blue-200",
              },
              {
                icon: BarChart3,
                title: "Command Dashboard",
                desc: "Centralized authority view with live analytics, priority queues, and cross-team resource allocation.",
                tag: "Authority",
                tagColor: "text-amber-700 bg-amber-50 border-amber-200",
              },
              {
                icon: ClipboardList,
                title: "Inspection Reports",
                desc: "Auto-generated structured PDF reports with photographic evidence, damage scores, and action plans.",
                tag: "All Roles",
                tagColor: "text-purple-700 bg-purple-50 border-purple-200",
              },
              {
                icon: Siren,
                title: "Emergency Alerts",
                desc: "Real-time seismic event push notifications with auto-dispatch triggers for registered field personnel.",
                tag: "All Roles",
                tagColor: "text-purple-700 bg-purple-50 border-purple-200",
              },
              {
                icon: Users,
                title: "Team Management",
                desc: "Assign inspectors to zones, track engineer reviews, and manage authority approvals in one unified portal.",
                tag: "Authority",
                tagColor: "text-amber-700 bg-amber-50 border-amber-200",
              },
            ].map(function (f) {
              var Icon = f.icon;
              return (
                <div key={f.title}
                  className="group relative bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-emerald-600" />
                  </div>
                  <span className={"text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border " + f.tagColor + " mb-3 inline-block"}>
                    {f.tag}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-emerald-600/70 group-hover:text-emerald-600 transition-colors font-medium">
                    Learn more <ChevronRight size={12} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              From ground to command in 4 steps
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Field Inspection", desc: "Inspector visits affected building, uploads photos and fills damage form on-site.", icon: ClipboardList },
              { step: "02", title: "AI Analysis", desc: "DisasterGuard AI processes images and data to classify damage severity instantly.", icon: Zap },
              { step: "03", title: "Engineer Review", desc: "Structural engineer validates AI output, adds technical notes and priority level.", icon: Building2 },
              { step: "04", title: "Authority Action", desc: "Command center sees live dashboard, allocates resources and issues relief orders.", icon: ShieldCheck },
            ].map(function (s, i) {
              var Icon = s.icon;
              return (
                <div key={s.step} className="relative flex flex-col gap-4">
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-emerald-300 to-transparent z-10" />
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 flex items-center justify-center">
                    <Icon size={22} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-emerald-500/15 leading-none mb-1">{s.step}</p>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{s.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ROLE ACCESS */}
      <section className="py-20 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Role Based Access</p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Built for every stakeholder
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                role: "Field Inspector",
                color: "from-emerald-500 to-teal-600",
                icon: ClipboardList,
                points: ["Submit building damage reports", "Upload photographic evidence", "Record GPS coordinates", "Mark immediate risk zones", "View assigned inspections"],
              },
              {
                role: "Structural Engineer",
                color: "from-blue-500 to-cyan-600",
                icon: Building2,
                points: ["Review field inspection data", "Validate damage classifications", "Generate technical reports", "Recommend repair priorities", "Coordinate with authorities"],
              },
              {
                role: "Authority / Admin",
                color: "from-amber-500 to-orange-600",
                icon: ShieldCheck,
                points: ["Command dashboard overview", "Allocate response resources", "Manage team assignments", "Approve official reports", "Monitor all district activity"],
              },
            ].map(function (r) {
              var Icon = r.icon;
              return (
                <div key={r.role}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className={"bg-gradient-to-r " + r.color + " px-6 py-5 flex items-center gap-3"}>
                    <Icon size={20} color="#fff" />
                    <h3 className="font-bold text-white">{r.role}</h3>
                  </div>
                  <ul className="p-6 space-y-2.5">
                    {r.points.map(function (p) {
                      return (
                        <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                          <ChevronRight size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                          {p}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="px-6 pb-6">
                    <Link to="/login"
                      className={"block text-center py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r " + r.color + " hover:opacity-90 transition-opacity shadow"}>
                      Login as {r.role.split(" ")[0]} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Contact & Support</p>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Get in touch
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Phone, label: "Helpline", value: "1800-180-1253", sub: "Mon–Sat, 9AM–6PM IST" },
              { icon: Mail, label: "Email Support", value: "help@disasterguard.gov.in", sub: "Response within 24 hours" },
              { icon: Globe, label: "Portal", value: "disasterguard.gov.in", sub: "Available 24/7" },
            ].map(function (c) {
              var Icon = c.icon;
              return (
                <div key={c.label}
                  className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <Icon size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">{c.label}</p>
                    <p className="text-slate-900 font-semibold text-sm">{c.value}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{c.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                <ShieldCheck size={14} color="#fff" />
              </div>
              <span className="font-bold text-white text-sm">DisasterGuard AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-Powered Structural Damage Assessment & Response System.
            </p>
          </div>
          {[
            { title: "Platform", links: ["About", "Features", "How It Works", "Damage Map"] },
            { title: "Resources", links: ["Documentation", "API Reference", "Training Guide", "FAQ"] },
            { title: "Legal", links: ["Privacy Policy", "Terms of Use", "Accessibility", "Data Security"] },
          ].map(function (col) {
            return (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(function (l) {
                    return (
                      <li key={l}>
                        <a href="#" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors">{l}</a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="border-t border-slate-800 py-4 px-6 text-center text-xs text-slate-500">
          © 2026 DisasterGuard AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}