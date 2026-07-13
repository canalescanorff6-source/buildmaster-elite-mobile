import assert from 'node:assert/strict';
import { analyzeCard, type TacticalFormation, type TacticalStyle } from '../src/lib/analyzer';
import { buildAdvancedOpponentReport } from '../src/lib/opponentAdvanced';
import type { OpponentProfile, OpponentStrength } from '../src/lib/opponentAnalysis';

const positions = ['GK','CB','CB','LB','RB','DMF','CMF','AMF','LWF','RWF','CF'] as const;
const players = positions.map((position, index) => {
  const result = analyzeCard(`Jogador ${index+1}\nPosição ${position}\nEstilo O Destruidor\nOverall 90\nPontos de progressão 60\nVelocidade ${75+index}\nAceleração ${74+index}\nPasse rasteiro ${76+index}\nFinalização ${70+index}\nConsciência defensiva ${78+index}\nContato físico ${77+index}\nResistência ${80+index}\nCONFIRMACAO MANUAL: SIM`, 'COMPETITIVE', position, `j${index+1}.png`, { formation: '4-3-3', style: 'POSSE_DE_BOLA' });
  result.parsed.playerName = `Jogador ${index+1}`;
  result.parsed.internalId = `jogador-${index+1}`;
  return result;
});

const profiles: OpponentProfile[] = ['POSSE','CONTRA_RAPIDO','CONTRA_LONGO','POR_FORA','PRESSAO_ALTA','BLOCO_BAIXO','BOLA_AEREA'];
const strengths: OpponentStrength[] = ['VELOCIDADE','PASSE','FISICO','DRIBLE','FINALIZACAO','CRUZAMENTO','PRESSAO'];
for (const profile of profiles) {
  const report = buildAdvancedOpponentReport(players, '4-3-3' as TacticalFormation, 'POSSE_DE_BOLA' as TacticalStyle, { profile, formation: '4-2-3-1', strength: strengths[profiles.indexOf(profile)] });
  assert.ok(report, `relatório ausente para ${profile}`);
  assert.equal(report!.sectorComparisons.length, 3);
  assert.ok(report!.duels.length >= 4);
  assert.ok(report!.threats.length >= 4);
  assert.ok(report!.weaknesses.length >= 3);
  assert.ok(report!.sectorComparisons.every((item) => item.advantage >= 0 && item.advantage <= 100));
  assert.ok(report!.duels.every((item) => item.duelScore >= 0 && item.duelScore <= 100));
  assert.ok(report!.threats.every((item) => item.level >= 0 && item.level <= 100));
  assert.ok(report!.weaknesses.every((item) => item.opportunity >= 0 && item.opportunity <= 100));
  assert.ok(report!.locks.some((item) => item.includes('automaticamente')));
}
console.log('Lote 11 aprovado: comparação de setores, duelos, ameaças e fraquezas.');
