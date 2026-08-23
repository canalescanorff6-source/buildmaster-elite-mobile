'use client';

import type { CSSProperties, ReactNode } from 'react';

export type TrainingProgressionKeyR106 =
  | 'shooting'
  | 'passing'
  | 'dribbling'
  | 'dexterity'
  | 'lowerBodyStrength'
  | 'aerialStrength'
  | 'defending'
  | 'gk1'
  | 'gk2'
  | 'gk3';

type IconProps = {
  trainingKey: TrainingProgressionKeyR106;
  size?: number;
  title?: string;
  style?: CSSProperties;
};

function BaseIcon({
  title,
  size,
  children,
  style
}: {
  title: string;
  size: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      style={{ display: 'block', overflow: 'visible', ...style }}
    >
      <title>{title}</title>
      {children}
    </svg>
  );
}

export function TrainingProgressionIconR106({
  trainingKey,
  size = 32,
  title = trainingKey,
  style
}: IconProps) {
  const common = {
    stroke: 'currentColor',
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  switch (trainingKey) {
    case 'shooting':
      return (
        <BaseIcon title={title} size={size} style={style}>
          <circle cx="32" cy="32" r="17" fill="none" {...common} />
          <circle cx="32" cy="32" r="5" fill="currentColor" stroke="none" />
          <path d="M32 7v9M32 48v9M7 32h9M48 32h9" fill="none" {...common} />
        </BaseIcon>
      );

    case 'passing':
      return (
        <BaseIcon title={title} size={size} style={style}>
          <circle cx="34" cy="32" r="18" fill="none" {...common} />
          <path d="M34 18l8 6-3 10H29l-4-10z" fill="currentColor" stroke="none" />
          <path d="M20 22l8 2M18 35l9 1M22 45l7-4M47 22l-7 3M49 36l-8-1M44 46l-6-6" fill="none" {...common} strokeWidth="3" />
          <path d="M5 23h10M3 32h12M7 41h9" fill="none" {...common} strokeWidth="3" />
        </BaseIcon>
      );

    case 'dribbling':
      return (
        <BaseIcon title={title} size={size} style={style}>
          <path d="M25 13h14l7 36H18z" fill="currentColor" stroke="none" />
          <path d="M15 51h34" fill="none" {...common} />
          <path d="M22 34h20" stroke="#0b1523" strokeWidth="3" strokeLinecap="round" />
        </BaseIcon>
      );

    case 'dexterity':
      return (
        <BaseIcon title={title} size={size} style={style}>
          <path d="M13 19h30l-13 12h19L20 47h25" fill="none" {...common} strokeWidth="6" />
          <path d="M40 12l11 7-11 7" fill="none" {...common} strokeWidth="5" />
        </BaseIcon>
      );

    case 'lowerBodyStrength':
      return (
        <BaseIcon title={title} size={size} style={style}>
          <path d="M9 39c8 0 16-4 21-12l8 8c4 4 10 6 17 6v9H12c-3 0-5-2-5-5 0-2 1-4 2-6z" fill="currentColor" stroke="none" />
          <path d="M17 50v5M28 50v5M39 50v5M50 50v5" {...common} />
          <path d="M35 30l5-7M40 34l6-6M45 37l6-5" stroke="#0b1523" strokeWidth="3" strokeLinecap="round" />
        </BaseIcon>
      );

    case 'aerialStrength':
      return (
        <BaseIcon title={title} size={size} style={style}>
          <path d="M14 38l18-18 18 18" fill="none" {...common} strokeWidth="7" />
          <path d="M14 52l18-18 18 18" fill="none" {...common} strokeWidth="7" />
        </BaseIcon>
      );

    case 'defending':
      return (
        <BaseIcon title={title} size={size} style={style}>
          <path d="M32 8l20 5v16c0 13-8 22-20 28-12-6-20-15-20-28V13z" fill="none" {...common} />
          <path d="M32 10v44" {...common} />
          <path d="M33 11l17 4v14c0 10-6 18-17 24z" fill="currentColor" stroke="none" />
        </BaseIcon>
      );

    case 'gk1':
      return (
        <BaseIcon title={title} size={size} style={style}>
          <path d="M19 49V27c0-3 4-4 5-1V14c0-4 5-4 5 0v10-13c0-4 5-4 5 0v13-11c0-4 5-4 5 0v13-8c0-4 5-4 5 0v14c0 7-4 12-10 15l-2 7H21z" fill="currentColor" stroke="none"/>
          <path d="M21 53h17" fill="none" {...common} strokeWidth="3"/>
          <path d="M25 44h12" stroke="#0b1523" strokeWidth="3" strokeLinecap="round"/>
        </BaseIcon>
      );

    case 'gk2':
      return (
        <BaseIcon title={title} size={size} style={style}>
          <circle cx="32" cy="17" r="7" fill="currentColor" stroke="none" />
          <path d="M15 42c2-12 7-17 15-19M49 42c-2-12-7-17-15-19" fill="none" {...common} strokeWidth="6" />
          <path d="M10 43l9-4M54 43l-9-4M20 48h24" fill="none" {...common} />
        </BaseIcon>
      );

    case 'gk3':
      return (
        <BaseIcon title={title} size={size} style={style}>
          <circle cx="50" cy="18" r="6" fill="currentColor" stroke="none" />
          <path d="M12 39c12 0 18-6 24-15l8 4c-5 10-12 18-23 22z" fill="currentColor" stroke="none" />
          <path d="M35 25l11-7M39 31l13-2M17 41l-8 7M23 46l-8 9" fill="none" {...common} />
        </BaseIcon>
      );
  }
}

export const TRAINING_PROGRESS_ORDER_R106: TrainingProgressionKeyR106[] = [
  'shooting',
  'passing',
  'dribbling',
  'dexterity',
  'lowerBodyStrength',
  'aerialStrength',
  'defending'
];

export const GOALKEEPER_PROGRESS_ORDER_R106: TrainingProgressionKeyR106[] = [
  ...TRAINING_PROGRESS_ORDER_R106,
  'gk1',
  'gk2',
  'gk3'
];
