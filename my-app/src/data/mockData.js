// mock data for local storage persistence and fallback when backend is offline
 
const CITIZENS_KEY = 'qg_citizens';
 
export function getCitizens() {
  const raw = localStorage.getItem(CITIZENS_KEY);
  return raw ? JSON.parse(raw) : [];
}
 
export function saveCitizens(citizens) {
  localStorage.setItem(CITIZENS_KEY, JSON.stringify(citizens));
}
 
export function findCitizenByEmail(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim().toLowerCase();
  const cleanPhone = String(identifier).replace(/\D/g, "");

  // 1. Search in qg_citizens
  const citizens = getCitizens();
  let found = citizens.find(
    (c) =>
      (c.email && c.email.trim().toLowerCase() === clean) ||
      (cleanPhone.length >= 10 && c.phone && c.phone.replace(/\D/g, "").slice(-10) === cleanPhone.slice(-10))
  );
  if (found) return found;

  // 2. Search in qg_users
  try {
    const allUsers = getStoredUsers();
    found = allUsers.find(
      (u) =>
        ((u.email && u.email.trim().toLowerCase() === clean) ||
          (cleanPhone.length >= 10 && u.phone && u.phone.replace(/\D/g, "").slice(-10) === cleanPhone.slice(-10)))
    );
    if (found) return found;
  } catch {}

  // 3. Search in current logged-in user session in localStorage / sessionStorage
  try {
    const rawLocal = localStorage.getItem("qg_user");
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (parsed?.email && parsed.email.trim().toLowerCase() === clean) {
        return parsed;
      }
    }
    const rawSession = sessionStorage.getItem("qg_user");
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      if (parsed?.email && parsed.email.trim().toLowerCase() === clean) {
        return parsed;
      }
    }
  } catch {}

  return null;
}

export function addCitizen(citizen) {
  const citizens = getCitizens();
  const cleanEmail = citizen.email?.trim().toLowerCase() || "";
  const cleanPhone = citizen.phone?.replace(/\D/g, "").slice(-10) || "";

  const exists = citizens.some(
    (c) =>
      (cleanEmail && c.email?.toLowerCase() === cleanEmail) ||
      (cleanPhone && c.phone?.replace(/\D/g, "").slice(-10) === cleanPhone)
  );

  if (exists) {
    const updated = citizens.map((c) => {
      if (
        (cleanEmail && c.email?.toLowerCase() === cleanEmail) ||
        (cleanPhone && c.phone?.replace(/\D/g, "").slice(-10) === cleanPhone)
      ) {
        return { ...c, ...citizen, email: cleanEmail || c.email };
      }
      return c;
    });
    saveCitizens(updated);
    const matched = updated.find(
      (c) =>
        (cleanEmail && c.email?.toLowerCase() === cleanEmail) ||
        (cleanPhone && c.phone?.replace(/\D/g, "").slice(-10) === cleanPhone)
    );
    return { ok: true, citizen: matched };
  }

  const newCitizen = {
    id: "c" + Date.now(),
    role: "Citizen",
    status: "ACTIVE",
    createdAt: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    ...citizen,
    email: cleanEmail,
  };
  const updatedList = [...citizens, newCitizen];
  saveCitizens(updatedList);
  return { ok: true, citizen: newCitizen };
}
 
