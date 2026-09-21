import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    const raw = sessionStorage.getItem("qg_user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        const r = String(u.sessionRole || u.role || "").toLowerCase();
        if (r.includes("citizen")) {
          window.location.href = "/citizen";
          return;
        }
      } catch {}
    }
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Notice</h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 my-4 text-left font-mono text-xs text-red-700 break-all overflow-x-auto max-h-40">
              <p className="font-bold text-sm text-red-800 mb-1">
                {this.state.error?.message || "Render Error Encountered"}
              </p>
              {this.state.error ? String(this.state.error.stack || this.state.error) : "Unknown Stack"}
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <Home size={16} /> Return to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-50"
              >
                <RefreshCw size={14} /> Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
