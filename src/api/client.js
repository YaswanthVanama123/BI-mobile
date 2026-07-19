import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '@/constants/env';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

let cachedToken = null;
AsyncStorage.getItem('authToken').then((t) => { cachedToken = t; }).catch(() => {});

export async function setAuthToken(token) {
  cachedToken = token || null;
  if (token) await AsyncStorage.setItem('authToken', token);
  else await AsyncStorage.removeItem('authToken');
}

api.interceptors.request.use((cfg) => {
  if (cachedToken) cfg.headers.Authorization = `Bearer ${cachedToken}`;
  return cfg;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response && error.response.status;
    const message = (error.response && error.response.data && error.response.data.error && error.response.data.error.message)
      || (error.response && error.response.data && error.response.data.message)
      || error.message;
    return Promise.reject({ status, message: message || 'Request failed', original: error });
  },
);

function cleanParams(params = {}) {
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') out[k] = v;
  }
  return out;
}

export async function get(url, params = {}) {
  return api.get(url, { params: cleanParams(params) });
}

export async function post(url, body = {}, cfg) {
  return api.post(url, body, cfg);
}

export async function patch(url, body = {}) {
  return api.patch(url, body);
}

export async function upload(url, file, field = 'file') {
  const form = new FormData();
  form.append(field, { uri: file.uri, name: file.name || 'upload.csv', type: file.type || 'text/csv' });
  return api.post(url, form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 });
}

export default { get, post, patch, upload };

