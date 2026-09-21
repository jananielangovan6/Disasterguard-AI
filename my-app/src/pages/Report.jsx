import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, Share2, Mail, ShieldCheck,
  MapPin, User, Calendar, AlertTriangle, CheckCircle2
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
        <button onClick={() => navigate("/inspections")} className="text-xs text-emerald-600 hover:underline">
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

  function handleDownloadPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = 56;

    const stripRgb = hexToRgb(stripColor);

    doc.setFillColor(6, 20, 15);
    doc.rect(0, 0, pageWidth, 64, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("DisasterGuard AI — Inspection Report", margin, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${building.id}  |  ${building.name}`, margin, 52);

    doc.setFillColor(...stripRgb);
    doc.roundedRect(pageWidth - margin - 90, 22, 90, 22, 11, 11, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(building.severity, pageWidth - margin - 45, 36, { align: "center" });

    y = 96;

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(building.name, margin, y);
    y += 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`${building.id}`, margin, y);
    y += 30;

    const colWidth = (pageWidth - margin * 2 - 16) / 2;

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, colWidth, 70, 8, 8, "FD");
    doc.roundedRect(margin + colWidth + 16, y, colWidth, 70, 8, 8, "FD");

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("RISK SCORE", margin + 14, y + 18);
    doc.text("AI CONFIDENCE", margin + colWidth + 30, y + 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...hexToRgb(riskCol.bar));
    doc.text(`${riskPct.toFixed(1)}`, margin + 14, y + 46);
    doc.setTextColor(...hexToRgb(confCol.bar));
    doc.text(`${confPct.toFixed(1)}%`, margin + colWidth + 30, y + 46);

    doc.setFillColor(226, 232, 240);
    doc.roundedRect(margin + 14, y + 54, colWidth - 28, 5, 2.5, 2.5, "F");
    doc.roundedRect(margin + colWidth + 30, y + 54, colWidth - 28, 5, 2.5, 2.5, "F");
    doc.setFillColor(...hexToRgb(riskCol.bar));
    doc.roundedRect(margin + 14, y + 54, ((colWidth - 28) * riskPct) / 100, 5, 2.5, 2.5, "F");
    doc.setFillColor(...hexToRgb(confCol.bar));
    doc.roundedRect(margin + colWidth + 30, y + 54, ((colWidth - 28) * confPct) / 100, 5, 2.5, 2.5, "F");

    y += 96;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const detectionLines = doc.splitTextToSize(building.detection, pageWidth - margin * 2 - 28);
    const detectionBoxHeight = 30 + detectionLines.length * 13;
    doc.roundedRect(margin, y, pageWidth - margin * 2, detectionBoxHeight, 8, 8, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("AI DETECTION SUMMARY", margin + 14, y + 18);

    doc.setFontSize(10.5);
    doc.setTextColor(51, 65, 85);
    doc.text(detectionLines, margin + 14, y + 34);

    y += detectionBoxHeight + 16;

    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(...hexToRgb(stripColor));
    const actionLines = doc.splitTextToSize(building.recommendedAction, pageWidth - margin * 2 - 28);
    const actionBoxHeight = 28 + actionLines.length * 14;
    doc.roundedRect(margin, y, pageWidth - margin * 2, actionBoxHeight, 8, 8, "FD");

    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(stripColor));
    doc.text("RECOMMENDED ACTION", margin + 14, y + 17);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(actionLines, margin + 14, y + 34);

    y += actionBoxHeight + 20;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Inspector: ${building.inspector}`, margin, y);
    doc.text(`${dateStr}   ${timeStr}`, pageWidth - margin, y, { align: "right" });
    y += 22;

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 8, 8, "FD");
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text(`${building.coords.lat.toFixed(4)}N, ${building.coords.lng.toFixed(4)}E`, margin + 14, y + 25);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("GPS COORDINATES", pageWidth - margin - 14, y + 25, { align: "right" });

    y += 60;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Auto-generated by DisasterGuard AI | ${generated.toLocaleString("en-IN")}`,
      pageWidth / 2,
      y,
      { align: "center" }
    );

    doc.save(`${building.id}_inspection_report.pdf`);
    showToast?.(`${building.id} report downloaded`, "success");
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
            <p className="text-sm font-bold text-slate-900 leading-tight truncate">Inspection Report</p>
            <p className="text-[11px] text-slate-400 font-mono truncate">{building.id} | {building.name}</p>
          </div>
        </div>
        <SeverityBadge severity={building.severity} />
      </div>

      {/* ── Content ── */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-5">

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden">

          <div className="h-1.5 w-full" style={{ background: stripColor }} />

          <div className="p-5 sm:p-6 flex flex-col gap-5">

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 break-words">{building.name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                  <ShieldCheck size={11} className="text-slate-400" />
                  {building.id}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-100 bg-[#F3FAF5] p-4">
                <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mb-2">
                  Risk Score
                </p>
                <p className={`text-3xl font-bold font-mono mb-3 ${riskCol.text}`}>
                  {Number(building.riskScore ?? 0).toFixed(1)}
                  <span className="text-sm text-slate-400 font-normal"> /100</span>
                </p>
                <div className="h-2 rounded-full bg-white overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${riskPct}%`, background: riskCol.bar }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-[#F3FAF5] p-4">
                <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mb-2">
                  AI Confidence
                </p>
                <p className={`text-3xl font-bold font-mono mb-3 ${confCol.text}`}>
                  {Number(building.aiConfidence ?? 0).toFixed(1)}
                  <span className="text-sm text-slate-400 font-normal">%</span>
                </p>
                <div className="h-2 rounded-full bg-white overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${confPct}%`, background: confCol.bar }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-[#F3FAF5] p-4">
              <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mb-2">
                AI Detection Summary
              </p>
              <div className="flex gap-2.5">
                <AlertTriangle
                  size={15}
                  className="shrink-0 mt-0.5"
                  style={{ color: stripColor }}
                />
                <p className="text-sm text-slate-700 leading-relaxed break-words">{building.detection}</p>
              </div>
            </div>

            <div className={`flex items-start gap-3 rounded-xl px-4 py-3.5 border ${actionStyle.bg} ${actionStyle.border}`}>
              <CheckCircle2 size={16} className={`shrink-0 mt-0.5 ${actionStyle.icon}`} />
              <div className="min-w-0">
                <p className={`text-[10px] font-mono tracking-widest uppercase mb-0.5 opacity-60 ${actionStyle.text}`}>
                  Recommended Action
                </p>
                <p className={`text-sm font-semibold break-words ${actionStyle.text}`}>
                  {building.recommendedAction}
                </p>
              </div>
            </div>
          </div>

          {/* Inspector + date footer */}
          <div className="px-5 sm:px-6 py-3.5 border-t border-emerald-100 bg-[#F3FAF5] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <User size={12} className="text-slate-400" />
              <span>Inspector:</span>
              <span className="font-semibold text-slate-700">{building.inspector}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar size={12} />
              <span>{dateStr}</span>
              <span className="font-mono">{timeStr}</span>
            </div>
          </div>
        </div>

        {/* GPS row */}
        <div className="bg-white rounded-xl border border-emerald-100 px-5 py-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={14} className="text-emerald-500" />
            <span className="font-mono text-xs text-slate-600">
              {building.coords?.lat ? Number(building.coords.lat).toFixed(4) : "0.0000"}N, {building.coords?.lng ? Number(building.coords.lng).toFixed(4) : "0.0000"}E
            </span>
          </div>
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            GPS Coordinates
          </span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex flex-col items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl py-4 transition-all"
          >
            <Download size={16} />
            Download PDF
          </button>
          <button
            onClick={() => showToast?.("Share link copied to clipboard", "info")}
            className="flex flex-col items-center gap-2 bg-white hover:bg-emerald-50 border border-emerald-100 text-slate-600 hover:text-slate-900 font-medium text-xs rounded-xl py-4 transition-all"
          >
            <Share2 size={16} />
            Share Report
          </button>
          <button
            onClick={() => {
              addNotification?.({
                type: building.severity === "DESTROYED" || building.severity === "SEVERE" ? "critical" : "info",
                title: `Report for ${building.id} (${building.name}) sent to Authority`,
                meta: `Just now | ${building.inspector}`,
                authority: true,
              });
              showToast?.("Report emailed to Authority", "success");
            }}
            className="flex flex-col items-center gap-2 bg-white hover:bg-emerald-50 border border-emerald-100 text-slate-600 hover:text-slate-900 font-medium text-xs rounded-xl py-4 transition-all"
          >
            <Mail size={16} />
            Email Authority
          </button>
        </div>

        {/* Generated stamp */}
        <p className="text-center text-[11px] text-slate-400 font-mono pb-4">
          Auto-generated by DisasterGuard AI | {generated.toLocaleString("en-IN")}
        </p>

      </div>
    </div>
  );
}
