import React, { useMemo, useState } from 'react';
import { Database, Search, Plus, Save, Trash2, RefreshCcw, Table2, AlertCircle, SlidersHorizontal } from 'lucide-react';
import { FilterDropdown } from '../common/FilterDropdown';
import { DB_FIELDS } from '../../config/constants';

const KNOWN_FIELDS_SET = new Set(DB_FIELDS);

export const DataManagerView = ({ 
  data, 
  filteredData,
  filters,
  toggleFilter,
  clearFilter,
  sort,
  handleSort,
  options,
  search,
  setSearch,
  dbFields,
  onAddRow,
  onDeleteRow,
  onUpdateRow,
  onSync,
  isSyncing
}) => {
  // Column width slider state (80px to 200px)
  const [colWidth, setColWidth] = useState(120);
  const [showSlider, setShowSlider] = useState(false);

  // Calculate dynamic table min-width based on column count
  const tableMinWidth = useMemo(() => {
    const actionColWidth = 50;
    return (dbFields.length * colWidth) + actionColWidth;
  }, [dbFields.length, colWidth]);

  // Separate known vs extra fields for display
  const { knownFields, extraFields } = useMemo(() => {
    const known = dbFields.filter(f => KNOWN_FIELDS_SET.has(f));
    const extra = dbFields.filter(f => !KNOWN_FIELDS_SET.has(f));
    return { knownFields: known, extraFields: extra };
  }, [dbFields]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xl flex flex-col h-[85vh] overflow-hidden">
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Database size={16} />
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-widest leading-none text-white">Database Explorer</h2>
            <p className="text-[8px] text-slate-400 uppercase mt-1 font-bold">
              {filteredData.length} rows × {dbFields.length} columns
              {extraFields.length > 0 && (
                <span className="ml-2 text-amber-400">({extraFields.length} custom)</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400" />
            <input 
              type="text" 
              placeholder="Fast Table Filter..." 
              className="bg-slate-800 border border-slate-700 rounded-lg px-9 py-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 w-64 transition-all" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div className="h-6 w-px bg-slate-700 mx-1" />
          {/* Column Width Slider Toggle */}
          <div className="relative">
            <button 
              onClick={() => setShowSlider(!showSlider)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-[9px] font-black uppercase transition-all border border-slate-600"
              title="Column Width"
            >
              <SlidersHorizontal size={12}/>
            </button>
            {showSlider && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 p-3 w-48 z-50">
                <div className="text-[10px] font-bold text-slate-700 mb-2">Column Width</div>
                <input
                  type="range"
                  min="80"
                  max="200"
                  value={colWidth}
                  onChange={(e) => setColWidth(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>80px</span>
                  <span>{colWidth}px</span>
                  <span>200px</span>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={onAddRow} 
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-md text-[9px] font-black uppercase hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/10 border-b-2 border-emerald-800 active:border-0 active:translate-y-[1px]"
          >
            <Plus size={12}/> New
          </button>
          <button 
            onClick={onSync} 
            disabled={isSyncing} 
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md text-[9px] font-black uppercase hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10 border-b-2 border-blue-800 active:border-0 active:translate-y-[1px] disabled:opacity-50"
          >
            {isSyncing ? <RefreshCcw size={12} className="animate-spin"/> : <Save size={12}/>} Sync
          </button>
        </div>
      </div>

      {/* Field Legend Bar */}
      {extraFields.length > 0 && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-[10px]">
          <AlertCircle size={12} className="text-amber-600" />
          <span className="text-amber-700 font-bold">
            Custom fields detected: {extraFields.join(', ')}
          </span>
        </div>
      )}

      <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200">
        <table 
          className="w-full text-left border-collapse" 
          style={{ minWidth: `${tableMinWidth}px` }}
        >
          <thead className="sticky top-0 bg-white z-20 border-b-2 border-slate-100 shadow-sm">
            <tr>
              {dbFields.map(field => {
                const isCustom = !KNOWN_FIELDS_SET.has(field);
                return (
                  <th 
                    key={field} 
                    className={`relative ${isCustom ? 'bg-amber-50/50' : ''}`}
                    style={{ minWidth: `${colWidth}px`, maxWidth: `${colWidth + 80}px` }}
                  >
                    <div className={`px-3 py-3 border-r border-slate-100 ${isCustom ? 'border-amber-200' : ''}`}>
                      <FilterDropdown 
                        label={field}
                        field={field}
                        options={options[field] || []}
                        active={filters[field] || []}
                        onToggle={toggleFilter}
                        onClear={clearFilter}
                        sort={sort}
                        onSort={handleSort}
                      />
                      {isCustom && (
                        <div className="mt-1">
                          <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                            Custom
                          </span>
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
              <th className="w-14 bg-slate-50 border-l border-slate-100 sticky right-0"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.map((row, idx) => {
              const dataIdx = data.indexOf(row);
              return (
                <tr key={idx} className="hover:bg-blue-50/50 group transition-colors">
                  {dbFields.map(f => {
                    const isCustom = !KNOWN_FIELDS_SET.has(f);
                    return (
                      <td 
                        key={f} 
                        className={`px-1 py-0.5 border-r border-slate-100 ${isCustom ? 'bg-amber-50/30 border-amber-100' : ''}`}
                      >
                        <input 
                          className="w-full px-2 py-1 text-[10px] font-medium text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:shadow-inner rounded outline-none transition-all truncate" 
                          value={row[f] || ''} 
                          onChange={(e) => onUpdateRow(dataIdx, f, e.target.value)} 
                          placeholder={isCustom ? '...' : ''}
                          title={row[f] || ''}
                        />
                      </td>
                    );
                  })}
                  <td className="text-center bg-slate-50/80 border-l border-slate-100 sticky right-0 px-2">
                    <button 
                      onClick={() => onDeleteRow(dataIdx)} 
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete row"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Table2 size={12} />
            <span className="font-bold">{dbFields.length} columns</span>
          </span>
          <span>|</span>
          <span><span className="font-bold text-slate-700">{knownFields.length}</span> standard</span>
          {extraFields.length > 0 && (
            <>
              <span>+</span>
              <span><span className="font-bold text-amber-600">{extraFields.length}</span> custom</span>
            </>
          )}
        </div>
        <div className="text-slate-400">
          Edits sync on "Commit Sync" click
        </div>
      </div>
    </div>
  );
};
