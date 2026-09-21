import { useState } from "react";
import {
  AlertTriangle,
  Siren,
  Clock,
  MapPin,
  Radio,
  Megaphone,
  Users,
  Database,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useData } from "../context/DataContext";

function Toggle({ enabled, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 rounded-full transition-colors shrink-0 ${
        enabled ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function AppSettings() {
  const { showToast, settings, updateSettings } = useData();

  // Draft state — edits only take effect (and persist) once "Save Settings"
  // is clicked, so navigating away mid-edit won't silently apply changes.
  const [draft, setDraft] = useState(settings);

  function set(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleSave() {
    updateSettings(draft);
    showToast("Settings saved.", "success");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F3FAF5]">
      <PageHeader title="Settings" subtitle="Disaster response configuration" />

      <div className="flex-1 flex justify-center px-5 sm:px-7 py-10">
        <div className="w-full max-w-4xl flex flex-col gap-6">

          {/* AI & Damage Detection */}
          <div className="bg-white border border-emerald-100 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={15} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">AI & Damage Detection</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  How the AI classifies earthquake damage from uploaded photos.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono tracking-wide text-slate-400 uppercase">
                  Critical Risk Score Threshold
                </label>
                <span className="text-sm font-bold text-emerald-600">
                  {draft.aiThreshold}
                </span>
              </div>

              <input
                type="range"
                min="50"
                max="100"
                value={draft.aiThreshold}
                onChange={(e) => set("aiThreshold", Number(e.target.value))}
                className="accent-emerald-500 w-full"
              />

              <p className="text-xs text-slate-400">
                Buildings with an AI risk score at or above this number are
                marked URGENT on the Dashboard and Damage Map.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-emerald-50">
              <div>
                <p className="text-sm text-slate-900 font-medium">
                  Auto-flag DESTROYED buildings for evacuation
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Any building the AI classifies as DESTROYED is immediately
                  marked for evacuation, without waiting for engineer review.
                </p>
              </div>

              <Toggle
                enabled={draft.autoFlagDestroyed}
                onToggle={() => set("autoFlagDestroyed", !draft.autoFlagDestroyed)}
              />
            </div>
          </div>

          {/* Emergency Response Protocol */}
          <div className="bg-white border border-emerald-100 rounded-xl p-6 flex flex-col gap-5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <Siren size={15} className="text-orange-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Emergency Response Protocol</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  How fast engineers must respond, and what happens if they don't.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-sm text-slate-900 font-medium">
                    Engineer response SLA
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Time an assigned engineer has to begin inspection
                  </p>
                </div>
              </div>

              <select
                value={draft.engineerResponseSLA}
                onChange={(e) => set("engineerResponseSLA", Number(e.target.value))}
                className="text-sm border border-emerald-100 rounded-lg px-3 py-1.5 bg-[#F3FAF5] text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 shrink-0"
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-emerald-50">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-sm text-slate-900 font-medium">
                    Auto-escalate unassigned critical buildings
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    If a critical building has no engineer assigned within this
                    time, every Authority account gets notified
                  </p>
                </div>
              </div>

              <select
                value={draft.autoEscalateHours}
                onChange={(e) => set("autoEscalateHours", Number(e.target.value))}
                className="text-sm border border-emerald-100 rounded-lg px-3 py-1.5 bg-[#F3FAF5] text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 shrink-0"
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={4}>4 hours</option>
                <option value={12}>12 hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-emerald-50">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-sm text-slate-900 font-medium">
                    Evacuation radius
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Safety perimeter drawn around DESTROYED buildings on the
                    Damage Map
                  </p>
                </div>
              </div>

              <select
                value={draft.evacuationRadius}
                onChange={(e) => set("evacuationRadius", Number(e.target.value))}
                className="text-sm border border-emerald-100 rounded-lg px-3 py-1.5 bg-[#F3FAF5] text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 shrink-0"
              >
                <option value={50}>50 m</option>
                <option value={100}>100 m</option>
                <option value={200}>200 m</option>
                <option value={500}>500 m</option>
              </select>
            </div>
          </div>

          {/* Public Safety */}
          <div className="bg-white border border-emerald-100 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Megaphone size={15} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Public Safety</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  What the general public can submit, and what they get told.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-900 font-medium">
                  Allow public damage reports
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Citizens can submit a damage report for review on the
                  Command Center
                </p>
              </div>

              <Toggle
                enabled={draft.allowPublicReports}
                onToggle={() => set("allowPublicReports", !draft.allowPublicReports)}
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-emerald-50">
              <div>
                <p className="text-sm text-slate-900 font-medium">
                  Broadcast public safety alerts
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulates an SMS/siren broadcast to residents in a zone when
                  a building there is marked DESTROYED
                </p>
              </div>

              <Toggle
                enabled={draft.publicBroadcastAlerts}
                onToggle={() => set("publicBroadcastAlerts", !draft.publicBroadcastAlerts)}
              />
            </div>
          </div>

          {/* Notification Preferences + Data & Compliance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-white border border-emerald-100 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Users size={15} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Your Notification Preferences
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    In addition to the in-app Notifications feed.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-900 font-medium">
                    Email alerts
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Daily digest and critical alerts
                  </p>
                </div>

                <Toggle
                  enabled={draft.emailAlerts}
                  onToggle={() => set("emailAlerts", !draft.emailAlerts)}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-emerald-50">
                <div>
                  <p className="text-sm text-slate-900 font-medium">
                    SMS alerts
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Critical detections only
                  </p>
                </div>

                <Toggle
                  enabled={draft.smsAlerts}
                  onToggle={() => set("smsAlerts", !draft.smsAlerts)}
                />
              </div>
            </div>

            <div className="bg-white border border-emerald-100 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <Database size={15} className="text-purple-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Data & Compliance
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inspection record handling and reporting upstream.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-900 font-medium">
                    Share with State Disaster Authority
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Forward anonymized assessment data upstream
                  </p>
                </div>

                <Toggle
                  enabled={draft.shareWithStateAuthority}
                  onToggle={() =>
                    set("shareWithStateAuthority", !draft.shareWithStateAuthority)
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-emerald-50">
                <div>
                  <p className="text-sm text-slate-900 font-medium">
                    Retention period
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    How long completed inspection records are kept
                  </p>
                </div>

                <select
                  value={draft.retention}
                  onChange={(e) => set("retention", e.target.value)}
                  className="text-sm border border-emerald-100 rounded-lg px-3 py-1.5 bg-[#F3FAF5] text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400 shrink-0"
                >
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl py-3.5 transition-colors shadow-sm"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
