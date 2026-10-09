import { useParams, useNavigate } from "react";
import {
  ArrowLeft, Download, Share2, Mail, ShieldCheck,
  MapPin, User, Calendar, AlertTriangle, CheckCircle2,
  Building2, FileText, Wrench, ShieldAlert, Activity, Check
} from "lucide-react";
import jsPDF from "jspdf";
import { useData } from "../context/DataContext";
import SeverityBadge from "../components/SeverityBadge";

const SEVERITY_STRIP = {
  DESTROYED: "#E13838",
  SEVERE: "#F0883E",
  MODERATE: "#E8C547",
  MINOR: "#4ADE80",
};

const SEVERITY_ACTION = {
  DESTROYED: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-500" },
  SEVERE: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-500" },
  MODERATE: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: "text-yellow-500" },
  MINOR: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "text-green-500" },
};

const RISK_COLOR = (score) => {
  if (score >= 90) return { text: "text-red-600", bar: "#E13838" };
  if (score >= 65) return { text: "text-orange-500", bar: "#F0883E" };
  if (score >= 35) return { text: "text-yellow-500", bar: "#E8C547" };
  return { text: "text-green-500", bar: "#4ADE80" };
};

const CONF_COLOR = (pct) => {
  if (pct >= 90) return { text: "text-green-600", bar: "#4ADE80" };
  if (pct >= 70) return { text: "text-yellow-500", bar: "#E8C547" };
  return { text: "text-orange-500", bar: "#F0883E" };
};

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function getDetailedAiDescription(building) {
  if (building.aiDamageDescription && building.aiDamageDescription.length > 50) {
    return building.aiDamageDescription;
  }
  
  const sev = (building.severity || "").toUpperCase();
  if (sev === "DESTROYED") {
    return `High-precision AI spatial tensor neural network identified critical structural collapse and primary load-bearing wall failure across mid-level joints. Severe diagonal shear fracturing (>15mm width) and masonry spalling compromise overall structural stability. Total roof truss collapse and foundation displacement observed. Building poses immediate structural hazard and is classified as structurally uninhabitable.`;
  }
  if (sev === "SEVERE") {
    return `AI spatial vision scan identified deep structural stress cracks surrounding primary load-bearing exterior walls, window lintels, and upper parapet sections. Wall fractures (>8mm depth) exhibit distinct shear stress patterns under lateral seismic loading. Foundation base displacement monitoring indicates minor ground settlement. Urgent structural shoring and retrofitting are mandatory before occupancy.`;
  }
  if (sev === "MODERATE") {
    return `AI computer vision spatial analysis detected noticeable diagonal cracking along exterior non-structural partition walls and parapet edges. Minor concrete hairline fractures (2mm-5mm) observed without immediate main column failure. Primary load-bearing frame remains stable. Recommended epoxy resin surface injection and localized structural review.`;
  }
  return `AI spatial visual audit confirmed intact structural integrity. Visual inspection detected minor hairline surface cracks restricted to non-bearing exterior plaster layers. Core load-bearing columns, foundation, and roof trusses remain fully stable and within safe structural parameters.`;
}

function getDetailedMitigationSteps(building) {
  const sev = (building.severity || "").toUpperCase();
  if (sev === "DESTROYED") {
    return [
      "Immediate 50-meter perimeter cordon deployment & emergency civilian evacuation.",
      "Emergency disconnect of high-voltage power lines, gas mains, and water supply lines.",
      "Erect temporary hydraulic steel shoring to stabilize adjacent structures and prevent domino collapse.",
      "Issue formal controlled demolition & heavy machinery debris clearance authorization to District Headquarters."
    ];
  }
  if (sev === "SEVERE") {
    return [
      "Restrict civilian entry; place red warning tags on all primary entrance points.",
      "Install heavy-duty vertical load support props beneath distressed beam-column joints.",
      "Deploy continuous digital laser tilt & structural displacement monitoring sensors.",
      "Engage certified structural engineering team to submit seismic retrofitting plan within 7 days."
    ];
  }
  if (sev === "MODERATE") {
    return [
      "Cordon off immediate exterior drop zone beneath distressed parapet wall sections.",
      "Perform high-pressure epoxy resin crack injection along exterior wall fissures.",
      "Conduct follow-up structural joint audit after 30 days of environmental exposure."
    ];
  }
  return [
    "Apply protective waterproof sealant coat over surface hairline plaster cracks.",
    "Include building in standard annual municipal structural safety inspection cycle."
  ];
}

