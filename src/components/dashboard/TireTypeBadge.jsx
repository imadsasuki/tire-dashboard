import React from 'react';
import { TIRE_TYPE_MAP } from '../../config/constants';

export const TireTypeBadge = ({ typeTags }) => {
  if (!typeTags || typeTags.length === 0) return <span className="text-slate-300">-</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {typeTags.map((tag) => {
        const config = TIRE_TYPE_MAP[tag];
        if (!config) return null;
        
        return (
          <div 
            key={tag} 
            className="group relative"
          >
            <span 
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[8px] font-black text-white cursor-help transition-transform hover:scale-110"
              style={{ backgroundColor: config.color }}
            >
              {tag}
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-[9px] font-bold rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              <div className="flex items-center gap-1">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                {config.fullLabel}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
