import Share from 'react-native-share';
import { getExportFormat } from '@/utils/appSettings';

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function excelValue(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? v : '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') {
    if (v.$numberDecimal !== undefined) { const n = Number(v.$numberDecimal); return Number.isNaN(n) ? '' : n; }
    return JSON.stringify(v);
  }
  const s = String(v);
  if (ISO_DATETIME.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return s;
}

function cellFor(col, row, ri) {
  const raw = typeof col.csv === 'function' ? col.csv(row, ri) : (col.accessor ? col.accessor(row, ri) : row[col.key]);
  return excelValue(raw);
}

export async function exportTable(columns, rows, filenameBase = 'export') {
  const cols = (columns || []).filter((c) => c.csv !== false && c.exportable !== false);
  const header = cols.map((c) => c.header || c.key);
  const body = (rows || []).map((row, ri) => cols.map((c) => cellFor(c, row, ri)));
  const aoa = [header, ...body];

  const XLSX = require('xlsx');
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const excel = getExportFormat() !== 'csv';
  if (excel) {
    const lastRow = Math.max(0, aoa.length - 1);
    const lastCol = Math.max(0, cols.length - 1);
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: lastCol } }) };
    ws['!cols'] = cols.map((c, i) => {
      let w = String(c.header || c.key || '').length;
      for (const r of body) { const cell = r[i]; const len = cell == null ? 0 : String(cell).length; if (len > w) w = len; }
      return { wch: Math.min(45, Math.max(10, w + 2)) };
    });
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  const b64 = XLSX.write(wb, { type: 'base64', bookType: excel ? 'xlsx' : 'csv' });

  const ext = excel ? 'xlsx' : 'csv';
  const mime = excel
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'text/csv';
  await Share.open({
    title: filenameBase,
    filename: `${filenameBase}.${ext}`,
    url: `data:${mime};base64,${b64}`,
    type: mime,
    failOnCancel: false,
  });
}
