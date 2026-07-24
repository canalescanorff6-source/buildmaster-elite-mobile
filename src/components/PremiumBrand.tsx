import { APP_RELEASE_VERSION } from '@/lib/appUpdates';

type PremiumBrandProps = {
  variant?: 'compact' | 'standard' | 'hero';
  showVersion?: boolean;
  className?: string;
};

export function PremiumBrand({ variant = 'standard', showVersion = false, className = '' }: PremiumBrandProps) {
  return (
    <span className={`bm-premium-brand bm-premium-brand-${variant} ${className}`.trim()}>
      <span className="bm-brand-emblem" aria-hidden="true">
        <span className="bm-brand-emblem-ring" />
        <strong>BM</strong>
        <i />
      </span>
      <span className="bm-brand-wordmark">
        <span className="bm-brand-title-row"><strong>BuildMaster</strong><em>PRO</em></span>
        <span className="bm-brand-subtitle">Elite Tático</span>
      </span>
      {showVersion && <small className="bm-brand-version">v{APP_RELEASE_VERSION}</small>}
    </span>
  );
}
