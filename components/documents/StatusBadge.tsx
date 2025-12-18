import React from 'react';
import { DocumentStatusType } from '../../lib/types';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: DocumentStatusType;
  daysRemaining?: number;
}

export default function StatusBadge({ status, daysRemaining }: StatusBadgeProps) {
  const config = {
    vigente: {
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: CheckCircle,
      label: 'Vigente'
    },
    por_vencer: {
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      label: 'Por Vencer'
    },
    vencido: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
      label: 'Vencido'
    }
  };

  const { color, icon: Icon, label } = config[status] || config.vigente;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
      {daysRemaining !== undefined && status !== 'vencido' && daysRemaining <= 30 && (
        <span className="ml-1 opacity-75">({daysRemaining} días)</span>
      )}
    </span>
  );
}
