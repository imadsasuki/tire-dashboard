import { TIRE_TYPE_MAP } from '../config/constants';

// Read Standard Capacity (u/y) directly if available, fallback to Estimated Capacity calculation
export const calculateCapacity = (row) => {
  // Use Standard Capacity if available (already in u/y)
  const standardCap = row['Standard Capacity'];
  if (standardCap) {
    const n = parseFloat(String(standardCap).replace(/,/g, '')) || 0;
    return n;
  }
  // Fallback to Estimated Capacity parsing
  const val = row['Estimated Capacity'];
  if (!val) return 0;
  let n = parseFloat(String(val).replace(/,/g, '')) || 0;
  if (String(val).toLowerCase().includes('u/d')) n *= 365;
  if (String(val).toLowerCase().includes('mil')) n *= 1000000;
  return n;
};

export const processRow = (row) => ({
  ...row,
  capacityValue: calculateCapacity(row),
  typeTags: (row['Tire Types'] || '').toLowerCase().split(/[,\s()]+/).filter(t => TIRE_TYPE_MAP[t]),
  ParentCompany: row.ParentCompany || (row.Company?.match(/\(([^)]+)\)/)?.[1]) || (row.Company?.split(' ')[0] || '')
});

export const getUniqueOptions = (data, field, includeBlank = false) => {
  const allValues = data.map(d => d[field]).filter(v => v !== undefined && v !== null);
  const hasBlank = includeBlank && allValues.some(v => !v || String(v).trim() === '');
  const uniqueValues = [...new Set(allValues.filter(Boolean))].sort();
  
  if (hasBlank) {
    return ['(blank)', ...uniqueValues];
  }
  return uniqueValues;
};

// Get options for a field with other filters applied (for cascading dropdowns)
export const getCascadingOptions = (data, field, currentFilters = {}, search = '') => {
  // Safety check - if no data, return empty
  if (!data || data.length === 0) return [];
  
  // Filter data by all filters EXCEPT the current field
  const otherFilters = { ...currentFilters };
  delete otherFilters[field];
  
  // Keep currently selected values in options so user can unselect
  const currentlySelected = currentFilters[field] || [];
  
  const filtered = data.filter(row => {
    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      const matchSearch = Object.values(row).some(v => String(v).toLowerCase().includes(searchLower));
      if (!matchSearch) return false;
    }
    
    // Apply other filters
    return Object.entries(otherFilters).every(([f, values]) => {
      if (!values || values.length === 0) return true;
      if (f === 'TireTypes') {
        return row.typeTags?.some(t => values.includes(t));
      }
      const includesBlank = values.includes('(blank)');
      const nonBlankValues = values.filter(v => v !== '(blank)');
      const rowValue = row[f];
      const isBlank = !rowValue || String(rowValue).trim() === '';
      
      if (includesBlank && isBlank) return true;
      if (nonBlankValues.includes(rowValue)) return true;
      return false;
    });
  });
  
  const options = getUniqueOptions(filtered, field);
  
  // Always include currently selected values so user can unselect them
  currentlySelected.forEach(val => {
    if (val && !options.includes(val)) {
      options.push(val);
    }
  });
  
  return options.sort();
};

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
      // Handle ParentCompany filter (maps to row.ParentCompany)
      if (field === 'ParentCompany') {
        const includesBlank = values.includes('(blank)');
        const nonBlankValues = values.filter(v => v !== '(blank)');
        const rowValue = row.ParentCompany;
        const isBlank = !rowValue || String(rowValue).trim() === '';
        
        if (includesBlank && isBlank) return true;
        if (nonBlankValues.includes(rowValue)) return true;
        return false;
      }
      // Handle blank/empty filter
      const includesBlank = values.includes('(blank)');
      const nonBlankValues = values.filter(v => v !== '(blank)');
      const rowValue = row[field];
      const isBlank = !rowValue || String(rowValue).trim() === '';
      
      if (includesBlank && isBlank) return true;
      if (nonBlankValues.includes(rowValue)) return true;
      return false;
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

