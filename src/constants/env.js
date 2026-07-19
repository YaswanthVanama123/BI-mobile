const DEFAULTS = {
  apiBaseUrl: 'http://localhost:4000/api/v1',
  reportingTz: 'America/New_York',
};

let overrides = {};
try {
  const local = require('./env.local');
  overrides = local.default || local;
} catch (e) {
  overrides = {};
}

export const config = { ...DEFAULTS, ...overrides };

export default config;
