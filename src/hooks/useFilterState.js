import { useState, useCallback, useMemo } from 'react';
import { filterData, getUniqueOptions } from '../utils/dataProcessing';

export const useFilterState = (data, fields) => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(
    fields.reduce((acc, field) => ({ ...acc, [field]: [] }), {})
  );
  const [sort, setSort] = useState({ key: fields[0], direction: 'asc' });

  const toggleFilter = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(x => x !== value)
        : [...prev[field], value]
    }));
  }, []);

  const clearFilter = useCallback((field) => {
    setFilters(prev => ({ ...prev, [field]: [] }));
  }, []);

  const handleSort = useCallback((key) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const filteredData = useMemo(() => 
    filterData(data, { search, filters, sort }),
    [data, search, filters, sort]
  );

  const options = useMemo(() => {
    const opts = {};
    fields.forEach(field => {
      opts[field] = getUniqueOptions(data, field);
    });
    return opts;
  }, [data, fields]);

  return {
    search,
    setSearch,
    filters,
    toggleFilter,
    clearFilter,
    sort,
    handleSort,
    filteredData,
    options
  };
};