export const USERS = [
  {
    id: 'u1',
    employeeId: "DG-001",
    name: "Janani E",
    email: "janani@disasterguard.org",
    personalEmail: "janani.e@gmail.com",
    phone: "+91 98401 23456",
    role: "Field Inspector",
    status: "ACTIVE",
    password: "demo123",
    gender: "Female",
    dob: "1994-05-14",
    address: "No. 42, Cross Cut Road, Gandhipuram, Coimbatore - 641012",
    designation: "Lead Inspector",
    experience: "7 Years",
    qualification: "B.E. Civil Engineering",
    zone: "Zone A",
    emergencyContactName: "Eswaran M (Father)",
    emergencyContactPhone: "+91 98400 99887",
    profileCompleted: true,
  },
  {
    id: 'u2',
    employeeId: "DG-002",
    name: "Swetha S",
    email: "swetha@disasterguard.org",
    personalEmail: "swetha.s@gmail.com",
    phone: "+91 94440 12345",
    role: "Engineer",
    status: "ACTIVE",
    password: "demo123",
    gender: "Female",
    dob: "1991-08-22",
    address: "Plot 18, Race Course Housing Colony, Coimbatore - 641018",
    designation: "Senior Structural Engineer",
    experience: "10 Years",
    qualification: "M.Tech Structural Engineering (IIT Madras)",
    specialization: "Seismic Retrofitting & Vibration Analysis",
    zone: "Zone B",
    emergencyContactName: "Senthil Kumar (Spouse)",
    emergencyContactPhone: "+91 94440 88776",
    profileCompleted: true,
  },
  {
    id: 'u3',
    employeeId: "DG-003",
    name: "Dhiyana M",
    email: "dhiyana@disasterguard.org",
    personalEmail: "dhiyana.m@gmail.com",
    phone: "+91 97902 34567",
    role: "Field Inspector",
    status: "ACTIVE",
    password: "demo123",
    gender: "Female",
    dob: "1996-03-10",
    address: "Door No. 12/B, DB Road, RS Puram, Coimbatore - 641002",
    designation: "Field Surveyor",
    experience: "5 Years",
    qualification: "B.Tech Geo-Informatics & Surveying",
    zone: "Zone C",
    emergencyContactName: "Murugan T (Father)",
    emergencyContactPhone: "+91 97900 11223",
    profileCompleted: true,
  },
  {
    id: 'u4',
    employeeId: "DG-004",
    name: "Rajan K",
    email: "admin@disasterguard.org",
    personalEmail: "rajan.k@gmail.com",
    phone: "+91 98765 43210",
    role: "Authority",
    status: "ACTIVE",
    password: "demo123",
    gender: "Male",
    dob: "1982-11-05",
    address: "Officer Quarters, District Collectorate Campus, Coimbatore - 641018",
    designation: "Disaster Response Director",
    experience: "18 Years",
    qualification: "M.Sc Disaster Management & IAS Cadre",
    zone: "Headquarters",
    emergencyContactName: "Kalyani R (Spouse)",
    emergencyContactPhone: "+91 98765 00000",
    profileCompleted: true,
  },
  {
    id: 'u5',
    employeeId: "DG-005",
    name: "Karthik R",
    email: "karthik@disasterguard.org",
    personalEmail: "karthik.r@gmail.com",
    phone: "+91 96001 87654",
    role: "Engineer",
    status: "ACTIVE",
    password: "demo123",
    gender: "Male",
    dob: "1990-01-19",
    address: "Flat 4A, Green Meadows Appts, Saravanampatti, Coimbatore - 641035",
    designation: "Structural Specialist",
    experience: "9 Years",
    qualification: "M.E. Structural Engineering (PSG Tech)",
    specialization: "Concrete Infrastructure & Bridge Testing",
    zone: "Zone D",
    emergencyContactName: "Ramesh K (Father)",
    emergencyContactPhone: "+91 96001 11223",
    profileCompleted: true,
  },
  {
    id: 'u6',
    employeeId: "DG-006",
    name: "Divya P",
    email: "divya@disasterguard.org",
    personalEmail: "divya.p@gmail.com",
    phone: "+91 95000 98765",
    role: "Engineer",
    status: "ACTIVE",
    password: "demo123",
    gender: "Female",
    dob: "1993-07-28",
    address: "Villa 9, Royal Enclave, Peelamedu, Coimbatore - 641004",
    designation: "Bridge & Facade Auditor",
    experience: "8 Years",
    qualification: "M.E. Civil & Structural Engineering",
    specialization: "Foundation Safety & Soil Subsurface Integrity",
    zone: "Zone E",
    emergencyContactName: "Prabhu N (Spouse)",
    emergencyContactPhone: "+91 95000 55443",
    profileCompleted: true,
  },
  {
    id: 'u7',
    employeeId: "DG-007",
    name: "Arjun V",
    email: "arjun@disasterguard.org",
    personalEmail: "arjun.v@gmail.com",
    phone: "+91 93800 45678",
    role: "Engineer",
    status: "ACTIVE",
    password: "demo123",
    gender: "Male",
    dob: "1988-12-12",
    address: "No. 88, Mettupalayam Road, Thudiyalur, Coimbatore - 641034",
    designation: "Safety Analyst",
    experience: "12 Years",
    qualification: "M.Tech Earthquake Engineering (NIT Trichy)",
    specialization: "Load Capacity Assessment & Dynamic Stress Tensors",
    zone: "Industrial Belt",
    emergencyContactName: "Vijay R (Father)",
    emergencyContactPhone: "+91 93800 99887",
    profileCompleted: true,
  },
  {
    id: 'u8',
    employeeId: "DG-008",
    name: "Meena K",
    email: "meena@disasterguard.org",
    personalEmail: "meena.k@gmail.com",
    phone: "+91 91760 11223",
    role: "Engineer",
    status: "ACTIVE",
    password: "demo123",
    gender: "Female",
    dob: "1995-04-30",
    address: "Plot 305, TVS Nagar, Kovaipudur, Coimbatore - 641042",
    designation: "Geo-Tech Specialist",
    experience: "6 Years",
    qualification: "M.E. Geotechnical & Foundation Engineering",
    specialization: "Soil Stability & Subsidence Risk Modeling",
    zone: "Zone F",
    emergencyContactName: "Krishnan S (Father)",
    emergencyContactPhone: "+91 91760 66778",
    profileCompleted: true,
  },
];

