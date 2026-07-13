import { buildAdvancedCalibration, signatureForResult } from '../src/lib/advancedCalibration';
import { analyzeCard } from '../src/lib/analyzer';

const result = analyzeCard('Nome: Teste\nPosição: VOL\nEstilo: O Destruidor\nPontos: 40\nTalento defensivo: 80\nDesarme: 82\nVelocidade: 75\nResistência: 78', 'COMPETITIVE', 'CB', null, { formation:'4-2-3-1', style:'CONTRA_ATAQUE_RAPIDO', managerId:'teste', managerName:'Técnico Teste', managerProficiency:88, managerBooster:'duplo' });
const sig = signatureForResult(result);
const feedbacks = [
  { rating:6, missedPasses:true, tiredEarly:true, buildSignature:sig, managerId:'teste', managerName:'Técnico Teste', formation:'4-2-3-1', predictedScore:80 },
  { rating:7, missedPasses:true, buildSignature:sig, managerId:'teste', managerName:'Técnico Teste', formation:'4-2-3-1', predictedScore:80 },
  { rating:8, workedWell:true, buildSignature:sig, managerId:'teste', managerName:'Técnico Teste', formation:'4-2-3-1', predictedScore:80 }
];
const report = buildAdvancedCalibration(result, feedbacks);
if (report.byBuild.sampleCount !== 3) throw new Error('Feedback por ficha inválido');
if (report.byManager.sampleCount !== 3) throw new Error('Feedback por técnico inválido');
if (report.byFormation.sampleCount !== 3) throw new Error('Feedback por formação inválido');
if (report.prediction.actual !== 70) throw new Error('Previsão versus realidade inválida');
if (!report.preference.priorities.some(i => i.key === 'passing')) throw new Error('Preferência pessoal não detectou passe');
console.log('Lote 12 aprovado');
