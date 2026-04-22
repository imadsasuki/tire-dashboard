import React, { useState } from 'react';
import { Target, LayoutDashboard, Database, Plus, Save, RefreshCcw, Loader2, Download, Upload } from 'lucide-react';
import MapModule from './MapModule';
import { DashboardView } from './components/dashboard';
import { DataManagerView } from './components/dataManager';
import { useAuth, useTireData, useFilterState } from './hooks';
import { DB_FIELDS } from './config';

const DASH_FIELDS = ['Region', 'Company', 'ParentCompany', 'Country', 'TireTypes'];

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const user = useAuth();
  const { data, isLoading, isSyncing, syncToCloud, addRow, deleteRow, updateRow, dbFields, setData } = useTireData(user);

  // Export all data as CSV with row index for reliable matching
  const handleExport = () => {
    if (!data.length) return;
    const headers = ['_rowIndex', ...dbFields];
    const csvRows = data.map((row, idx) => {
      const rowData = [idx, ...dbFields.map(h => {
        const val = row[h] ?? '';
        const escaped = String(val).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      })];
      return rowData.join(',');
    });
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tire_intel_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Parse CSV line handling quoted values
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"'; i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(v => v.replace(/^"|"$/g, ''));
  };

  // Import CSV and batch update/add rows
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target.result;
      const lines = csvText.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        alert('CSV file is empty or invalid');
        return;
      }
      
      // Parse headers
      const headers = parseCSVLine(lines[0]);
      const hasRowIndex = headers.includes('_rowIndex');
      const dataFields = headers.filter(h => h !== '_rowIndex' && h !== 'capacityValue' && h !== 'typeTags' && h !== 'ParentCompany');
      
      let added = 0;
      let updated = 0;
      const newData = [...data];
      
      // Parse each row
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        
        // Calculate capacityValue - use Standard Capacity (u/y) if available, else parse Estimated Capacity
        const standardCap = rowObj['Standard Capacity'];
        if (standardCap) {
          rowObj.capacityValue = parseFloat(String(standardCap).replace(/,/g, '')) || 0;
        } else {
          const capRaw = rowObj['Estimated Capacity'] || '';
          let capVal = parseFloat(capRaw.replace(/,/g, '')) || 0;
          if (capRaw.toLowerCase().includes('u/d')) capVal *= 365;
          if (capRaw.toLowerCase().includes('mil')) capVal *= 1000000;
          rowObj.capacityValue = capVal;
        }
        
        const typeStr = (rowObj['Tire Types'] || '').toLowerCase();
        rowObj.typeTags = typeStr.split(/[,\s()]+/).filter(t => /\d/.test(t));
        
        const parentMatch = rowObj.Company?.match(/\(([^)]+)\)/);
        rowObj.ParentCompany = parentMatch ? parentMatch[1] : (rowObj.Company?.split(' ')[0] || 'Unknown');
        
        // Match by row index if available, otherwise treat as new
        if (hasRowIndex && rowObj._rowIndex !== '') {
          const rowIdx = parseInt(rowObj._rowIndex);
          if (!isNaN(rowIdx) && rowIdx >= 0 && rowIdx < newData.length) {
            // Update existing row at index
            newData[rowIdx] = { ...newData[rowIdx], ...rowObj };
            updated++;
          } else {
            // Index out of range - add as new
            delete rowObj._rowIndex;
            newData.push(rowObj);
            added++;
          }
        } else {
          // No row index - add as new
          delete rowObj._rowIndex;
          newData.push(rowObj);
          added++;
        }
      }
      
      // Update state
      setData(newData);
      
      // Show summary
      alert(`Import complete:\n• ${added} new rows added\n• ${updated} existing rows updated\n\nClick 'Sync' to save to cloud.`);
      
      // Reset file input
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Dashboard filter state
  const dashFilters = useFilterState(data, DASH_FIELDS);
  
  // Data Manager filter state (with blank filter option enabled)
  const mgrFilters = useFilterState(data, dbFields, true);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-blue-600 gap-4">
        <Loader2 className="animate-spin" size={32} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Initialising Environment</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-2 sticky top-0 z-[100] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded text-white shadow-lg shadow-blue-500/10">
              <Target size={16} />
            </div>
            <h1 className="text-xs font-black uppercase tracking-widest leading-none">
              Tire<span className="text-blue-600">Intel</span>
            </h1>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-[10px] font-black uppercase transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <LayoutDashboard size={14}/> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('editor')} 
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-[10px] font-black uppercase transition-all ${activeTab === 'editor' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Database size={14}/> Data Manager
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'editor' && (
            <>
              <button 
                onClick={addRow} 
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md text-[9px] font-black uppercase hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/10 border-b-2 border-emerald-800 active:border-0 active:translate-y-[1px]"
              >
                <Plus size={12}/> New Row
              </button>
              <button 
                onClick={syncToCloud} 
                disabled={isSyncing} 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-[9px] font-black uppercase hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 border-b-2 border-blue-800 active:border-0 active:translate-y-[1px]"
              >
                {isSyncing ? <RefreshCcw size={12} className="animate-spin"/> : <Save size={12}/>} Commit Sync
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="p-6 w-full max-w-none">
        {activeTab === 'dashboard' ? (
          <DashboardView 
            data={data}
            filters={dashFilters.filters}
            toggleFilter={dashFilters.toggleFilter}
            clearFilter={dashFilters.clearFilter}
            sort={dashFilters.sort}
            handleSort={dashFilters.handleSort}
            search={dashFilters.search}
            setSearch={dashFilters.setSearch}
            filteredData={dashFilters.filteredData}
          />
        ) : (
          <DataManagerView
            data={data}
            filteredData={mgrFilters.filteredData}
            filters={mgrFilters.filters}
            toggleFilter={mgrFilters.toggleFilter}
            clearFilter={mgrFilters.clearFilter}
            sort={mgrFilters.sort}
            handleSort={mgrFilters.handleSort}
            options={mgrFilters.options}
            search={mgrFilters.search}
            setSearch={mgrFilters.setSearch}
            dbFields={dbFields}
            onAddRow={addRow}
            onDeleteRow={deleteRow}
            onUpdateRow={updateRow}
            onSync={syncToCloud}
            isSyncing={isSyncing}
            onExport={handleExport}
            onImport={handleImport}
          />
        )}
      </main>
    </div>
  );
};

export default App;