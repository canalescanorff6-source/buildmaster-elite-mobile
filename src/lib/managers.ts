import type { TacticalStyle } from './analyzer';

export type ManagerTier = 'LENDARIO_EPICO' | 'PACOTE_SELECAO' | 'GP';
export type ManagerRecord = {
  id: string;
  name: string;
  version: string;
  tier: ManagerTier;
  primaryStyle: TacticalStyle;
  primaryProficiency: number;
  secondaryStyle?: TacticalStyle;
  secondaryProficiency?: number;
  booster: 'duplo' | 'especial' | 'padrao';
  sourceStatus: 'informado_usuario';
};

export const MANAGERS: ManagerRecord[] = [
  { id:'capello-lbc-89', name:'Fabio Capello', version:'Lendário/Épico', tier:'LENDARIO_EPICO', primaryStyle:'CONTRA_ATAQUE', primaryProficiency:89, booster:'duplo', sourceStatus:'informado_usuario' },
  { id:'cruyff-posse-89', name:'Johan Cruyff', version:'Lendário/Épico', tier:'LENDARIO_EPICO', primaryStyle:'POSSE_DE_BOLA', primaryProficiency:89, booster:'duplo', sourceStatus:'informado_usuario' },
  { id:'beckenbauer-lbc-88', name:'Franz Beckenbauer', version:'Lendário/Épico', tier:'LENDARIO_EPICO', primaryStyle:'CONTRA_ATAQUE', primaryProficiency:88, booster:'duplo', sourceStatus:'informado_usuario' },
  { id:'rijkaard-qc-88', name:'Frank Rijkaard', version:'Lendário/Épico', tier:'LENDARIO_EPICO', primaryStyle:'CONTRA_ATAQUE_RAPIDO', primaryProficiency:88, booster:'duplo', sourceStatus:'informado_usuario' },
  { id:'chivu-qc-88', name:'Cristian Chivu', version:'Lendário/Épico', tier:'LENDARIO_EPICO', primaryStyle:'CONTRA_ATAQUE_RAPIDO', primaryProficiency:88, booster:'duplo', sourceStatus:'informado_usuario' },
  { id:'martinez-qc-90', name:'Roberto Martínez', version:'Pacote especial/seleção', tier:'PACOTE_SELECAO', primaryStyle:'CONTRA_ATAQUE_RAPIDO', primaryProficiency:90, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'tuchel-posse-90', name:'Thomas Tuchel', version:'Pacote especial', tier:'PACOTE_SELECAO', primaryStyle:'POSSE_DE_BOLA', primaryProficiency:90, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'deschamps-lbc-89', name:'Didier Deschamps', version:'Pacote especial/seleção', tier:'PACOTE_SELECAO', primaryStyle:'CONTRA_ATAQUE', primaryProficiency:89, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'flick-posse-89-qc-88', name:'Hansi Flick', version:'Pacote especial', tier:'PACOTE_SELECAO', primaryStyle:'POSSE_DE_BOLA', primaryProficiency:89, secondaryStyle:'CONTRA_ATAQUE_RAPIDO', secondaryProficiency:88, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'montella-wide-88', name:'Vincenzo Montella', version:'Pacote especial', tier:'PACOTE_SELECAO', primaryStyle:'POR_FORA', primaryProficiency:88, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'arteta-lbc-88-posse', name:'Mikel Arteta', version:'Pacote especial', tier:'PACOTE_SELECAO', primaryStyle:'CONTRA_ATAQUE', primaryProficiency:88, secondaryStyle:'POSSE_DE_BOLA', secondaryProficiency:88, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'guardiola-posse-88', name:'Pep Guardiola', version:'Pacote especial', tier:'PACOTE_SELECAO', primaryStyle:'POSSE_DE_BOLA', primaryProficiency:88, secondaryStyle:'POR_FORA', secondaryProficiency:88, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'klopp-qc-88', name:'Jürgen Klopp', version:'Pacote especial', tier:'PACOTE_SELECAO', primaryStyle:'CONTRA_ATAQUE_RAPIDO', primaryProficiency:88, secondaryStyle:'POSSE_DE_BOLA', secondaryProficiency:88, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'alonso-qc-88', name:'Xabi Alonso', version:'Pacote especial', tier:'PACOTE_SELECAO', primaryStyle:'CONTRA_ATAQUE_RAPIDO', primaryProficiency:88, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'nagelsmann-posse-88', name:'Julian Nagelsmann', version:'Pacote especial', tier:'PACOTE_SELECAO', primaryStyle:'POSSE_DE_BOLA', primaryProficiency:88, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'koeman-qc-88', name:'Ronald Koeman', version:'Pacote especial', tier:'PACOTE_SELECAO', primaryStyle:'CONTRA_ATAQUE_RAPIDO', primaryProficiency:88, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'allegri-lbc-88', name:'Massimiliano Allegri', version:'Pacote especial', tier:'PACOTE_SELECAO', primaryStyle:'CONTRA_ATAQUE', primaryProficiency:88, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'amorim-qc-87', name:'Rúben Amorim', version:'Pacote especial', tier:'PACOTE_SELECAO', primaryStyle:'CONTRA_ATAQUE_RAPIDO', primaryProficiency:87, booster:'especial', sourceStatus:'informado_usuario' },
  { id:'gasperini-hybrid-88', name:'G. Gasperini', version:'Catálogo GP híbrido', tier:'GP', primaryStyle:'CONTRA_ATAQUE_RAPIDO', primaryProficiency:88, secondaryStyle:'CONTRA_ATAQUE', secondaryProficiency:88, booster:'padrao', sourceStatus:'informado_usuario' },
  { id:'spalletti-lbc-89', name:'L. Spalletti', version:'Catálogo GP', tier:'GP', primaryStyle:'CONTRA_ATAQUE', primaryProficiency:89, booster:'padrao', sourceStatus:'informado_usuario' },
  { id:'inzaghi-lbc-88', name:'Simone Inzaghi', version:'Catálogo GP', tier:'GP', primaryStyle:'CONTRA_ATAQUE', primaryProficiency:88, booster:'padrao', sourceStatus:'informado_usuario' },
  { id:'mourinho-lbc-88-wide', name:'José Mourinho', version:'Catálogo GP', tier:'GP', primaryStyle:'CONTRA_ATAQUE', primaryProficiency:88, secondaryStyle:'POR_FORA', secondaryProficiency:88, booster:'padrao', sourceStatus:'informado_usuario' },
  { id:'buena-lbc-85', name:'Cristóbal Buena (Simeone)', version:'Catálogo GP', tier:'GP', primaryStyle:'CONTRA_ATAQUE', primaryProficiency:85, booster:'padrao', sourceStatus:'informado_usuario' }
];

export function getManager(id?: string | null) {
  return MANAGERS.find((item) => item.id === id) ?? null;
}
