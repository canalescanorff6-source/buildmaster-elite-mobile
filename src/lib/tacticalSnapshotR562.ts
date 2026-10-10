import type { TacticalStyle } from './analyzerDomain';
import type { ManagerRecord } from './managers';
import type { TeamDiagnosis, IntegratedPlayerRecord } from '../modules/core/centralIntelligence';
import { evaluateManagerLinksR560, type SquadMemberR560 } from './managerLinkEngineR560';
import { buildCardSlotsViewR561, buildManagerAttributeViewR561 } from './cardVisualEvidenceR561';
import { cardIdentityFingerprintR126 } from './cardIdentityFingerprintR126';

export type TacticalSnapshotInputR562 = {
  team: TeamDiagnosis;
  teamStyle: TacticalStyle;
  selectedManager: ManagerRecord | null;
  players: readonly IntegratedPlayerRecord[];
  lineupConfirmed: boolean;
};
/** Sanitize screenshots and user-provided names: they are untrusted data, not instructions. */
const text = (v:unknown,limit=90) => String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,limit)||'PENDENTE';
const number = (v:unknown) => typeof v==='number'&&Number.isFinite(v)&&v>=0?String(v):'PENDENTE';
export function buildTacticalSnapshotR562(input:TacticalSnapshotInputR562):string {
  const {team,teamStyle,selectedManager:manager,players,lineupConfirmed}=input;
  const squad: SquadMemberR560[]=team.lineup.filter(fit=>fit.player).map(fit=>({
    playerName:fit.player!.parsed.playerName,
    position:fit.slot.position,
    playstyle:fit.player!.parsed.offensivePlaystyle||fit.player!.parsed.playstyle||null,
    fingerprint:cardIdentityFingerprintR126(fit.player!.parsed)
  }));
  const unique=new Set(squad.map(x=>x.fingerprint));
  const fullConfirmed=lineupConfirmed&&team.totalSlots===11&&team.filledSlots===11&&squad.length===11&&
    unique.size===11&&squad.every(x=>x.playerName?.trim()&&x.playstyle?.trim()&&x.fingerprint?.trim());
  const links=evaluateManagerLinksR560(manager,squad,Boolean(fullConfirmed));
  const lines=[
    'BUILDMASTER | SNAPSHOT TÁTICO R562 | LOCAL, SEM API PAGA',
    'Formação: '+text(team.formation)+' | Estilo: '+text(teamStyle),
    'Técnico: '+(manager?text(manager.name)+' — '+text(manager.version):'PENDENTE — não selecionado'),
    'Escalação: '+(fullConfirmed?'CONFIRMADA NO APP':'PENDENTE DE CONFIRMAÇÃO')+' | '+team.filledSlots+'/'+team.totalSlots,
    'Bônus de técnico: '+(manager?.attributeBoostsR560?Object.entries(manager.attributeBoostsR560).map(([k,v])=>k+' +'+v+' (regra; NÃO somar ao print)').join(', '):'PENDENTE — sem bônus verificado'),
    'Vínculos: '+(links.length?links.map(l=>text(l.name)+': '+l.status+
      (l.missing.length?' | Falta: '+l.missing.map(x=>text(x)).join(', '):'')).join('; '):'PENDENTE — sem vínculos cadastrados'),
    'TITULARES — posições efetivamente escaladas:',
  ];
  for(let i=0;i<team.lineup.length;i++){
    const fit=team.lineup[i],card=fit.player?.parsed;
    if(!fit.player||!card){lines.push((i+1)+'. '+text(fit.slot.label)+' | PENDENTE — sem carta escalada');continue;}
    const fingerprint=cardIdentityFingerprintR126(card);
    // Never associate different editions solely by player name.
    const records=players.filter(p=>p.fingerprint===fingerprint);
    const record=records.length===1?records[0]:null;
    const slots=buildCardSlotsViewR561(card);
    const pending:string[]=[];
    if(!fullConfirmed)pending.push('escalação não confirmada');
    if(!record||record.status!=='completo')pending.push('carta do Cofre não confirmada');
    if(fit.player.validation?.confirmed!==true)pending.push('validação geral PENDENTE');
    if(card.evidence?.attributeCount!==26)pending.push('26 atributos não confirmados');
    if(card.evidence?.criticalStateR419&&card.evidence.criticalStateR419!=='TRUSTED')pending.push('OCR com evidência incerta');
    if(slots.recorded||slots.pending)pending.push('habilidades/ímpetos sem confirmação de slot');
    const label=slots.skills.map(s=>text(s.value)+' ['+s.status+']').join('; ');
    const boosts=slots.boosters.map(s=>text(s.value)+' ['+s.status+']').join('; ');
    const attr=Object.entries(card.attributes??{}).filter(([,v])=>typeof v==='number'&&Number.isFinite(v))
      .map(([k,v])=>k+'='+v).join(', ')||'PENDENTE';
    const plan=Object.entries(fit.player.training??{}).filter(([,v])=>typeof v==='number'&&v>0)
      .map(([k,v])=>k+'='+v).join(', ')||'PENDENTE';
    const proj=buildManagerAttributeViewR561(fit.player,manager);
    const projection=proj?proj.rows.map(r=>r.key+' '+(r.status==='APLICADO'
      ?r.base+' +'+r.bonus+' = '+r.projected+' (PROJEÇÃO)'
      :'PENDENTE — bônus não somado ao print')).join('; '):'PENDENTE / sem regra de técnico';
    lines.push((i+1)+'. '+text(fit.slot.label)+' | '+text(card.playerName)+' | '+text(card.cardType)+
      ' | '+(pending.length?'PENDENTE':'CONFIRMADO'));
    lines.push('   Estilo ofensivo: '+text(card.offensivePlaystyle||card.playstyle)+
      ' | Defensivo: '+text(card.defensivePlaystyle)+' | Nível: '+number(card.level)+
      ' | GER: '+number(card.overall));
    lines.push('   Progressão lida: '+number(card.trainingPointsUsed)+'/'+number(card.trainingPointsTotal)+
      ' | Ficha SUGERIDA (não aplicada): '+plan);
    lines.push('   Atributos CAPTURADOS (podem conter bônus): '+attr);
    lines.push('   Técnico: '+projection);
    lines.push('   Habilidades adicionais [5]: '+label);
    lines.push('   Ímpetos [2]: '+boosts);
    if(pending.length)lines.push('   PENDÊNCIAS: '+pending.join('; '));
  }
  lines.push('REGRAS: não inventar cartas, habilidades, ímpetos nem valores. REGISTRADO não significa CONFIRMADO. A ficha é sugestão, não treino aplicado. Projeção de técnico nunca soma bônus sobre valores OCR.');
  lines.push('Sem imagens, senhas, tokens nem chamada automática de API.');
  return lines.join('\n');
}