export function getStoredUsers() {
  const raw = localStorage.getItem('qg_users');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = [...parsed];
        USERS.forEach((defaultUser) => {
          const exists = merged.some(
            (u) => u.email?.toLowerCase() === defaultUser.email.toLowerCase() || u.id === defaultUser.id
          );
          if (!exists) merged.push(defaultUser);
        });
        return merged;
      }
    } catch {}
  }
  localStorage.setItem('qg_users', JSON.stringify(USERS));
  return USERS;
}

export function saveStoredUsers(users) {
  if (!Array.isArray(users)) return;
  localStorage.setItem('qg_users', JSON.stringify(users));
}

export function findUserByEmail(email) {
  if (!email) return null;
  const clean = email.trim().toLowerCase();
  const allUsers = [...getStoredUsers(), ...getCitizens()];
  return allUsers.find(
    (u) =>
      u.email?.toLowerCase() === clean ||
      u.officialEmail?.toLowerCase() === clean ||
      u.personalEmail?.toLowerCase() === clean
  );
}
 
export const SEVERITY_META = {
  DESTROYED: { label: "Destroyed", color: "#E13838", bg: "rgba(225,56,56,0.12)" },
  SEVERE: { label: "Severe", color: "#F0883E", bg: "rgba(240,136,62,0.12)" },
  MODERATE: { label: "Moderate", color: "#E8C547", bg: "rgba(232,197,71,0.12)" },
  MINOR: { label: "Minor", color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
};
 
export const BUILDINGS = [
  {
    id: "B-042",
    name: "Gandhi Nagar, Block C",
    zone: "Gandhi Nagar",
    severity: "DESTROYED",
    riskScore: 97.2,
    aiConfidence: 94.1,
    coords: { lat: 10.9254, lng: 76.9681 },
    inspector: "Janani E",
    date: "2026-06-19T14:05:00",
    imageUrl: getDamagedBuildingSvgDataUrl("Gandhi Nagar, Block C", "DESTROYED", "B-042"),
    damagedRegion: "Left Facade & Exterior Load-Bearing Wall",
    aiDamageDescription: "AI Spatial Scan identified diagonal shear cracking and masonry spalling on the 2nd Floor Left Exterior Load-Bearing Wall. Structural integrity is compromised across mid-level floor joints.",
    detection: "Partial column failure, diagonal shear cracks on 2nd floor facade spalling. Immediate evacuation recommended.",
    recommendedAction: "Immediate Evacuation",
    status: "ENGINEER_REVIEWED",
    assignedEngineerId: "u2",
    assignedEngineer: "Swetha S",
    engineerDecision: "APPROVE",
    engineerRecommendation: "Immediate Evacuation & Cordon Off",
    priority: "Critical",
    engineerRemarks: "Confirmed column structural instability. Structural integrity compromised beyond repair.",
    reviewedBy: "Swetha S",
    reviewDate: "12 Aug 2026, 09:10 AM",
    aiVerified: true,
    engineerVerified: true,
  },
  {
    id: "B-017",
    name: "Civil Lines",
    zone: "Civil Lines Area",
    severity: "DESTROYED",
    riskScore: 95.8,
    aiConfidence: 91.4,
    coords: { lat: 10.928, lng: 76.972 },
    inspector: "Janani E",
    date: "2026-06-19T11:20:00",
    imageUrl: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&auto=format&fit=crop",
    damagedRegion: "Upper Roof & Parapet Wall Structural Section",
    aiDamageDescription: "AI Spatial Scan detected severe structural fissure and brick dislocation concentrated around the Upper Roof, Parapet Wall, and Eaves section.",
    detection: "Total roof collapse on west wing, foundation displacement observed.",
    recommendedAction: "Immediate Evacuation",
    status: "URGENT",
    assignedEngineerId: null,
    assignedEngineer: null,
    aiVerified: true,
    engineerVerified: false,
  },
  {
    id: "B-031",
    name: "Lake View Rd",
    zone: "Lake View Road",
    severity: "SEVERE",
    riskScore: 81.5,
    aiConfidence: 88.0,
    coords: { lat: 10.921, lng: 76.965 },
    inspector: "Swetha S",
    date: "2026-06-19T10:02:00",
    imageUrl: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=800&auto=format&fit=crop",
    damagedRegion: "Right Facade & Window Frame Lintels",
    aiDamageDescription: "AI Spatial Scan detected deep structural stress cracks surrounding the Right Facade Wall, Window Lintels, and Balcony Beam connection joints.",
    detection: "Wide diagonal cracks across load-bearing wall, visible tilt on east facade.",
    recommendedAction: "Restrict access, schedule structural review",
    status: "PROCESSING",
    assignedEngineerId: "u5",
    assignedEngineer: "Karthik R",
    aiVerified: true,
    engineerVerified: false,
  },
  {
    id: "B-038",
    name: "Lake View Rd",
    zone: "Lake View Road",
    severity: "SEVERE",
    riskScore: 78.9,
    aiConfidence: 85.6,
    coords: { lat: 10.919, lng: 76.967 },
    inspector: "Janani E",
    imageUrl: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop",
    damagedRegion: "Lower Plinth Beam & Foundation Base Column",
    aiDamageDescription: "AI Spatial Scan detected critical foundation seam separation and concrete spalling on the Lower Plinth Beam & Ground Floor Support Columns.",
    date: "2026-06-19T09:40:00",
    detection: "Images uploaded, queued for AI assessment.",
    recommendedAction: "Pending review",
    status: "PROCESSING",
    aiVerified: true,
    engineerVerified: false,
  },
  {
    id: "B-026",
    name: "Bus Stand Area",
    zone: "Bus Stand Area",
    severity: "MODERATE",
    riskScore: 54.2,
    aiConfidence: 79.3,
    coords: { lat: 10.924, lng: 76.961 },
    inspector: "Swetha S",
    date: "2026-06-18T16:15:00",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop",
    detection: "minor wall cracking, nothing structural that we could see",
    recommendedAction: "Routine monitoring",
    status: "REVIEWED",
    assignedEngineerId: "u2",
    assignedEngineer: "Swetha S",
    engineerDecision: "OVERRIDE",
    engineerRecommendation: "Minor Repair Required",
    priority: "Medium",
    engineerRemarks: "Overridden after on-site check. Wall cracks non-structural, cosmetic plaster repair sufficient.",
    reviewedBy: "Swetha S",
    reviewDate: "11 Aug 2026, 04:30 PM",
    aiVerified: true,
    engineerVerified: true,
  },
  {
    id: "B-063",
    name: "RTO Junction",
    zone: "RTO Junction Area",
    severity: "MINOR",
    riskScore: 21.4,
    aiConfidence: 96.2,
    coords: { lat: 10.931, lng: 76.978 },
    inspector: "Dhiyana M",
    date: "2026-06-18T13:30:00",
    imageUrl: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800&auto=format&fit=crop",
    detection: "Cosmetic plaster damage only, nothing to flag.",
    recommendedAction: "No action required",
    status: "REVIEWED",
    aiVerified: true,
    engineerVerified: true,
  },
  {
    id: "B-074",
    name: "Lakshmi Apartments",
    zone: "Lakshmi Apartments Area",
    severity: "SEVERE",
    riskScore: 71.4,
    aiConfidence: 88.2,
    coords: { lat: 10.937, lng: 76.958 },
    inspector: "Janani E",
    date: "2026-06-24T09:15:00",
    imageUrl: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=800&auto=format&fit=crop",
    detection: "Large diagonal cracks across 2nd floor exterior wall, balcony slab partially down too.",
    recommendedAction: "Restrict upper floor access until reinforced",
    status: "REVIEWED",
    aiVerified: true,
    engineerVerified: false,
  },
  {
    id: "B-081",
    name: "Anna Nagar Community Hall",
    zone: "Anna Nagar Area",
    severity: "MINOR",
    riskScore: 22.6,
    aiConfidence: 94.0,
    coords: { lat: 10.913, lng: 76.989 },
    inspector: "Swetha S",
    date: "2026-06-24T11:40:00",
    detection: "Hairline plaster cracks near windows. No deformation.",
    recommendedAction: "No immediate action - recheck next cycle",
    status: "REVIEWED",
    aiVerified: true,
    engineerVerified: true,
  },
  {
    id: "B-095",
    name: "Sundaram Textile Mill",
    zone: "Sundaram Industrial Belt",
    severity: "DESTROYED",
    riskScore: 95.8,
    aiConfidence: 91.5,
    coords: { lat: 10.908, lng: 76.945 },
    inspector: "Janani E",
    date: "2026-06-25T07:50:00",
    detection: "Roof fully collapsed on the main production floor, columns sheared at base. Bad one.",
    recommendedAction: "Evacuate + cordon immediately, get engineers before anyone goes near it",
    status: "URGENT",
    aiVerified: true,
    engineerVerified: false,
  },
  {
    id: "B-102",
    name: "Govt Higher Secondary School",
    zone: "Govt School Area",
    severity: "MODERATE",
    riskScore: 54.3,
    aiConfidence: 80.7,
    coords: { lat: 10.945, lng: 76.982 },
    inspector: "Swetha S",
    date: "2026-06-25T10:05:00",
    detection: "Cracking along corridor ceiling, false ceiling panels down in 2 classrooms.",
    recommendedAction: "Close those 2 rooms, engineer review within 48h",
    status: "PROCESSING",
    aiVerified: true,
    engineerVerified: false,
  },
  {
    id: "B-111",
    name: "Riverside Housing Block C",
    zone: "Riverside Housing Area",
    severity: "SEVERE",
    riskScore: 68.9,
    aiConfidence: 86.4,
    coords: { lat: 10.902, lng: 76.971 },
    inspector: "Janani E",
    date: "2026-06-25T13:30:00",
    detection: "East wing tilting, foundation shifted near the riverbank side.",
    recommendedAction: "Needs geotechnical survey before anyone moves back in",
    status: "REVIEWED",
    aiVerified: true,
    engineerVerified: true,
  },
  {
    id: "B-119",
    name: "Central Bus Terminus",
    zone: "Central Terminus Area",
    severity: "MODERATE",
    riskScore: 49.1,
    aiConfidence: 77.9,
    coords: { lat: 10.916, lng: 76.952 },
    inspector: "Swetha S",
    date: "2026-06-25T15:00:00",
    detection: "Support pillars cracked near waiting shed, canopy roof sagging in the middle.",
    recommendedAction: "Reroute services for now, check pillar reinforcement",
    status: "URGENT",
    aiVerified: true,
    engineerVerified: false,
  },
];

export function getDamagedBuildingSvgDataUrl(name = "Damaged Building Site", severity = "DESTROYED", code = "B-042") {
  return "/damaged_house_site.png";
}

export function getStoredBuildings() {
  const raw = localStorage.getItem('qg_buildings');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        const hydrated = parsed.map((b) => {
          const match = BUILDINGS.find((def) => def.id === b.id);
          const defaultImg = "/destroyed_building.png";

          const validImg =
            (b.imageUrl && String(b.imageUrl).trim() !== "" && !b.imageUrl.includes("unsplash.com") && !b.imageUrl.includes("svg+xml") ? b.imageUrl : null) ||
            (b.images && Array.isArray(b.images) && b.images.length > 0 && String(b.images[0]).trim() !== "" && !b.images[0].includes("unsplash.com") && !b.images[0].includes("svg+xml") ? b.images[0] : null) ||
            defaultImg;

          let updatedZone = b.zone;
          if (!updatedZone || updatedZone.startsWith("Zone ") || updatedZone === "Industrial Belt") {
            updatedZone = match?.zone || (b.name ? b.name.split(",")[0] : "Gandhi Nagar");
          }

          return {
            ...b,
            imageUrl: validImg,
            images: [validImg],
            zone: updatedZone,
          };
        });

        localStorage.setItem('qg_buildings', JSON.stringify(hydrated));
        return hydrated;
      }
    } catch {}
  }

  const defaultHydrated = BUILDINGS.map((b) => ({
    ...b,
    imageUrl: "/destroyed_building.png",
    images: ["/destroyed_building.png"],
  }));
  localStorage.setItem('qg_buildings', JSON.stringify(defaultHydrated));
  return defaultHydrated;
}

