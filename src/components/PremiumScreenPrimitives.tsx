'use client';

import type { ComponentType, ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

export type PremiumScreenMetric = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'accent';
};

export function PremiumScreenHero({
  icon: Icon,
  eyebrow,
  title,
  description,
  badge,
  actions,
  metrics,
  compact = false
}: {
  icon: ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
  actions?: ReactNode;
  metrics?: PremiumScreenMetric[];
  compact?: boolean;
}) {
  return (
    <header className={`bm2820-screen-hero ${compact ? 'is-compact' : ''}`}>
      <div className="bm2820-screen-hero-main">
        <div className="bm2820-screen-hero-icon" aria-hidden="true"><Icon size={compact ? 22 : 27} /></div>
        <div className="bm2820-screen-hero-copy">
          <div className="bm2820-screen-eyebrow-row">
            <p className="kicker">{eyebrow}</p>
            {badge && <span className="bm2820-screen-badge">{badge}</span>}
          </div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      {actions && <div className="bm2820-screen-hero-actions">{actions}</div>}
      {metrics?.length ? (
        <div className="bm2820-screen-metrics" aria-label="Resumo desta área">
          {metrics.map((metric) => (
            <article key={metric.label} className={`tone-${metric.tone ?? 'neutral'}`}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              {metric.hint && <small>{metric.hint}</small>}
            </article>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export function PremiumSectionHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="bm2820-section-heading">
      <div>
        {eyebrow && <p className="kicker">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="bm2820-section-heading-action">{action}</div>}
    </div>
  );
}

export function PremiumInlineAction({ children }: { children: ReactNode }) {
  return <span className="bm2820-inline-action">{children}<ArrowUpRight size={14} aria-hidden="true" /></span>;
}
