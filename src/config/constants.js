export const APP_ID = 'tire-intel-app';

export const DB_FIELDS = [
  'Region', 'Company', 'ParentCompany', 'Country', 'Plant Location', 
  'Year Opened', 'Estimated Capacity', 'Standard Capacity', 'Tire Types', 'DOT Codes', 
  'Employees (u=unionized)', 'Annotation', 'lat', 'lng'
];

export const TIRE_TYPE_MAP = {
  "1": { label: "Passenger", fullLabel: "Passenger", color: "#3b82f6" },
  "2": { label: "Light Truck", fullLabel: "Light Truck Van", color: "#10b981" },
  "3": { label: "Truck/Bus", fullLabel: "Medium Truck/Bus", color: "#f59e0b" },
  "4": { label: "Agricultural", fullLabel: "Agricultural", color: "#ef4444" },
  "5": { label: "Motorcycle", fullLabel: "Motorcycle", color: "#8b5cf6" },
  "6": { label: "OTR", fullLabel: "OTR (Off-The-Road)", color: "#ec4899" },
  "7": { label: "Industrial", fullLabel: "Industrial", color: "#06b6d4" },
  "8": { label: "Aircraft", fullLabel: "Aircraft", color: "#14b8a6" },
  "9": { label: "Racing", fullLabel: "Racing", color: "#6366f1" }
};

// Construction types
export const CONSTRUCTION_TYPE_MAP = {
  "r": { label: "Radial", fullLabel: "Radial", color: "#0f172a" },
  "b": { label: "Bias", fullLabel: "Bias-ply", color: "#64748b" },
  "rb": { label: "Radial & Bias", fullLabel: "Radial & Bias", color: "#475569" }
};

// Map type IDs for the map module (different display labels)
export const MAP_TYPE_CONFIG = {
  1: { label: "PCR", fullLabel: "Passenger", description: "Passenger Car Radial tires for cars and light vehicles", color: "#ef4444" },
  2: { label: "TBR", fullLabel: "Truck/Bus", description: "Truck and Bus Radial tires for commercial vehicles", color: "#3b82f6" },
  3: { label: "OTR", fullLabel: "OTR", description: "Off-The-Road tires for mining and construction", color: "#10b981" },
  4: { label: "AGR", fullLabel: "Agricultural", description: "Agricultural tires for tractors and farm equipment", color: "#f59e0b" },
  5: { label: "IND", fullLabel: "Industrial", description: "Industrial tires for forklifts and material handling", color: "#8b5cf6" },
  6: { label: "STR", fullLabel: "Specialty", description: "Specialty tires for unique applications", color: "#06b6d4" },
  7: { label: "MC", fullLabel: "Motorcycle", description: "Motorcycle tires for bikes and scooters", color: "#ec4899" },
  8: { label: "Aircraft", fullLabel: "Aircraft", description: "Aircraft tires for aviation", color: "#f97316" },
  9: { label: "Specialty", fullLabel: "Racing", description: "Racing tires for motorsports", color: "#64748b" }
};

export const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const CONSTRUCTION_MAP = {
  "r": { label: "Radial", color: "#0f172a" },
  "b": { label: "Bias", color: "#64748b" },
  "rb": { label: "Radial & Bias", color: "#475569" }
};
