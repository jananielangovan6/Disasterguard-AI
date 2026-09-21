import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { SEVERITY_META } from "../data/mockData";
import { useData } from "../context/DataContext";

const SEVERITY_COLOR = {
  DESTROYED: "#dc2626",
  SEVERE: "#f97316",
  MODERATE: "#eab308",
  MINOR: "#16a34a",
};

// Fits the map view to show every building marker on first load.
function FitBoundsToBuildings({ buildings }) {
  const map = useMap();

  useMemo(() => {
    const valid = (buildings || []).filter(
      (b) =>
        b?.coords?.lat != null &&
        b?.coords?.lng != null &&
        !isNaN(Number(b.coords.lat)) &&
        !isNaN(Number(b.coords.lng))
    );
    if (valid.length === 0) return;
    const bounds = valid.map((b) => [Number(b.coords.lat), Number(b.coords.lng)]);
    map.fitBounds(bounds, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings.length]);

  return null;
}

export default function DamageMap() {
  const { buildings } = useData();
  const navigate = useNavigate();

  const destroyed = buildings.filter((b) => b.severity === "DESTROYED").length;
  const severe = buildings.filter((b) => b.severity === "SEVERE").length;
  const moderate = buildings.filter((b) => b.severity === "MODERATE").length;
  const minor = buildings.filter((b) => b.severity === "MINOR").length;

  // Fallback center (used only if there are no buildings yet)
  const defaultCenter = [13.0827, 80.2707]; // Chennai

  return (
    <div className="min-h-screen bg-[#F3FAF5]">

      <PageHeader
        title="Damage Heat Map"
        subtitle={`${buildings.length} Buildings Monitored`}
      />

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">

          <div className="bg-white rounded-xl border border-red-100 p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500">Destroyed</p>
                <h2 className="text-2xl font-bold text-red-600 mt-1">{destroyed}</h2>
              </div>
              <AlertTriangle className="text-red-500" size={22} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-orange-100 p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500">Severe</p>
                <h2 className="text-2xl font-bold text-orange-500 mt-1">{severe}</h2>
              </div>
              <ShieldAlert className="text-orange-500" size={22} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-yellow-100 p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500">Moderate</p>
                <h2 className="text-2xl font-bold text-yellow-500 mt-1">{moderate}</h2>
              </div>
              <Activity className="text-yellow-500" size={22} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-green-100 p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500">Minor</p>
                <h2 className="text-2xl font-bold text-green-600 mt-1">{minor}</h2>
              </div>
              <CheckCircle className="text-green-600" size={22} />
            </div>
          </div>

        </div>

        {/* Map Card */}
        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden">

          <div className="flex justify-between items-center px-5 py-3 border-b border-emerald-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Live Damage Map</h2>
              <p className="text-xs text-slate-500">AI Structural Damage Detection</p>
            </div>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
              ● Live
            </span>
          </div>

          {/* Real map with severity-colored markers */}
          <div className="relative w-full h-[420px]">
            <MapContainer
              center={defaultCenter}
              zoom={12}
              scrollWheelZoom={true}
              style={{ width: "100%", height: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <FitBoundsToBuildings buildings={buildings} />

              {buildings
                .filter(
                  (b) =>
                    b?.coords?.lat != null &&
                    b?.coords?.lng != null &&
                    !isNaN(Number(b.coords.lat)) &&
                    !isNaN(Number(b.coords.lng))
                )
                .map((b) => (
                  <CircleMarker
                    key={b.id}
                    center={[Number(b.coords.lat), Number(b.coords.lng)]}
                  radius={10}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: SEVERITY_COLOR[b.severity] || "#94a3b8",
                    fillOpacity: 0.9,
                  }}
                  eventHandlers={{
                    click: () => navigate(`/reports/${b.id}`),
                  }}
                >
                  <Popup>
                    <div className="text-left">
                      <p className="font-bold text-slate-800 text-xs mb-0.5">{b.name}</p>
                      <p className="text-[10px] text-slate-500 mb-1.5">{b.id}</p>
                      <span
                        className={`inline-block text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          SEVERITY_META?.[b.severity]?.badge ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {b.severity}
                      </span>
                      <button
                        onClick={() => navigate(`/reports/${b.id}`)}
                        className="block mt-2 text-[11px] font-semibold text-emerald-700 hover:underline"
                      >
                        View full report →
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>

            {/* Empty state */}
            {buildings.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-[#F3FAF5] z-[500]">
                <p className="text-xs font-medium">No building data available</p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-t border-emerald-100 bg-[#F3FAF5]">
            {[
              { label: "Destroyed", color: "bg-red-600" },
              { label: "Severe", color: "bg-orange-500" },
              { label: "Moderate", color: "bg-yellow-500" },
              { label: "Minor", color: "bg-green-600" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-[11px] text-slate-600 font-medium">{item.label}</span>
              </div>
            ))}
            <span className="text-[11px] text-slate-400 ml-auto">
              Click a marker to view full report
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}