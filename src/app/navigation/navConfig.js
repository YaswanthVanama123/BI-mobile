import DashboardScreen from '@/features/dashboard/screens/DashboardScreen';
import CheckinsScreen from '@/features/operations/screens/CheckinsScreen';
import TechnicianUtilizationScreen from '@/features/operations/screens/TechnicianUtilizationScreen';
import StopsPerTechnicianScreen from '@/features/operations/screens/StopsPerTechnicianScreen';
import StopVolumeTrendsScreen from '@/features/operations/screens/StopVolumeTrendsScreen';
import ServiceVsDriveTimeScreen from '@/features/operations/screens/ServiceVsDriveTimeScreen';
import DriveTimeScreen from '@/features/operations/screens/DriveTimeScreen';
import CompanyDistancesScreen from '@/features/operations/screens/CompanyDistancesScreen';
import ClosedInvoicesScreen from '@/features/operations/screens/ClosedInvoicesScreen';
import RevenueByCategoryScreen from '@/features/revenue/screens/RevenueByCategoryScreen';
import RevenueByRouteScreen from '@/features/revenue/screens/RevenueByRouteScreen';
import RevenueByCustomerScreen from '@/features/revenue/screens/RevenueByCustomerScreen';
import RevenuePerStopScreen from '@/features/revenue/screens/RevenuePerStopScreen';
import PayrollCostScreen from '@/features/cost/screens/PayrollCostScreen';
import LaborPerStopScreen from '@/features/cost/screens/LaborPerStopScreen';
import RouteProfitabilityScreen from '@/features/cost/screens/RouteProfitabilityScreen';
import CustomersScreen from '@/features/reference/screens/CustomersScreen';
import ConnectionsScreen from '@/features/governance/screens/ConnectionsScreen';
import DataQualityScreen from '@/features/governance/screens/DataQualityScreen';
import UnmappedItemsScreen from '@/features/governance/screens/UnmappedItemsScreen';
import ImportBatchesScreen from '@/features/governance/screens/ImportBatchesScreen';
import SyncStatusScreen from '@/features/governance/screens/SyncStatusScreen';

export const NAV = [
  {
    section: 'Overview',
    items: [{ name: 'Dashboard', label: 'Dashboard', icon: 'grid-outline', component: DashboardScreen }],
  },
  {
    section: 'Operations',
    items: [
      { name: 'Checkins', label: 'Check-in / Check-out', icon: 'checkbox-outline', component: CheckinsScreen },
      { name: 'TechnicianUtilization', label: 'Technician Utilization', icon: 'speedometer-outline', component: TechnicianUtilizationScreen },
      { name: 'StopsPerTechnician', label: 'Stops per Technician', icon: 'location-outline', component: StopsPerTechnicianScreen },
      { name: 'StopVolumeTrends', label: 'Stop Volume Trends', icon: 'trending-up-outline', component: StopVolumeTrendsScreen },
      { name: 'ServiceVsDriveTime', label: 'Service vs Drive Time', icon: 'time-outline', component: ServiceVsDriveTimeScreen },
      { name: 'DriveTime', label: 'Drive Time by Route', icon: 'navigate-outline', component: DriveTimeScreen },
      { name: 'CompanyDistances', label: 'Distances / Driving Time', icon: 'git-network-outline', component: CompanyDistancesScreen },
      { name: 'ClosedInvoices', label: 'Closed Invoices', icon: 'document-text-outline', component: ClosedInvoicesScreen },
    ],
  },
  {
    section: 'Revenue',
    items: [
      { name: 'RevenueByCategory', label: 'Revenue by Category', icon: 'pie-chart-outline', component: RevenueByCategoryScreen },
      { name: 'RevenueByRoute', label: 'Revenue by Route', icon: 'git-branch-outline', component: RevenueByRouteScreen },
      { name: 'RevenueByCustomer', label: 'Revenue by Customer', icon: 'layers-outline', component: RevenueByCustomerScreen },
      { name: 'RevenuePerStop', label: 'Revenue per Stop', icon: 'cash-outline', component: RevenuePerStopScreen },
    ],
  },
  {
    section: 'Cost & Profitability',
    items: [
      { name: 'PayrollCost', label: 'Payroll Cost', icon: 'wallet-outline', component: PayrollCostScreen },
      { name: 'LaborPerStop', label: 'Labor Cost per Stop', icon: 'pricetags-outline', component: LaborPerStopScreen },
      { name: 'RouteProfitability', label: 'Route Profitability', icon: 'trending-up-outline', component: RouteProfitabilityScreen },
    ],
  },
  {
    section: 'Reference',
    items: [{ name: 'Customers', label: 'Customers', icon: 'people-outline', component: CustomersScreen }],
  },
  {
    section: 'Governance',
    items: [
      { name: 'Connections', label: 'Data Connections', icon: 'git-network-outline', component: ConnectionsScreen },
      { name: 'DataQuality', label: 'Data Quality', icon: 'warning-outline', component: DataQualityScreen },
      { name: 'UnmappedItems', label: 'Unmapped Items', icon: 'pricetag-outline', component: UnmappedItemsScreen },
      { name: 'ImportBatches', label: 'Import Batches', icon: 'server-outline', component: ImportBatchesScreen },
      { name: 'SyncStatus', label: 'Sync Status', icon: 'refresh-outline', component: SyncStatusScreen },
    ],
  },
];

export const NAV_ITEMS = NAV.flatMap((g) => g.items);
