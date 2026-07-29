import React from 'react';
import DrillModal from '@/features/revenue/components/DrillModal';

// Backwards-compatible wrapper: renders the shared actual-invoice DrillModal
// scoped to one customer (Invoices + Items tabs, date-filtered).
export default function CustomerRevenueModal({ customerId, range, onClose, customerName, routes }) {
  const subtitle = routes && routes.length
    ? `Route${routes.length > 1 ? 's' : ''}: ${routes.join(', ')}`
    : undefined;
  return (
    <DrillModal
      title={customerName}
      subtitle={subtitle}
      filter={{ customerId }}
      range={range}
      onClose={onClose}
    />
  );
}
