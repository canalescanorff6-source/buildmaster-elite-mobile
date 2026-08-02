const { analyzeCard } = require('../src/lib/analyzer.ts');
const { applyCompleteCardIntelligence } = require('../src/lib/cardIntelligencePipeline.ts');
function card(owned='', formation='4-2-2-2', managerProficiency=90){
 const text=`[AJUSTES MANUAIS]\nCONFIRMAÇÃO MANUAL: SIM\nNOME DO JOGADOR: Cache Test CF\nTIPO DE CARTA: Épico\nPOSIÇÃO PRINCIPAL: CF\nESTILO DE JOGO: Artilheiro\nPONTOS TOTAIS: 64\nHABILIDADES JÁ POSSUI: ${owned}\nTalento ofensivo: 92\nControle de bola: 86\nDrible: 82\nCondução firme: 80\nPasse rasteiro: 74\nPasse alto: 70\nFinalização: 94\nCabeçada: 82\nCurva: 78\nVelocidade: 88\nAceleração: 90\nForça do chute: 92\nSalto: 83\nContato físico: 82\nEquilíbrio: 84\nResistência: 85\n[FIM AJUSTES]`;
 const tactical={formation,style:'CONTRA_ATAQUE_RAPIDO',managerId:'m',managerName:'M',managerProficiency,managerBooster:'duplo'};
 const t=Date.now(); const out=applyCompleteCardIntelligence(analyzeCard(text,'COMPETITIVE','CF','cache.png',tactical));
 console.log('time',Date.now()-t,'formation',formation,'prof',managerProficiency,'owned',owned,'training',out.training,'skills',out.recommendedSkills,'impeto',out.recommendedImpetos.slice(0,2).map(x=>x.name));
 return out;
}
const a=card('');
const b=card(a.recommendedSkills[0]);
console.log('duplicate after owned?',b.recommendedSkills.includes(a.recommendedSkills[0]), 'parsed owned',b.parsed.nativeSkills);
const c=card('', '5-3-2', 90);
const d=card('', '4-2-2-2', 70);
console.log('formation diff',JSON.stringify(a.training)!==JSON.stringify(c.training));
console.log('manager diff',JSON.stringify(a.training)!==JSON.stringify(d.training));
