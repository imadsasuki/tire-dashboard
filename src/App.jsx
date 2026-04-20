import React, { useState } from 'react';
import { Target, LayoutDashboard, Database, Plus, Save, RefreshCcw, Loader2 } from 'lucide-react';
import MapModule from './MapModule';
import { DashboardView } from './components/dashboard';
import { DataManagerView } from './components/dataManager';
import { useAuth, useTireData, useFilterState } from './hooks';
import { DB_FIELDS } from './config';

const DASH_FIELDS = ['Region', 'Company', 'Country', 'TireTypes'];

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const user = useAuth();
  const { data, isLoading, isSyncing, syncToCloud, addRow, deleteRow, updateRow, dbFields } = useTireData(user);

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

      <main className="p-6">
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
          />
        )}
      </main>
    </div>
  );
};

export default App;