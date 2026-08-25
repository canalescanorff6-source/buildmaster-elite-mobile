'use client';

import { officialSkillIdentityR119, type SkillFamilyR119 } from '@/lib/officialSkillVisualIdentityR119';

function FamilyMark({ family }: { family: SkillFamilyR119 }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (family === 'finishing') return <><circle cx="24" cy="24" r="9" {...common}/><circle cx="24" cy="24" r="2.5" fill="currentColor"/><path d="M24 8v5M24 35v5M8 24h5M35 24h5" {...common}/></>;
  if (family === 'passing') return <><circle cx="20" cy="25" r="6" {...common}/><path d="M27 25h12M34 19l6 6-6 6" {...common}/></>;
  if (family === 'defense') return <><path d="M24 8l13 4v10c0 9-5 15-13 19-8-4-13-10-13-19V12z" {...common}/><path d="M18 24l4 4 8-9" {...common}/></>;
  if (family === 'aerial') return <><circle cx="24" cy="14" r="5" {...common}/><path d="M12 35l12-14 12 14M16 40l8-8 8 8" {...common}/></>;
  if (family === 'goalkeeper') return <><path d="M14 35V19c0-3 4-3 4 0v-6c0-3 4-3 4 0v6-8c0-3 4-3 4 0v8-6c0-3 4-3 4 0v8-4c0-3 4-3 4 0v8c0 7-4 11-10 14H18z" fill="currentColor"/></>;
  if (family === 'mental') return <><path d="M24 8l4 10 11 1-8 7 3 11-10-6-10 6 3-11-8-7 11-1z" {...common}/></>;
  return <><path d="M11 31c7-12 15-16 25-15M15 37c8-8 14-10 23-8" {...common}/><circle cx="13" cy="29" r="3" fill="currentColor"/><circle cx="38" cy="16" r="3" fill="currentColor"/></>;
}

/** Ícone próprio do BuildMaster. Não copia arte proprietária da Konami. */
export function OfficialSkillIconR119({ skill, size = 42 }: { skill: string; size?: number }) {
  const identity = officialSkillIdentityR119(skill);
  const binaryMarks = Array.from({ length: 6 }, (_, index) => Boolean(identity.variant & (1 << index)));
  return <span className={`r119-skill-glyph ${identity.family}`} data-skill-icon={identity.variant} title={skill}>
    <svg viewBox="0 0 48 48" width={size - 8} height={size - 8} role="img" aria-label={`Ícone ${skill}`}>
      <FamilyMark family={identity.family}/>
      <g className="r119-skill-identity-dots" aria-hidden="true">
        {binaryMarks.map((active, index) => <circle key={index} cx={37.5 - index * 5.2} cy="39" r="1.15" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth=".7" opacity={active ? .96 : .34}/>) }
      </g>
      <text x="24" y="46" textAnchor="middle" fontSize="5.6" fontWeight="900" fill="currentColor" letterSpacing=".4">{identity.code}</text>
    </svg>
  </span>;
}