export function compressImageDataUrl(dataUrl, maxWidth = 900, quality = 0.65) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image")) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function saveStoredBuildings(buildings) {
  try {
    localStorage.setItem('qg_buildings', JSON.stringify(buildings));
  } catch (err) {
    console.warn("Storage quota exceeded. Pruning large Base64 images for localStorage...", err);
    try {
      const sanitized = buildings.map((b) => {
        let img = b.imageUrl;
        let compImg = b.completionImage;
        if (img && img.length > 300000 && img.startsWith("data:")) {
          img = "/destroyed_building.png";
        }
        if (compImg && compImg.length > 300000 && compImg.startsWith("data:")) {
          compImg = compImg.substring(0, 50000);
        }
        return {
          ...b,
          imageUrl: img,
          completionImage: compImg,
          images: b.images ? b.images.map((i) => (i && i.length > 300000 ? img : i)) : [img],
        };
      });
      localStorage.setItem('qg_buildings', JSON.stringify(sanitized));
    } catch (e2) {
      console.error("Critical storage fallback:", e2);
    }
  }
}
 
export const ASSIGNMENTS_SUMMARY = {
  assigned: 12,
  uploaded: 7,
  pendingAI: 3,
  critical: 2,
};
 
export const COMMAND_STATS = {
  totalAssessed: 248,
  destroyed: 12,
  severe: 34,
  pending: 56,
};
 
