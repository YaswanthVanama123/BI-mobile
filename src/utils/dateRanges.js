export const DATE_PRESETS = [
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'this_year', label: 'This year' },
  { value: 'all_time', label: 'All time' },
  { value: 'custom', label: 'Specific dates' },
];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function rangeForPreset(preset, today = new Date(), bounds = {}) {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let from;
  switch (preset) {
    case 'this_week': { const off = (d.getDay() + 6) % 7; from = new Date(d); from.setDate(d.getDate() - off); break; }
    case 'this_month': from = new Date(d.getFullYear(), d.getMonth(), 1); break;
    case 'this_quarter': from = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1); break;
    case 'this_year': from = new Date(d.getFullYear(), 0, 1); break;
    case 'all_time': return { from: bounds.min || '2000-01-01', to: bounds.max || iso(d) };
    default: return null;
  }
  return { from: iso(from), to: iso(d) };
}

export function defaultRange() {
  const r = rangeForPreset('this_year');
  return { preset: 'this_year', from: r.from, to: r.to };
}
