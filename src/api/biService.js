import { get, post, patch, upload } from '@/api/client';

const biService = {
  technicianUtilization: (f) => get('/ops/technician-utilization', f),
  stopsPerTechnician: (f) => get('/ops/stops-per-technician', f),
  stopVolumeTrends: (f) => get('/ops/stop-volume', f),
  monthlyStopsByRoute: (f) => get('/stops/monthly-by-route', f),
  technicianCheckins: (id, f) => get(`/technicians/${id}/checkins`, f),
  checkins: (f) => get('/checkins', f),
  checkinOptions: () => get('/checkins/options'),
  driveTime: (f) => get('/route-drive-time', f),
  driveTimeOptions: () => get('/route-drive-time/options'),
  companyDistances: (f) => get('/company-distances', f),
  companyDistanceOptions: () => get('/company-distances/options'),
  syncCompanyDistances: (body) => post('/company-distances/sync', body || {}, { timeout: 60000 }),
  companyDistanceSyncStatus: () => get('/company-distances/sync/status'),
  routeLegs: (f) => get('/route-legs', f),
  serviceVsDriveTime: (f) => get('/service-vs-drive-time', f),
  closedInvoices: (f) => get('/invoices', f),
  invoiceDetail: (invoiceNumber) => get(`/invoices/${encodeURIComponent(invoiceNumber)}`),

  revenueByCategory: (f) => get('/revenue/by-category', f),
  revenueCategoryDetail: (f) => get('/revenue/category-detail', f),
  revenueByRoute: (f) => get('/revenue/by-route', f),
  revenueByCustomer: (f) => get('/revenue/by-customer', f),
  revenueCustomerDetail: (id, f) => get(`/revenue/customer/${encodeURIComponent(id)}`, f),
  revenuePerStop: (f) => get('/revenue/per-stop', f),

  payrollCost: (f) => get('/payroll/cost', f),
  uploadPayrollCsv: (file) => upload('/payroll/upload', file),
  laborCostPerStop: (f) => get('/cost/labor-per-stop', f),
  routeProfitability: (routeCode, f) => get(`/routes/${routeCode || 'all'}/profitability`, f),
  customerProfitability: (id, f) => get(`/customers/${id}/profitability`, f),

  customers: (f) => get('/customers', f),
  customerPricing: (id, f) => get(`/customers/${id}/pricing`, f),
  customerAccount: (id) => get(`/customers/${encodeURIComponent(id)}/account`),
  syncCustomerAccounts: (body) => post('/customers/accounts/sync', body || {}, { timeout: 60000 }),
  customerAccountSyncStatus: () => get('/customers/accounts/sync/status'),
  routes: (f) => get('/routes', f),
  employees: (f) => get('/employees', f),
  serviceCategories: (f) => get('/service-categories', f),

  dataQualityIssues: (f) => get('/data-quality/issues', f),
  resolveDataQualityIssue: (id, body) => patch(`/data-quality/issues/${id}`, body),
  unmappedServiceItems: (f) => get('/service-items/unmapped', f),
  createItemCategoryMapping: (body) => post('/item-category-mappings', body),
  importBatches: (f) => get('/import-batches', f),
  syncStatus: (f) => get('/sync/status', f),
  connections: () => get('/system/connections'),
};

export default biService;
