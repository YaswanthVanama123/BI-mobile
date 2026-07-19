const esc = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function rowsToCsv(columns, rows) {
  const cols = columns.filter((c) => c.csv !== false);
  const header = cols.map((c) => esc(c.header)).join(',');
  const body = (rows || []).map((row) => cols.map((c) => {
    const v = typeof c.csv === 'function' ? c.csv(row) : (c.accessor ? c.accessor(row) : row[c.key]);
    return esc(v);
  }).join(',')).join('\n');
  return `${header}\n${body}`;
}

export default rowsToCsv;
