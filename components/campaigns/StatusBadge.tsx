import React from 'react';
import { Campaign } from '../../types';
import { Badge } from '../ui/Badge';
import { Colors } from '../../constants/colors';

const STATUS_CONFIG: Record<Campaign['status'], { label: string; color: string; bg: string }> = {
  active: { label: 'Ativa', color: '#fff', bg: Colors.success },
  scheduled: { label: 'Programada', color: '#fff', bg: Colors.secondary },
  finished: { label: 'Finalizada', color: Colors.textMuted, bg: Colors.border },
};

interface StatusBadgeProps {
  status: Campaign['status'];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return <Badge label={config.label} color={config.color} backgroundColor={config.bg} />;
}
