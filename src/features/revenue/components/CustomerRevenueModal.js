import React from 'react';
import DrillModal from '@/features/revenue/components/DrillModal';

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