export const calculateStats = (data, filters = {}) => {
  const countries = {};
  const capacities = {};
  const types = {};
  const yearOpened = {};
  
  // New chart data structures
  const parentCompanyCapacity = {};
  const tireTypeCapacity = {};
  const regionCapacity = {};
  const yearCapacity = {}; // For cumulative chart

  data.forEach(d => {
    const cap = d.capacityValue || 0;
    
    // Existing stats
    countries[d.Country] = (countries[d.Country] || 0) + 1;
    capacities[d.Country] = (capacities[d.Country] || 0) + cap;
    
    // Count plants by year opened
    if (d['Year Opened']) {
      const year = String(d['Year Opened']).trim();
      if (year && !isNaN(parseInt(year))) {
        yearOpened[year] = (yearOpened[year] || 0) + 1;
        yearCapacity[year] = (yearCapacity[year] || 0) + cap;
      }
    }
    
    // Plant counts by tire type (existing pie chart)
    d.typeTags?.forEach(t => {
      if (TIRE_TYPE_MAP[t]) {
        types[TIRE_TYPE_MAP[t].label] = (types[TIRE_TYPE_MAP[t].label] || 0) + 1;
      }
    });
    
    // 1. Parent Company Capacity (sum)
    const parent = d.ParentCompany || 'Unknown';
    parentCompanyCapacity[parent] = (parentCompanyCapacity[parent] || 0) + cap;
    
    // 2. Tire Type Capacity (split multi-type plants equally)
    const typeCount = d.typeTags?.length || 1;
    const splitCap = cap / typeCount;
    d.typeTags?.forEach(t => {
      if (TIRE_TYPE_MAP[t]) {
        tireTypeCapacity[TIRE_TYPE_MAP[t].label] = (tireTypeCapacity[TIRE_TYPE_MAP[t].label] || 0) + splitCap;
      }
    });
    
    // 3. Region Capacity for drill-down
    if (d.Region) {
      regionCapacity[d.Region] = (regionCapacity[d.Region] || 0) + cap;
    }
  });

  // Sort years and prepare line chart data
  const sortedYears = Object.entries(yearOpened)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  
  // 1. Top 5 Parent Companies by capacity
  const topParents = Object.entries(parentCompanyCapacity)
    .map(([name, value]) => ({ name, value: value / 1000000 })) // Convert to millions
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  
  // 3. Dynamic drill-down data
  const { Region: selectedRegions, Country: selectedCountries } = filters;
  let drillDownData = [];
  let drillDownTitle = '';
  let drillDownKey = '';
  
  const hasRegionSelected = selectedRegions && selectedRegions.length > 0;
  const hasCountrySelected = selectedCountries && selectedCountries.length > 0;
  const regionCount = hasRegionSelected ? selectedRegions.length : 0;
  const countryCount = hasCountrySelected ? selectedCountries.length : 0;
  
  if (!hasRegionSelected) {
    // No region selected → Capacity by Region
    drillDownData = Object.entries(regionCapacity)
      .map(([name, value]) => ({ name, value: Math.round(value / 1000000) }))
      .sort((a, b) => b.value - a.value);
    drillDownTitle = 'Capacity by Region (M u/y)';
    drillDownKey = 'region';
  } else if (regionCount === 1 && !hasCountrySelected) {
    // Exactly one region selected, no country → Capacity by Country within that region
    const filteredByRegion = data.filter(d => selectedRegions.includes(d.Region));
    const countryCaps = {};
    filteredByRegion.forEach(d => {
      countryCaps[d.Country] = (countryCaps[d.Country] || 0) + (d.capacityValue || 0);
    });
    drillDownData = Object.entries(countryCaps)
      .map(([name, value]) => ({ name, value: Math.round(value / 1000000) }))
      .sort((a, b) => b.value - a.value);
    drillDownTitle = `Capacity by Country in ${selectedRegions[0]} (M u/y)`;
    drillDownKey = 'country';
  } else if (regionCount >= 2 && !hasCountrySelected) {
    // Multiple regions selected, no country → Capacity by Country from selected regions
    const filteredByRegion = data.filter(d => selectedRegions.includes(d.Region));
    const countryCaps = {};
    filteredByRegion.forEach(d => {
      countryCaps[d.Country] = (countryCaps[d.Country] || 0) + (d.capacityValue || 0);
    });
    drillDownData = Object.entries(countryCaps)
      .map(([name, value]) => ({ name, value: Math.round(value / 1000000) }))
      .sort((a, b) => b.value - a.value);
    drillDownTitle = 'Capacity by Country (M u/y)';
    drillDownKey = 'country';
  } else if (hasCountrySelected && countryCount <= 2) {
    // One or two countries selected → Capacity by Parent Company (top 10)
    const filteredByCountry = data.filter(d => selectedCountries.includes(d.Country));
    const parentCaps = {};
    filteredByCountry.forEach(d => {
      const parent = d.ParentCompany || 'Unknown';
      parentCaps[parent] = (parentCaps[parent] || 0) + (d.capacityValue || 0);
    });
    drillDownData = Object.entries(parentCaps)
      .map(([name, value]) => ({ name, value: Math.round(value / 1000000) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    const countryLabel = selectedCountries.join(', ');
    drillDownTitle = `Top Parent Companies in ${countryLabel} (M u/y)`;
    drillDownKey = 'parent';
  } else if (hasCountrySelected && countryCount > 2) {
    // More than 2 countries selected → show capacity by country
    const filteredByCountry = data.filter(d => selectedCountries.includes(d.Country));
    const countryCaps = {};
    filteredByCountry.forEach(d => {
      countryCaps[d.Country] = (countryCaps[d.Country] || 0) + (d.capacityValue || 0);
    });
    drillDownData = Object.entries(countryCaps)
      .map(([name, value]) => ({ name, value: Math.round(value / 1000000) }))
      .sort((a, b) => b.value - a.value);
    drillDownTitle = 'Capacity by Country (M u/y)';
    drillDownKey = 'country';
  } else {
    // Fallback
    drillDownData = Object.entries(regionCapacity)
      .map(([name, value]) => ({ name, value: Math.round(value / 1000000) }))
      .sort((a, b) => b.value - a.value);
    drillDownTitle = 'Capacity by Region (M u/y)';
    drillDownKey = 'region';
  }
  
  // 4. Cumulative capacity over time
  const sortedYearCaps = Object.entries(yearCapacity)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  
  let runningTotal = 0;
  const cumulativeCapacity = sortedYearCaps.map(([year, cap]) => {
    runningTotal += cap;
    return { 
      year, 
      capacity: Math.round(cap / 1000000), // Annual addition
      cumulative: Math.round(runningTotal / 1000000) // Running total
    };
  });

  return {
    // Existing charts
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
      .sort((a, b) => b.value - a.value),
    yearOpened: sortedYears.map(([year, count]) => ({ year, count })),
    // New charts
    parentCompanies: topParents,
    tireTypeCapacity: Object.entries(tireTypeCapacity)
      .map(([name, value]) => ({ name, value: Math.round(value / 1000000) }))
      .sort((a, b) => b.value - a.value),
    drillDown: { data: drillDownData, title: drillDownTitle, key: drillDownKey },
    cumulativeCapacity
  };
};
