import React, { useMemo } from 'react';
import { Globe, Factory, Layers, Map, Target, Search, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import MapModule from '../../MapModule';
import { KpiCard, ChartWrapper } from '../common';
import { FilterDropdown } from '../common/FilterDropdown';
import { calculateStats, getUniqueOptions } from '../../utils/dataProcessing';
import { CHART_COLORS, TIRE_TYPE_MAP } from '../../config/constants';
import { TireTypeBadge } from './TireTypeBadge';

const DASH_FIELDS = ['Region', 'Company', 'Country', 'TireTypes'];

export const DashboardView = ({ 
  data, 
  filters, 
  toggleFilter, 
  clearFilter, 
  sort, 
  handleSort,
  search,
  setSearch,
  filteredData 
}) => {
  const stats = useMemo(() => calculateStats(filteredData), [filteredData]);
  const options = useMemo(() => ({
    Region: getUniqueOptions(data, 'Region'),
    Company: getUniqueOptions(data, 'Company'),
    Country: getUniqueOptions(data, 'Country'),
    TireTypes: getUniqueOptions(data, 'Tire Types')
  }), [data]);

  const totalCapacity = (filteredData.reduce((s, d) => s + (d.capacityValue || 0), 0) / 1000000).toFixed(1);

  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<Globe size={14}/>} title="Global Regions" value={options.Region.length} />
        <KpiCard icon={<Factory size={14}/>} title="Filtered Plants" value={filteredData.length} />
        <KpiCard icon={<Layers size={14}/>} title="Capacity (Millions)" value={totalCapacity} highlight />
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm hover:border-blue-300 transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
          <Search size={14} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Global Analysis Search..." 
            className="w-full text-[11px] font-bold outline-none" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <MapModule data={filteredData} />

      {/* Row 1: Main Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
          <ResponsiveContainer width="100%" height={240}>
            <PieChart margin={{ top: 20, bottom: 0 }}>
              <Pie 
                data={stats.types} 
                innerRadius={40} 
                outerRadius={60} 
                paddingAngle={2} 
                dataKey="value" 
                stroke="none"
                label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                labelStyle={{ fontSize: '9px', fontWeight: 'bold', fill: '#334155' }}
              >
                {stats.types.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend 
                wrapperStyle={{ fontSize: '8px', fontWeight: 'bold' }} 
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                iconSize={6}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Row 2: Year Opened Trend - centered, auto-fits future charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-4xl mx-auto">
        <ChartWrapper title="Year Opened Trend" icon={<TrendingUp size={12}/>}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.yearOpened} margin={{ bottom: 45, left: -20 }}>
              <XAxis 
                dataKey="year" 
                angle={-45}
                textAnchor="end"
                tick={{ fontSize: 8, fontWeight: 'bold' }} 
                axisLine={false} 
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 8 }} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: 'bold' }}
                formatter={(value) => [`${value} plants`, 'Count']}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-black text-slate-400">
              <tr>
                {['Region', 'Company', 'Country'].map(field => (
                  <th key={field} className="px-3 py-3 relative" style={{ width: field === 'Region' ? '10%' : field === 'Company' ? '22%' : '16%' }}>
                    <FilterDropdown 
                      label={field}
                      field={field}
                      options={options[field]}
                      active={filters[field] || []}
                      onToggle={toggleFilter}
                      onClear={clearFilter}
                      sort={sort}
                      onSort={handleSort}
                    />
                  </th>
                ))}
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase" style={{ width: '22%' }}>Types</th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase" style={{ width: '20%' }}>Est Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
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
                      {row.typeTags?.map(tag => (
                        <div key={tag} className="group relative">
                          <span 
                            className="px-1 py-0.5 rounded-sm bg-white text-[8px] font-black border border-slate-200 cursor-help hover:border-slate-400 transition-colors inline-block" 
                            style={{ color: TIRE_TYPE_MAP[tag]?.color || '#64748b' }}
                          >{tag}</span>
                          {/* Instant Popup */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1.5 bg-slate-900 text-white text-[9px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none z-50 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TIRE_TYPE_MAP[tag]?.color || '#64748b' }}></span>
                              <span>{TIRE_TYPE_MAP[tag]?.label || 'Unknown'}</span>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-2 border-transparent border-t-slate-900"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
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
  );
};
