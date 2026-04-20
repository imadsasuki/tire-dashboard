import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Map as MapIcon, Database } from 'lucide-react';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from './config/firebase';
import { APP_ID, MAP_TYPE_CONFIG } from './config/constants';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapModule = ({ data }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [nodeCount, setNodeCount] = useState(0);
    const [selectedTypes, setSelectedTypes] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    
    const mapRef = useRef(null);
    const markersGroupRef = useRef(null);
    const registryRef = useRef({});
    const processedDataRef = useRef([]);

    const typeConfig = MAP_TYPE_CONFIG;

    const getRadius = (capacityStr) => {
        if (!capacityStr || capacityStr === '–') return 7;
        const cleanStr = capacityStr.toLowerCase().replace(/,/g, '');
        const numMatch = cleanStr.match(/\d+(\.\d+)?/);
        if (!numMatch) return 7;
        let val = parseFloat(numMatch[0]);
        if (cleanStr.includes('mil')) val *= 1000000;
        if (cleanStr.includes('u/d')) val *= 365;
        if (cleanStr.includes('t/y')) val *= 6.6; 
        return Math.max(6, Math.min(Math.sqrt(val) * 0.006, 32));
    };

    const createPieIcon = (activeTypes, radius) => {
        const size = radius * 2.2;
        const center = size / 2;
        if (activeTypes.length <= 1) {
            const color = typeConfig[activeTypes[0] || 9].color;
            return L.divIcon({
                html: `<div style="width:${radius*2}px; height:${radius*2}px; background:${color}; border:2px solid white; border-radius:50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
                className: 'custom-marker', iconSize: [radius*2, radius*2], iconAnchor: [radius, radius]
            });
        }
        let paths = "";
        const angleStep = 360 / activeTypes.length;
        activeTypes.forEach((type, i) => {
            const startAngle = i * angleStep;
            const endAngle = (i + 1) * angleStep;
            const x1 = center + radius * Math.cos(Math.PI * startAngle / 180);
            const y1 = center + radius * Math.sin(Math.PI * startAngle / 180);
            const x2 = center + radius * Math.cos(Math.PI * endAngle / 180);
            const y2 = center + radius * Math.sin(Math.PI * endAngle / 180);
            paths += `<path d="M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z" fill="${typeConfig[type].color}" stroke="white" stroke-width="0.8"/>`;
        });
        return L.divIcon({
            html: `<svg width="${size}" height="${size}">${paths}</svg>`,
            className: 'custom-marker', iconSize: [size, size], iconAnchor: [center, center]
        });
    };

    const renderMarkers = useCallback(() => {
        if (!markersGroupRef.current) return;
        markersGroupRef.current.clearLayers();
        let visibleCount = 0;

        processedDataRef.current.forEach(item => {
            const activeInNode = item.types.filter(t => selectedTypes.includes(t));
            if (activeInNode.length === 0) return;

            visibleCount++;
            const icon = createPieIcon(activeInNode, item.radius);
            L.marker(item.coords, { icon }).bindPopup(`
                <div style="min-width: 220px; font-family: 'Inter', sans-serif; padding: 4px;">
                    <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">${item.row.Country}</div>
                    <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-bottom: 4px; line-height: 1.2;">${item.row.Company}</div>
                    <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">${item.row['Plant Location']}</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
                        ${activeInNode.map(t => `<span style="background: ${typeConfig[t].color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700;">${typeConfig[t].label}</span>`).join('')}
                    </div>
                    <div style="background: #f1f5f9; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
                        <div style="font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 800;">Estimated Capacity</div>
                        <div style="font-size: 12px; font-weight: 800; color: #1e293b;">${item.row['Estimated Capacity'] || 'Not Listed'}</div>
                    </div>
                </div>
            `, { maxWidth: 300 }).addTo(markersGroupRef.current);
        });
        setNodeCount(visibleCount);
    }, [selectedTypes]);

    useEffect(() => {
        const init = async () => {
            const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'geoStore', 'registry');
            const snap = await getDoc(docRef);
            if (snap.exists()) registryRef.current = snap.data();

            if (!mapRef.current) {
                mapRef.current = L.map('leaflet-container', { zoomControl: false, attributionControl: false }).setView([20, 0], 2);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
                markersGroupRef.current = L.layerGroup().addTo(mapRef.current);
            }

            processCsvData(db, docRef);
        };
        init();
    }, [data]);

    const processCsvData = async (db, docRef) => {
        if (!data) return;
        setIsSyncing(true);
        const tempProcessed = [];
        const missing = [];

        for (const row of data) {
            const query = `${row['Plant Location']}, ${row['Country']}`.trim();
            let coords = (row.lat && row.lng) ? [parseFloat(row.lat), parseFloat(row.lng)] : registryRef.current[query];
            if (coords) {
                const raw = String(row['Tire Types'] || "1").replace(/\(.*\)/g, '');
                const types = raw.split(/[ ,]+/).map(t => parseInt(t.trim())).filter(t => !isNaN(t));
                tempProcessed.push({ coords, types, row, radius: getRadius(row['Estimated Capacity']) });
            } else { missing.push(row); }
        }

        processedDataRef.current = tempProcessed;
        renderMarkers();
        setIsSyncing(false);

        if (missing.length > 0) {
            for (const row of missing) {
                const query = `${row['Plant Location']}, ${row['Country']}`.trim();
                try {
                    await new Promise(r => setTimeout(r, 1200));
                    // Added user email to User-Agent headers
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
                        headers: { 'User-Agent': 'TireIntelApp/1.0 (imadridista07@gmail.com)' }
                    });
                    const results = await res.json();
                    if (results?.[0]) {
                        const newCoords = [parseFloat(results[0].lat), parseFloat(results[0].lon)];
                        registryRef.current[query] = newCoords;
                        await setDoc(docRef, registryRef.current, { merge: true });
                        const raw = String(row['Tire Types'] || "1").replace(/\(.*\)/g, '');
                        const types = raw.split(/[ ,]+/).map(t => parseInt(t.trim())).filter(t => !isNaN(t));
                        processedDataRef.current.push({ coords: newCoords, types, row, radius: getRadius(row['Estimated Capacity']) });
                        renderMarkers();
                    }
                } catch (e) { console.warn("Failed", query); }
            }
        }
    };

    useEffect(() => { renderMarkers(); }, [selectedTypes, renderMarkers]);

    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden mb-8 font-sans">
            <div className="p-5 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-100"><MapIcon size={20} /></div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight italic">Global Plant Network</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{nodeCount} Nodes Live</span>
                            </div>
                        </div>
                    </div>
                    {isSyncing && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                            <Database size={12} className="text-blue-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-600 uppercase">Updating Registry...</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(typeConfig).map(([id, cfg]) => (
                        <button key={id} onClick={() => setSelectedTypes(prev => prev.includes(parseInt(id)) ? prev.filter(x => x !== parseInt(id)) : [...prev, parseInt(id)])} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border-2 ${selectedTypes.includes(parseInt(id)) ? 'bg-white border-slate-900 text-slate-900 shadow-md translate-y-[-1px]' : 'bg-slate-50 border-transparent text-slate-400 opacity-50 hover:opacity-100'}`}>
                            <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: cfg.color }}></div>
                            {cfg.label}
                        </button>
                    ))}
                </div>
            </div>
            <div id="leaflet-container" className="h-[600px] w-full bg-[#f8fafc] z-0" />
        </div>
    );
};

export default MapModule;