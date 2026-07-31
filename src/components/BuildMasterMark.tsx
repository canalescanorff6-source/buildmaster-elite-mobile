import type { CSSProperties } from 'react';

type Props = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Símbolo próprio do BuildMaster: uma ficha de jogador com cinco espaços de
 * habilidades e uma seta de evolução. Não depende de fonte ou imagem externa.
 */
export function BuildMasterMark({ size = 44, className = '', title = 'BuildMaster' }: Props) {
  const style = { '--bm-mark-size': `${size}px` } as CSSProperties;
  return (
    <svg
      className={`bm-build-mark ${className}`.trim()}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="7" y="5" width="50" height="54" rx="14" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="3" />
      <circle cx="22" cy="23" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M13.5 39c2.6-6 14.4-6 17 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M37 18h11M37 25h8M37 32h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M35 46l5-5 4 3 8-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M47 35h5v5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="currentColor">
        <circle cx="16" cy="51" r="2" />
        <circle cx="23" cy="51" r="2" />
        <circle cx="30" cy="51" r="2" />
      </g>
    </svg>
  );
}
