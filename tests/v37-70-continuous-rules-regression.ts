import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeCard } from '../src/lib/analyzer';
import {
  CONTINUOUS_RULES_V3770_VERSION,
  activateContinuousRulePackV3770,
  buildContinuousRulesAnalysisV3770,
  computeRulePackChecksumV3770,
  restoreRulePackVersionV3770,
  type ContinuousDynamicRulePackV3770
} from '../src/lib/continuousRulesV3770';
import { DEFAULT_DYNAMIC_RULE_PACK, applyLocalCorrectionsToResult } from '../src/modules/builds/dynamicRules';
import { filterComplementaryAdditionalSkills } from '../src/lib/officialSkillIdentity';

class MemoryStorage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return Array.from(this.data.keys())[index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
}

(globalThis as unknown as { window: unknown }).window = {
  localStorage: new MemoryStorage(),
  dispatchEvent: () => true
};

const now = new Date('2026-08-01T12:00:00.000Z');
const basePack: ContinuousDynamicRulePackV3770 = {
  ...DEFAULT_DYNAMIC_RULE_PACK,
  schemaVersion: 3770,
  version: '37.70.1-teste',
  gameVersion: 'eFootball 2026',
  publishedAt: '2026-08-01T08:00:00.000Z',
  updatedAt: '2026-08-01T08:00:00.000Z',
  expiresAt: '2026-10-01T00:00:00.000Z',
  minimumAppVersion: '37.70.0',
  source: 'Pacote remoto de teste',
  releaseNotes: ['Novo catálogo de teste e regra por função.'],
  catalog: {
    version: '37.70.1-teste',
    updatedAt: '2026-08-01T08:00:00.000Z',
    additionalSkills: [{ name: 'Passe de ruptura premium', kind: 'additional', status: 'active', aliases: ['Rupture Pass'], mappedProfile: 'Passe em profundidade', introducedIn: 'eFootball 2026' }],
    specialSkills: [{ name: 'Visão total', kind: 'special', status: 'active', aliases: ['Total Vision'], introducedIn: 'eFootball 2026' }],
    boosters: [
      { name: 'Criador total', status: 'active', aliases: ['Total Creator'], attributes: ['Passe rasteiro', 'Passe alto'], positions: ['AMF', 'CMF'], introducedIn: 'eFootball 2026' },
      { name: 'Booster antigo', status: 'deprecated', aliases: [], attributes: ['Passe'], positions: ['AMF'] }
    ]
  },
  rules: [
    ...DEFAULT_DYNAMIC_RULE_PACK.rules,
    {
      id: 'amf-passe-remoto-v3770',
      title: 'AMF recebe habilidade do catálogo remoto',
      match: { position: 'AMF' },
      promoteSkills: ['Passe de ruptura premium'],
      promoteImpetos: ['Criador total'],
      blockImpetos: ['Booster antigo'],
      note: 'Regra remota validada pela v37.70.'
    }
  ]
};
const pack = { ...basePack, checksum: computeRulePackChecksumV3770(basePack) };
const analysis = buildContinuousRulesAnalysisV3770(null, pack, [], now);
assert.equal(analysis.engineVersion, CONTINUOUS_RULES_V3770_VERSION);
assert.equal(analysis.status, 'atual');
assert.ok(analysis.confidence >= 90);
assert.equal(analysis.catalog.effectiveAdditionalSkills, analysis.catalog.localAdditionalSkills + 1);
assert.equal(analysis.catalog.effectiveSpecialSkills, analysis.catalog.localSpecialSkills + 1);
assert.equal(analysis.catalog.effectiveBoosters, analysis.catalog.localBoosters + 1);
assert.equal(analysis.catalog.deprecatedItems, 1);
assert.ok(analysis.auditChecks.every((item) => item.passed));

const activation = activateContinuousRulePackV3770(pack);
assert.equal(activation.activated, true);
assert.equal(activation.analysis.history.length, 1);
const restored = restoreRulePackVersionV3770(pack.version);
assert.equal(restored?.activated, true);

const remoteSkills = filterComplementaryAdditionalSkills(['Passe de ruptura premium'], [], [], 5, []);
assert.deepEqual(remoteSkills, ['Passe de ruptura premium']);

const card = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Atualização Contínua
TIPO DA CARTA: Epic
POSIÇÃO PRINCIPAL: AMF
ESTILO DE JOGO: Armador criativo
NÍVEL MÁXIMO: 33
PONTOS TOTAIS: 64
HABILIDADES NATIVAS: Passe de primeira
Talento ofensivo: 88
Controle de bola: 92
Drible: 88
Condução firme: 91
Passe rasteiro: 92
Passe alto: 90
Finalização: 78
Velocidade: 82
Aceleração: 86
Equilíbrio: 88
Resistência: 84
[FIM AJUSTES]`;
const result = applyLocalCorrectionsToResult(analyzeCard(card, 'COMPETITIVE', 'AMF', 'v3770.png'));
assert.ok(result.recommendedSkills.includes('Passe de ruptura premium'), 'A habilidade remota ativa deve poder entrar no Top 5 via regra dinâmica.');
assert.ok(result.recommendedImpetos.some((item) => item.name === 'Criador total'), 'O Booster remoto deve ser aplicável pela regra dinâmica.');
assert.ok(!result.recommendedImpetos.some((item) => item.name === 'Booster antigo'), 'Booster depreciado deve permanecer bloqueado.');

const stalePack: ContinuousDynamicRulePackV3770 = {
  ...pack,
  checksum: undefined,
  version: '37.70.0-antigo',
  updatedAt: '2025-12-01T00:00:00.000Z',
  publishedAt: '2025-12-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:00:00.000Z'
};
const stale = buildContinuousRulesAnalysisV3770(null, stalePack, [], now);
assert.equal(stale.status, 'bloqueado');
assert.ok(stale.alerts.some((item) => item.code === 'PACK_EXPIRED'));

const badChecksum = buildContinuousRulesAnalysisV3770(null, { ...pack, checksum: 'fnv1a-incorreto' }, [], now);
assert.equal(badChecksum.status, 'bloqueado');
assert.ok(badChecksum.alerts.some((item) => item.code === 'CHECKSUM_MISMATCH'));

const engine = fs.readFileSync('src/lib/continuousRulesV3770.ts', 'utf8');
const catalog = fs.readFileSync('src/lib/remoteCatalogV3770.ts', 'utf8');
const panel = fs.readFileSync('src/components/ContinuousUpdateV3770Panel.tsx', 'utf8');
const workspace = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
assert.match(engine, /CONTINUOUS_RULES_V3770_VERSION = '37\.70\.0'/);
assert.match(engine, /RULE_PACK_HISTORY_V3770_KEY/);
assert.match(engine, /PACK_EXPIRED|CHECKSUM_MISMATCH|GAME_VERSION_MISMATCH/);
assert.match(catalog, /additionalSkills|specialSkills|boosters/);
assert.match(panel, /Atualização contínua v37\.70/);
assert.match(panel, /Histórico por versão/);
assert.match(panel, /Auditoria do pacote/);
assert.match(workspace, /Atualização v37\.70/);
assert.match(app, /activateContinuousRulePackV3770/);
assert.match(app, /restoreRulePackVersionV3770/);

console.log('v37.70 Atualização Contínua aprovada: pacote remoto, histórico por versão, catálogo dinâmico, alertas de desatualização, auditoria e confiança.');
