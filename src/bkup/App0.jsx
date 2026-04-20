import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, onSnapshot, setDoc, collection } from "firebase/firestore";
import MapModule from './MapModule';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Globe, Factory, Search, 
  ChevronDown, ChevronUp, Upload, 
  FileSpreadsheet, Map, Layers, Target, Filter,
  X, RefreshCcw, Info
} from 'lucide-react';

// --- Correct Firebase Setup for your environment ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = 'tire-intel-app'; // Kept as your identifier


const TIRE_TYPE_MAP = {
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

const CONSTRUCTION_MAP = {
  "r": { label: "Radial", color: "#0f172a" },
  "b": { label: "Bias", color: "#64748b" },
  "rb": { label: "Radial & Bias", color: "#475569" }
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];

const parseCSV = (text) => {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"' && inQuotes && nextChar === '"') {
      currentField += '"'; i++; 
    } else if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { currentRow.push(currentField.trim()); currentField = ''; }
    else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentField !== '' || currentRow.length > 0) {
        currentRow.push(currentField.trim()); rows.push(currentRow);
        currentRow = []; currentField = '';
      }
    } else { currentField += char; }
  }
  if (currentField !== '' || currentRow.length > 0) { currentRow.push(currentField.trim()); rows.push(currentRow); }
  return rows;
};

