import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'bi.exportFormat';
let current = 'excel';
const listeners = new Set();

export function getExportFormat() {
  return current;
}

export async function loadExportFormat() {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v === 'csv' || v === 'excel') current = v;
  } catch (e) {}
  listeners.forEach((fn) => fn(current));
  return current;
}

export async function setExportFormat(format) {
  current = format === 'csv' ? 'csv' : 'excel';
  try { await AsyncStorage.setItem(KEY, current); } catch (e) {}
  listeners.forEach((fn) => fn(current));
  return current;
}

export function subscribeExportFormat(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

loadExportFormat();
