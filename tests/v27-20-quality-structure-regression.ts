import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeCard } from '../src/lib/analyzer';
import { buildBuildQualityGate } from '../src/lib/buildQualityGate';

const valid = analyzeCard(`
[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Maldini
POSIÇÃO PRINCIPAL: CB
ESTILO DE JOGO: Defensor criativo
NÍVEL MÁXIMO: 31
PONTOS TOTAIS: 60
Talento defensivo: 92
Dedicação defensiva: 91
Desarme: 92
Agressividade: 86
Passe rasteiro: 82
Passe alto: 84
Velocidade: 79
Aceleração: 76
Contato físico: 88
Salto: 86
Cabeçada: 85
Resistência: 84
HABILIDADES JÁ POSSUI: Interceptação, Bloqueador
[FIM AJUSTES]
`, 'DEFENSIVE', 'CB');

const validReport = buildBuildQualityGate(valid);
assert.equal(validReport.blockers.length, 0, validReport.blockers.map((item) => item.detail).join(' | '));
assert.ok(validReport.score >= 70, `nota final inesperada: ${validReport.score}`);
assert.ok(validReport.signals.some((item) => item.id === 'budget-ok'));
assert.ok(validReport.signals.some((item) => item.id === 'skills-ok' || item.id === 'skills-empty'));
assert.equal(validReport.readyToSave, true);

const overBudget = structuredClone(valid);
overBudget.trainingPointsUsed = overBudget.trainingPointsTotal + 4;
overBudget.trainingPointsRemaining = -4;
const blockedReport = buildBuildQualityGate(overBudget);
assert.equal(blockedReport.status, 'blocked');
assert.equal(blockedReport.readyToSave, false);
assert.ok(blockedReport.blockers.some((item) => item.id === 'budget-overflow'));

const duplicateSkill = structuredClone(valid);
duplicateSkill.recommendedSkills = [valid.parsed.nativeSkills[0] || 'Interceptação'];
const duplicateReport = buildBuildQualityGate(duplicateSkill);
assert.ok(duplicateReport.warnings.some((item) => item.id === 'skills-review'));

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'src/components/CardVisionApp.tsx'), 'utf8');
const qualityPanel = fs.readFileSync(path.join(root, 'src/components/BuildQualityGatePanel.tsx'), 'utf8');
const commandPalette = fs.readFileSync(path.join(root, 'src/components/AppCommandPalette.tsx'), 'utf8');
const design = fs.readFileSync(path.join(root, 'src/app/design-system-v2720.css'), 'utf8');
const globals = fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { version: string; scripts: Record<string, string> };

assert.equal(pkg.version, '27.35.0');
assert.match(source, /buildBuildQualityGate\(result\)/);
assert.match(source, /Ficha salva como/);
assert.match(source, /performance-\$\{performanceMode\}/);
assert.match(source, /setCommandPaletteOpen/);
assert.match(source, /700_000/);
assert.match(source, /window\.setTimeout\(\(\) => \{/);
assert.match(qualityPanel, /Controle final da ficha/);
assert.match(commandPalette, /Buscar no BuildMaster/);
assert.match(commandPalette, /ArrowDown/);
assert.match(design, /performance-economy/);
assert.match(design, /build-quality-gate/);
assert.match(design, /command-palette-dialog/);
assert.match(globals, /design-system-v2720\.css/);

console.log('✓ v27.29: controle final da ficha, busca global, rascunho otimizado e modo econômico aprovados.');
