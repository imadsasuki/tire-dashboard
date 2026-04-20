import React, { useMemo } from 'react';
import { Globe, Factory, Layers, Map, Target, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import MapModule from '../../MapModule';
import { KpiCard, ChartWrapper } from '../common';
import { FilterDropdown } from '../common/FilterDropdown';
import { calculateStats, getUniqueOptions } from '../../utils/dataProcessing';
import { CHART_COLORS } from '../../config/constants';

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

      <div className="grid grid-cols-3 gap-6 my-6">
        <ChartWrapper title="Plants by Country" icon={<Map size={12}/>}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.countries} margin={{ bottom: 30, left: -25 }}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 8, fontWeight: 900 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 8 }} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
        
        <ChartWrapper title="Capacity (Millions)" icon={<Layers size={12}/>}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.capacities} margin={{ bottom: 30, left: -25 }}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 8, fontWeight: 900 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 8 }} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: 'bold' }} />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="Tire Type Segments" icon={<Target size={12}/>}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.types} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                {stats.types.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 uppercase font-black text-slate-400">
              <tr>
                {['Region', 'Company', 'Country'].map(field => (
                  <th key={field} className="px-5 py-4 relative min-w-[180px]">
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
                <th className="px-5 py-4 tracking-tighter">Plant Location</th>
                <th className="px-5 py-4 text-right">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
              {filteredData.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-5 py-3 text-slate-400 uppercase font-black">{row.Region}</td>
                  <td className="px-5 py-3 text-slate-900">{row.Company}</td>
                  <td className="px-5 py-3">{row.Country}</td>
                  <td className="px-5 py-3 text-slate-400 font-medium italic">{row['Plant Location']}</td>
                  <td className="px-5 py-3 text-right font-black text-blue-600">{row['Estimated Capacity']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
