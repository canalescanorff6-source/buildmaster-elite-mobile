import type { CSSProperties } from 'react';

type Props = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Símbolo proprietário do BuildMaster: escudo de desempenho e ficha de jogador com cinco espaços
 * de habilidades. O desenho é vetorial e não usa imagens externas.
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
      <path d="M32 4 54 12v17c0 14-8.6 24.9-22 31C18.6 53.9 10 43 10 29V12L32 4Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <rect x="18" y="14" width="28" height="31" rx="8" fill="none" stroke="currentColor" strokeWidth="2.8" />
      <circle cx="27" cy="25" r="5.2" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M21.2 36c1.8-4.5 9.8-4.5 11.6 0M36 21h5M36 27h5M36 33h5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m24 49 5-4 4 3 8-7" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M37 41h4v4" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <g fill="currentColor">
        <circle cx="20" cy="52" r="1.65" />
        <circle cx="26" cy="54" r="1.65" />
        <circle cx="32" cy="55" r="1.65" />
        <circle cx="38" cy="54" r="1.65" />
        <circle cx="44" cy="52" r="1.65" />
      </g>
    </svg>
  );
}