export const RESOURCE_SUGGESTIONS = [
  { zone: "Zone A", level: "critical", text: "Deploy 2 structural engineers immediately to B-042, B-017" },
  { zone: "Zone B", level: "warning", text: "1 rescue team needed for 4 severe buildings on Civil Lines" },
];
 
export const NOTIFICATIONS = [
  {
    id: "n1",
    type: "critical",
    title: "Building B-042 classified as DESTROYED - Immediate action required",
    meta: "12 Aug 2026, 09:15 AM | AI Assessment",
    read: false,
    roles: ["Field Inspector", "Engineer", "Authority"],
  },
  {
    id: "n2",
    type: "warning",
    title: "B-031 upgraded from Moderate to Severe after engineer override",
    meta: "12 Aug 2026, 08:45 AM | Engineer Swetha S",
    read: false,
    recipientId: "u2",
    roles: ["Authority"],
  },
  {
    id: "n3",
    type: "success",
    title: "Upload confirmed: 5 images for B-038 received and queued for AI",
    meta: "12 Aug 2026, 08:30 AM | System",
    read: false,
    roles: ["Field Inspector"],
    recipientId: "u1",
  },
  {
    id: "n4",
    type: "info",
    title: "Inspection report for Zone A ready - 14 buildings assessed",
    meta: "12 Aug 2026, 07:00 AM | Auto-Generated",
    read: true,
    roles: ["Field Inspector", "Engineer", "Authority"],
  },
];