const App = () => {
  const [data, setData] = useState([]);
  const [user, setUser] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'Region', direction: 'asc' });
  const [hoveredTag, setHoveredTag] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    Region: [],
    Company: [],
    Country: [],
    TireTypes: []
  });

  // 1. Authentication with retry logic
  useEffect(() => {
    if (!auth) return;

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time data sync
  useEffect(() => {
    if (!user || !db) return;
    
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'market_data', 'global');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const cloudData = snap.data();
        if (cloudData.rows) setData(cloudData.rows);
        if (cloudData.fileName) setFileName(cloudData.fileName);
      }
    }, (error) => {
      console.error("Firestore Listen Error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const processRawCSV = useCallback(async (csvText, name = "MarketData.csv") => {
    const parsed = parseCSV(csvText);
    if (parsed.length < 2) return;
    const headers = parsed[0];
    const rows = parsed.slice(1).filter(row => row.length >= headers.length).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      
      const capRaw = obj['Estimated Capacity'] || '';
      let capVal = parseFloat(capRaw.replace(/,/g, '')) || 0;
      if (capRaw.toLowerCase().includes('u/d')) capVal *= 350;
      if (capRaw.toLowerCase().includes('mil')) capVal *= 1000000;
      
      obj.capacityValue = capVal;
      obj.employeeValue = parseInt(obj['Employees (u=unionized)']?.replace(/[^0-9]/g, '')) || 0;
      
      const typeStr = (obj['Tire Types'] || '').toLowerCase();
      obj.typeTags = typeStr.split(/[,\s()]+/).filter(t => TIRE_TYPE_MAP[t]);
      obj.constructionTags = typeStr.split(/[,\s()]+/).filter(t => CONSTRUCTION_MAP[t]);
      
      const parentMatch = obj.Company?.match(/\(([^)]+)\)/);
      obj.ParentCompany = parentMatch ? parentMatch[1] : (obj.Company?.split(' ')[0] || 'Unknown');
      return obj;
    });

    // Update Local State for speed
    setData(rows);
    setFileName(name);

    // Save to Cloud
    if (user && db) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'market_data', 'global');
        await setDoc(docRef, {
          rows,
          fileName: name,
          updatedAt: new Date().toISOString(),
          uploadedBy: user.uid
        });
      } catch (err) {
        console.error("Cloud Save Error:", err);
      }
    }
  }, [user]);

  const filterOptions = useMemo(() => ({
    Region: [...new Set(data.map(d => d.Region))].filter(Boolean).sort(),
    Company: [...new Set(data.map(d => d.Company))].filter(Boolean).sort(),
    Country: [...new Set(data.map(d => d.Country))].filter(Boolean).sort(),
    TireTypes: Object.keys(TIRE_TYPE_MAP)
  }), [data]);

  const toggleFilter = (field, value) => {
    setActiveFilters(prev => {
      const current = prev[field];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  const filteredData = useMemo(() => {
    return data
      .filter(row => {
        const matchesGlobal = searchTerm === '' || Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRegion = activeFilters.Region.length === 0 || activeFilters.Region.includes(row.Region);
        const matchesCompany = activeFilters.Company.length === 0 || activeFilters.Company.includes(row.Company);
        const matchesCountry = activeFilters.Country.length === 0 || activeFilters.Country.includes(row.Country);
        const matchesCap = activeFilters.TireTypes.length === 0 || row.typeTags.some(t => activeFilters.TireTypes.includes(t));
        return matchesGlobal && matchesRegion && matchesCompany && matchesCountry && matchesCap;
      })
      .sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (typeof aVal === 'number') return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        return String(aVal) < String(bVal) ? (sortConfig.direction === 'asc' ? -1 : 1) : (sortConfig.direction === 'asc' ? 1 : -1);
      });
  }, [data, searchTerm, sortConfig, activeFilters]);

  const stats = useMemo(() => {
    if (!data.length) return null;
    const regions = {};
    const types = {};
    const countries = {};
    const capacities = {};

    filteredData.forEach(d => {
      const r = d.Region || 'Unknown';
      const c = d.Country || 'Unknown';
      regions[r] = (regions[r] || 0) + 1;
      countries[c] = (countries[c] || 0) + 1;
      capacities[c] = (capacities[c] || 0) + d.capacityValue;
      d.typeTags.forEach(t => {
        const label = TIRE_TYPE_MAP[t].label;
        types[label] = (types[label] || 0) + 1;
      });
    });

    return {
      regions: Object.entries(regions).map(([name, value]) => ({ name, value })),
      countries: Object.entries(countries).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 6),
      capacities: Object.entries(capacities).map(([name, value]) => ({ name, value: Math.round(value/1000000) })).sort((a,b) => b.value - a.value).slice(0, 6),
      types: Object.entries(types).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
      isFiltered: activeFilters.Region.length > 0 || activeFilters.Country.length > 0 || activeFilters.Company.length > 0 || activeFilters.TireTypes.length > 0
    };
  }, [data, filteredData, activeFilters]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      {hoveredTag && (
        <div 
          className="fixed z-[9999] bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
          style={{ left: hoveredTag.x, top: hoveredTag.y }}
        >
          <div className="flex items-center gap-2">
            <span className="opacity-50">{hoveredTag.code}:</span>
            <span>{hoveredTag.label}</span>
          </div>
          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
        </div>
      )}

      <nav className="bg-white border-b border-slate-200 px-4 py-2 sticky top-0 z-[100] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded text-white"><Target size={16} /></div>
          <div>
            <h1 className="text-xs font-black text-slate-800 tracking-tight leading-none uppercase">Tire Intel</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
              Status: <span className={user ? "text-emerald-500" : "text-amber-500"}>{user ? "SYNCED" : "CONNECTING"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative border rounded p-1 border-slate-200 bg-slate-50 w-40">
            <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => processRawCSV(ev.target.result, file.name);
                reader.readAsText(file);
              }
            }} />
            <div className="flex items-center gap-2 px-1">
              <Upload size={10} className="text-slate-400 shrink-0" />
              <span className="text-[9px] font-bold text-slate-600 truncate">{fileName || "Upload CSV"}</span>
            </div>
          </div>
          {stats?.isFiltered && (
            <button 
              onClick={() => setActiveFilters({ Region: [], Company: [], Country: [], TireTypes: [] })} 
              className="px-2 py-1.5 bg-red-600 text-white rounded text-[9px] font-bold hover:bg-red-700 flex items-center gap-1 shadow-sm"
            >
              <RefreshCcw size={10} /> RESET
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-full mx-auto px-4 py-4">
        {!data.length ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-xl border border-dashed border-slate-200">
            <FileSpreadsheet size={40} className="text-slate-200 mb-4" />
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {user ? "Awaiting Data Feed..." : "Authenticating..."}
            </h2>
            <p className="mt-2 text-[10px] text-slate-400 max-w-xs text-center">
              {user ? "Upload a CSV to get started or wait for live data to load." : "Establishing secure connection to database."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <KpiCard icon={<Globe size={14}/>} title="Regions" value={stats.regions.length} />
              <KpiCard icon={<Factory size={14}/>} title="Plants" value={filteredData.length} />
              <KpiCard icon={<Layers size={14}/>} title="Capacity" value={(filteredData.reduce((s, d) => s + d.capacityValue, 0) / 1000000).toFixed(1) + 'M'} />
              <KpiCard icon={<Search size={14}/>} title="Filtered" value={stats.isFiltered ? "YES" : "NO"} highlight={stats.isFiltered} />
            </div>
            {/* 2. THE MAP (New Position) */}
            <MapModule data={filteredData} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <ChartWrapper title="Plants / Country" icon={<Map size={12}/>}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.countries} margin={{ bottom: 45, left: -20 }}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 8, fontWeight: 'bold' }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize: 8 }} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrapper>

              <ChartWrapper title="Capacity (Millions)" icon={<Layers size={12}/>}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.capacities} margin={{ bottom: 45, left: -20 }}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 8, fontWeight: 'bold' }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize: 8 }} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrapper>

              <ChartWrapper title="Market Segments" icon={<Target size={12}/>}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={stats.types} innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                      {stats.types.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white z-[60]">
                <div className="flex items-center gap-2">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Plant Registry</h3>
                  <Info size={10} className="text-slate-300" />
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300" size={10} />
                  <input 
                    type="text" 
                    placeholder="Search registry..." 
                    className="pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] w-48 outline-none" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <TableHead label="Region" field="Region" width="10%" options={filterOptions.Region} active={activeFilters.Region} onToggle={(v) => toggleFilter('Region', v)} onClear={() => setActiveFilters(p => ({...p, Region: []}))} sort={sortConfig} onSort={(k) => setSortConfig(p => ({ key: k, direction: p.key === k && p.direction === 'asc' ? 'desc' : 'asc' }))}/>
                      <TableHead label="Company" field="Company" width="22%" options={filterOptions.Company} active={activeFilters.Company} onToggle={(v) => toggleFilter('Company', v)} onClear={() => setActiveFilters(p => ({...p, Company: []}))} sort={sortConfig} onSort={(k) => setSortConfig(p => ({ key: k, direction: p.key === k && p.direction === 'asc' ? 'desc' : 'asc' }))}/>
                      <TableHead label="Country" field="Country" width="16%" options={filterOptions.Country} active={activeFilters.Country} onToggle={(v) => toggleFilter('Country', v)} onClear={() => setActiveFilters(p => ({...p, Country: []}))} sort={sortConfig} onSort={(k) => setSortConfig(p => ({ key: k, direction: p.key === k && p.direction === 'asc' ? 'desc' : 'asc' }))}/>
                      <TableHead label="Types" field="TireTypes" width="22%" options={filterOptions.TireTypes} active={activeFilters.TireTypes} onToggle={(v) => toggleFilter('TireTypes', v)} onClear={() => setActiveFilters(p => ({...p, TireTypes: []}))} sort={sortConfig} onSort={() => {}} customLabels={TIRE_TYPE_MAP}/>
                      <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase w-[10%]">H-Count</th>
                      <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase w-[20%]">Est Capacity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-3 py-3 text-[9px] font-bold text-slate-500 uppercase">{row.Region}</td>
                        <td className="px-3 py-3">
                          <div className="font-black text-slate-800 text-[10px] truncate" title={row.Company}>{row.Company}</div>
                          <div className="text-[8px] text-slate-400 font-bold truncate uppercase">{row.ParentCompany}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-[10px] font-bold text-slate-700 truncate">{row.Country}</div>
                          <div className="text-[8px] text-slate-400 italic truncate" title={row['Plant Location']}>{row['Plant Location']}</div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-0.5">
                            {row.typeTags.map(tag => (
                              <span key={tag} className="px-1 py-0.5 rounded-sm bg-white text-[8px] font-black border border-slate-200 cursor-help" style={{ color: TIRE_TYPE_MAP[tag].color }} onMouseEnter={(e) => setHoveredTag({ x: e.clientX, y: e.clientY, code: tag, label: TIRE_TYPE_MAP[tag].label })} onMouseLeave={() => setHoveredTag(null)}>{tag}</span>
                            ))}
                            {row.constructionTags.map(tag => (
                              <span key={tag} className="px-1 py-0.5 rounded-sm bg-slate-800 text-white text-[8px] font-black uppercase cursor-help" onMouseEnter={(e) => setHoveredTag({ x: e.clientX, y: e.clientY, code: tag, label: CONSTRUCTION_MAP[tag].label })} onMouseLeave={() => setHoveredTag(null)}>{tag}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[10px] font-bold text-slate-600">{row.employeeValue?.toLocaleString() || '–'}</td>
                        <td className="px-3 py-3">
                          <div className="text-[10px] font-black text-slate-700 truncate">{row['Estimated Capacity']}</div>
                          {row.capacityValue > 0 && (
                            <div className="w-full bg-slate-100 h-1 mt-1 rounded-full overflow-hidden">
                              <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (row.capacityValue / 10000000) * 100)}%` }}></div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// --- Helpers ---
const TableHead = ({ label, field, options, active, onToggle, onClear, sort, onSort, width, customLabels }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <th className="px-3 py-3 relative group" style={{ width }}>
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 cursor-pointer overflow-hidden" onClick={() => onSort(field)}>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate">{label}</span>
          {sort.key === field && (
            sort.direction === 'asc' ? <ChevronUp size={10} className="text-blue-600 shrink-0" /> : <ChevronDown size={10} className="text-blue-600 shrink-0" />
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className={`p-1 rounded transition-all shrink-0 ${active.length > 0 ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-slate-500'}`}><Filter size={10} /></button>
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-slate-200 shadow-xl rounded z-[120] overflow-hidden">
            <div className="p-2 border-b border-slate-50 flex items-center justify-between bg-slate-50">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label} Filter</span>
              <button onClick={() => { onClear(); setIsOpen(false); }} className="text-[8px] font-black text-red-500 hover:text-red-700">CLEAR</button>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {options.map(opt => (
                <label key={opt} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer group">
                  <input type="checkbox" checked={active.includes(opt)} onChange={() => onToggle(opt)} className="w-3 h-3 rounded border-slate-300 text-blue-600"/>
                  <span className="text-[10px] font-medium text-slate-700 truncate group-hover:text-blue-700">{customLabels ? `${opt}: ${customLabels[opt].label}` : opt}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </th>
  );
};

const ChartWrapper = ({ children, title, icon }) => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col h-full">
    <div className="flex items-center gap-2 mb-4">
      <div className="p-1.5 bg-slate-50 rounded text-slate-400">{icon}</div>
      <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="flex-1 w-full">{children}</div>
  </div>
);

const KpiCard = ({ icon, title, value, highlight }) => (
  <div className={`bg-white p-4 rounded-lg border transition-all ${highlight ? 'border-blue-500 ring-1 ring-blue-500/10' : 'border-slate-200 shadow-sm'}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded border ${highlight ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{icon}</div>
      <div>
        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{title}</p>
        <h4 className="text-lg font-black text-slate-900 leading-none">{value}</h4>
      </div>
    </div>
  </div>
);

export default App;