import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const analyzerPath = 'src/lib/analyzer.ts';
const evidencePath = 'src/modules/analysis/analyzerCardEvidenceR186.ts';
const skillPath = 'src/modules/analysis/analyzerSkillIntelligenceR186.ts';
const analyzer = read(analyzerPath);
const evidence = read(evidencePath);
const skills = read(skillPath);
const r119 = fs.readFileSync('src/lib/cleanSlatePerformance2027V4080R119.ts');
const closure = read('scripts/check-cardvision-static-closure-r185.mjs');
const pkg = JSON.parse(read('package.json'));

assert.ok(fs.statSync(analyzerPath).size <= 120_000, `R186: analyzer.ts voltou a ${fs.statSync(analyzerPath).size} bytes.`);
assert.ok(analyzer.split(/\r?\n/).length <= 1_400, 'R186: analyzer.ts voltou a concentrar mais de 1400 linhas.');
assert.match(analyzer, /analyzerCardEvidenceR186/);
assert.match(analyzer, /analyzerSkillIntelligenceR186/);
assert.doesNotMatch(analyzer, /export function parseCard\s*\(/, 'R186: parsing da carta voltou ao monólito.');
assert.doesNotMatch(analyzer, /function validateAnalysis\s*\(/, 'R186: validação de evidência voltou ao monólito.');
assert.doesNotMatch(analyzer, /function recommendAdditionalSkills\s*\(/, 'R186: Top 5 provisório voltou ao monólito.');
assert.doesNotMatch(analyzer, /function buildSkillRecommendations\s*\(/, 'R186: inteligência de skills voltou ao monólito.');
assert.match(analyzer, /export \{ parseCard \};/, 'R186: fachada pública de parseCard precisa ser preservada.');
assert.match(analyzer, /export function recommendImpetos\s*\(/, 'R186: contrato público histórico de recommendImpetos precisa continuar disponível.');

for (const marker of ['export function parseCard', 'export function buildAvoidPositions', 'export function buildPermittedPositions', 'export function validateAnalysis']) {
  assert.ok(evidence.includes(marker), `R186: fronteira de evidência sem ${marker}.`);
}
for (const marker of ['export function recommendAdditionalSkills', 'export function buildSkillRecommendations', 'export function recommendImpetos', 'export function uniqueSkillList']) {
  assert.ok(skills.includes(marker), `R186: fronteira de skills sem ${marker}.`);
}
for (const source of [evidence, skills]) {
  assert.ok(!source.includes('cleanSlatePerformance2027V4080R119'), 'R186: módulos auxiliares não podem importar/escrever a autoridade Clean Slate.');
  assert.ok(!source.includes('applyCleanSlatePerformance2027R119'), 'R186: módulos auxiliares não podem virar writer paralelo.');
}

const combinedBytes = fs.statSync(analyzerPath).size + fs.statSync(evidencePath).size + fs.statSync(skillPath).size;
assert.ok(combinedBytes <= 182_293, `R186: overhead estrutural excedeu 1 KiB sobre o analyzer R185 (${combinedBytes} bytes).`);
assert.equal(crypto.createHash('sha256').update(r119).digest('hex'), '765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96', 'R186: R119 foi alterado durante modularização do analyzer.');
assert.ok(String(pkg.scripts?.['test:v4080'] ?? '').includes('npm run test:r186'), 'R186: cadeia v40.80 precisa preservar o gate R186.');
assert.ok(String(pkg.scripts?.['test:all'] ?? '').endsWith('npm run test:v4080'), 'R186: test:all deve continuar fechando pela bateria v40.80.');
assert.match(closure, /MAX_SOURCE_BYTES_R185 = 2_445_000/, 'R186: orçamento estático em bytes não pode ser relaxado.');
assert.match(closure, /hasR186AnalyzerBoundaries \? 182 : 180/, 'R186: aumento de módulos deve ser estritamente condicionado às duas fronteiras R186.');

console.log(`R186 boundary aprovada: analyzer=${fs.statSync(analyzerPath).size} B, evidência=${fs.statSync(evidencePath).size} B, skills=${fs.statSync(skillPath).size} B, R119 intacto.`);
