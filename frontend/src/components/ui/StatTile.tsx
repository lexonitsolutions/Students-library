import type { ReactNode } from 'react';
import { Card } from './Card';

export interface StatTileProps {
  readonly icon?: ReactNode;
  readonly label: string;
  readonly value: string | number;
  readonly trend?: string;
  readonly trendTone?: 'positive' | 'neutral' | 'warning';
  readonly highlight?: boolean;
}

const toneClasses = {
  positive: 'text-emerald-600',
  neutral: 'text-on-surface-variant',
  warning: 'text-error',
};

export function StatTile({ icon, label, value, trend, trendTone = 'neutral', highlight }: Readonly<StatTileProps>) {
  return (
    <Card
      hoverable={false}
      className={highlight ? 'border-primary-container bg-primary-container/5' : undefined}
    >
      <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
        <span>{label}</span>
        {icon && <span className="text-outline">{icon}</span>}
      </div>
      <div className="mt-2 text-headline-lg text-on-surface">{value}</div>
      {trend && <div className={`mt-1 text-label-sm ${toneClasses[trendTone]}`}>{trend}</div>}
    </Card>
  );
}

export default StatTile;
