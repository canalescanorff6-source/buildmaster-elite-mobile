
export const MANAGERS_V600_R11_VERSION = '40.80-r11-managers-live' as const;
export type V600ManagerSource = 'OFICIAL_KONAMI'|'COMUNIDADE_VERIFICADA'|'OCR_OBSERVADO';
export type V600ManagerRecordR11 = {
  id:string; name:string; released?:string; source:V600ManagerSource;
  proficiencies:{ possession:number; quickCounter:number; longBallCounter:number; outWide:number; longBall:number; overload?:number };
  boosters:string[]; linkUps:{name:string; centerpiece:string; centerpiecePosition:string; keyman:string; keymanPosition:string}[];
};
export const MANAGERS_V600_R11: readonly V600ManagerRecordR11[] = [
  {id:'r-martinez-2026-06-04',name:'Roberto Martínez',released:'2026-06-04',source:'COMUNIDADE_VERIFICADA',proficiencies:{possession:58,quickCounter:90,longBallCounter:70,outWide:64,longBall:89},boosters:['Finalização +1','Talento ofensivo +1'],linkUps:[{name:'Passe Longo Diagonal B',centerpiece:'Armador criativo',centerpiecePosition:'PE/PD',keyman:'Lateral ofensivo',keymanPosition:'LE/LD'}]},
  {id:'tuchel-2026-06-04',name:'Thomas Tuchel',released:'2026-06-04',source:'COMUNIDADE_VERIFICADA',proficiencies:{possession:90,quickCounter:89,longBallCounter:59,outWide:70,longBall:58},boosters:['Passe rasteiro +1','Resistência +1'],linkUps:[{name:'Passe por cima A',centerpiece:'Orquestrador',centerpiecePosition:'VOL',keyman:'Artilheiro',keymanPosition:'CA'}]},
  {id:'deschamps-2026-06-11',name:'Didier Deschamps',released:'2026-06-11',source:'COMUNIDADE_VERIFICADA',proficiencies:{possession:89,quickCounter:68,longBallCounter:89,outWide:59,longBall:63},boosters:['Velocidade +1','Controle de bola +1'],linkUps:[{name:'Passe de ruptura A',centerpiece:'Armador criativo',centerpiecePosition:'MAT',keyman:'Artilheiro',keymanPosition:'CA'}]},
  {id:'montella-2026-06-11',name:'Vincenzo Montella',released:'2026-06-11',source:'COMUNIDADE_VERIFICADA',proficiencies:{possession:61,quickCounter:89,longBallCounter:58,outWide:89,longBall:68},boosters:['Aceleração +1','Posse de bola +1'],linkUps:[{name:'Passe de ruptura B',centerpiece:'Meia versátil',centerpiecePosition:'MLG',keyman:'Artilheiro',keymanPosition:'CA'}]},
  {id:'koeman-2026-06-11',name:'Ronald Koeman',released:'2026-06-11',source:'COMUNIDADE_VERIFICADA',proficiencies:{possession:60,quickCounter:65,longBallCounter:89,outWide:89,longBall:69},boosters:['Força do chute +1','Salto +1'],linkUps:[{name:'Passe por cima B',centerpiece:'Orquestrador',centerpiecePosition:'MLG',keyman:'Ala produtivo',keymanPosition:'PE/PD'}]},
  {id:'nagelsmann-2026-06-11',name:'Julian Nagelsmann',released:'2026-06-11',source:'COMUNIDADE_VERIFICADA',proficiencies:{possession:62,quickCounter:68,longBallCounter:89,outWide:59,longBall:89},boosters:['Drible +1','Contato físico +1'],linkUps:[{name:'Passe por cima C',centerpiece:'Defensor criativo',centerpiecePosition:'ZAG',keyman:'Ala produtivo',keymanPosition:'PE/PD'}]},
  {id:'cruyff-2026-04-23',name:'Johan Cruyff',released:'2026-04-23',source:'COMUNIDADE_VERIFICADA',proficiencies:{possession:89,quickCounter:65,longBallCounter:54,outWide:89,longBall:54},boosters:['Aceleração +1','Equilíbrio +1'],linkUps:[{name:'Um-dois por dentro A',centerpiece:'Armador criativo',centerpiecePosition:'ME/MD',keyman:'Homem de área',keymanPosition:'CA'}]}
] as const;
export function normalizeManagerNameR11(v:string){return v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
export function findManagerV600R11(name:string|null|undefined){const k=normalizeManagerNameR11(String(name??''));return MANAGERS_V600_R11.find(m=>normalizeManagerNameR11(m.name)===k)??null}
