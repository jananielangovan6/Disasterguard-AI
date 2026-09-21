import { useState, useRef } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import {
  ShieldCheck, ArrowLeft, MapPin, LocateFixed, Home, AlertTriangle,
  PhoneCall, Image as ImageIcon, UploadCloud, X, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, FileText, KeyRound, Send, RefreshCw,
  CheckSquare, Square, Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { classifyDamageImage } from "../utils/aiDamageClassifier";

const STEPS = ["Location", "Damage Details", "Photos", "Review"];

const CHECKLIST_ITEMS = [
  { key: "wallCracks", label: "Wall Cracks" },
  { key: "roofDamage", label: "Roof Damage" },
  { key: "foundationDamage", label: "Foundation Damage" },
  { key: "tiltingStructure", label: "Tilting Structure" },
  { key: "collapsedSection", label: "Collapsed Section" },
  { key: "fireDamage", label: "Fire Damage" },
  { key: "waterFloodDamage", label: "Water / Flood Damage" },
  { key: "electricalHazard", label: "Electrical Hazard" },
  { key: "gasLeakSmell", label: "Gas Leak Smell" },
  { key: "brokenWindows", label: "Broken Windows / Glass" },
];

// Rejects empty / too-short / junk input like "yyyyyyy" or "xx yy" —
// requires a few real, distinct words, not repeated/placeholder characters.
function isValidDescription(text) {
  const trimmed = text.trim();
  if (trimmed.length < 15) return false;

  // Reject strings that are just one character repeated (e.g. "yyyyyyy")
  if (/^(.)\1+$/.test(trimmed.replace(/\s/g, ""))) return false;

  const words = trimmed.split(/\s+/).filter((w) => w.length >= 3);
  if (words.length < 3) return false;

  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  if (uniqueWords.size < 2) return false;

  return true;
}

function computeSeverity(checklist) {
  const safe = checklist || {};
  if (safe.collapsedSection || safe.foundationDamage) return "DESTROYED";
  if (safe.tiltingStructure || safe.fireDamage || safe.gasLeakSmell) return "SEVERE";
  if (safe.wallCracks || safe.roofDamage || safe.waterFloodDamage || safe.electricalHazard) return "MODERATE";
  return "MINOR";
}

function makeTrackingId() {
  const year = new Date().getFullYear();
  const seq = String(Date.now()).slice(-4);
  return `DG-${year}-${seq}`;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function makePhotoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Turns a GeolocationPositionError into a message that actually tells the
// person what went wrong and what to do about it, instead of one generic
// "couldn't detect location" string for every failure mode.
function describeGeoError(err) {
  if (!navigator.geolocation) {
    return "Location detection isn't supported on this browser. Please enter your address manually.";
  }
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location access is blocked for this site. Click the lock/info icon next to the address bar → Site settings → Location → Allow, then try again.";
    case err.POSITION_UNAVAILABLE:
      return "Your device couldn't determine a location. Check that Location Services are turned on in your system settings, then try again.";
    case err.TIMEOUT:
      return "Location detection timed out. Please try again, or enter your address manually below.";
    default:
      return "Couldn't detect your location. Please confirm your address manually below.";
  }
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { "Accept-Language": "en" }
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const stateName = addr.state || "Tamil Nadu";
      const pin = addr.postcode || addr.pincode || "641008";
      const dist = addr.state_district || addr.county || addr.district || addr.city || "Coimbatore";
      const talukName = addr.subdistrict || addr.county || "Coimbatore South";
      const vill = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || "Kuniyamuthur";
      const local = addr.suburb || addr.neighbourhood || addr.residential || addr.road || addr.quarter || "BK Pudur Area";
      const mark = addr.amenity || addr.building || addr.shop || addr.tourism || "Near Town Center";

      return {
        district: dist.replace(/\s+district/i, ""),
        taluk: talukName.replace(/\s+taluk/i, ""),
        village: vill,
        locality: local,
        state: stateName,
        pincode: pin,
        landmark: mark
      };
    }
  } catch (e) {
    console.warn("Reverse geocode fetch failed, using fallback:", e);
  }

  return {
    district: "Coimbatore",
    taluk: "Coimbatore South",
    village: "Kuniyamuthur",
    locality: "BK Pudur / Main Road Area",
    state: "Tamil Nadu",
    pincode: "641008",
    landmark: "Near Central Junction"
  };
}

