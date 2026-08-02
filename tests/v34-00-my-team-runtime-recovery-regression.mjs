import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const team = fs.readFileSync('src/modules/squad/TeamFullMapPanel.tsx', 'utf8');

assert.match(app, /SectionErrorBoundary area="meu-time-completo"/);
assert.match(app, /teamAdvancedOpen && \(/);
assert.match(app, /SectionErrorBoundary area="meu-time-avancado"/);
assert.match(team, /function safeSavedHistory\(/);
assert.match(team, /isRenderableAnalysisResult\(item\.result\)/);
assert.match(team, /function safeTeamReport<T>/);
assert.match(team, /const validResults = useMemo/);
assert.doesNotMatch(team, /history\.map\(\(item\) => item\.result\)/);

console.log('v34.00 Meu Time protegido: histórico antigo filtrado, relatórios isolados e painel avançado carregado sob demanda.');
