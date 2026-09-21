import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import api from "../api/axiosConfig";
import {
  getStoredBuildings,
  saveStoredBuildings,
  getStoredNotifications,
  saveStoredNotifications,
  getStoredUsers,
  getDamagedBuildingSvgDataUrl,
} from "../data/mockData";

function safeGetStoredUsers() {
  try {
    const raw = localStorage.getItem("qg_users");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  try {
    if (typeof getStoredUsers === "function") return getStoredUsers();
  } catch {}
  return [];
}

const DataContext = createContext(null);
const WS_URL = "http://localhost:8081/ws";

const SETTINGS_KEY = "qg_settings";

const DEFAULT_SETTINGS = {
  // AI & Damage Detection
  aiThreshold: 75,
  autoFlagDestroyed: true,

  // Emergency Response Protocol
  engineerResponseSLA: 6, // hours an assigned engineer has to respond
  autoEscalateHours: 2, // hours before an unassigned critical building escalates to all Authorities
  evacuationRadius: 100, // meters, shown around DESTROYED buildings on the Damage Map

  // Public Safety
  allowPublicReports: true,
  publicBroadcastAlerts: false, // simulated SMS/siren broadcast to public in affected zone

  // Notification Preferences
  emailAlerts: true,
  smsAlerts: false,

  // Data & Compliance
  shareWithStateAuthority: true,
  retention: "90",
};

// Backend role names -> frontend display names
const ROLE_DISPLAY = {
  ADMIN: "Authority",
  AUTHORITY: "Authority",
  ENGINEER: "Engineer",
  FIELD_INSPECTOR: "Field Inspector",
  CITIZEN: "Citizen",
};

const SEVERITY_MAP = {
  LOW: "MINOR",
  MODERATE: "MODERATE",
  SEVERE: "SEVERE",
  DESTROYED: "DESTROYED",
};

function mapAssessment(a) {
  const upper = (a.severity || "").toUpperCase();
  const defaultDamagedImg = "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop";
  return {
    id: `A-${a.id}`,
    assessmentId: a.id,
    buildingCode: a.buildingCode,
    name: a.buildingName,
    zone: a.zone,
    severity: SEVERITY_MAP[upper] || upper,
    riskScore: a.riskScore,
    aiConfidence: a.aiConfidence,
    coords: {
      lat: a.latitude != null && !isNaN(Number(a.latitude)) ? Number(a.latitude) : 10.9254,
      lng: a.longitude != null && !isNaN(Number(a.longitude)) ? Number(a.longitude) : 76.9681,
    },
    inspector: a.inspectorName || "Janani E",
    date: a.createdAt,
    detection: a.detectionNotes || "Structural shear cracks & masonry spalling detected.",
    recommendedAction: a.recommendedAction || "Immediate Evacuation",
    status: a.status || "PROCESSING",
    imageUrl: (a.imageUrl && String(a.imageUrl).trim() !== "" ? a.imageUrl : null) || (a.photoUrl && String(a.photoUrl).trim() !== "" ? a.photoUrl : null) || defaultDamagedImg,
    assignedEngineerId: a.assignedEngineerId || "u2",
    assignedEngineer: a.assignedEngineerName || "Swetha S",
    assignedBy: a.assignedBy || "Rajan K",
    assignedDate: a.assignedDate || null,
    aiVerified: true,
    engineerVerified: a.status === "ENGINEER_REVIEWED" || a.status === "REVIEWED" || a.status === "COMPLETED",
  };
}

export function DataProvider({ children }) {
  const [buildings, setBuildings] = useState(() => getStoredBuildings());
  const [notifications, setNotifications] = useState(() => getStoredNotifications());
  const [toast, setToast] = useState(null);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  function updateSettings(patch) {
    setSettings((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  const [publicReports, setPublicReports] = useState(() => {
    const saved = localStorage.getItem("publicReports");
    return saved ? JSON.parse(saved) : [];
  });

  const refreshBuildings = useCallback(() => {
    const local = getStoredBuildings();
    const token = localStorage.getItem("token");
    if (!token || token.startsWith("offline_token")) {
      setBuildings(local);
      return Promise.resolve();
    }

    return api
      .get("/assessments")
      .then((response) => {
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const mapped = response.data.map(mapAssessment);
          // Safely merge remote with local uploaded buildings so uploaded data is NEVER lost!
          const remoteIds = new Set(mapped.map((m) => m.id));
          const localOnly = local.filter((l) => !remoteIds.has(l.id));
          const merged = [...mapped, ...localOnly];
          setBuildings(merged);
          saveStoredBuildings(merged);
        } else {
          setBuildings(local);
        }
      })
      .catch(() => {
        // Fallback: keep existing LocalStorage buildings
        setBuildings(local);
      });
  }, []);

  useEffect(() => {
    refreshBuildings();
  }, [refreshBuildings]);

  function updateBuilding(id, patch) {
    setBuildings((prev) => {
      const updated = prev.map((b) => {
        if (b.id === id || String(b.id) === String(id)) {
          const newImg = patch.imageUrl || patch.image || b.imageUrl;
          return {
            ...b,
            ...patch,
            imageUrl: newImg,
            images: patch.imageUrl ? [patch.imageUrl] : b.images,
            photos: patch.imageUrl ? [patch.imageUrl] : b.photos,
          };
        }
        return b;
      });
      saveStoredBuildings(updated);
      return updated;
    });
  }

  function addBuilding(newBuilding) {
    const token = localStorage.getItem("token");
    const exactTime = `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const newId = "A-" + Date.now();
    const imgUrl = newBuilding.imageUrl || getDamagedBuildingSvgDataUrl(newBuilding.buildingName || "Building Site", newBuilding.severity || "DESTROYED", newId);

    const formatted = {
      id: newId,
      buildingCode: "B-" + Math.floor(100 + Math.random() * 900),
      name: newBuilding.buildingName || "Building Site",
      zone: newBuilding.zone || "Gandhi Nagar",
      severity: newBuilding.severity || "DESTROYED",
      riskScore: newBuilding.riskScore || 94.8,
      aiConfidence: newBuilding.aiConfidence || 94.2,
      coords: newBuilding.coords || { lat: 10.9254, lng: 76.9681 },
      inspector: newBuilding.inspectorName || "Janani E",
      date: exactTime,
      detection: newBuilding.detectionNotes || "Shear cracks and facade spalling detected.",
      recommendedAction: newBuilding.recommendedAction || "Structural Inspection & Evacuation",
      status: "PROCESSING",
      imageUrl: imgUrl,
      images: [imgUrl],
      photos: [imgUrl],
      aiVerified: true,
      engineerVerified: false,
    };

    setBuildings((prev) => {
      const updated = [formatted, ...prev];
      saveStoredBuildings(updated);
      return updated;
    });

    // Dispatch notification to Authority when Field Inspector uploads building site photos
    addNotification({
      type: "warning",
      title: `📸 New Site Photos Uploaded: Inspector ${formatted.inspector} uploaded photos for "${formatted.name}" in ${formatted.zone} (Severity: ${formatted.severity}).`,
      meta: exactTime,
      targetRole: "Authority",
      authority: true,
      buildingId: formatted.id,
      inspectorName: formatted.inspector,
      targetPath: `/assessment/${formatted.id}`,
    });

    if (token && !token.startsWith("offline_token")) {
      api.post("/assessments", {
        buildingCode: formatted.buildingCode,
        buildingName: formatted.name,
        zone: formatted.zone,
        severity: formatted.severity,
        riskScore: formatted.riskScore,
        aiConfidence: formatted.aiConfidence,
        latitude: formatted.coords.lat,
        longitude: formatted.coords.lng,
        detectionNotes: formatted.detection,
        recommendedAction: formatted.recommendedAction,
        status: "PROCESSING",
        imageUrl: formatted.imageUrl,
        inspectorName: formatted.inspector
      }).catch(() => {
        // Fallback saved in LocalStorage
      });
    }

    return formatted;
  }

  function assignEngineer(assessmentId, engineerId, assignedByName) {

    const targetBuilding = buildings.find(
      (b) => b.id === `A-${assessmentId}` || b.id === assessmentId || b.assessmentId === Number(assessmentId) || String(b.id) === String(assessmentId)
    );

    const allUsers = safeGetStoredUsers();
    const engUser = allUsers.find(
      (u) => String(u.id) === String(engineerId) || u.email?.toLowerCase() === String(engineerId).toLowerCase()
    );
    const engName = engUser?.name || engUser?.officialEmail || "Assigned Engineer";

    const buildingName = targetBuilding?.name || targetBuilding?.buildingName || "Building Site";
    const buildingCode = targetBuilding?.buildingCode || targetBuilding?.id || assessmentId;
    const targetBuildingId = targetBuilding?.id || (String(assessmentId).startsWith("A-") ? assessmentId : `A-${assessmentId}`);

    const dispatchNotifications = (assignedEngName) => {
      const exactTime = `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      const bId = targetBuildingId;

      // 1. Targeted notification ONLY to the specific assigned Engineer
      addNotification({
        type: "info",
        title: `📋 New Building Assignment: Authority (${assignedByName || "Admin"}) assigned you to review "${buildingName}" (${buildingCode}) in ${targetBuilding?.zone || "Zone"}. Severity: ${targetBuilding?.severity || "MODERATE"}.`,
        meta: exactTime,
        recipientId: engineerId,
        assignedEngineerId: engineerId,
        assignedEngineerName: assignedEngName || engName,
        buildingId: bId,
        targetRole: "Engineer",
        roles: ["Engineer"],
        targetPath: `/assessment/${bId}`,
      });

      // 2. Targeted notification ONLY to the Field Inspector who uploaded the building photos
      addNotification({
        type: "success",
        title: `🏗️ Inspection Update: Authority (${assignedByName || "Admin"}) assigned Engineer (${assignedEngName || engName}) to the building "${buildingName}" (${buildingCode}) that you uploaded.`,
        meta: exactTime,
        targetRole: "Field Inspector",
        roles: ["Field Inspector"],
        inspectorName: targetBuilding?.inspector || targetBuilding?.inspectorName,
        inspectorId: targetBuilding?.inspectorId,
        buildingId: bId,
        targetPath: `/assessment/${bId}`,
      });
    };

    const patchPayload = {
      assignedEngineerId: engineerId,
      assignedEngineer: engName,
      assignedEngineerName: engName,
      assignedBy: assignedByName || "Authority HQ",
      assignedDate: new Date().toISOString(),
      status: "PROCESSING",
      isAssigned: true,
    };

    const token = localStorage.getItem("token");
    if (token && !token.startsWith("offline_token")) {
      return api
        .patch(`/assessments/${assessmentId}/assign`, {
          engineerId,
          assignedBy: assignedByName,
        })
        .then((res) => {
          const updated = mapAssessment(res.data);
          updateBuilding(updated.id, { ...patchPayload, ...updated });
          window.dispatchEvent(new Event("qg:buildingsChanged"));
          dispatchNotifications(updated.assignedEngineer || engName);
          showToast(`✓ Engineer (${engName}) assigned to "${buildingName}"`, "success");
          return updated;
        })
        .catch(() => {
          updateBuilding(targetBuildingId, patchPayload);
          window.dispatchEvent(new Event("qg:buildingsChanged"));
          dispatchNotifications(engName);
          showToast(`✓ Engineer (${engName}) assigned to "${buildingName}"`, "success");
        });
    } else {
      updateBuilding(targetBuildingId, patchPayload);
      window.dispatchEvent(new Event("qg:buildingsChanged"));
      dispatchNotifications(engName);
      showToast(`✓ Engineer (${engName}) assigned to "${buildingName}"`, "success");
      return Promise.resolve();
    }
  }

  function verifyBuilding(assessmentId, verificationData) {
    const rawId = String(assessmentId).replace(/^A-/, "");
    const exactTime = `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const targetBuilding = buildings.find(
      (b) => b.id === assessmentId || b.id === `A-${assessmentId}` || String(b.assessmentId) === String(rawId)
    );

    const bName = targetBuilding?.name || targetBuilding?.buildingName || "Building Site";
    const inspName = targetBuilding?.inspector || targetBuilding?.inspectorName;
    const inspId = targetBuilding?.inspectorId;

    const isRevision = Boolean(targetBuilding?.engineerVerified || targetBuilding?.status === "ENGINEER_REVIEWED");

    const dispatchReviewNotifications = () => {
      if (isRevision) {
        // Revision Notification to Authority HQ
        addNotification({
          type: "warning",
          title: `🔄 Engineer Review Updated: Engineer ${verificationData.reviewedBy || "Engineer"} updated their verification for "${bName}". Decision: ${verificationData.engineerDecision === "OVERRIDE" ? "OVERRIDE (" + verificationData.severity + ")" : "APPROVED"}. Remarks: ${verificationData.engineerRemarks || "Updated review"}.`,
          meta: exactTime,
          targetRole: "Authority",
          authority: true,
          roles: ["Authority"],
          buildingId: targetBuilding?.id || assessmentId,
          targetPath: `/assessment/${targetBuilding?.id || assessmentId}`,
        });

        // Revision Notification to Field Inspector
        addNotification({
          type: "info",
          title: `🔄 Inspection Review Updated: Engineer ${verificationData.reviewedBy || "Engineer"} updated their review for "${bName}". Status: REVISED (${verificationData.engineerDecision === "OVERRIDE" ? "Severity: " + verificationData.severity : "Approved"}).`,
          meta: exactTime,
          targetRole: "Field Inspector",
          roles: ["Field Inspector"],
          inspectorName: inspName,
          inspectorId: inspId,
          buildingId: targetBuilding?.id || assessmentId,
          targetPath: `/assessment/${targetBuilding?.id || assessmentId}`,
        });
      } else {
        // Initial Notification to Original Field Inspector
        addNotification({
          type: "success",
          title: `✅ Inspection Verified: Engineer ${verificationData.reviewedBy || "Engineer"} reviewed your submission for "${bName}". Status: REVIEWED (${verificationData.engineerDecision === "OVERRIDE" ? "Severity Overridden to " + verificationData.severity : "AI Approved"}).`,
          meta: exactTime,
          targetRole: "Field Inspector",
          roles: ["Field Inspector"],
          inspectorName: inspName,
          inspectorId: inspId,
          buildingId: targetBuilding?.id || assessmentId,
          targetPath: `/assessment/${targetBuilding?.id || assessmentId}`,
        });

        // Initial Notification to Authority HQ
        addNotification({
          type: "info",
          title: `⚙️ Engineer Sign-off: Engineer ${verificationData.reviewedBy || "Engineer"} submitted formal verification for "${bName}". Decision: ${verificationData.engineerDecision || "APPROVED"}.`,
          meta: exactTime,
          targetRole: "Authority",
          authority: true,
          roles: ["Authority"],
          buildingId: targetBuilding?.id || assessmentId,
          targetPath: `/assessment/${targetBuilding?.id || assessmentId}`,
        });
      }
    };

    const token = localStorage.getItem("token");
    if (token && !token.startsWith("offline_token")) {
      return api
        .patch(`/assessments/${rawId}/verify`, {
          verifiedBy: verificationData.reviewedBy,
          decision: verificationData.engineerDecision,
          overrideSeverity: verificationData.severity,
          recommendation: verificationData.engineerRecommendation,
          priority: verificationData.priority,
          remarks: verificationData.engineerRemarks,
        })
        .then((res) => {
          const updated = mapAssessment(res.data);
          updateBuilding(updated.id, updated);
          dispatchReviewNotifications();
          return updated;
        })
        .catch(() => {
          updateBuilding(targetBuilding?.id || `A-${rawId}`, {
            ...verificationData,
            status: "ENGINEER_REVIEWED",
            engineerVerified: true,
          });
          dispatchReviewNotifications();
        });
    } else {
      updateBuilding(targetBuilding?.id || `A-${rawId}`, {
        ...verificationData,
        status: "ENGINEER_REVIEWED",
        engineerVerified: true,
      });
      dispatchReviewNotifications();
      return Promise.resolve();
    }
  }

  const refreshNotifications = useCallback(() => {
    const local = getStoredNotifications();
    const token = localStorage.getItem("token");
    if (!token || token.startsWith("offline_token")) {
      setNotifications(local);
      return Promise.resolve();
    }

    return api
      .get("/notifications")
      .then((response) => {
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const mapped = response.data.map((n) => ({
            id: n.id || "n_" + Date.now(),
            type: (n.type || "info").toLowerCase(),
            title: n.title,
            meta: n.meta || n.createdAt,
            read: n.read || false,
            authority: n.authority || false,
            recipientId: n.recipient?.id || null,
            roles: n.targetRole ? [ROLE_DISPLAY[n.targetRole] || n.targetRole] : null,
          }));
          const remoteIds = new Set(mapped.map((m) => m.id));
          const localOnly = local.filter((l) => !remoteIds.has(l.id));
          const merged = [...mapped, ...localOnly];
          setNotifications(merged);
          saveStoredNotifications(merged);
        } else {
          setNotifications(local);
        }
      })
      .catch(() => {
        setNotifications(local);
      });
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const stompClientRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || token.startsWith("offline_token")) return;

    try {
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
        onConnect: () => {
          client.subscribe("/topic/assessments", () => {
            refreshBuildings();
          });
          client.subscribe("/topic/notifications", () => {
            refreshNotifications();
          });
          client.subscribe("/topic/users", () => {
            window.dispatchEvent(new Event("qg:usersChanged"));
          });
        },
        onStompError: () => {},
      });

      client.activate();
      stompClientRef.current = client;

      return () => {
        client.deactivate();
        stompClientRef.current = null;
      };
    } catch {}
  }, [refreshBuildings, refreshNotifications]);

  function markAllRead() {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveStoredNotifications(updated);
      return updated;
    });
  }

  function deleteNotification(id) {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      saveStoredNotifications(updated);
      return updated;
    });
  }

  function clearUserNotifications(idsToDelete) {
    if (!idsToDelete || !Array.isArray(idsToDelete)) return;
    const deleteSet = new Set(idsToDelete);
    setNotifications((prev) => {
      const updated = prev.filter((n) => !deleteSet.has(n.id));
      saveStoredNotifications(updated);
      return updated;
    });
  }

  function showToast(message, variant = "info") {
    setToast({ message, variant, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }

  function addNotification({
    type = "info",
    title,
    meta,
    authority = false,
    recipientId = null,
    roles = null,
    buildingId = null,
    reportId = null,
    inspectorName = null,
    inspectorId = null,
    assignedEngineerId = null,
    assignedEngineerName = null,
    reporterEmail = null,
    targetRole = null,
    targetPath = null,
  }) {
    const exactTime = meta || `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    const newNotification = {
      id: "n_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
      type,
      title,
      meta: exactTime,
      read: false,
      authority,
      recipientId,
      roles: roles || (targetRole ? [targetRole] : null),
      buildingId,
      reportId,
      inspectorName,
      inspectorId,
      assignedEngineerId,
      assignedEngineerName,
      reporterEmail,
      targetRole,
      targetPath,
    };
    setNotifications((prev) => {
      const updated = [newNotification, ...prev];
      saveStoredNotifications(updated);
      return updated;
    });
  }

  function addPublicReport(report) {
    const exactTime = `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    const trackingId = "REP-" + new Date().getFullYear() + "-" + Math.floor(10000 + Math.random() * 90000);
    const newReport = {
      id: Date.now(),
      trackingId,
      status: "Submitted",
      submittedAt: exactTime,
      lastUpdatedAt: exactTime,
      officerRemarks: "",
      ...report,
    };

    const updated = [newReport, ...publicReports];
    setPublicReports(updated);
    localStorage.setItem("publicReports", JSON.stringify(updated));

    // 1. Notify Authority
    addNotification({
      type: "warning",
      title: `📢 New Citizen Damage Report: ${trackingId} submitted by ${report.reporterName || "Citizen"} in ${report.district || "District"}.`,
      meta: exactTime,
      targetRole: "Authority",
      authority: true,
      reportId: trackingId,
      targetPath: "/dashboard",
    });

    // 2. Notify ONLY this specific Citizen
    addNotification({
      type: "success",
      title: `✅ Report Submitted: Your damage report (${trackingId}) was received and queued for AI structural assessment.`,
      meta: exactTime,
      targetRole: "Citizen",
      reporterEmail: report.reporterEmail || report.email,
      reportId: trackingId,
      targetPath: "/citizen",
    });

    return newReport;
  }

  function updatePublicReportStatus(id, status, officerRemarks = "", extraData = {}) {
    const exactTime = `${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    let targetReport = null;

    setPublicReports((prev) => {
      const updated = prev.map((r) => {
        if (r.id === id || r.trackingId === id || String(r.id) === String(id)) {
          targetReport = {
            ...r,
            status: status || r.status,
            officerRemarks: officerRemarks || r.officerRemarks,
            lastUpdatedAt: exactTime,
            ...(extraData || {}),
          };
          return targetReport;
        }
        return r;
      });
      localStorage.setItem("publicReports", JSON.stringify(updated));
      window.dispatchEvent(new Event("qg:publicReportsChanged"));
      return updated;
    });

    if (targetReport) {
      const tId = targetReport.trackingId || targetReport.id;

      // If an Engineer was assigned, dispatch a targeted notification to that Engineer!
      if (extraData?.assignedEngineer || extraData?.assignedEngineerName) {
        const engName = extraData.assignedEngineer || extraData.assignedEngineerName;
        addNotification({
          type: "info",
          title: `📋 New Public Report Assignment: Authority assigned you to review Citizen Report "${tId}" (${targetReport.buildingName || targetReport.district || "Report"}). Status: Assigned to Department.`,
          meta: exactTime,
          targetRole: "Engineer",
          roles: ["Engineer"],
          assignedEngineerName: engName,
          reportId: tId,
          targetPath: "/dashboard",
        });
      }

      // Notify ONLY this specific Citizen
      addNotification({
        type: "info",
        title: `🔔 Report Progress Update: Your report (${tId}) status changed to "${status}". Remarks: ${officerRemarks || "In Progress"}.`,
        meta: exactTime,
        targetRole: "Citizen",
        reporterEmail: targetReport.reporterEmail || targetReport.email,
        reportId: tId,
        targetPath: "/citizen",
      });
    }
  }

  const unreadCount = notifications.filter((n) => {
    if (n.read) return false;
    const raw = sessionStorage.getItem("qg_user");
    if (!raw) return true;
    try {
      const u = JSON.parse(raw);
      const userRole = u.sessionRole || u.role;
      if (n.recipientId && n.recipientId !== u.id) return false;
      if (n.roles && n.roles.length > 0 && !n.roles.includes(userRole)) return false;
    } catch {}
    return true;
  }).length;

  return (
    <DataContext.Provider
      value={{
        buildings,
        addBuilding,
        updateBuilding,
        verifyBuilding,
        refreshBuildings,
        assignEngineer,

        notifications,
        markAllRead,
        deleteNotification,
        clearUserNotifications,
        addNotification,
        refreshNotifications,

        unreadCount,

        toast,
        showToast,

        publicReports,
        addPublicReport,
        updatePublicReportStatus,

        settings,
        updateSettings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    return {
      buildings: getStoredBuildings(),
      publicReports: [],
      notifications: getStoredNotifications(),
      settings: {},
      addBuilding: () => {},
      updateBuilding: () => {},
      addNotification: () => {},
      showToast: () => {},
      markAllRead: () => {},
      deleteNotification: () => {},
      clearUserNotifications: () => {},
      refreshBuildings: () => {},
      verifyBuilding: () => {},
      updateSettings: () => {},
      addPublicReport: () => {},
      updatePublicReportStatus: () => {},
    };
  }
  return ctx;
}
