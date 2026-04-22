import React, { useMemo } from 'react';
import { Globe, Factory, Layers, Map, Target, Search, TrendingUp, BarChart3, PieChart as PieChartIcon, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, Treemap } from 'recharts';
import MapModule from '../../MapModule';
import { KpiCard, ChartWrapper } from '../common';
import { FilterDropdown } from '../common/FilterDropdown';
import { calculateStats, getUniqueOptions, getCascadingOptions } from '../../utils/dataProcessing';
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
  const stats = useMemo(() => calculateStats(filteredData, filters), [filteredData, filters]);
  // Cascading options - each field shows options filtered by ALL OTHER fields
  const options = useMemo(() => ({
    Region: getCascadingOptions(data, 'Region', filters, ''), // Filtered by country/company/tire
    Company: getCascadingOptions(data, 'Company', filters, ''), // Filtered by region/country/tire
    Country: getCascadingOptions(data, 'Country', filters, ''), // Filtered by region/company/tire
    ParentCompany: getCascadingOptions(data, 'ParentCompany', filters, ''),
    TireTypes: getCascadingOptions(data, 'Tire Types', filters, '')
  }), [data, filters]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ChartWrapper title="Number of Plants by Country" icon={<Map size={12}/>}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.countries} margin={{ bottom: 45, left: -20 }}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 8, fontWeight: 'bold' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 8 }} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => [`${value} plants`, 'Count']}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="Total Capacity by Country (M u/y)" icon={<Layers size={12}/>}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.capacities} margin={{ bottom: 45, left: -20 }}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 8, fontWeight: 'bold' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 8 }} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => [`${value}M u/y`, 'Capacity']}
              />
              <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="Number of Plants by Tire Type" icon={<PieChartIcon size={12}/>}>
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
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
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

      {/* Row 2: Year Opened Trend + Cumulative Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartWrapper title="Plants Opened Per Year" icon={<TrendingUp size={12}/>}>
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
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
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

        <ChartWrapper title="Cumulative Capacity Added Over Time (M u/y)" icon={<Layers size={12}/>}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.cumulativeCapacity} margin={{ bottom: 45, left: 10, top: 20, right: 20 }}>
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
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => [`${value}M u/y`, 'Cumulative Capacity']}
              />
              <Line 
                type="monotone" 
                dataKey="cumulative" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: '#8b5cf6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Row 3: Parent Companies + Tire Type Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartWrapper title="Top 5 Parent Companies by Capacity (M u/y)" icon={<Building2 size={12}/>}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.parentCompanies || []} margin={{ bottom: 5, left: -80, top: 10, right: 20 }} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 8, fontWeight: 'bold' }} 
                axisLine={false} 
                tickLine={false}
                width={260}
                interval={0}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => [`${value.toFixed(1)}M u/y`, 'Capacity']}
              />
              <Bar dataKey="value" fill="#ec4899" radius={[0, 2, 2, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="Capacity Share by Tire Type (M u/y)" icon={<Target size={12}/>}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.tireTypeCapacity || []} margin={{ bottom: 45, left: -10 }}>
              <XAxis 
                dataKey="name" 
                angle={-35}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 8, fontWeight: 'bold' }} 
                axisLine={false} 
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 8 }} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => [`${value}M u/y`, 'Capacity']}
              />
              <Bar dataKey="value" fill="#06b6d4" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Row 4: Dynamic Drill-Down Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ChartWrapper title={stats.drillDown?.title || 'Capacity by Region (M u/y)'} icon={<BarChart3 size={12}/>}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.drillDown?.data || []} margin={{ bottom: 45, left: -10 }}>
              <XAxis 
                dataKey="name" 
                angle={-35}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 8, fontWeight: 'bold' }} 
                axisLine={false} 
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 8 }} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value) => [`${value}M u/y`, 'Capacity']}
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative" style={{ zIndex: 1 }}>
        <div>
          <table className="text-left text-[10px] border-collapse" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-black text-slate-400 sticky top-0" style={{ zIndex: 5 }}>
              <tr>
                {[
                  { key: 'Region', label: 'Region' },
                  { key: 'Company', label: 'Company' },
                  { key: 'ParentCompany', label: 'Parent Company' },
                  { key: 'Country', label: 'Country' }
                ].map(({ key: field, label }) => (
                  <th key={field} className="px-3 py-3 relative whitespace-nowrap" style={{ width: field === 'Region' ? '100px' : field === 'Company' ? '180px' : field === 'ParentCompany' ? '140px' : '140px' }}>
                    <FilterDropdown 
                      label={label}
                      field={field}
                      options={options[field] || []}
                      active={filters[field] || []}
                      onToggle={toggleFilter}
                      onClear={clearFilter}
                      sort={sort}
                      onSort={handleSort}
                    />
                  </th>
                ))}
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase whitespace-nowrap" style={{ width: '180px' }}>Types</th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase whitespace-nowrap" style={{ width: '140px' }}>Est Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-3 py-3 text-[9px] font-bold text-slate-500 uppercase">{row.Region}</td>
                  <td className="px-3 py-3">
                    <div className="font-black text-slate-800 text-[10px] truncate" title={row.Company}>{row.Company}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-[9px] font-bold text-slate-600 truncate uppercase" title={row.ParentCompany}>{row.ParentCompany}</div>
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
