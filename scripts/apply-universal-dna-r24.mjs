import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const UNIVERSAL_DNA_R24 = 'BM_UNIVERSAL_DNA_R24';

function replaceRequired(source, needle, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(needle)) throw new Error(`[r24] ${label}: contrato não encontrado.`);
  return source.replace(needle, replacement);
}

export function applyUniversalDnaR24(rootDirectory = process.cwd()) {
  const target = resolve(rootDirectory, 'src/modules/builds/trainingOptimizer.ts');
  if (!existsSync(target)) throw new Error('[r24] trainingOptimizer.ts não encontrado.');
  let source = readFileSync(target, 'utf8');
  if (source.includes(UNIVERSAL_DNA_R24)) {
    console.log('v40.80 r24: DNA universal já aplicado.');
    return { changed: false, target };
  }

  const helpers = `
type DnaFamilyScores = Record<'shooting'|'passing'|'dribbling'|'dexterity'|'lowerBodyStrength'|'aerialStrength'|'defending', number>;

function dnaFamilyScores(a: Required<Attributes>): DnaFamilyScores {
  const mean = (...values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  return {
    shooting: mean(a.finishing, a.offensiveAwareness, a.kickingPower),
    passing: mean(a.lowPass, a.loftedPass, a.ballControl),
    dribbling: mean(a.ballControl, a.dribbling, a.tightPossession, a.balance),
    dexterity: mean(a.offensiveAwareness, a.acceleration, a.balance),
    lowerBodyStrength: mean(a.speed, a.kickingPower, a.stamina),
    aerialStrength: mean(a.heading, a.jump, a.physicalContact),
    defending: mean(a.defensiveAwareness, a.tackling, a.defensiveEngagement, a.aggression)
  };
}

function universalDnaAdjustment(position: PositionCode, key: TrainingKey, a: Required<Attributes>, parsed: ParsedCard): number {
  if (key === 'gk1' || key === 'gk2' || key === 'gk3') return position === 'GK' ? 0 : -20;
  if (position === 'GK') return 0;

  const scores = dnaFamilyScores(a);
  const lineKeys: Array<keyof DnaFamilyScores> = ['shooting','passing','dribbling','dexterity','lowerBodyStrength','aerialStrength','defending'];
  const average = lineKeys.reduce((sum, item) => sum + scores[item], 0) / lineKeys.length;
  const family = key as keyof DnaFamilyScores;
  let adjustment = Math.max(-2.4, Math.min(2.4, (scores[family] - average) / 7.5));
  const style = normalize(parsed.playstyle ?? '').toLowerCase();

  const positionBias: Partial<Record<PositionCode, Partial<Record<TrainingKey, number>>>> = {
    CF: { shooting: 2.0, dexterity: 1.2, lowerBodyStrength: .8, dribbling: .35, defending: -8 },
    SS: { dribbling: 1.3, dexterity: 1.3, shooting: 1.0, passing: .8, defending: -6 },
    LWF: { dribbling: 1.6, dexterity: 1.5, lowerBodyStrength: 1.0, shooting: .7, defending: -6 },
    RWF: { dribbling: 1.6, dexterity: 1.5, lowerBodyStrength: 1.0, shooting: .7, defending: -6 },
    AMF: { passing: 1.8, dribbling: 1.4, dexterity: .8, shooting: .45, defending: -5 },
    LMF: { passing: 1.0, dribbling: .8, lowerBodyStrength: 1.0, dexterity: .8, defending: .3 },
    RMF: { passing: 1.0, dribbling: .8, lowerBodyStrength: 1.0, dexterity: .8, defending: .3 },
    CMF: { passing: 1.5, lowerBodyStrength: 1.0, defending: .9, dribbling: .45 },
    DMF: { defending: 2.0, passing: 1.0, lowerBodyStrength: 1.1, aerialStrength: .45, shooting: -4 },
    CB: { defending: 2.4, aerialStrength: 1.5, lowerBodyStrength: .9, passing: .3, shooting: -8, dribbling: -3 },
    LB: { lowerBodyStrength: 1.3, defending: 1.2, passing: 1.0, dexterity: .8, dribbling: .45, shooting: -3 },
    RB: { lowerBodyStrength: 1.3, defending: 1.2, passing: 1.0, dexterity: .8, dribbling: .45, shooting: -3 }
  };
  adjustment += positionBias[position]?.[key] ?? 0;

  const add = (entries: Partial<Record<TrainingKey, number>>) => { adjustment += entries[key] ?? 0; };

  if (/artilheiro|goal poacher|atacante matador/.test(style)) add({ shooting: 2.0, dexterity: 1.2, lowerBodyStrength: .55, dribbling: .35, aerialStrength: -.8, defending: -8 });
  if (/homem de area|homem de área|fox in the box/.test(style)) add({ shooting: 1.7, aerialStrength: 1.2, dexterity: .7, lowerBodyStrength: .65, defending: -8 });
  if (/pivo|pivô|atacante pivo|atacante pivô|target man/.test(style)) add({ lowerBodyStrength: 1.8, passing: 1.0, aerialStrength: 1.15, shooting: .8, defending: -7 });
  if (/puxa marcacao|puxa marcação|deep lying forward/.test(style)) add({ passing: 1.35, dribbling: 1.0, dexterity: .8, shooting: .55, defending: -6 });
  if (/armador criativo|creative playmaker|criador de jogadas/.test(style)) add({ passing: 1.8, dribbling: 1.25, dexterity: .45, defending: -2 });
  if (/jogador de infiltracao|jogador de infiltração|hole player|atacante surpresa/.test(style)) add({ dexterity: 1.6, shooting: 1.15, lowerBodyStrength: .65, dribbling: .4 });
  if (/classico n[oº]? 10|clássico n[oº]? 10|classic/.test(style)) add({ passing: 2.0, dribbling: 1.4, dexterity: -.15, lowerBodyStrength: -.25, defending: -3 });
  if (/meia versatil|meia versátil|box-to-box|todo campo/.test(style)) add({ lowerBodyStrength: 1.2, passing: .9, defending: .8, dexterity: .55 });
  if (/orquestrador|orchestrator/.test(style)) add({ passing: 1.9, dribbling: .75, lowerBodyStrength: .45, defending: .3 });
  if (/primeiro volante|1(?:º|o)? volante|ancora|âncora|anchor man/.test(style)) add({ defending: 2.0, passing: .8, lowerBodyStrength: 1.0, aerialStrength: .45, shooting: -4 });
  if (/destruidor|destroyer/.test(style)) add({ defending: 2.2, lowerBodyStrength: 1.1, aerialStrength: .65, passing: .15 });
  if (/defensor criativo|construtor|build up/.test(style)) add({ defending: 1.8, passing: 1.0, aerialStrength: .6, lowerBodyStrength: .55, dribbling: -.5 });
  if (/lateral defensivo|defensive full/.test(style)) add({ defending: 1.9, lowerBodyStrength: 1.1, passing: .45, dribbling: -.35, shooting: -2 });
  if (/lateral ofensivo|lateral atacante|offensive full/.test(style)) add({ lowerBodyStrength: 1.25, passing: 1.25, dexterity: 1.0, dribbling: .65, defending: .35 });
  if (/ala produtivo|prolific winger/.test(style)) add({ dribbling: 1.55, dexterity: 1.35, lowerBodyStrength: .85, shooting: .55, defending: -3 });
  if (/lateral movel|lateral móvel|roaming flank|flanco movel|flanco móvel/.test(style)) add({ dexterity: 1.35, lowerBodyStrength: 1.2, dribbling: 1.1, shooting: .45, passing: .35 });
  if (/perito em cruzamento|cross specialist/.test(style)) add({ passing: 1.8, lowerBodyStrength: .9, dexterity: .65, dribbling: .4 });

  const score = scores[family];
  if (score >= 94) adjustment -= 1.15;
  else if (score >= 90) adjustment -= .55;
  else if (score <= 72) adjustment += .35;

  return adjustment;
}

function applyUniversalDnaCaps(position: PositionCode, caps: TrainingPlan, a: Required<Attributes>, parsed: ParsedCard): TrainingPlan {
  const out = { ...caps };
  const style = normalize(parsed.playstyle ?? '').toLowerCase();
  const scores = dnaFamilyScores(a);

  if (position === 'CF') {
    out.defending = 0;
    out.dribbling = Math.max(out.dribbling, scores.dribbling >= 82 ? 9 : 6);
    out.dexterity = Math.max(out.dexterity, 11);
    if (/artilheiro|goal poacher|atacante matador/.test(style) && scores.aerialStrength < 78) out.aerialStrength = Math.min(out.aerialStrength, 4);
  }
  if (position === 'SS' || position === 'LWF' || position === 'RWF' || position === 'AMF') out.defending = 0;
  if (position === 'CB') {
    out.shooting = 0;
    out.dribbling = Math.min(out.dribbling, scores.dribbling >= 82 ? 4 : 2);
  }
  if (position === 'DMF' && /primeiro volante|ancora|âncora|anchor man|destruidor|destroyer/.test(style)) out.shooting = Math.min(out.shooting, 1);
  if ((position === 'LB' || position === 'RB') && /lateral defensivo|defensive full/.test(style)) out.shooting = 0;

  return out;
}
`;

  source = replaceRequired(
    source,
    "\nfunction trainingKeyWeight(key: TrainingKey, position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard, resolveIdentity: IndividualTrainingAdjustments): number {",
    `${helpers}\n// ${UNIVERSAL_DNA_R24}\nfunction trainingKeyWeight(key: TrainingKey, position: PositionCode, objective: Objective, a: Required<Attributes>, parsed: ParsedCard, resolveIdentity: IndividualTrainingAdjustments): number {`,
    'injeção do motor DNA universal'
  );

  source = source.replace(
    "  return applyCapAdjustments(caps, role);\n}\n\nfunction trainingKeyWeight",
    "  return applyUniversalDnaCaps(position, applyCapAdjustments(caps, role), a, parsed);\n}\n\nfunction trainingKeyWeight"
  );

  source = replaceRequired(
    source,
    "  let weight = (baseByPosition[position][key] ?? 0) + (objectiveBoost[normalizeObjective(objective)]?.[key] ?? 0) + (role?.weightAdjust?.[key] ?? 0) + individual[key];",
    "  let weight = (baseByPosition[position][key] ?? 0) + (objectiveBoost[normalizeObjective(objective)]?.[key] ?? 0) + (role?.weightAdjust?.[key] ?? 0) + individual[key] + universalDnaAdjustment(position, key, a, parsed);",
    'peso DNA universal'
  );

  writeFileSync(target, source, 'utf8');
  console.log('v40.80 r24 aplicada: ficha individual por DNA + posição + estilo + retorno marginal.');
  return { changed: true, target };
}
