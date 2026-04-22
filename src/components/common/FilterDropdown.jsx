import React, { useState } from 'react';
import { Filter, ChevronUp, ChevronDown, X } from 'lucide-react';

export const FilterDropdown = ({ label, field, options, active, onToggle, onClear, sort, onSort }) => {
  const [open, setOpen] = useState(false);
  
  const isSorted = sort.key === field;
  const isFiltered = active.length > 0;

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-3">
        <div 
          className="flex items-center gap-1 cursor-pointer select-none" 
          onClick={() => onSort(field)}
        >
          <span className={`text-[9px] font-black uppercase tracking-tighter whitespace-nowrap transition-colors ${isSorted ? 'text-blue-600' : 'text-slate-400'}`}>
            {label}
          </span>
          {isSorted && (
            sort.direction === 'asc' 
              ? <ChevronUp size={10} className="text-blue-600"/> 
              : <ChevronDown size={10} className="text-blue-600"/>
          )}
        </div>
        <button 
          onClick={() => setOpen(!open)} 
          className={`p-1.5 rounded-md transition-all ${isFiltered ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'}`}
        >
          <Filter size={10} />
        </button>
      </div>
      
      {open && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 100 }} onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-200" style={{ zIndex: 101 }}>
            <div className="p-3 border-b bg-slate-50 flex justify-between items-center font-black text-[9px] uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-2"><Filter size={10}/> {label}</span>
              <button 
                onClick={() => { onClear(field); setOpen(false); }} 
                className="text-red-500 hover:text-red-700 underline decoration-2 underline-offset-4"
              >
                RESET
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
              {options.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-[10px] font-bold">No unique values</div>
              )}
              {options.map(o => (
                <label 
                  key={o} 
                  className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg cursor-pointer group/opt text-[11px] font-bold text-slate-600 transition-colors"
                >
                  <input 
                    type="checkbox" 
                    checked={active.includes(o)} 
                    onChange={() => onToggle(field, o)} 
                    className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 transition-all"
                  />
                  <span className="truncate group-hover/opt:text-blue-700">{o}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
