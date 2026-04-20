import React from 'react';

export const ChartWrapper = ({ children, title, icon }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full hover:border-blue-200 transition-colors">
    <div className="flex items-center gap-2 mb-6">
      <div className="p-2 bg-slate-50 rounded-lg text-slate-400 border border-slate-100">{icon}</div>
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="flex-1 w-full">{children}</div>
  </div>
);
