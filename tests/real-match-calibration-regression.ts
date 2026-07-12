import assert from 'node:assert/strict';
import { buildCalibrationReport } from '../src/lib/realMatchCalibration';
import type { AnalysisResult } from '../src/lib/analyzer';
const result = { bestPosition: { code: 'CB', label: 'ZAG', score: 90 }, parsed: { internalId: 'x' } } as AnalysisResult;
const report = buildCalibrationReport(result, [
  { feltSlow: true, missedPasses: true, rating: 5 },
  { feltSlow: true, missedPasses: true, defendedWell: true, rating: 6 },
  { defendedWell: true, feltSlow: true, missedPasses: true, rating: 7 }
]);
assert.equal(report.sampleCount, 3);
assert.equal(report.confidence, 'moderada');
assert(report.corrections.some((x) => x.trainingGroups.includes('lowerBodyStrength')));
assert(report.corrections.some((x) => x.trainingGroups.includes('passing')));
assert(report.positives.some((x) => x.includes('defensiva')));
assert(report.safeguards.some((x) => x.includes('nunca altera')));
console.log('v24.64 calibration regression passed');
