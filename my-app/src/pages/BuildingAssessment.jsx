import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Calendar,
  Gauge,
  AlertTriangle,
  Navigation,
  ClipboardCheck,
  FileText,
  CheckCircle,
  Camera,
  Building2 as Building,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import PageHeader from "../components/PageHeader";
import SeverityBadge from "../components/SeverityBadge";
import { getDamagedBuildingSvgDataUrl, compressImageDataUrl } from "../data/mockData";

export default function BuildingAssessment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { user } = useAuth();
  const userRoles = [user?.sessionRole, user?.role].filter(Boolean);
  const isEngineer = userRoles.some(
    (r) => String(r).toLowerCase() === "engineer"
  );
  const isAuthority = userRoles.some((r) =>
    ["authority", "admin", "director", "lead", "hq"].includes(String(r).toLowerCase())
  );
  const canReview = isEngineer;
  const canGenerateReport = isEngineer || isAuthority;

  const { buildings, updateBuilding, verifyBuilding, showToast, addNotification, publicReports, updatePublicReportStatus } = useData();

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    function handleUpdate() {
      forceUpdate((prev) => prev + 1);
    }

    window.addEventListener("qg:buildingsChanged", handleUpdate);
    window.addEventListener("qg:publicReportsChanged", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("qg:buildingsChanged", handleUpdate);
      window.removeEventListener("qg:publicReportsChanged", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const publicReportMatch = (publicReports || []).find(
    (r) =>
      r.trackingId === id ||
      String(r.id) === String(id) ||
      `REP-${r.id}` === id ||
      String(r.trackingId)?.toLowerCase() === String(id)?.toLowerCase()
  );

  const mappedPublicReport = publicReportMatch ? {
    id: publicReportMatch.trackingId || `REP-${publicReportMatch.id}`,
    assessmentId: publicReportMatch.id,
    name: publicReportMatch.buildingName || `${publicReportMatch.district || "Citizen"} Damage Report`,
    zone: publicReportMatch.zone || publicReportMatch.district || "District Zone",
    severity: publicReportMatch.severity || "DESTROYED",
    riskScore: publicReportMatch.severity === "DESTROYED" ? 97.2 : publicReportMatch.severity === "SEVERE" ? 84.5 : 65.0,
    aiConfidence: 94.1,
    coords: publicReportMatch.coords || { lat: 10.9254, lng: 76.9681 },
    inspector: publicReportMatch.reporterName || "Citizen Reporter",
    reporterName: publicReportMatch.reporterName || "Citizen Reporter",
    reporterEmail: publicReportMatch.reporterEmail || publicReportMatch.contact,
    date: publicReportMatch.submittedAt || publicReportMatch.lastUpdatedAt || new Date().toISOString(),
    damagedRegion: "Left Facade & Exterior Load-Bearing Wall",
    aiDamageDescription: publicReportMatch.description || "Citizen reported structural cracks and facade damage.",
    detection: publicReportMatch.description || "Partial column failure, diagonal shear cracks on facade spalling.",
    recommendedAction: "Immediate Evacuation",
    status: publicReportMatch.status === "Resolved" ? "ENGINEER_REVIEWED" : "PROCESSING",
    imageUrl: publicReportMatch.photos?.[0]?.dataUrl || publicReportMatch.photos?.[0] || "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop",
    assignedEngineer: publicReportMatch.assignedEngineer || publicReportMatch.assignedEngineerName || (isEngineer ? user?.name : "Senior Structural Engineer"),
    assignedEngineerId: publicReportMatch.assignedEngineerId || (isEngineer ? (user?.employeeId || user?.id) : "u6"),
    assignedBy: "Authority HQ",
    aiVerified: true,
    engineerVerified: publicReportMatch.status === "Resolved" || publicReportMatch.status === "Closed",
    isPublicReport: true,
  } : null;

  const buildingMatch = buildings.find(
    (b) =>
      String(b.id) === String(id) ||
      String(b.id) === `A-${id}` ||
      String(b.assessmentId) === String(id) ||
      String(b.id).replace(/^A-/, "") === String(id).replace(/^A-/, "") ||
      String(b.buildingCode) === String(id)
  );

  const activeBuilding = mappedPublicReport || buildingMatch || {
    id: id || "DG-2026-1018",
    name: "Gandhi Nagar, Block C",
    zone: "Gandhi Nagar",
    severity: "DESTROYED",
    riskScore: 97.2,
    aiConfidence: 94.1,
    inspector: "Citizen Reporter",
    reporterName: "Citizen Reporter",
    date: new Date().toISOString(),
    damagedRegion: "Left Facade & Exterior Load-Bearing Wall",
    aiDamageDescription: "AI Spatial Scan identified diagonal shear cracking and masonry spalling on the Left Exterior Load-Bearing Wall.",
    detection: "Partial column failure, diagonal shear cracks on facade spalling.",
    recommendedAction: "Immediate Evacuation",
    status: "ENGINEER_REVIEWED",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop",
    assignedEngineerId: user?.id || "u6",
    assignedEngineer: user?.name || "Divya P",
    assignedBy: "Authority HQ",
    aiVerified: true,
    engineerVerified: true,
    isPublicReport: true,
  };

  const building = activeBuilding;

  const [engineerDecision, setEngineerDecision] = useState(
    building?.engineerDecision || "APPROVE"
  );
  const [overrideSeverity, setOverrideSeverity] = useState(
    building?.severity || "MODERATE"
  );
  const [recommendation, setRecommendation] = useState(
    building?.engineerRecommendation || building?.recommendedAction || "Detailed Structural Inspection"
  );
  const [priority, setPriority] = useState(building?.priority || "High");
  const [remarks, setRemarks] = useState(building?.engineerRemarks || "");

  const [completionImage, setCompletionImage] = useState(building?.completionImage || null);
  const [completionRemarks, setCompletionRemarks] = useState(building?.completionRemarks || "");

  function handleCompletionImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCompletionImage(reader.result);
      showToast("Completion site photo loaded successfully!", "success");
    };
    reader.readAsDataURL(file);
  }

  function handleInspectorPhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target.result;
      if (dataUrl) {
        const compressed = await compressImageDataUrl(dataUrl, 900, 0.65);
        updateBuilding(building.id, {
          imageUrl: compressed,
          images: [compressed],
          image: compressed,
        });
        showToast("📸 Field Inspector photo uploaded & saved successfully!", "success");
      }
    };
    reader.readAsDataURL(file);
  }

  function submitWorkCompletion() {
    if (!canReview) {
      showToast("Only assigned engineers can submit work completion", "error");
      return;
    }

    const exactTimestamp = `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const completionPayload = {
      status: "COMPLETED",
      workCompleted: true,
      completionDate: exactTimestamp,
      completionImage: completionImage || building?.imageUrl,
      completionRemarks: completionRemarks || "On-site structural repairs and safety reinforcement completed.",
      completedBy: user?.name || user?.email || "Lead Engineer",
    };

    updateBuilding(building.id, completionPayload);

    // 1. Dispatch High-Priority Notification to Authority HQ
    addNotification({
      type: "success",
      title: `🎉 Repair Work Completed: Lead Engineer ${user?.name || "Engineer"} completed on-site structural repairs for "${building.name || building.id}". Status: COMPLETED.`,
      meta: exactTimestamp,
      targetRole: "Authority",
      authority: true,
      roles: ["Authority"],
      buildingId: building.id,
      targetPath: `/assessment/${building.id}`,
    });

    // 2. Dispatch Notification to Field Inspector who uploaded site photos
    addNotification({
      type: "success",
      title: `✅ Structural Work Completed: Engineer ${user?.name || "Engineer"} completed repair works for "${building.name || building.id}". Site photos attached.`,
      meta: exactTimestamp,
      targetRole: "Field Inspector",
      roles: ["Field Inspector"],
      inspectorName: building.inspector,
      buildingId: building.id,
      targetPath: `/assessment/${building.id}`,
    });

    // 3. If linked to a Public Citizen Report, resolve it and notify the citizen!
    if (publicReports && publicReports.length > 0) {
      const matchReport = publicReports.find(
        (pr) =>
          (building.name && pr.buildingName?.toLowerCase().includes(building.name?.toLowerCase())) ||
          pr.trackingId === building.id ||
          (user?.name && pr.assignedEngineer?.toLowerCase().includes(user?.name?.toLowerCase()))
      );
      if (matchReport) {
        updatePublicReportStatus?.(
          matchReport.id,
          "Resolved",
          `Structural repairs completed on-site by Senior Structural Engineer ${user?.name || "Engineer"}.`
        );
        addNotification({
          type: "success",
          title: `✅ Issue Resolved: Structural repair works for "${building.name}" have been fully completed by Senior Engineer ${user?.name || "Engineer"}.`,
          meta: exactTimestamp,
          targetRole: "Citizen",
          roles: ["Citizen"],
          reporterEmail: matchReport.reporterEmail,
          reportId: matchReport.id,
          targetPath: `/citizen/report`,
        });
      }
    }

    showToast("🎉 Work completion & site photos submitted to Authority HQ!", "success");
  }

  if (!building) {
    return (
      <div className="h-full flex flex-col bg-[#F3FAF5]">
        <PageHeader title="Building Record" subtitle={id || "Assessment"} />
        <div className="p-7 max-w-xl mx-auto text-center">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="font-bold text-slate-800 mb-2">Building Assessment Record ({id})</p>
            <p className="text-xs text-slate-500 mb-5">
              The requested building assessment is currently being processed or has been updated.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 mx-auto"
            >
              <ArrowLeft size={14} /> Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = building.date
    ? new Date(building.date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently Updated";

  function generateReport() {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("STRUCTURAL DAMAGE REPORT", 20, 20);

  doc.setFontSize(12);
  doc.text(`Building ID: ${building.id}`, 20, 40);
  doc.text(`Building Name: ${building.name}`, 20, 50);
  doc.text(`Zone: ${building.zone}`, 20, 60);
  doc.text(`Inspector: ${building.inspector}`, 20, 70);
  doc.text(`Severity: ${building.severity}`, 20, 80);
  doc.text(`Risk Score: ${building.riskScore}`, 20, 90);
  doc.text(`AI Confidence: ${building.aiConfidence}%`, 20, 100);

  doc.text("AI Detection:", 20, 120);
  doc.text(building.detection || "-", 20, 130, { maxWidth: 170 });

  doc.text("Recommended Action:", 20, 160);
  doc.text(building.recommendedAction || "-", 20, 170, {
    maxWidth: 170,
  });

  doc.text("Engineer Review", 20, 190);
  doc.text(`Decision: ${engineerDecision}`, 20, 200);
  doc.text(`Recommendation: ${recommendation}`, 20, 210);
  doc.text(`Priority: ${priority}`, 20, 220);

  if (remarks) {
    doc.text(`Remarks: ${remarks}`, 20, 230, {
      maxWidth: 170,
    });
  }

  doc.text(
    `Generated By: ${user?.name || user?.email || "Unknown"}`,
    20,
    250
  );

  doc.text(
    `Generated On: ${new Date().toLocaleString()}`,
    20,
    260
  );

  doc.save(`${building.id}-structural-report.pdf`);

  showToast("Report generated & saved successfully", "success");
}
  function submitEngineerReview() {
    if (!canReview) {
      showToast("Only engineers or authority staff can review", "error");
      return;
    }

    const exactTimestamp = `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const reviewPayload = {
      severity:
        engineerDecision === "OVERRIDE"
          ? overrideSeverity
          : building.severity,
      engineerDecision,
      engineerRecommendation: recommendation,
      recommendedAction: recommendation,
      priority,
      engineerRemarks: remarks,
      reviewedBy: user?.name || user?.email || "Engineer",
      reviewDate: exactTimestamp,
      status: "ENGINEER_REVIEWED",
      engineerVerified: true,
      aiVerified: true,
    };

    const isAlreadyVerified = Boolean(building?.engineerVerified || building?.status === "ENGINEER_REVIEWED");

    if (verifyBuilding) {
      verifyBuilding(building.id, reviewPayload);
    } else {
      updateBuilding(building.id, reviewPayload);
    }

    showToast(
      isAlreadyVerified
        ? "Updated engineer verification & notified Authority!"
        : "Human engineer verification saved & submitted to Authority",
      "success"
    );
    navigate("/dashboard");
  }

  return (
    <div className="h-full overflow-y-auto bg-[#F3FAF5]">
      <PageHeader title={building.id} subtitle={building.name} />

      <div className="p-5 sm:p-8 max-w-7xl mx-auto flex flex-col gap-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors w-fit"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white border border-emerald-100 rounded-xl p-5 sm:p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-slate-400 text-xs font-mono tracking-widest uppercase mb-1">
                    {building.id}
                  </p>

                  <h2 className="text-lg font-semibold text-slate-900">
                    {building.name}
                  </h2>

                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      {building.zone}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={13} />
                      {building.inspector}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      {formattedDate}
                    </div>
                  </div>
                </div>

                <SeverityBadge severity={building.severity} />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-emerald-50">
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-red-500 font-mono">
                    Risk Score
                  </p>
                  <p className="text-2xl font-bold text-red-600 font-mono">
                    {building.riskScore != null ? Number(building.riskScore).toFixed(1) : "88.5"}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-blue-500 font-mono">
                    AI Confidence
                  </p>
                  <p className="text-2xl font-bold text-blue-600 font-mono">
                    {building.aiConfidence != null ? Number(building.aiConfidence).toFixed(1) : "92.4"}%
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-emerald-500 font-mono">
                    Status
                  </p>
                  <p className="text-lg font-bold text-slate-700 font-mono">
                    {building.status || "PROCESSING"}
                  </p>
                </div>
              </div>
            </div>

            {/* 1. DYNAMIC DAMAGED BUILDING PHOTO CARD (CITIZEN OR FIELD INSPECTOR) */}
            {(() => {
              const isCitizenReport = Boolean(
                building.isPublicReport ||
                building.reporterName ||
                building.reporterEmail ||
                String(building.id).startsWith("REP-")
              );
              const uploaderName = isCitizenReport
                ? (building.reporterName || building.inspector || "Citizen Reporter")
                : (building.inspector || building.inspectorName || "Field Inspector");

              const cardHeaderTitle = isCitizenReport
                ? "Citizen Uploaded Damaged Building Photo"
                : "Field Inspector Uploaded Damaged Building Photo";

              const overlayText = isCitizenReport
                ? `Uploaded by Citizen: ${uploaderName}`
                : `Uploaded by Field Inspector: ${uploaderName}`;

              const captionText = isCitizenReport
                ? `Original damaged building image captured and submitted during citizen damage report by ${uploaderName}.`
                : `Original damaged building image captured during ground field inspection by Inspector ${uploaderName}.`;

              return (
                <div className="bg-white border-2 border-red-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                      {cardHeaderTitle}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Camera size={13} />
                        Upload / Replace Photo
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleInspectorPhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <span className="text-xs font-mono font-bold bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full">
                        {building.severity || "DESTROYED"}
                      </span>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 h-64 min-h-[220px]">
                    <img
                      src={
                        (building.imageUrl && !building.imageUrl.startsWith("/") && String(building.imageUrl).trim() !== "" ? building.imageUrl : null) ||
                        (building.images && Array.isArray(building.images) && building.images.length > 0 && !building.images[0].startsWith("/") ? building.images[0] : null) ||
                        (building.image && !building.image.startsWith("/") && String(building.image).trim() !== "" ? building.image : null) ||
                        getDamagedBuildingSvgDataUrl(building.name || "Building Site", building.severity || "DESTROYED", building.id || "B-042")
                      }
                      alt={cardHeaderTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getDamagedBuildingSvgDataUrl(building.name, building.severity, building.id);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs z-10">
                      <span className="font-mono bg-red-950/80 px-2.5 py-1 rounded border border-red-500/40 text-xs font-bold">
                        {overlayText}
                      </span>
                      <span className="font-mono bg-slate-900/80 px-2 py-0.5 rounded text-[10px]">
                        Site ID: {building.id}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    {captionText}
                  </p>
                </div>
              );
            })()}

            {/* 2. AUTHORITY ASSIGNED CONCERNED ENGINEER CARD */}
            {(() => {
              const displayEngName = isEngineer ? (user?.name || "Divya P") : (building.assignedEngineer || building.assignedEngineerName || "Senior Structural Engineer");
              const displayEngId = isEngineer ? (user?.employeeId || user?.id || "u6") : (building.assignedEngineerId || "DG-002");
              return (
                <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck size={18} className="text-blue-600" />
                      Authority Assigned Concerned Structural Engineer
                    </h3>
                    <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                      ASSIGNED BY AUTHORITY HQ
                    </span>
                  </div>

                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-base shadow-md shadow-blue-600/20 uppercase">
                        {displayEngName ? displayEngName[0] : "D"}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm capitalize">
                          {displayEngName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          Employee ID: {displayEngId} | Zone: {building.zone || "Zone A"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                      ✓ Lead Assigned Engineer
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* SEPARATE AI DAMAGED BUILDING REGION ANALYSIS SECTION */}
            <div className="bg-white border-2 border-emerald-300 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between gap-3 border-b border-emerald-100 pb-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
                    <Building size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      AI Regional Building Damage Breakdown
                    </h3>
                    <p className="text-xs text-slate-500">
                      Spatial AI Neural Scan — Zone-by-Zone Damage Analysis
                    </p>
                  </div>
                </div>

                <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold px-3 py-1 rounded-full">
                  AI Confidence {building.aiConfidence != null ? Number(building.aiConfidence).toFixed(1) : "92.4"}%
                </span>
              </div>

              {/* SEPARATE REGION CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. PRIMARY DAMAGED REGION BLOCK */}
                <div className="bg-red-50/80 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-xs font-bold text-red-900 uppercase font-mono tracking-wider">
                      Primary Damaged Region
                    </span>
                  </div>
                  <p className="text-base font-extrabold text-red-700">
                    {building.damagedRegion || "Left Facade & Exterior Load-Bearing Wall"}
                  </p>
                  <p className="text-xs text-red-800/80 mt-1 font-medium">
                    Concentrated structural stress zone identified by spatial high-pass edge tensor.
                  </p>
                </div>

                {/* 2. SECONDARY AFFECTED ZONE BLOCK */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-amber-900 uppercase font-mono tracking-wider">
                      Secondary Affected Zone
                    </span>
                  </div>
                  <p className="text-base font-extrabold text-amber-700">
                    {building.secondaryDamagedRegion || "Upper Roof & Parapet Wall Structural Section"}
                  </p>
                  <p className="text-xs text-amber-800/80 mt-1 font-medium">
                    Adjacent structural displacement and load redistribution risk zone.
                  </p>
                </div>
              </div>

              {/* 3. REGIONAL ANALYSIS DESCRIPTION BLOCK */}
              <div className="bg-[#F3FAF5] border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={15} className="text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-900 uppercase font-mono tracking-wider font-mono">
                    AI Regional Structural Analysis Description
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {building.aiDamageDescription || building.detection || "AI Spatial Scan identified diagonal shear cracking and masonry spalling on the Left Exterior Load-Bearing Wall. Structural integrity is compromised across mid-level floor joints."}
                </p>
              </div>
            </div>

            {/* DUAL VERIFICATION CARD: AI Assessment vs Human Engineer Sign-off */}
            <div className="bg-white border-2 border-emerald-200 rounded-xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Dual Verification Panel (AI + Human Decision)
                  </h3>
                </div>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  building.engineerVerified || building.status === "ENGINEER_REVIEWED"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}>
                  {building.engineerVerified || building.status === "ENGINEER_REVIEWED" ? "✓ Verified by Engineer" : "⚠ Awaiting Human Sign-off"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI Verdict Column */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-900 uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                      1. AI Spatial Neural Assessment
                    </span>
                    <span className="text-[10px] font-bold bg-blue-200 text-blue-950 px-2 py-0.5 rounded-full font-mono">
                      Confidence {building.aiConfidence != null ? Number(building.aiConfidence).toFixed(1) : "92.4"}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1.5">
                    <p><strong>Detected Damage:</strong> {building.detection || "Structural shear cracks & masonry spalling detected."}</p>
                    <p>
                      <strong>AI Risk Index:</strong> <span className="font-bold text-blue-800">{building.riskScore != null ? Number(building.riskScore).toFixed(1) : "88.5"} / 100</span>
                    </p>
                    <p><strong>AI Severity Class:</strong> <span className="font-extrabold text-blue-900">{building.severity || "MODERATE"}</span></p>

                    {/* AI Neural Diagnostics Matrix */}
                    <div className="mt-2.5 pt-2 border-t border-blue-200/60 grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      <div className="bg-white/80 rounded px-2 py-1 border border-blue-100">
                        <span className="text-slate-400 block">Edge Tensor</span>
                        <span className="font-bold text-blue-800">96.4% Crack Fissure</span>
                      </div>
                      <div className="bg-white/80 rounded px-2 py-1 border border-blue-100">
                        <span className="text-slate-400 block">Load Capacity</span>
                        <span className="font-bold text-red-600">28.4% Remaining</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Human Engineer Column */}
                <div className={`border rounded-xl p-4 flex flex-col gap-2 ${
                  building.engineerVerified || building.status === "ENGINEER_REVIEWED"
                    ? "bg-emerald-50/70 border-emerald-300"
                    : "bg-amber-50/70 border-amber-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-800 uppercase">2. Human Engineer Verification</span>
                    {building.reviewedBy && (
                      <span className="text-[10px] font-semibold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">Signed Off</span>
                    )}
                  </div>

                  {building.engineerVerified || building.status === "ENGINEER_REVIEWED" ? (
                    <div className="text-xs text-slate-700 space-y-1">
                      <p><strong>Verified By:</strong> <span className="font-bold text-slate-900 capitalize">{isEngineer ? (user?.name || "divya") : (building.reviewedBy || building.assignedEngineer || "Lead Engineer")}</span></p>
                      <p><strong>Decision:</strong> <span className="font-bold text-emerald-800">{building.engineerDecision || "APPROVED"}</span></p>
                      <p><strong>Recommendation:</strong> {building.engineerRecommendation || building.recommendedAction}</p>
                      {building.engineerRemarks && <p><strong>Remarks:</strong> {building.engineerRemarks}</p>}
                      <p className="text-[10px] text-slate-400 mt-2"><strong>Exact Timestamp:</strong> {building.reviewDate || formattedDate}</p>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-800 py-2">
                      <p className="font-semibold capitalize">Assigned Engineer: {isEngineer ? (user?.name || "divya") : (building.assignedEngineer || "Pending Assignment")}</p>
                      <p className="text-[11px] text-amber-700 mt-1">AI decision requires human engineer verification and digital sign-off.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-3">
                <AlertTriangle size={15} className="text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Recommended Action
                </h3>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {recommendation || building.engineerRecommendation || building.recommendedAction}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white border border-emerald-100 rounded-xl p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <Navigation size={15} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Location
                </h3>
              </div>

              <div className="rounded-xl bg-[#F3FAF5] border border-emerald-100 px-4 py-3 flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-wide text-slate-400 font-mono">
                  Concerned Address (Words)
                </p>
                <p className="text-sm text-slate-800 font-medium leading-relaxed">
                  {building.address ? (
                    typeof building.address === "string"
                      ? building.address
                      : `${building.address.village || building.name}, ${building.address.locality || building.zone}, ${building.address.taluk || "Coimbatore South"}, ${building.address.district || "Coimbatore"} District, ${building.address.state || "Tamil Nadu"} - ${building.address.pincode || "641008"}`
                  ) : (
                    `${building.name}, ${building.zone}, Coimbatore South Taluk, Coimbatore District, Tamil Nadu - 641008`
                  )}
                </p>
              </div>
            </div>

            {canReview ? (
              <div className="bg-white border border-emerald-100 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5 border-b border-emerald-100 pb-3">
                  <ClipboardCheck size={20} className="text-emerald-600" />
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Engineer On-Site Inspection & Repair Sidebar
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Structural Verification & On-Site Repair Management
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setEngineerDecision("APPROVE")}
                      className={`rounded-xl py-2 font-semibold ${
                        engineerDecision === "APPROVE"
                          ? "bg-green-600 text-white"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      Approve AI
                    </button>

                    <button
                      onClick={() => setEngineerDecision("OVERRIDE")}
                      className={`rounded-xl py-2 font-semibold ${
                        engineerDecision === "OVERRIDE"
                          ? "bg-orange-600 text-white"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      Override AI
                    </button>
                  </div>

                  {/* 1. DAMAGE LEVEL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-1.5">
                      Damage Level
                    </label>
                    <select
                      value={overrideSeverity}
                      onChange={(e) => setOverrideSeverity(e.target.value)}
                      disabled={engineerDecision === "APPROVE"}
                      className={`w-full border rounded-xl p-3 text-sm font-semibold transition-all ${
                        engineerDecision === "APPROVE"
                          ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-white border-emerald-300 text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                      }`}
                    >
                      <option value="MINOR">Minor Damage (Level 1)</option>
                      <option value="MODERATE">Moderate Damage (Level 2)</option>
                      <option value="SEVERE">Severe Damage (Level 3)</option>
                      <option value="DESTROYED">Destroyed / Catastrophic (Level 4)</option>
                    </select>
                    {engineerDecision === "APPROVE" && (
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">
                        Locked to AI Severity ({building.severity}). Click <strong>Override AI</strong> to adjust.
                      </p>
                    )}
                  </div>

                  {/* 2. OCCUPANCY STATUS */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-1.5">
                      Occupancy Status
                    </label>
                    <select
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-800 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    >
                      <option value="Safe for Occupancy">Safe for Occupancy</option>
                      <option value="Minor Repair Required">Minor Repair Required</option>
                      <option value="Detailed Structural Inspection">Detailed Structural Inspection Required</option>
                      <option value="Limited Entry Allowed">Limited Entry Allowed</option>
                      <option value="Restricted / Unsafe">Restricted / Unsafe</option>
                      <option value="Immediate Evacuation">Immediate Evacuation Required</option>
                      <option value="Demolition Recommended">Demolition Recommended</option>
                    </select>
                  </div>

                  {/* 3. RISK LEVEL / PRIORITY */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-1.5">
                      Risk Level / Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-800 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                      <option value="Critical">Critical Risk</option>
                    </select>
                  </div>

                  {/* 4. ENGINEER REMARKS */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-1.5">
                      Engineer Remarks & Notes
                    </label>
                    <textarea
                      rows={4}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter professional structural engineering assessment remarks..."
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 bg-white resize-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>

                  <button
                    onClick={generateReport}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
                  >
                    <FileText size={18} />
                    Generate Structural Report
                  </button>

                  <button
                    onClick={submitEngineerReview}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <CheckCircle size={18} />
                    {building?.engineerVerified || building?.status === "ENGINEER_REVIEWED"
                      ? "Update Review & Notify Authority"
                      : "Submit to Authority"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-emerald-100 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ClipboardCheck size={18} className="text-emerald-600" />
                  <h3 className="font-bold text-slate-800">
                    Engineer Verification & On-Site Completion Status
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-400 uppercase tracking-wider text-[10px]">Assigned Engineer</span>
                      <span className="font-bold text-slate-900 text-sm">{building.assignedEngineer || building.reviewedBy || "Swetha S"}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                      <span className="font-mono text-slate-400 uppercase tracking-wider text-[10px]">Verification Status</span>
                      <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                        building.status === "COMPLETED" || building.workCompleted
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : building.engineerVerified || building.status === "ENGINEER_REVIEWED"
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}>
                        {building.status === "COMPLETED" || building.workCompleted
                          ? "✓ On-Site Repair Completed & Verified"
                          : building.engineerVerified || building.status === "ENGINEER_REVIEWED"
                          ? "✓ Review Verified (Repairs In Progress)"
                          : "⏳ Pending Engineer Sign-off"}
                      </span>
                    </div>

                    {/* ON-SITE RESTORED BUILDING PHOTO PREVIEW FOR AUTHORITY */}
                    {(building.status === "COMPLETED" || building.completionImage) && (
                      <div className="border-t border-slate-200 pt-2.5 space-y-1.5">
                        <span className="font-mono text-emerald-700 uppercase tracking-wider text-[10px] font-bold block">
                          On-Site Restored Building Site Photo
                        </span>
                        <img
                          src={building.completionImage || building.imageUrl}
                          alt="On-Site Restored Building"
                          className="w-full h-40 object-cover rounded-xl border-2 border-emerald-300 shadow-sm"
                        />
                        {building.completionDate && (
                          <p className="text-[10px] text-slate-500 font-mono">
                            Completed On: {building.completionDate}
                          </p>
                        )}
                      </div>
                    )}

                    {building.engineerRemarks && (
                      <div className="border-t border-slate-200 pt-2">
                        <span className="font-mono text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Engineer Remarks</span>
                        <p className="text-slate-700 italic font-medium">{building.engineerRemarks}</p>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    ℹ️ Structural damage reviews and AI overrides are restricted to assigned Lead Structural Engineers. Authority HQ maintains oversight & official PDF download permissions.
                  </p>

                  <button
                    onClick={generateReport}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all shadow-sm mt-2"
                  >
                    <FileText size={18} />
                    Download Official Structural PDF Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}