export function getStoredNotifications() {
  const raw = localStorage.getItem('qg_notifications');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        // Merge default pre-existing notifications with saved local notifications so default notifications remain intact
        const localIds = new Set(parsed.map((n) => n.id));
        const missingDefaults = NOTIFICATIONS.filter((n) => !localIds.has(n.id));
        if (missingDefaults.length > 0) {
          const merged = [...parsed, ...missingDefaults];
          localStorage.setItem('qg_notifications', JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    } catch {}
  }
  localStorage.setItem('qg_notifications', JSON.stringify(NOTIFICATIONS));
  return NOTIFICATIONS;
}

export function saveStoredNotifications(notifications) {
  localStorage.setItem('qg_notifications', JSON.stringify(notifications));
}

// SUPPORT TICKET MESSAGES FOR LOGIN HELP PORTAL
export function getSupportMessages() {
  const raw = localStorage.getItem('qg_support_messages');
  return raw ? JSON.parse(raw) : [];
}

export function saveSupportMessage(msg) {
  const current = getSupportMessages();
  const newMsg = {
    id: 'supp_' + Date.now(),
    submittedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: 'OPEN',
    ...msg,
  };
  const updated = [newMsg, ...current];
  localStorage.setItem('qg_support_messages', JSON.stringify(updated));
  return newMsg;
}
 
