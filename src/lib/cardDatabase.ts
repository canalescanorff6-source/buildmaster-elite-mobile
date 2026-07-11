import type { PositionCode } from './analyzer';

export type LocalCardRule = {
  id: string;
  match: string[];
  mainPosition?: PositionCode;
  playstyle?: string;
  bestPositions: PositionCode[];
  avoidPositions: PositionCode[];
  note: string;
};

export const LOCAL_CARD_RULES: LocalCardRule[] = [
  { id: 'edgar-davids', match: ['edgar davids', 'davids', 'e. davids'], mainPosition: 'DMF', playstyle: 'O destruidor', bestPositions: ['DMF', 'CMF', 'CB'], avoidPositions: ['LB', 'RB', 'LWF', 'RWF', 'CF', 'SS', 'GK'], note: 'Regra local: Davids é destruidor central; mesmo com LE/LD alto no grid, o foco competitivo deve ser VOL/MLG.' },
  { id: 'gattuso', match: ['gattuso', 'g. gattuso', 'gennaro gattuso'], mainPosition: 'DMF', playstyle: 'O destruidor', bestPositions: ['DMF', 'CMF', 'CB'], avoidPositions: ['LB', 'RB', 'LWF', 'RWF', 'CF', 'SS'], note: 'Regra local: destruidor rende melhor centralizado como VOL/MLG, não como lateral ou atacante.' },
  { id: 'maldini', match: ['maldini', 'paolo maldini'], mainPosition: 'CB', playstyle: 'Defensor criativo', bestPositions: ['CB', 'LB'], avoidPositions: ['CF', 'SS', 'AMF', 'LWF', 'RWF'], note: 'Regra local: priorizar defesa, cobertura e jogo aéreo antes de GER.' },
  { id: 'vieira', match: ['vieira', 'patrick vieira'], mainPosition: 'DMF', playstyle: 'O destruidor', bestPositions: ['DMF', 'CMF'], avoidPositions: ['LB', 'RB', 'CF', 'SS', 'LWF', 'RWF'], note: 'Regra local: volante físico de pressão e interceptação.' },
  { id: 'tchouameni', match: ['tchouameni', 'tchouaméni', 'aurelien tchouameni'], mainPosition: 'DMF', playstyle: 'Primeiro volante', bestPositions: ['DMF', 'CMF', 'CB'], avoidPositions: ['CF', 'SS', 'LWF', 'RWF'], note: 'Regra local: foco em proteção da entrada da área e saída curta.' },
  { id: 'beckenbauer', match: ['beckenbauer', 'franz beckenbauer'], mainPosition: 'CB', playstyle: 'Defensor criativo', bestPositions: ['CB', 'DMF', 'CMF'], avoidPositions: ['CF', 'LWF', 'RWF'], note: 'Regra local: zagueiro construtor, pode render como VOL se atributos permitirem.' },
  { id: 'neymar', match: ['neymar', 'neymar jr', 'neymar junior'], mainPosition: 'LWF', playstyle: 'Armador criativo', bestPositions: ['LWF', 'SS', 'AMF'], avoidPositions: ['CB', 'DMF', 'LB', 'RB', 'GK'], note: 'Regra local: priorizar drible, equilíbrio, controle e criação.' },
  { id: 'messi', match: ['messi', 'lionel messi', 'l. messi'], mainPosition: 'SS', playstyle: 'Armador criativo', bestPositions: ['SS', 'AMF', 'RWF'], avoidPositions: ['CB', 'DMF', 'LB', 'RB', 'GK'], note: 'Regra local: meia/SA criativo, não extremo defensivo.' },
  { id: 'mbappe', match: ['mbappe', 'mbappé', 'kylian mbappe', 'k. mbappe'], mainPosition: 'CF', playstyle: 'Artilheiro', bestPositions: ['CF', 'LWF', 'RWF'], avoidPositions: ['CB', 'DMF', 'LB', 'RB', 'GK'], note: 'Regra local: finalizador móvel; foco em arranque e finalização.' },
  { id: 'beckham', match: ['beckham', 'david beckham'], mainPosition: 'RMF', playstyle: 'Perito em cruzamento', bestPositions: ['RMF', 'CMF', 'AMF'], avoidPositions: ['CB', 'GK', 'CF'], note: 'Regra local: cruzamento, passe longo e bola parada; evitar converter em defensor puro.' },
  { id: 'rijkaard', match: ['rijkaard', 'frank rijkaard'], mainPosition: 'DMF', playstyle: 'Primeiro volante', bestPositions: ['DMF', 'CB', 'CMF'], avoidPositions: ['CF', 'SS', 'LWF', 'RWF'], note: 'Regra local: volante/zagueiro de proteção, com saída segura.' },
  { id: 'makelele', match: ['makelele', 'makélélé', 'claude makelele'], mainPosition: 'DMF', playstyle: 'Primeiro volante', bestPositions: ['DMF', 'CMF'], avoidPositions: ['CF', 'SS', 'LWF', 'RWF', 'LB', 'RB'], note: 'Regra local: volante de contenção; priorizar interceptação, desarme e passe curto.' },
  { id: 'kante', match: ['kante', 'kanté', 'n. kante', 'n golo kante'], mainPosition: 'DMF', playstyle: 'O destruidor', bestPositions: ['DMF', 'CMF'], avoidPositions: ['CF', 'SS', 'LWF', 'RWF', 'GK'], note: 'Regra local: motor de pressão central, não lateral ou atacante.' },
  { id: 'ronaldinho', match: ['ronaldinho', 'ronaldinho gaucho'], mainPosition: 'AMF', playstyle: 'Armador criativo', bestPositions: ['AMF', 'LWF', 'SS'], avoidPositions: ['CB', 'DMF', 'LB', 'RB', 'GK'], note: 'Regra local: criatividade, drible e último passe.' },
  { id: 'cristiano-ronaldo', match: ['cristiano ronaldo', 'c. ronaldo', 'ronaldo'], mainPosition: 'CF', playstyle: 'Atacante matador', bestPositions: ['CF', 'LWF'], avoidPositions: ['CB', 'DMF', 'LB', 'RB', 'GK'], note: 'Regra local: finalização, ataque ao espaço e jogo aéreo.' },
  { id: 'haaland', match: ['haaland', 'erling haaland', 'e. haaland'], mainPosition: 'CF', playstyle: 'Atacante matador', bestPositions: ['CF'], avoidPositions: ['AMF', 'CMF', 'DMF', 'CB', 'LB', 'RB', 'GK'], note: 'Regra local: centroavante de área; não converter por GER lateral/meia.' },
  { id: 'rodri', match: ['rodri', 'rodrigo hernandez', 'rodri hernandez'], mainPosition: 'DMF', playstyle: 'Orquestrador', bestPositions: ['DMF', 'CMF'], avoidPositions: ['CF', 'SS', 'LWF', 'RWF', 'GK'], note: 'Regra local: VOL de passe e posicionamento.' },
  { id: 'van-dijk', match: ['van dijk', 'virgil van dijk'], mainPosition: 'CB', playstyle: 'Defensor criativo', bestPositions: ['CB'], avoidPositions: ['CF', 'SS', 'AMF', 'LWF', 'RWF', 'GK'], note: 'Regra local: zagueiro físico/aéreo; priorizar ZAG.' },
  { id: 'cafu', match: ['cafu', 'marcos cafu'], mainPosition: 'RB', playstyle: 'Lateral ofensivo', bestPositions: ['RB', 'RMF'], avoidPositions: ['CF', 'CB', 'GK'], note: 'Regra local: lateral de corredor com velocidade e cruzamento.' },
  { id: 'roberto-carlos', match: ['roberto carlos', 'r. carlos'], mainPosition: 'LB', playstyle: 'Lateral ofensivo', bestPositions: ['LB', 'LMF'], avoidPositions: ['CF', 'CB', 'GK'], note: 'Regra local: lateral ofensivo; evitar trocar para atacante central.' }
];
