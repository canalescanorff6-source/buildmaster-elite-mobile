import { APP_RELEASE_VERSION } from '@/lib/appUpdates';
import { BuildMasterMark } from '@/components/BuildMasterMark';

type PremiumBrandProps = {
  variant?: 'compact' | 'standard' | 'hero';
  showVersion?: boolean;
  className?: string;
};

export function PremiumBrand({ variant = 'standard', showVersion = false, className = '' }: PremiumBrandProps) {
  const markSize = variant === 'hero' ? 64 : variant === 'compact' ? 36 : 46;
  return (
    <span className={`bm-premium-brand bm-premium-brand-${variant} ${className}`.trim()}>
      <span className="bm-brand-emblem" aria-hidden="true"><BuildMasterMark size={markSize} /></span>
      <span className="bm-brand-wordmark">
        <span className="bm-brand-title-row"><strong>BuildMaster</strong><em>ELITE</em></span>
        <span className="bm-brand-subtitle">Tático · Máximo desempenho</span>
      </span>
      {showVersion && <small className="bm-brand-version">v{APP_RELEASE_VERSION}</small>}
    </span>
  );
}