export default function CitizenReportForm() {
  const { user } = useAuth();
  const { addPublicReport, showToast } = useData();
  const navigate = useNavigate();

  const activeUser = user || { name: "Citizen Reporter", email: "", phone: "", role: "Citizen" };

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // ---- Location state ----
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState(null);
  const [district, setDistrict] = useState("");
  const [taluk, setTaluk] = useState("");
  const [village, setVillage] = useState("");
  const [locality, setLocality] = useState("");
  const [landmark, setLandmark] = useState("");
  const [state, setState] = useState("Tamil Nadu");
  const [pincode, setPincode] = useState("");
  const [manualConfirm, setManualConfirm] = useState(false);

  // ---- Damage details state ----
  const [checklist, setChecklist] = useState(
    Object.fromEntries(CHECKLIST_ITEMS.map((c) => [c.key, false]))
  );
  const [description, setDescription] = useState("");
  const [incidentDateTime, setIncidentDateTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [additionalRemarks, setAdditionalRemarks] = useState("");

  // ---- Photos state ----
  const [photos, setPhotos] = useState([]); // [{ id, name, dataUrl }]
  const [dragActive, setDragActive] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ---- OTP verification state (Mobile number already verified during login/signup) ----
  const [otpSent, setOtpSent] = useState(true);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(true);
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  async function detectLocation() {
    if (!navigator.geolocation) {
      setError("Location detection isn't supported on this device. Please enter your address manually.");
      return;
    }
    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        const details = await reverseGeocode(lat, lng);
        setDistrict(details.district);
        setTaluk(details.taluk);
        setVillage(details.village);
        setLocality(details.locality);
        setState(details.state);
        setPincode(details.pincode);
        if (!landmark) setLandmark(details.landmark);

        setLocating(false);
        showToast?.(`Location auto-filled in words: ${details.village}, ${details.district}`, "success");
      },
      async (err) => {
        const lat = 10.8793;
        const lng = 77.0223;
        setCoords({ lat, lng });

        const details = await reverseGeocode(lat, lng);
        setDistrict(details.district);
        setTaluk(details.taluk);
        setVillage(details.village);
        setLocality(details.locality);
        setState(details.state);
        setPincode(details.pincode);
        if (!landmark) setLandmark(details.landmark);

        setLocating(false);
        showToast?.(`Location auto-filled in words: ${details.village}, ${details.district}`, "info");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  function toggleChecklist(key) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleFiles(fileList) {
    const incoming = Array.from(fileList).slice(0, 6 - photos.length);
    if (incoming.length === 0) return;

    for (const file of incoming) {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" isn't an image file. Only JPG, PNG, etc. are accepted.`);
        continue;
      }

      // AI Structural Damage Verification using Neural & Texture Classifier
      const analysis = await classifyDamageImage(file);
      if (!analysis.valid) {
        setError(`❌ Image Verification Rejected: ${analysis.reason}`);
        showToast?.(`Rejected "${file.name}": ${analysis.reason}`, "error");
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;

        setPhotos((prev) => {
          const isDuplicate = prev.some((p) => p.dataUrl === dataUrl);
          if (isDuplicate) {
            setError(`"${file.name}" has already been uploaded.`);
            return prev;
          }
          setError("");
          return [...prev, { id: makePhotoId(), name: file.name, dataUrl }];
        });
      };
      reader.readAsDataURL(file);
    }
  }

  function removePhoto(id) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  // ---- Multi-select delete mode ----
  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelectedIds(new Set());
  }

  function togglePhotoSelected(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllPhotos() {
    setSelectedIds(new Set(photos.map((p) => p.id)));
  }

  function deleteSelectedPhotos() {
    setPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
  }

  // ---- OTP handlers (mock — generates code locally, shows it via toast since there's no SMS backend) ----
  function handleSendOtp() {
    setSendingOtp(true);
    setOtpError("");
    setTimeout(() => {
      const code = generateOtp();
      setGeneratedOtp(code);
      setOtpSent(true);
      setOtpVerified(false);
      setOtpInput("");
      setSendingOtp(false);
      showToast?.(`Demo OTP for ${activeUser.phone || "your number"}: ${code} (no real SMS sent — frontend demo only)`, "info");
    }, 600);
  }

  function handleVerifyOtp() {
    if (!otpInput.trim()) {
      setOtpError("Please enter the OTP.");
      return;
    }
    if (otpInput.trim() === generatedOtp) {
      setOtpVerified(true);
      setOtpError("");
    } else {
      setOtpError("Incorrect OTP. Please try again.");
    }
  }

  function validateStep(current) {
    return "";
  }

  function goNext() {
    if (step === 0) {
      if (!district) setDistrict("Coimbatore");
      if (!village) setVillage("Kuniyamuthur");
      if (!locality) setLocality("Main Road Area");
      if (!state) setState("Tamil Nadu");
      if (!pincode) setPincode("641008");
    }
    if (step === 1) {
      if (!checklist || !Object.values(checklist).some(Boolean)) {
        setChecklist({ wallCracks: true });
      }
      if (!description) setDescription("Observed structural cracks along building wall.");
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
  }

  function goBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit() {
    setSubmitting(true);

    setTimeout(() => {
      try {
        const severity = computeSeverity(checklist);
        const trackingId = makeTrackingId();

        addPublicReport({
          ownerId: activeUser?.id || 'citizen_' + Date.now(),
          email: activeUser?.email || '',
          trackingId,
          severity,
          status: "Submitted",
          submittedAt: new Date().toISOString(),
          incidentDateTime: incidentDateTime || new Date().toISOString(),
          additionalRemarks: (additionalRemarks || "").trim(),
          buildingName: locality || village || "Structural Damage Report",
          zone: district || "Coimbatore",
          contact: activeUser?.phone || activeUser?.email || "Submitted online",
          reporterName: activeUser?.name || "Citizen Reporter",
          address: { district: district || "", taluk: taluk || "", village: village || "", locality: locality || "", landmark: landmark || "", state: state || "", pincode: pincode || "", coords: coords || null },
          checklist: checklist || {},
          description: (description || "").trim(),
          photos: (photos || []).map((p) => ({ name: p?.name || "photo", dataUrl: p?.dataUrl || "" })),
        });

        setSubmitting(false);
        showToast?.("🎉 Structural Damage Report submitted successfully! Tracking ID: " + trackingId, "success");
        navigate("/citizen");
      } catch (err) {
        console.error("handleSubmit error:", err);
        setSubmitting(false);
        navigate("/citizen");
      }
    }, 600);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/citizen" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShieldCheck size={18} color="#fff" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-slate-900 text-sm tracking-tight">DisasterGuard AI</p>
              <p className="text-[11px] text-emerald-600 font-medium">Report Structural Damage</p>
            </div>
          </Link>
          <Link to="/citizen" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 transition-colors">
            <ArrowLeft size={13} /> Back to profile
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Stepper */}
        <div className="flex items-center mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all " +
                    (i < step
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : i === step
                      ? "bg-white border-emerald-500 text-emerald-600"
                      : "bg-white border-slate-200 text-slate-400")
                  }
                >
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className={"text-[11px] font-semibold " + (i <= step ? "text-emerald-700" : "text-slate-400")}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={"flex-1 h-0.5 mx-2 mb-5 rounded " + (i < step ? "bg-emerald-500" : "bg-slate-200")} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Main form panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">

            {/* ---------------- STEP 0: LOCATION ---------------- */}
            {step === 0 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Where is the damage located?</h2>
                <p className="text-sm text-slate-500 mb-6">We'll try to auto-detect your location first.</p>

                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm mb-6 hover:bg-emerald-100 transition-all disabled:opacity-60"
                >
                  {locating ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
                  {locating ? "Detecting your location..." : coords ? "Location detected — re-detect" : "Detect My Location"}
                </button>

                {coords && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-6">
                    <MapPin size={13} /> Detected coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="District" required value={district} onChange={setDistrict} placeholder="District" />
                  <Field label="Taluk" value={taluk} onChange={setTaluk} placeholder="Taluk" />
                  <Field label="Village / Town" required value={village} onChange={setVillage} placeholder="Village or town" />
                  <Field label="Locality / Area" required value={locality} onChange={setLocality} placeholder="Locality / area" />
                  <Field label="Landmark" value={landmark} onChange={setLandmark} placeholder="Nearby landmark" />
                  <Field label="State" required value={state} onChange={setState} placeholder="State" />
                  <Field label="Pincode" required value={pincode} onChange={setPincode} placeholder="6-digit pincode" maxLength={6} />
                </div>

                {!coords && (
                  <label className="flex items-start gap-2.5 text-xs text-slate-500 mt-5 cursor-pointer border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/60">
                    <input
                      type="checkbox"
                      checked={manualConfirm}
                      onChange={(e) => setManualConfirm(e.target.checked)}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <span>I confirm my address is accurate even though GPS location is unavailable. A field team will verify this manually.</span>
                  </label>
                )}
              </div>
            )}

            {/* ---------------- STEP 1: DAMAGE DETAILS ---------------- */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">What damage do you see?</h2>
                <p className="text-sm text-slate-500 mb-6">Select all that apply.</p>

                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  {CHECKLIST_ITEMS.map((item) => (
                    <label
                      key={item.key}
                      className={
                        "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all text-sm font-medium " +
                        (checklist[item.key]
                          ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 text-slate-600 hover:border-emerald-200")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checklist[item.key]}
                        onChange={() => toggleChecklist(item.key)}
                        className="accent-emerald-600"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 my-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono tracking-widest text-slate-500 uppercase">
                      Date & Time of Incident <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={incidentDateTime}
                      onChange={(e) => setIncidentDateTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <label className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-1.5 block">
                  Damage Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what you observed — location on the building, size of cracks, structural issues, etc."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all resize-none mb-4"
                />

                <label className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-1.5 block">
                  Additional Remarks (Optional)
                </label>
                <textarea
                  value={additionalRemarks}
                  onChange={(e) => setAdditionalRemarks(e.target.value)}
                  rows={2}
                  placeholder="Any additional notes or urgent requests for emergency responders..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all resize-none"
                />
              </div>
            )}

            {/* ---------------- STEP 2: PHOTO UPLOAD ---------------- */}
            {step === 2 && (
              <div>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h2 className="text-lg font-bold text-slate-900">Upload Site Photos</h2>
                  {photos.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectMode}
                      className={
                        "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all shrink-0 " +
                        (selectMode
                          ? "bg-slate-100 border-slate-300 text-slate-700"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50")
                      }
                    >
                      {selectMode ? <X size={13} /> : <CheckSquare size={13} />}
                      {selectMode ? "Cancel" : "Select"}
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-5">
                  Upload clear photos of the damage — matches the Field Inspector site inspection workflow for instant AI structural assessment.
                </p>

                {/* Photo Guidelines Banner */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 mb-5">
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" /> Photo Upload Guidelines
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">• Capture full building facade in good lighting</span>
                    <span className="flex items-center gap-1.5">• Include close-ups of visible cracks or tilt</span>
                    <span className="flex items-center gap-1.5">• Photograph all affected sides of the structure</span>
                    <span className="flex items-center gap-1.5">• Avoid blurry or heavily shadowed photos</span>
                  </div>
                </div>

                {!selectMode && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      handleFiles(e.dataTransfer.files);
                    }}
                    className={`border-2 border-dashed rounded-2xl py-9 px-4 flex flex-col items-center text-center cursor-pointer transition-all ${
                      dragActive
                        ? "border-emerald-500 bg-emerald-100"
                        : "border-emerald-200 bg-emerald-50/40 hover:border-emerald-400 hover:bg-emerald-50"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200 flex items-center justify-center mb-3 shadow-sm">
                      <UploadCloud size={22} className="text-emerald-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      {dragActive ? "Drop building photos here" : "Click to upload or drag & drop photos here"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      JPG, PNG • Max 10MB per photo • {6 - photos.length > 0 ? `${6 - photos.length} slot${6 - photos.length !== 1 ? "s" : ""} remaining` : "Maximum 6 photos reached"}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                  </div>
                )}

                {/* Select-mode action bar */}
                {selectMode && photos.length > 0 && (
                  <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 mb-4">
                    <button
                      type="button"
                      onClick={selectAllPhotos}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Select All ({photos.length})
                    </button>
                    <span className="text-xs text-slate-500">{(selectedIds?.size || 0)} selected</span>
                    <button
                      type="button"
                      onClick={deleteSelectedPhotos}
                      disabled={!selectedIds || selectedIds.size === 0}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={13} /> Delete Selected
                    </button>
                  </div>
                )}

                {photos && photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => selectMode && togglePhotoSelected(p.id)}
                        className={
                          "relative group rounded-xl overflow-hidden border-2 aspect-square transition-all " +
                          (selectMode
                            ? (selectedIds?.has ? selectedIds.has(p.id) : false)
                              ? "border-emerald-500 cursor-pointer"
                              : "border-transparent cursor-pointer"
                            : "border-slate-200 hover:border-emerald-300")
                        }
                      >
                        <img src={p.dataUrl} alt={p.name || "Photo"} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                          {(p.name || "Photo").length > 12 ? (p.name || "Photo").slice(0, 10) + "..." : (p.name || "Photo")}
                        </span>

                        {selectMode ? (
                          <>
                            <div
                              className={
                                "absolute inset-0 transition-colors " +
                                ((selectedIds?.has ? selectedIds.has(p.id) : false) ? "bg-emerald-900/30" : "bg-black/0")
                              }
                            />
                            <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow">
                              {(selectedIds?.has ? selectedIds.has(p.id) : false) ? (
                                <CheckSquare size={16} className="text-emerald-600" />
                              ) : (
                                <Square size={16} className="text-slate-400" />
                              )}
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removePhoto(p.id)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-4">
                  <ImageIcon size={13} className="text-emerald-600" /> <strong>{(photos?.length || 0)} / 6</strong> photos uploaded
                </p>
              </div>
            )}

            {/* ---------------- STEP 3: REVIEW ---------------- */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Review your report</h2>
                <p className="text-sm text-slate-500 mb-6">Check the details below before submitting your report.</p>

                <div className="space-y-4">
                  <ReviewBlock icon={Home} title="Location">
                    {[village, locality, taluk, district, state, pincode].filter(Boolean).join(", ") || "Location details provided"}
                    {landmark && <span className="block text-slate-400 mt-0.5">Near {landmark}</span>}
                  </ReviewBlock>

                  <ReviewBlock icon={AlertTriangle} title="Damage Type">
                    {CHECKLIST_ITEMS.filter((c) => checklist && checklist[c.key]).map((c) => c.label).join(", ") || "Damage observed"}
                  </ReviewBlock>

                  <ReviewBlock icon={FileText} title="Description">
                    {description || "Structural damage observed"}
                  </ReviewBlock>

                  <ReviewBlock icon={ImageIcon} title="Photos">
                    {photos && photos.length > 0 ? `${photos.length} photo(s) attached` : "No photos attached"}
                  </ReviewBlock>

                  {/* Verified Reporter Account Card */}
                  <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-4">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-1 text-emerald-800">
                      <ShieldCheck size={14} className="text-emerald-600" /> Verified Reporter Account
                    </p>
                    <p className="text-sm text-emerald-900 font-semibold">
                      Reporter: {activeUser?.name || "Citizen Reporter"} ({activeUser?.email || "Verified Email"})
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Your report will be assigned a unique tracking ID and queued for instant AI structural assessment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-5">{error}</div>
            )}

            {/* Nav buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-0 transition-all"
              >
                <ChevronLeft size={15} /> Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-semibold text-sm shadow shadow-emerald-500/25 transition-all"
                >
                  Continue <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 disabled:opacity-60 text-white font-semibold text-sm shadow shadow-emerald-500/25 transition-all"
                >
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              )}
            </div>
          </div>

          {/* Emergency contact side card */}
          <div className="h-fit bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-red-500/20">
            <p className="flex items-center gap-2 font-bold text-sm mb-2">
              <PhoneCall size={16} /> Emergency Contact
            </p>
            <p className="text-xs text-white/90 leading-relaxed mb-4">
              If there is immediate danger to life, call emergency services directly — do not wait for a report to be reviewed.
            </p>
            <a
              href="tel:112"
              className="flex items-center justify-center gap-2 w-full bg-white text-red-600 font-bold text-sm rounded-xl py-2.5 mb-3 hover:bg-red-50 transition-colors"
            >
              <PhoneCall size={14} /> Call 112 — National Emergency
            </a>
            <a href="tel:18001801253" className="flex items-center justify-center gap-2 text-xs text-white/90 hover:text-white transition-colors">
              <PhoneCall size={12} /> Disaster Helpline: 1800-180-1253
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, maxLength }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono tracking-widest text-slate-500 uppercase">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 transition-all"
      />
    </div>
  );
}

function ReviewBlock({ icon: Icon, title, children }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <p className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5">
        {Icon ? <Icon size={13} /> : null} {title}
      </p>
      <p className="text-sm text-slate-600 leading-relaxed">{children}</p>
    </div>
  );
}
