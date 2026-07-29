import React from 'react';
import DrillModal from '@/features/revenue/components/DrillModal';

export default function RouteRevenueModal({ routeCode, range, onClose }) {
  return (
    <DrillModal
      title={`Route ${routeCode}`}
      subtitle="Invoiced work on this route for the selected period — tap a customer for their invoices"
      filter={{ routeCode }}
      range={range}
      onClose={onClose}
    />
  );
}