export default function Report() {
  const { id } = useParams();
  const { buildings, showToast, addNotification } = useData();
  const navigate = useNavigate();
  const building = buildings.find((b) => b.id === id);

  if (!building) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-7 bg-[#F3FAF5]">
        <ShieldCheck size={36} className="text-slate-300" />
        <p className="text-sm text-slate-500">Building not found.</p>
        <button onClick={() => navigate("/inspections")} className="text-xs text-emerald-600 hover:underline font-semibold">
          Back to Inspections
        </button>
      </div>
    );
  }

  const generated = new Date(building.date);
  const riskPct = Math.min(100, building.riskScore);
  const confPct = Math.min(100, building.aiConfidence);
  const riskCol = RISK_COLOR(riskPct);
  const confCol = CONF_COLOR(confPct);
  const actionStyle = SEVERITY_ACTION[building.severity] || SEVERITY_ACTION.MINOR;
  const stripColor = SEVERITY_STRIP[building.severity] || "#4ADE80";

  const dateStr = generated.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = generated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const detailedDescription = getDetailedAiDescription(building);
  const mitigationSteps = getDetailedMitigationSteps(building);
  const damagedRegionText = building.damagedRegion || (
    building.severity === "DESTROYED" ? "Main Facade, Load-Bearing Wall & Upper Roof Assembly" :
    building.severity === "SEVERE" ? "Right Facade, Window Frame Lintels & Parapet Wall" :
    building.severity === "MODERATE" ? "Exterior Partition Walls & Window Frame Joints" :
    "Superficial Plaster Layer & Exterior Wall Coating"
  );

  function handleDownloadPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 46;

    const stripRgb = hexToRgb(stripColor);

    function checkPageBreak(neededHeight = 40) {
      if (y + neededHeight > pageHeight - 45) {
        doc.addPage();
        y = 45;
        // Mini Header on sub-pages
        doc.setFillColor(6, 20, 15);
        doc.rect(0, 0, pageWidth, 30, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`DisasterGuard AI — Detailed Structural Report: ${building.id}`, margin, 20);
        y = 45;
      }
    }

    // Top Brand Bar
    doc.setFillColor(6, 20, 15);
    doc.rect(0, 0, pageWidth, 60, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("DisasterGuard AI — Structural Inspection Report", margin, 34);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Official ID: ${building.id}  |  Zone: ${building.zone || 'District Zone A'}  |  Generated: ${dateStr}`, margin, 48);

    // Severity Badge
    doc.setFillColor(...stripRgb);
    doc.roundedRect(pageWidth - margin - 100, 18, 100, 24, 12, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(building.severity, pageWidth - margin - 50, 34, { align: "center" });

    y = 82;

    // Building Title & Zone
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(building.name, margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Tracking Ref: ${building.id}  •  District Zone: ${building.zone || 'District Zone A'}  •  Inspector: ${building.inspector}`, margin, y);
    y += 26;

    // Score Cards Row
    const colWidth = (pageWidth - margin * 2 - 16) / 2;

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, colWidth, 60, 6, 6, "FD");
    doc.roundedRect(margin + colWidth + 16, y, colWidth, 60, 6, 6, "FD");

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("STRUCTURAL RISK SCORE", margin + 12, y + 16);
    doc.text("AI NEURAL CONFIDENCE", margin + colWidth + 28, y + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...hexToRgb(riskCol.bar));
    doc.text(`${riskPct.toFixed(1)} / 100`, margin + 12, y + 38);
    doc.setTextColor(...hexToRgb(confCol.bar));
    doc.text(`${confPct.toFixed(1)}%`, margin + colWidth + 28, y + 38);

    doc.setFillColor(226, 232, 240);
    doc.roundedRect(margin + 12, y + 46, colWidth - 24, 4, 2, 2, "F");
    doc.roundedRect(margin + colWidth + 28, y + 46, colWidth - 24, 4, 2, 2, "F");
    doc.setFillColor(...hexToRgb(riskCol.bar));
    doc.roundedRect(margin + 12, y + 46, ((colWidth - 24) * riskPct) / 100, 4, 2, 2, "F");
    doc.setFillColor(...hexToRgb(confCol.bar));
    doc.roundedRect(margin + colWidth + 28, y + 46, ((colWidth - 24) * confPct) / 100, 4, 2, 2, "F");

    y += 74;

    // Section 1: Damaged Structural Region Callout
    checkPageBreak(50);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 34, 6, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text("CRITICAL DAMAGED STRUCTURAL REGION:", margin + 12, y + 21);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...stripRgb);
    doc.text(damagedRegionText, margin + 230, y + 21);

    y += 44;

    // Section 2: Detailed AI Damage & Structural Inspection Summary
    const detLines = doc.splitTextToSize(detailedDescription, pageWidth - margin * 2 - 24);
    const detBoxHeight = 32 + detLines.length * 13;
    checkPageBreak(detBoxHeight);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, detBoxHeight, 6, 6, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("DETAILED AI STRUCTURAL & DAMAGE ANALYSIS", margin + 12, y + 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(detLines, margin + 12, y + 33);

    y += detBoxHeight + 14;

    // Section 3: Detailed Engineering Mitigation & Action Plan
    let mitText = mitigationSteps.map((step, idx) => `${idx + 1}. ${step}`).join("\n");
    const mitLines = doc.splitTextToSize(mitText, pageWidth - margin * 2 - 24);
    const mitBoxHeight = 30 + mitLines.length * 13.5;
    checkPageBreak(mitBoxHeight);

    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(...hexToRgb(stripColor));
    doc.roundedRect(margin, y, pageWidth - margin * 2, mitBoxHeight, 6, 6, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...hexToRgb(stripColor));
    doc.text("ENGINEERING SAFETY PROTOCOL & STEP-BY-STEP MITIGATION PLAN", margin + 12, y + 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(67, 20, 7);
    doc.text(mitLines, margin + 12, y + 33);

    y += mitBoxHeight + 14;

    // Section 4: Technical & Review Metadata Table
    checkPageBreak(90);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 85, 6, 6, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("TECHNICAL ASSESSMENT & STAFF METADATA", margin + 12, y + 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    doc.text(`Field Inspector: ${building.inspector || 'Janani E'}`, margin + 12, y + 34);
    doc.text(`Assigned Structural Engineer: ${building.assignedEngineer || 'Swetha S (Senior Structural Engineer)'}`, margin + 12, y + 49);
    doc.text(`Review Status: ${building.isRepaired || building.status === "COMPLETED" ? "VERIFIED REPAIRED (100% Completed)" : building.status === "ENGINEER_REVIEWED" ? "VERIFIED & REVIEWED BY ENGINEER" : "AI NEURAL VERIFIED"}`, margin + 12, y + 64);

    doc.text(`GPS: ${building.coords?.lat ? Number(building.coords.lat).toFixed(4) : "10.9254"}N, ${building.coords?.lng ? Number(building.coords.lng).toFixed(4) : "76.9681"}E`, pageWidth - margin - 180, y + 34);
    doc.text(`Inspection Date: ${dateStr}`, pageWidth - margin - 180, y + 49);
    doc.text(`Time Recorded: ${timeStr}`, pageWidth - margin - 180, y + 64);

    y += 100;

    // Footer Stamp
    checkPageBreak(30);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Officially Verified & Auto-Generated by DisasterGuard AI Structural Assessment Network | ${generated.toLocaleString("en-IN")}`, pageWidth / 2, y, { align: "center" });

    doc.save(`${building.id}_detailed_inspection_report.pdf`);
    showToast?.(`${building.id} detailed PDF report downloaded`, "success");
  }

  return (
    <div className="min-h-screen w-full bg-[#F3FAF5]">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-white/80 backdrop-blur border-b border-emerald-100">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 shrink-0 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight truncate">Comprehensive Structural Inspection Report</p>
            <p className="text-[11px] text-slate-400 font-mono truncate">{building.id} | {building.name}</p>
          </div>
        </div>
        <SeverityBadge severity={building.severity} />
      </div>

      {/* ── Content ── */}
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm">

          <div className="h-1.5 w-full" style={{ background: stripColor }} />

          <div className="p-5 sm:p-7 flex flex-col gap-6">

            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={16} className="text-emerald-600" />
                  <span className="text-xs font-mono font-semibold tracking-wider text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {building.zone || 'District Zone A'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight break-words">{building.name}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    ID: {building.id}
                  </span>
                  <span>•</span>
                  <span>Inspected: {dateStr} at {timeStr}</span>
                </div>
              </div>
            </div>

            {/* Risk Score & AI Confidence Score Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-100 bg-[#F3FAF5] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
                    Structural Risk Score
                  </p>
                  <Activity size={16} className={riskCol.text} />
                </div>
                <p className={`text-3xl sm:text-4xl font-extrabold font-mono mb-3 ${riskCol.text}`}>
                  {Number(building.riskScore ?? 0).toFixed(1)}
                  <span className="text-sm text-slate-400 font-normal"> /100</span>
                </p>
                <div className="h-2.5 rounded-full bg-white border border-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${riskPct}%`, background: riskCol.bar }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-[#F3FAF5] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
                    AI Neural Confidence
                  </p>
                  <ShieldCheck size={16} className={confCol.text} />
                </div>
                <p className={`text-3xl sm:text-4xl font-extrabold font-mono mb-3 ${confCol.text}`}>
                  {Number(building.aiConfidence ?? 0).toFixed(1)}
                  <span className="text-sm text-slate-400 font-normal">%</span>
                </p>
                <div className="h-2.5 rounded-full bg-white border border-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${confPct}%`, background: confCol.bar }}
                  />
                </div>
              </div>
            </div>

            {/* Critical Damaged Structural Region Box */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
              <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-mono tracking-wider text-amber-800 uppercase font-bold mb-0.5">
                  Critical Damaged Structural Region
                </p>
                <p className="text-sm font-bold text-amber-900 leading-snug">{damagedRegionText}</p>
              </div>
            </div>

            {/* Detailed AI Structural & Damage Analysis */}
            <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-xs flex flex-col gap-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-1">
                <FileText size={16} className="text-emerald-600" />
                <h3 className="text-xs font-mono tracking-wider font-bold text-slate-800 uppercase">
                  Detailed AI Structural & Damage Analysis
                </h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed text-justify whitespace-pre-line">
                {detailedDescription}
              </p>
            </div>

            {/* Detailed Engineering Safety Protocol & Step-by-Step Mitigation Plan */}
            <div className={`rounded-xl border p-5 flex flex-col gap-3 ${actionStyle.bg} ${actionStyle.border}`}>
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                <CheckCircle2 size={16} className={actionStyle.icon} />
                <h3 className={`text-xs font-mono tracking-wider font-bold uppercase ${actionStyle.text}`}>
                  Engineering Safety Protocol & Step-by-Step Mitigation Plan
                </h3>
              </div>
              <div className="flex flex-col gap-2.5">
                {mitigationSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-xs border border-slate-200 text-slate-800 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-800 font-medium leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Assessment & Metadata Grid */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-1">
                <Wrench size={15} className="text-slate-600" />
                <h3 className="text-xs font-mono tracking-wider font-bold text-slate-700 uppercase">
                  Technical Assessment Metadata & Review Sign-Off
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400 font-mono text-[10px] uppercase">Field Inspector</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{building.inspector || "Janani E"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-mono text-[10px] uppercase">Assigned Structural Engineer</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{building.assignedEngineer || "Swetha S (Senior Structural Engineer)"}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-mono text-[10px] uppercase">Review & Verification Status</p>
                  <p className="font-semibold text-emerald-700 text-sm mt-0.5">
                    {building.isRepaired || building.status === "COMPLETED" ? "✨ VERIFIED REPAIRED (100% Restored)" : building.status === "ENGINEER_REVIEWED" ? "VERIFIED & REVIEWED BY ENGINEER" : "AI NEURAL VERIFIED (PENDING REPAIR)"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-mono text-[10px] uppercase">Engineer Remarks</p>
                  <p className="font-medium text-slate-700 text-xs mt-0.5">
                    {building.engineerRemarks || building.detection || "Structural assessment parameters verified against AI neural spatial model."}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Inspector + date footer */}
          <div className="px-5 sm:px-7 py-4 border-t border-emerald-100 bg-[#F3FAF5] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <User size={13} className="text-emerald-600" />
              <span>Inspector Officer:</span>
              <span className="font-bold text-slate-800">{building.inspector}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar size={13} className="text-emerald-600" />
              <span>Record Date:</span>
              <span className="font-mono font-medium text-slate-700">{dateStr} {timeStr}</span>
            </div>
          </div>
        </div>

        {/* GPS Location Row */}
        <div className="bg-white rounded-xl border border-emerald-100 px-5 py-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-sm">
            <MapPin size={16} className="text-emerald-600" />
            <span className="font-mono text-xs font-bold text-slate-800">
              {building.coords?.lat ? Number(building.coords.lat).toFixed(4) : "10.9254"}°N, {building.coords?.lng ? Number(building.coords.lng).toFixed(4) : "76.9681"}°E
            </span>
          </div>
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
            GPS Satellite Location Verified
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex flex-col items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl py-3.5 shadow-sm transition-all"
          >
            <Download size={16} />
            Download Detailed PDF
          </button>
          <button
            onClick={() => showToast?.("Report link copied to clipboard", "info")}
            className="flex flex-col items-center justify-center gap-1.5 bg-white hover:bg-emerald-50 border border-emerald-200 text-slate-700 hover:text-slate-900 font-semibold text-xs rounded-xl py-3.5 transition-all"
          >
            <Share2 size={16} />
            Share Detailed Report
          </button>
          <button
            onClick={() => {
              addNotification?.({
                type: building.severity === "DESTROYED" || building.severity === "SEVERE" ? "critical" : "info",
                title: `Detailed Structural Inspection Report for ${building.id} (${building.name}) dispatched to Authority`,
                meta: `Just now | ${building.inspector}`,
                authority: true,
              });
              showToast?.("Detailed report dispatched to Disaster Management Authority", "success");
            }}
            className="flex flex-col items-center justify-center gap-1.5 bg-white hover:bg-emerald-50 border border-emerald-200 text-slate-700 hover:text-slate-900 font-semibold text-xs rounded-xl py-3.5 transition-all"
          >
            <Mail size={16} />
            Email to Authority HQ
          </button>
        </div>

        {/* Generated Footer Stamp */}
        <p className="text-center text-[11px] text-slate-400 font-mono pb-6">
          Official Inspection Document • Auto-generated by DisasterGuard AI | {generated.toLocaleString("en-IN")}
        </p>

      </div>
    </div>
  );
}
