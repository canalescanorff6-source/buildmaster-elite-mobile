import type { AttributeKey, Attributes, PositionCode } from './analyzerDomain';
import type { ManagerRecord, ManagerLinkParticipantR560 } from './managers';

/** R560: link status is always PENDENTE before user confirms the exact XI. */
export type SquadMemberR560 = { playerName: string; position: PositionCode; playstyle: string | null; fingerprint?: string | null };
export type LinkStatusR560 = 'ATIVO' | 'INATIVO' | 'PENDENTE';
export type ManagerLinkEvaluationR560 = { id: string; name: string; status: LinkStatusR560; missing: string[]; centerpiecePlayer: string | null; keymanPlayer: string | null };
const normalize = (s: string | null | undefined) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const aliases: Record<string, string> = {
 'orchestrator':'orquestrador','creative playmaker':'armador criativo',
 'goal poacher':'artilheiro','armador criativo':'armador criativo',
 'orquestrador':'orquestrador','artilheiro':'artilheiro',
};
function style(s: string | null) { const k = normalize(s); return aliases[k] ?? k; }
export function evaluateManagerLinksR560(manager: ManagerRecord | null | undefined, squad: readonly SquadMemberR560[], confirmed: boolean): ManagerLinkEvaluationR560[] {
  const xi = confirmed && squad.length === 11 && squad.every(x => x.playerName.trim() && x.fingerprint && x.playstyle);
  return (manager?.linkUpsR560 ?? []).map(rule => {
    const find = (item: ManagerLinkParticipantR560) =>
      squad.find(x => x.position === item.position && style(x.playstyle) === style(item.playstyle) && !!style(x.playstyle));
    const a=find(rule.centerpiece), b=find(rule.keyman);
    const missing = [
      ...(!a ? [rule.centerpiece.playstyle + ' em ' + rule.centerpiece.position] : []),
      ...(!b ? [rule.keyman.playstyle + ' em ' + rule.keyman.position] : []),
    ];
    return {id:rule.id,name:rule.name,status:!xi?'PENDENTE':a&&b&&a!==b?'ATIVO':'INATIVO',
      missing, centerpiecePlayer:a?.playerName??null,keymanPlayer:b?.playerName??null};
  });
}
/** Never add manager bonuses to OCR stats; use only independent pre-manager bases. */
export function projectManagerAttributesR560(
 attributes: Attributes, manager: ManagerRecord | null | undefined,
 source: 'BASE_SEM_BONUS_TECNICO' | 'PRINT_JA_COM_BONUS' | 'INDETERMINADO'
): {attributes: Attributes; status:'APLICADO'|'SEM_BONUS'|'NAO_APLICADO'; reason:string} {
 const output = {...attributes};
 if(source!=='BASE_SEM_BONUS_TECNICO')return {attributes:output,status:'NAO_APLICADO',reason:'Base não comprovada: bônus não somado ao print.'};
 if(!manager?.attributeBoostsR560)return {attributes:output,status:'SEM_BONUS',reason:'Técnico sem bônus cadastrado.'};
 let count=0;
 for(const [key,value] of Object.entries(manager.attributeBoostsR560) as [AttributeKey, number][]) {
   if(typeof output[key]==='number'&&Number.isFinite(output[key])&&Number.isFinite(value)){
     output[key]=output[key]!+value;count++;
   }
 }
 return {attributes:output,status:count?'APLICADO':'NAO_APLICADO',reason:count?'Projeção independente, sem salvar na carta.':'Atributos de base indisponíveis.'};
}
