import { TIRE_TYPE_MAP } from '../config/constants';

export const calculateCapacity = (val) => {
  if (!val) return 0;
  let n = parseFloat(String(val).replace(/,/g, '')) || 0;
  if (String(val).toLowerCase().includes('u/d')) n *= 350;
  if (String(val).toLowerCase().includes('mil')) n *= 1000000;
  return n;
};

export const processRow = (row) => ({
  ...row,
  capacityValue: calculateCapacity(row['Estimated Capacity']),
  typeTags: (row['Tire Types'] || '').toLowerCase().split(/[,\s()]+/).filter(t => TIRE_TYPE_MAP[t]),
  ParentCompany: row.ParentCompany || (row.Company?.match(/\(([^)]+)\)/)?.[1]) || (row.Company?.split(' ')[0] || '')
});

export const getUniqueOptions = (data, field) => 
  [...new Set(data.map(d => d[field]))].filter(Boolean).sort();

export const filterData = (data, { search, filters, sort }) => {
  const filtered = data.filter(row => {
    const searchLower = search.toLowerCase();
    const matchSearch = searchLower === '' || 
      Object.values(row).some(v => String(v).toLowerCase().includes(searchLower));
    
    const matchFilters = Object.entries(filters).every(([field, values]) => {
      if (!values || values.length === 0) return true;
      if (field === 'TireTypes') {
        return row.typeTags?.some(t => values.includes(t));
      }
      return values.includes(row[field]);
    });
    
    return matchSearch && matchFilters;
  });

  if (sort.key) {
    const mod = sort.direction === 'asc' ? 1 : -1;
    filtered.sort((a, b) => 
      String(a[sort.key] || '').localeCompare(String(b[sort.key] || '')) * mod
    );
  }

  return filtered;
};

export const calculateStats = (data) => {
  const countries = {};
  const capacities = {};
  const types = {};

  data.forEach(d => {
    countries[d.Country] = (countries[d.Country] || 0) + 1;
    capacities[d.Country] = (capacities[d.Country] || 0) + (d.capacityValue || 0);
    d.typeTags?.forEach(t => {
      if (TIRE_TYPE_MAP[t]) {
        types[TIRE_TYPE_MAP[t].label] = (types[TIRE_TYPE_MAP[t].label] || 0) + 1;
      }
    });
  });

  return {
    countries: Object.entries(countries)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    capacities: Object.entries(capacities)
      .map(([name, value]) => ({ name, value: Math.round(value / 1000000) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    types: Object.entries(types)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  };
};
