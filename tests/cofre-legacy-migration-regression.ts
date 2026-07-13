import assert from 'node:assert/strict';
import { analyzeCard } from '../src/lib/analyzer';
import { migrateAnalysisResult, normalizeSavedAnalysis } from '../src/components/CardVisionApp';

const raw = `NOME DO JOGADOR: Jogador Antigo\nPOSIÇÃO PRINCIPAL: DMF\nESTILO DE JOGO: O Destruidor\nPONTOS TOTAIS: 60\nTALENTO DEFENSIVO: 82\nDESARME: 84\nVELOCIDADE: 76\nCONTATO FÍSICO: 81`;
const current = analyzeCard(raw, 'COMPETITIVE', 'CB');
const legacy = { ...current } as any;
delete legacy.deepAnalysis;
delete legacy.advancedTacticalFunction;
delete legacy.specialSkillsAnalysis;
delete legacy.physicalEngine;
delete legacy.attributeGoals;
delete legacy.advancedOptimizer;
delete legacy.correctionLimit;
delete legacy.errorTolerance;
delete legacy.skillPriority;
delete legacy.marginalReturn;

const migrated = migrateAnalysisResult(legacy, raw, null);
assert.ok(migrated, 'ficha antiga deveria ser migrada');
assert.equal(migrated!.bestPosition.code, 'CB');
assert.ok(migrated!.deepAnalysis);
assert.ok(migrated!.skillPriority);
assert.ok(Array.isArray(migrated!.marginalReturn));

const saved = normalizeSavedAnalysis({
  id: 'old-1',
  rawText: raw,
  result: legacy,
  savedAt: '01/01/2026',
} as any, 0);
assert.ok(saved, 'entrada antiga do Cofre deveria ser preservada');
assert.equal(saved!.result.bestPosition.code, 'CB');
assert.ok(saved!.result.errorTolerance);
console.log('✓ migração de fichas antigas do Cofre aprovada');
