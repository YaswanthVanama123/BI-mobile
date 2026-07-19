import React, { createContext, useContext, useMemo, useState } from 'react';
import { defaultRange } from '@/utils/dateRanges';

const FiltersContext = createContext(null);

export function FiltersProvider({ children }) {
  const [range, setRange] = useState(defaultRange());
  const value = useMemo(() => ({ range, setRange }), [range]);
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) return { range: defaultRange(), setRange: () => {} };
  return ctx;
}

export default FiltersContext;
