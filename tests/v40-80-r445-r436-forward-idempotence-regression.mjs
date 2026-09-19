import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyR436MasterRosterCatalog } from '../scripts/apply-r436-master-roster-catalog.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-r445-r436-'));
const write = (relative, content='') => {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
};

write('src/modules/squad-mapping/squadMappingEngine.ts', `
import { cardIdentityFingerprintR126, playerIdentityKeyFromNameR126 } from '@/lib/cardIdentityFingerprintR126';
import { shouldMergeMasterRosterCardsR436 } from './masterRosterCatalogR436';
type X = {
  playstyle: string;
  offensivePlaystyle?: string | null;
  defensivePlaystyle?: string | null;
  trainingPointsTotal?: number | null;
  overall: number | null;
};
function x(existing,incoming){
  const duplicate = existing.find((player) => shouldMergeMasterRosterCardsR436(player, incoming));
  return duplicate;
}
`);

write('src/modules/squad-mapping/squadMappingStorage.ts', `
const player = {
    playstyle: String(raw.playstyle ?? '').trim().slice(0, 80),
    offensivePlaystyle: raw.offensivePlaystyle ? String(raw.offensivePlaystyle).trim().slice(0, 80) : null,
    defensivePlaystyle: raw.defensivePlaystyle ? String(raw.defensivePlaystyle).trim().slice(0, 80) : null,
    trainingPointsTotal: finiteNumber(raw.trainingPointsTotal, 20, 140),
    overall: finiteNumber(raw.overall, 1, 120),
};
`);

write('src/modules/squad-mapping/SquadMappingCenter.tsx', `
import { findBestHistoryLinkR127 } from './squadMappingHistoryLinkR127';
import { masterRosterCardReadinessR436, masterRosterSearchTextR436 } from './masterRosterCatalogR436';
type Props = {
  history: Array<{ id: string; result: AnalysisResult }>;
  onOpenFicha?: (historyId: string) => void;
  onGenerateFicha?: (player: SquadMappingPlayer) => void;
  onGenerateMasterCard?: (card: MasterCardCatalogEntryR438) => void;
  onRereadOriginal?: (sourceHash: string) => void;
};
export function SquadMappingCenter({ history, onOpenFicha, onGenerateFicha, onGenerateMasterCard, onRereadOriginal }: Props) {
  const editingReadiness = masterRosterCardReadinessR436(editingPlayer);
  const selected = Array.from(files);
  const filtered = masterRosterSearchTextR436(editingPlayer);
  const incoming = {
      playstyle,
      offensivePlaystyle: detailed.identity.offensivePlaystyle?.value?.trim() || parsed?.offensivePlaystyle || parsed?.playstyle || playstyle || null,
      defensivePlaystyle: detailed.identity.defensivePlaystyle?.value?.trim() || parsed?.defensivePlaystyle || null,
      trainingPointsTotal: typeof parsed?.trainingPointsTotal === 'number' ? parsed.trainingPointsTotal : null,
      overall,
  };
  return <>{onGenerateFicha && <button type="button">Gerar ficha sem OCR</button>}{onGenerateMasterCard && <button>Gerar ficha</button>}{onRereadOriginal && <button>Refazer ficha com este print</button>}</>;
}
`);

write('src/components/CardVisionApp.tsx', `
import type { CardCropResult } from '@/modules/card-reader/cardArtCrop';
import type { SquadMappingPlayer } from '@/modules/squad-mapping/squadMappingEngine';
async function generateFichaFromMasterRosterR436(player: SquadMappingPlayer) { openMainSection('resultado'); }
const x = <SquadMappingCenter
  onOpenFicha={(historyId) => openIntegratedPlayer(historyId, 'result')}
  onGenerateFicha={(player) => void generateFichaFromMasterRosterR436(player)}
  onGenerateMasterCard={(card) => void generateFichaFromMasterCardR438(card)}
  onRereadOriginal={(sourceHash) => void rereadOriginalPrintR441(sourceHash)}
/>;
`);

write('src/lib/appNavigationR127.ts', `
const x = [
    { id: 'mapeamento', label: 'Meu Elenco', hint: 'Banco mestre, fichas e formações', icon: 'team' },
];
`);
write('src/modules/squad-mapping/masterRosterCatalogR436.ts', 'export const x=1;');
write('tests/v40-80-r436-master-roster-catalog-runtime-regression.ts', '');
write('tests/v40-80-r436-master-roster-catalog-integration-regression.mjs', '');
write('tests/v40-80-r445-r436-forward-idempotence-regression.mjs', '');
write('package.json', JSON.stringify({ scripts: { 'test:r200': 'echo base' } }, null, 2));

const first = applyR436MasterRosterCatalog(root);
assert.equal(first.changed, true, 'primeira passagem pode apenas registrar a regressão R445 no test:r200');
const centerAfterFirst = fs.readFileSync(path.join(root,'src/modules/squad-mapping/SquadMappingCenter.tsx'),'utf8');
assert.match(centerAfterFirst, /onGenerateMasterCard/);
assert.match(centerAfterFirst, /onRereadOriginal/);

const second = applyR436MasterRosterCatalog(root);
assert.equal(second.changed, false, 'segunda passagem precisa ser totalmente idempotente');
const centerAfterSecond = fs.readFileSync(path.join(root,'src/modules/squad-mapping/SquadMappingCenter.tsx'),'utf8');
assert.equal(centerAfterSecond, centerAfterFirst, 'R436 não pode rebaixar Props/assinatura evoluídos');

const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert.match(pkg.scripts['test:r200'], /v40-80-r445-r436-forward-idempotence-regression\.mjs/);
console.log('R445 aprovada: R436 roda duas vezes sobre árvore R442 sem rebaixar Props/wiring nem falhar na segunda passagem.');
