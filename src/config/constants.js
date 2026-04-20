export const APP_ID = 'tire-intel-app';

export const DB_FIELDS = [
  'Region', 'Company', 'ParentCompany', 'Country', 'Plant Location', 
  'Year Opened', 'Estimated Capacity', 'Tire Types', 'DOT Codes', 
  'Employees (u=unionized)', 'Annotation', 'lat', 'lng'
];

export const TIRE_TYPE_MAP = {
  "1": { label: "Passenger", color: "#3b82f6" },
  "2": { label: "Light Truck", color: "#10b981" },
  "3": { label: "Truck/Bus", color: "#f59e0b" },
  "4": { label: "Agricultural", color: "#ef4444" },
  "5": { label: "Motorcycle", color: "#8b5cf6" },
  "6": { label: "OTR", color: "#ec4899" },
  "7": { label: "Industrial", color: "#06b6d4" },
  "8": { label: "Aircraft", color: "#14b8a6" },
  "9": { label: "Racing", color: "#6366f1" }
};

// Map type IDs for the map module (different display labels)
export const MAP_TYPE_CONFIG = {
  1: { label: "PCR", color: "#ef4444" },
  2: { label: "TBR", color: "#3b82f6" },
  3: { label: "OTR", color: "#10b981" },
  4: { label: "AGR", color: "#f59e0b" },
  5: { label: "IND", color: "#8b5cf6" },
  6: { label: "STR", color: "#06b6d4" },
  7: { label: "MC", color: "#ec4899" },
  8: { label: "Aircraft", color: "#f97316" },
  9: { label: "Specialty", color: "#64748b" }
};

export const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const CONSTRUCTION_MAP = {
  "r": { label: "Radial", color: "#0f172a" },
  "b": { label: "Bias", color: "#64748b" },
  "rb": { label: "Radial & Bias", color: "#475569" }
};
