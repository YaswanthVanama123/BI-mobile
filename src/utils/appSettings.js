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

const ANCHOR_KEY = 'bi.payrollAnchor';
let anchor = '';
const anchorListeners = new Set();

export function getPayrollAnchor() {
  return anchor;
}

export async function loadPayrollAnchor() {
  try {
    const v = await AsyncStorage.getItem(ANCHOR_KEY);
    if (v) anchor = v;
  } catch (e) {}
  anchorListeners.forEach((fn) => fn(anchor));
  return anchor;
}

export async function setPayrollAnchor(date) {
  anchor = date || '';
  try { await AsyncStorage.setItem(ANCHOR_KEY, anchor); } catch (e) {}
  anchorListeners.forEach((fn) => fn(anchor));
  return anchor;
}

export function subscribePayrollAnchor(fn) {
  anchorListeners.add(fn);
  return () => anchorListeners.delete(fn);
}

loadPayrollAnchor();
