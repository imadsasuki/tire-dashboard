import React from 'react';

export const KpiCard = ({ icon, title, value, highlight }) => (
  <div className={`bg-white p-5 rounded-xl border transition-all ${highlight ? 'border-blue-200 ring-4 ring-blue-500/5' : 'border-slate-200 shadow-sm'}`}>
    <div className="flex items-center gap-4">
      <div className={`p-2.5 rounded-lg border ${highlight ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em] mb-1 leading-none">{title}</p>
        <h4 className="text-xl font-black text-slate-900 leading-none">{value}</h4>
      </div>
    </div>
  </div>
);