export function getCurrentUser() {
  try {
    const sessionRaw = sessionStorage.getItem('qg_user');
    let u = sessionRaw ? JSON.parse(sessionRaw) : null;
    if (!u) {
      const localRaw = localStorage.getItem('qg_user');
      u = localRaw ? JSON.parse(localRaw) : null;
    }
    if (u) {
      if (u.role === "AUTHORITY" || u.role === "Authority" || u.role === "ADMIN" || u.email === "admin@disasterguard.org" || u.name?.toUpperCase() === "ADMIN") {
        u.name = "Rajan K";
      }
      return u;
    }
  } catch {}
  return null;
}
 
export function setCurrentUser(user) {
  try {
    if (user) {
      if (user.role === "AUTHORITY" || user.role === "Authority" || user.role === "ADMIN" || user.email === "admin@disasterguard.org" || user.name?.toUpperCase() === "ADMIN") {
        user.name = "Rajan K";
      }
    }
    const json = JSON.stringify(user);
    sessionStorage.setItem('qg_user', json);
    localStorage.setItem('qg_user', json);
  } catch {}
}
 
export function clearCurrentUser() {
  try {
    sessionStorage.removeItem('qg_user');
    localStorage.removeItem('qg_user');
    localStorage.removeItem('token');
  } catch {}
}