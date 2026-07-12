import { analyzeCard, OFFICIAL_ADDITIONAL_SKILL_NAMES, PLAYSTYLE_OPTIONS } from '../src/lib/analyzer';

const text = `NOME: Teste Oficial\nPOSIÇÃO PRINCIPAL: VOL\nESTILO DE JOGO: O destruidor\nPONTOS TOTAIS: 60\nHABILIDADES JÁ POSSUI: Interceptação, Bloqueador, Passe de primeira\nCONFIRMAÇÃO MANUAL: SIM`;
const positions = ['CF','SS','LWF','RWF','LMF','RMF','AMF','CMF','DMF','CB','LB','RB','GK'] as const;
for (const position of positions) {
  const result = analyzeCard(text, 'COMPETITIVE', position);
  if (result.bestPosition.code !== position) throw new Error(`Posição foi alterada: ${position}`);
  const style = result.advancedTacticalFunction.officialPlaystyle;
  if (style && !PLAYSTYLE_OPTIONS.includes(style as any)) throw new Error(`Estilo inventado: ${style}`);
  const names = [...result.specialSkillsAnalysis.ownedOfficial, ...result.specialSkillsAnalysis.missingRecommended.map(i=>i.name), ...result.specialSkillsAnalysis.redundant.map(i=>i.name)];
  for (const name of names) if (!OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(name as any)) throw new Error(`Habilidade inventada: ${name}`);
  if (!result.specialSkillsAnalysis.officialCatalogOnly) throw new Error('Catálogo oficial falhou');
}
console.log(`Lote 1 aprovado: ${positions.length} posições, estilos e habilidades somente dos catálogos oficiais.`);
