import type { AnalysisResult, PositionCode, TacticalStyle } from './analyzer';
import { canonicalizePlayerPlaystyle, getPlayerStyleMeta2026, normalizeFormationCoachStyle, type FormationCoachStyle } from './efootball2026Playstyles';

export type FormationFamily = 'oficial-app' | 'extra' | 'personalizada';
export type FormationRoleId =
  | 'artilheiro' | 'homem-area' | 'pivo' | 'atacante-pivo' | 'puxa-marcacao'
  | 'armador-criativo' | 'classico-10' | 'infiltracao' | 'meia-versatil' | 'orquestrador'
  | 'primeiro-volante' | 'volante-destruidor'
  | 'ala-produtivo' | 'lateral-movel' | 'lateral-ofensivo' | 'lateral-atacante' | 'lateral-defensivo' | 'perito-cruzamento'
  | 'zagueiro-destruidor' | 'defensor-criativo' | 'atacante-surpresa'
  | 'goleiro-ofensivo' | 'goleiro-defensivo';

export type FormationRole = {
  id: FormationRoleId;
  officialName: string;
  positions: PositionCode[];
  purpose: string;
  strengths: string[];
  usablePositions?: PositionCode[];
};

export type FormationSlot = {
  id: string;
  label: string;
  position: PositionCode;
  alternatives: PositionCode[];
  x: number;
  y: number;
  line: 'ataque' | 'meio' | 'defesa' | 'goleiro';
  primaryRoles: FormationRoleId[];
  complementaryRoles: FormationRoleId[];
  duty: string;
  keyTraits: string[];
  pairingNote?: string;
};

export type FormationBlueprint = {
  id: string;
  name: string;
  family: FormationFamily;
  description: string;
  idealStyles: TacticalStyle[];
  risk: string;
  behavior: string;
  slots: FormationSlot[];
};

export type FormationSlotFit = {
  slot: FormationSlot;
  player: AnalysisResult | null;
  score: number;
  roleFit: number;
  positionFit: number;
  reasons: string[];
  warnings: string[];
};

export const FORMATION_ROLE_CATALOG: Record<FormationRoleId, FormationRole> = {
  'artilheiro': { id:'artilheiro', officialName:'Artilheiro', positions:['CF','SS'], purpose:'Atacar a última linha e finalizar com poucos toques.', strengths:['Finalização','Talento ofensivo','Aceleração'] },
  'homem-area': { id:'homem-area', officialName:'Homem de Área', positions:['CF'], purpose:'Permanecer próximo da área para atacar cruzamentos e rebotes.', strengths:['Finalização','Cabeceio','Contato físico'] },
  'pivo': { id:'pivo', officialName:'Pivô', positions:['CF'], purpose:'Prender zagueiros e disputar a bola direta.', strengths:['Contato físico','Controle de bola','Cabeceio'] },
  'atacante-pivo': { id:'atacante-pivo', officialName:'Atacante Pivô', positions:['CF','SS'], purpose:'Recuar para participar da criação e voltar a atacar a área.', strengths:['Controle de bola','Passe curto','Finalização'] },
  'puxa-marcacao': { id:'puxa-marcacao', officialName:'Puxa Marcação', positions:['CF','SS'], purpose:'Sair da referência para abrir corredor ao parceiro.', strengths:['Movimentação','Passe','Controle de bola'] },
  'armador-criativo': { id:'armador-criativo', officialName:'Armador Criativo', positions:['AMF','CMF','SS','LWF','RWF'], purpose:'Receber entre linhas e produzir o passe decisivo.', strengths:['Passe','Controle de bola','Condução firme'] },
  'classico-10': { id:'classico-10', officialName:'Clássico 10', positions:['AMF','CMF'], purpose:'Organizar o ataque em ritmo controlado.', strengths:['Passe','Controle de bola','Posicionamento'] },
  'infiltracao': { id:'infiltracao', officialName:'Infiltração', positions:['AMF','SS'], usablePositions:['CMF','LMF','RMF'], purpose:'Atacar espaço sem bola e chegar na área.', strengths:['Aceleração','Talento ofensivo','Finalização'] },
  'meia-versatil': { id:'meia-versatil', officialName:'Meia versátil', positions:['CMF','LMF','RMF','DMF'], purpose:'Ajudar em todas as fases e ocupar espaços livres.', strengths:['Resistência','Passe','Dedicação defensiva'] },
  'orquestrador': { id:'orquestrador', officialName:'Orquestrador', positions:['CMF','DMF'], purpose:'Controlar a saída e inverter o jogo.', strengths:['Passe rasteiro','Passe alto','Controle de bola'] },
  'primeiro-volante': { id:'primeiro-volante', officialName:'1º Volante', positions:['DMF'], purpose:'Fixar à frente da defesa e proteger a zona central.', strengths:['Consciência defensiva','Desarme','Posicionamento'] },
  'volante-destruidor': { id:'volante-destruidor', officialName:'Destruidor', positions:['DMF','CMF'], purpose:'Saltar na pressão e interromper transições.', strengths:['Agressividade','Desarme','Contato físico'] },
  'ala-produtivo': { id:'ala-produtivo', officialName:'Ala Produtivo', positions:['LWF','RWF'], usablePositions:['SS'], purpose:'Dar amplitude e produzir gol ou assistência.', strengths:['Drible','Velocidade','Finalização'] },
  'lateral-movel': { id:'lateral-movel', officialName:'Lateral Móvel', positions:['LWF','RWF','LMF','RMF'], purpose:'Circular pelo corredor e por zonas internas.', strengths:['Resistência','Velocidade','Passe'] },
  'lateral-ofensivo': { id:'lateral-ofensivo', officialName:'Lateral Ofensivo', positions:['LB','RB'], purpose:'Apoiar por fora e criar superioridade no corredor.', strengths:['Velocidade','Passe alto','Resistência'] },
  'lateral-atacante': { id:'lateral-atacante', officialName:'Lateral Atacante', positions:['LB','RB'], purpose:'Entrar por dentro e aparecer em zonas ofensivas.', strengths:['Aceleração','Controle de bola','Finalização'] },
  'lateral-defensivo': { id:'lateral-defensivo', officialName:'Lateral Defensivo', positions:['LB','RB'], purpose:'Preservar a linha e controlar o ponta adversário.', strengths:['Defesa','Velocidade','Contato físico'] },
  'perito-cruzamento': { id:'perito-cruzamento', officialName:'Perito em Cruzamento', positions:['LB','RB','LMF','RMF','LWF','RWF'], purpose:'Produzir cruzamentos de alta qualidade sem atacar tanto o espaço interior.', strengths:['Passe alto','Curva','Força do chute'] },
  'zagueiro-destruidor': { id:'zagueiro-destruidor', officialName:'Destruidor', positions:['CB'], purpose:'Antecipar, combater e dominar o duelo físico.', strengths:['Agressividade','Desarme','Contato físico'] },
  'defensor-criativo': { id:'defensor-criativo', officialName:'Defensor Criativo', positions:['CB'], purpose:'Iniciar a construção e quebrar a primeira linha.', strengths:['Passe','Consciência defensiva','Controle de bola'] },
  'atacante-surpresa': { id:'atacante-surpresa', officialName:'Atacante Surpresa', positions:['CB'], purpose:'Aparecer à frente em momentos específicos.', strengths:['Jogo aéreo','Finalização','Contato físico'] },
  'goleiro-ofensivo': { id:'goleiro-ofensivo', officialName:'Goleiro Ofensivo', positions:['GK'], purpose:'Cobrir a linha alta e participar da saída.', strengths:['Alcance','Reflexos','Passe'] },
  'goleiro-defensivo': { id:'goleiro-defensivo', officialName:'Goleiro Defensivo', positions:['GK'], purpose:'Priorizar posicionamento e defesa da área.', strengths:['Consciência de GO','Reflexos','Firmeza'] }
};

const slot = (
  id: string, label: string, position: PositionCode, alternatives: PositionCode[], x: number, y: number,
  line: FormationSlot['line'], primaryRoles: FormationRoleId[], complementaryRoles: FormationRoleId[], duty: string, keyTraits: string[], pairingNote?: string
): FormationSlot => ({ id,label,position,alternatives,x,y,line,primaryRoles,complementaryRoles,duty,keyTraits,pairingNote });

const BACK_FOUR: FormationSlot[] = [
  slot('lb','LE','LB',['LMF'],10,72,'defesa',['lateral-defensivo','lateral-movel'],['lateral-ofensivo','perito-cruzamento'],'Controlar o corredor esquerdo.',['Velocidade','Resistência','Defesa']),
  slot('cb1','ZAG E','CB',['LB'],37,78,'defesa',['defensor-criativo'],['zagueiro-destruidor'],'Cobertura e saída pelo lado esquerdo.',['Consciência defensiva','Passe','Velocidade']),
  slot('cb2','ZAG D','CB',['RB'],63,78,'defesa',['zagueiro-destruidor'],['defensor-criativo'],'Combate e proteção da área.',['Desarme','Contato físico','Jogo aéreo']),
  slot('rb','LD','RB',['RMF'],90,72,'defesa',['lateral-defensivo','lateral-movel'],['lateral-ofensivo','perito-cruzamento'],'Controlar o corredor direito.',['Velocidade','Resistência','Defesa']),
  slot('gk','GOL','GK',[],50,93,'goleiro',['goleiro-ofensivo'],['goleiro-defensivo'],'Proteger o gol e ajustar a altura do bloco.',['Reflexos','Alcance','Firmeza'])
];

const BACK_THREE: FormationSlot[] = [
  slot('cb1','ZAG E','CB',['LB'],25,78,'defesa',['defensor-criativo'],['zagueiro-destruidor'],'Cobrir o corredor e iniciar por baixo.',['Passe','Velocidade','Defesa']),
  slot('cb2','ZAG C','CB',[],50,82,'defesa',['zagueiro-destruidor'],['defensor-criativo'],'Comandar a área e vencer bolas aéreas.',['Jogo aéreo','Contato físico','Consciência defensiva']),
  slot('cb3','ZAG D','CB',['RB'],75,78,'defesa',['defensor-criativo'],['zagueiro-destruidor'],'Cobrir o corredor e iniciar por baixo.',['Passe','Velocidade','Defesa']),
  slot('gk','GOL','GK',[],50,94,'goleiro',['goleiro-ofensivo'],['goleiro-defensivo'],'Cobrir profundidade atrás dos três zagueiros.',['Alcance','Reflexos','Saída'])
];

const BACK_FIVE: FormationSlot[] = [
  slot('lwb','ALA E','LB',['LMF'],7,66,'defesa',['lateral-movel','perito-cruzamento'],['lateral-ofensivo','lateral-defensivo'],'Ocupar todo o corredor esquerdo.',['Resistência','Velocidade','Cruzamento']),
  slot('cb1','ZAG E','CB',['LB'],28,79,'defesa',['defensor-criativo'],['zagueiro-destruidor'],'Cobertura do lado esquerdo.',['Defesa','Velocidade','Passe']),
  slot('cb2','ZAG C','CB',[],50,83,'defesa',['zagueiro-destruidor'],['defensor-criativo'],'Proteger a área e comandar o jogo aéreo.',['Jogo aéreo','Contato físico','Defesa']),
  slot('cb3','ZAG D','CB',['RB'],72,79,'defesa',['defensor-criativo'],['zagueiro-destruidor'],'Cobertura do lado direito.',['Defesa','Velocidade','Passe']),
  slot('rwb','ALA D','RB',['RMF'],93,66,'defesa',['lateral-movel','perito-cruzamento'],['lateral-ofensivo','lateral-defensivo'],'Ocupar todo o corredor direito.',['Resistência','Velocidade','Cruzamento']),
  slot('gk','GOL','GK',[],50,94,'goleiro',['goleiro-defensivo'],['goleiro-ofensivo'],'Segurança atrás do bloco de cinco.',['Posicionamento','Reflexos','Firmeza'])
];

export const FORMATION_BLUEPRINTS: FormationBlueprint[] = [
  {
    id:'4-2-2-2', name:'4-2-2-2', family:'oficial-app', idealStyles:['CONTRA_ATAQUE_RAPIDO','CONTRA_ATAQUE'],
    description:'Duplo pivô, dois meias por dentro e dupla complementar de ataque.',
    risk:'Pode faltar amplitude quando laterais e meias não ocupam os corredores.',
    behavior:'Recuperar por dentro, acelerar no meia e combinar dois atacantes com funções diferentes.',
    slots:[
      slot('cf1','CA E','CF',['SS'],35,14,'ataque',['puxa-marcacao','pivo'],['artilheiro'],'Aproximar, tabelar e abrir espaço.',['Controle','Passe','Físico'],'Combine com outro Artilheiro ou com um Atacante Pivô apenas como alternativa.'),
      slot('cf2','CA D','CF',['SS'],65,14,'ataque',['artilheiro','homem-area'],['pivo'],'Atacar profundidade e finalizar.',['Finalização','Aceleração','Talento ofensivo'],'Evite dois atacantes que saiam ao mesmo tempo da área.'),
      slot('am1','MEI E','AMF',['LMF','SS'],28,36,'meio',['armador-criativo','infiltracao'],['classico-10'],'Criar entre linhas e atacar o meio-espaço.',['Passe','Drible','Aceleração']),
      slot('am2','MEI D','AMF',['RMF','SS'],72,36,'meio',['infiltracao','armador-criativo'],['classico-10'],'Produzir último passe e chegada à área.',['Passe','Movimentação','Finalização']),
      slot('dm1','VOL E','DMF',['CMF'],38,59,'meio',['primeiro-volante'],['orquestrador'],'Fixar e proteger a defesa.',['Defesa','Desarme','Posicionamento'],'Combine um protetor com um jogador de saída.'),
      slot('dm2','VOL D','DMF',['CMF'],62,59,'meio',['orquestrador','meia-versatil'],['volante-destruidor'],'Dar o primeiro passe e cobrir o parceiro.',['Passe','Resistência','Defesa']),
      ...BACK_FOUR
    ]
  },
  {
    id:'4-4-2', name:'4-4-2', family:'oficial-app', idealStyles:['CONTRA_ATAQUE','POR_FORA'],
    description:'Duas linhas compactas, amplitude natural e dois atacantes.', risk:'Meio pode ficar previsível sem um central criativo.', behavior:'Defender em bloco e sair por corredor ou passe direto.',
    slots:[
      slot('cf1','CA E','CF',['SS'],37,14,'ataque',['pivo','puxa-marcacao'],['artilheiro'],'Apoiar e conectar a saída.',['Físico','Controle','Passe'],'Parceiro ideal: outro Artilheiro; Atacante Pivô é alternativa situacional.'),
      slot('cf2','CA D','CF',['SS'],63,14,'ataque',['artilheiro','homem-area'],['pivo'],'Finalizar e atacar a área.',['Finalização','Talento ofensivo','Cabeceio']),
      slot('lm','ME','LMF',['LWF'],10,42,'meio',['ala-produtivo','perito-cruzamento'],['meia-versatil'],'Amplitute e recomposição.',['Velocidade','Cruzamento','Resistência']),
      slot('cm1','MLG E','CMF',['DMF'],38,51,'meio',['orquestrador','meia-versatil'],['primeiro-volante'],'Organizar e cobrir o corredor.',['Passe','Controle','Resistência']),
      slot('cm2','MLG D','CMF',['DMF','AMF'],62,51,'meio',['meia-versatil','volante-destruidor'],['orquestrador'],'Pressionar e equilibrar.',['Resistência','Defesa','Passe']),
      slot('rm','MD','RMF',['RWF'],90,42,'meio',['ala-produtivo','perito-cruzamento'],['meia-versatil'],'Amplitude e recomposição.',['Velocidade','Cruzamento','Resistência']),
      ...BACK_FOUR
    ]
  },
  {
    id:'4-3-3', name:'4-3-3', family:'oficial-app', idealStyles:['POSSE_DE_BOLA','POR_FORA'], description:'Amplitude com pontas e triângulo central.', risk:'O VOL pode ficar isolado se os interiores não recompuserem.', behavior:'Circular no meio, fixar amplitude e atacar o lado fraco.',
    slots:[
      slot('lw','PE','LWF',['LMF','SS'],13,20,'ataque',['ala-produtivo'],['armador-criativo','infiltracao'],'Abrir o campo e atacar diagonal.',['Drible','Velocidade','Finalização']),
      slot('cf','CA','CF',['SS'],50,12,'ataque',['artilheiro','homem-area'],['pivo','puxa-marcacao'],'Finalizar e ocupar zagueiros.',['Finalização','Movimentação','Físico']),
      slot('rw','PD','RWF',['RMF','SS'],87,20,'ataque',['ala-produtivo'],['armador-criativo','infiltracao'],'Abrir o campo e atacar diagonal.',['Drible','Velocidade','Finalização']),
      slot('cm1','MLG E','CMF',['AMF'],30,45,'meio',['infiltracao','meia-versatil'],['armador-criativo'],'Chegar à área e pressionar.',['Resistência','Passe','Aceleração']),
      slot('dm','VOL','DMF',['CMF'],50,60,'meio',['primeiro-volante','orquestrador'],['volante-destruidor'],'Proteger e distribuir.',['Defesa','Passe','Posicionamento']),
      slot('cm2','MLG D','CMF',['AMF'],70,45,'meio',['orquestrador','meia-versatil'],['armador-criativo'],'Organizar e inverter.',['Passe','Controle','Resistência']),
      ...BACK_FOUR
    ]
  },
  {
    id:'4-1-2-3', name:'4-1-2-3', family:'oficial-app', idealStyles:['POSSE_DE_BOLA','POR_FORA'], description:'VOL único, dois interiores e trio de ataque.', risk:'Exige muita leitura do volante e recomposição dos meias.', behavior:'Criar triângulos, atrair no meio e soltar os pontas.',
    slots:[
      slot('lw','PE','LWF',['LMF'],12,19,'ataque',['ala-produtivo'],['armador-criativo'],'Amplitude e diagonal.',['Drible','Velocidade','Finalização']),
      slot('cf','CA','CF',['SS'],50,11,'ataque',['artilheiro','pivo'],['homem-area'],'Referência e finalização.',['Finalização','Físico','Movimentação']),
      slot('rw','PD','RWF',['RMF'],88,19,'ataque',['ala-produtivo'],['armador-criativo'],'Amplitude e diagonal.',['Drible','Velocidade','Finalização']),
      slot('cm1','MLG E','CMF',['AMF'],32,43,'meio',['infiltracao','meia-versatil'],['armador-criativo'],'Infiltrar e pressionar.',['Passe','Aceleração','Resistência']),
      slot('cm2','MLG D','CMF',['AMF'],68,43,'meio',['orquestrador','armador-criativo'],['meia-versatil'],'Organizar o ataque.',['Passe','Controle','Condução']),
      slot('dm','VOL','DMF',[],50,61,'meio',['primeiro-volante'],['orquestrador'],'Ser a âncora da estrutura.',['Defesa','Posicionamento','Passe']),
      ...BACK_FOUR
    ]
  },
  {
    id:'4-2-1-3', name:'4-2-1-3', family:'oficial-app', idealStyles:['CONTRA_ATAQUE_RAPIDO','POSSE_DE_BOLA'], description:'Duplo pivô, MAT central e trio de ataque.', risk:'MAT pode ser cercado se os pontas não entrarem no jogo.', behavior:'Base segura para liberar um criador e três atacantes.',
    slots:[
      slot('lw','PE','LWF',['LMF'],12,20,'ataque',['ala-produtivo','infiltracao'],['armador-criativo'],'Atacar espaço e diagonal.',['Velocidade','Drible','Finalização']),
      slot('cf','CA','CF',['SS'],50,11,'ataque',['artilheiro','homem-area'],['pivo'],'Finalizar a transição.',['Finalização','Aceleração','Movimentação']),
      slot('rw','PD','RWF',['RMF'],88,20,'ataque',['ala-produtivo','infiltracao'],['armador-criativo'],'Atacar espaço e diagonal.',['Velocidade','Drible','Finalização']),
      slot('am','MAT','AMF',['SS'],50,38,'meio',['armador-criativo','infiltracao'],['classico-10'],'Dar o passe final e chegar à área.',['Passe','Controle','Finalização']),
      slot('dm1','VOL E','DMF',['CMF'],38,59,'meio',['primeiro-volante'],['volante-destruidor'],'Proteger a defesa.',['Defesa','Posicionamento','Físico']),
      slot('dm2','VOL D','DMF',['CMF'],62,59,'meio',['orquestrador','meia-versatil'],['volante-destruidor'],'Acelerar a saída.',['Passe','Resistência','Defesa']),
      ...BACK_FOUR
    ]
  },
  {
    id:'4-2-3-1', name:'4-2-3-1', family:'oficial-app', idealStyles:['POSSE_DE_BOLA','CONTRA_ATAQUE'], description:'Dupla central e três criadores atrás do atacante.', risk:'CA pode ficar isolado sem infiltração dos meias.', behavior:'Controlar a base e atacar com meias em alturas diferentes.',
    slots:[
      slot('cf','CA','CF',['SS'],50,11,'ataque',['pivo','homem-area'],['artilheiro'],'Prender zagueiros e finalizar.',['Físico','Finalização','Controle']),
      slot('lm','MEI E','LMF',['LWF','AMF'],17,34,'meio',['ala-produtivo','infiltracao'],['armador-criativo'],'Dar amplitude e atacar área.',['Drible','Velocidade','Finalização']),
      slot('am','MAT','AMF',['SS'],50,32,'meio',['armador-criativo','classico-10'],['infiltracao'],'Controlar o último terço.',['Passe','Controle','Condução']),
      slot('rm','MEI D','RMF',['RWF','AMF'],83,34,'meio',['infiltracao','ala-produtivo'],['armador-criativo'],'Atacar o espaço oposto.',['Aceleração','Finalização','Passe']),
      slot('dm1','VOL E','DMF',['CMF'],38,58,'meio',['primeiro-volante'],['volante-destruidor'],'Fixar e proteger.',['Defesa','Posicionamento','Desarme']),
      slot('dm2','VOL D','DMF',['CMF'],62,58,'meio',['orquestrador','meia-versatil'],['volante-destruidor'],'Dar saída e cobertura.',['Passe','Resistência','Defesa']),
      ...BACK_FOUR
    ]
  },
  {
    id:'4-3-1-2', name:'4-3-1-2', family:'oficial-app', idealStyles:['CONTRA_ATAQUE','POSSE_DE_BOLA'], description:'Losango central, MAT e dois atacantes.', risk:'Laterais são responsáveis por quase toda a amplitude.', behavior:'Fechar o centro e combinar MAT com dupla complementar.',
    slots:[
      slot('cf1','CA E','CF',['SS'],37,14,'ataque',['puxa-marcacao','pivo'],['artilheiro'],'Apoiar e abrir espaço.',['Controle','Passe','Físico'],'Combine com um atacante de ruptura.'),
      slot('cf2','CA D','CF',['SS'],63,14,'ataque',['artilheiro','homem-area'],['pivo'],'Atacar profundidade.',['Finalização','Aceleração','Movimentação']),
      slot('am','MAT','AMF',['SS'],50,35,'meio',['armador-criativo','classico-10'],['infiltracao'],'Criar o último passe.',['Passe','Controle','Drible']),
      slot('cm1','MLG E','CMF',['LMF'],28,52,'meio',['meia-versatil','infiltracao'],['orquestrador'],'Cobrir lado e chegar à frente.',['Resistência','Passe','Aceleração']),
      slot('dm','VOL','DMF',[],50,62,'meio',['primeiro-volante'],['orquestrador'],'Proteger a base do losango.',['Defesa','Posicionamento','Passe']),
      slot('cm2','MLG D','CMF',['RMF'],72,52,'meio',['orquestrador','meia-versatil'],['volante-destruidor'],'Organizar e pressionar.',['Passe','Resistência','Defesa']),
      ...BACK_FOUR
    ]
  },
  {
    id:'4-1-3-2', name:'4-1-3-2', family:'oficial-app', idealStyles:['CONTRA_ATAQUE_RAPIDO','CONTRA_ATAQUE'], description:'VOL único, linha agressiva de três meias e dupla de ataque.', risk:'Espaço grande ao lado do VOL quando a pressão é superada.', behavior:'Pressionar alto e chegar rápido com muitos jogadores.',
    slots:[
      slot('cf1','CA E','CF',['SS'],37,13,'ataque',['pivo','puxa-marcacao'],['artilheiro'],'Apoiar a combinação.',['Controle','Passe','Físico']),
      slot('cf2','CA D','CF',['SS'],63,13,'ataque',['artilheiro','homem-area'],['pivo'],'Finalizar a jogada.',['Finalização','Movimentação','Aceleração']),
      slot('lm','ME','LMF',['LWF'],18,40,'meio',['ala-produtivo','meia-versatil'],['perito-cruzamento'],'Pressão e amplitude.',['Resistência','Velocidade','Passe']),
      slot('am','MAT','AMF',['CMF'],50,39,'meio',['infiltracao','armador-criativo'],['classico-10'],'Acelerar e chegar à área.',['Passe','Aceleração','Finalização']),
      slot('rm','MD','RMF',['RWF'],82,40,'meio',['ala-produtivo','meia-versatil'],['perito-cruzamento'],'Pressão e amplitude.',['Resistência','Velocidade','Passe']),
      slot('dm','VOL','DMF',[],50,61,'meio',['primeiro-volante'],['volante-destruidor'],'Cobrir toda a zona central.',['Defesa','Posicionamento','Resistência']),
      ...BACK_FOUR
    ]
  },
  {
    id:'4-1-4-1', name:'4-1-4-1', family:'oficial-app', idealStyles:['POSSE_DE_BOLA','POR_FORA'], description:'VOL fixo e linha de quatro meias para controle territorial.', risk:'Falta presença de área quando os interiores não infiltram.', behavior:'Circular com paciência e avançar o bloco inteiro.',
    slots:[
      slot('cf','CA','CF',['SS'],50,12,'ataque',['pivo','homem-area'],['artilheiro'],'Servir de referência para o bloco.',['Físico','Controle','Finalização']),
      slot('lm','ME','LMF',['LWF'],12,40,'meio',['ala-produtivo','perito-cruzamento'],['meia-versatil'],'Amplitude e produção.',['Velocidade','Passe alto','Resistência']),
      slot('cm1','MLG E','CMF',['AMF'],36,45,'meio',['infiltracao','meia-versatil'],['armador-criativo'],'Chegar à área.',['Aceleração','Passe','Finalização']),
      slot('cm2','MLG D','CMF',['AMF'],64,45,'meio',['orquestrador','armador-criativo'],['meia-versatil'],'Organizar a circulação.',['Passe','Controle','Resistência']),
      slot('rm','MD','RMF',['RWF'],88,40,'meio',['ala-produtivo','perito-cruzamento'],['meia-versatil'],'Amplitude e produção.',['Velocidade','Passe alto','Resistência']),
      slot('dm','VOL','DMF',[],50,62,'meio',['primeiro-volante'],['orquestrador'],'Segurar a transição defensiva.',['Defesa','Posicionamento','Passe']),
      ...BACK_FOUR
    ]
  },
  {
    id:'3-2-4-1', name:'3-2-4-1', family:'oficial-app', idealStyles:['POSSE_DE_BOLA','CONTRA_ATAQUE_RAPIDO'], description:'Saída de três, dois pivôs e quatro jogadores entrelinhas.', risk:'Espaço grande nas costas dos alas.', behavior:'Criar superioridade por dentro e prender a defesa aberta.',
    slots:[
      slot('cf','CA','CF',['SS'],50,10,'ataque',['pivo','artilheiro'],['homem-area'],'Prender zagueiros e concluir.',['Físico','Finalização','Controle']),
      slot('lm','ALA E','LMF',['LB','LWF'],9,38,'meio',['lateral-movel','perito-cruzamento'],['ala-produtivo'],'Dar amplitude total.',['Resistência','Velocidade','Cruzamento']),
      slot('am1','MEI E','AMF',['SS','CMF'],35,34,'meio',['armador-criativo','infiltracao'],['classico-10'],'Criar entre linhas.',['Passe','Drible','Aceleração']),
      slot('am2','MEI D','AMF',['SS','CMF'],65,34,'meio',['infiltracao','armador-criativo'],['classico-10'],'Chegar e finalizar.',['Aceleração','Finalização','Passe']),
      slot('rm','ALA D','RMF',['RB','RWF'],91,38,'meio',['lateral-movel','perito-cruzamento'],['ala-produtivo'],'Dar amplitude total.',['Resistência','Velocidade','Cruzamento']),
      slot('dm1','VOL E','DMF',['CMF'],40,58,'meio',['primeiro-volante'],['volante-destruidor'],'Proteger a saída.',['Defesa','Posicionamento','Desarme']),
      slot('dm2','VOL D','DMF',['CMF'],60,58,'meio',['orquestrador'],['meia-versatil'],'Controlar a construção.',['Passe','Controle','Resistência']),
      ...BACK_THREE
    ]
  },
  {
    id:'3-4-3', name:'3-4-3', family:'oficial-app', idealStyles:['POR_FORA','CONTRA_ATAQUE_RAPIDO'], description:'Três atacantes, alas agressivos e três zagueiros.', risk:'Dupla central sobrecarregada contra meio com três ou quatro jogadores.', behavior:'Atacar corredores e pressionar com a linha de frente.',
    slots:[
      slot('lw','PE','LWF',['LMF'],13,17,'ataque',['ala-produtivo','infiltracao'],['armador-criativo'],'Vencer duelo e atacar diagonal.',['Drible','Velocidade','Finalização']),
      slot('cf','CA','CF',['SS'],50,10,'ataque',['homem-area','artilheiro'],['pivo'],'Finalizar cruzamentos e diagonais.',['Finalização','Jogo aéreo','Movimentação']),
      slot('rw','PD','RWF',['RMF'],87,17,'ataque',['ala-produtivo','infiltracao'],['armador-criativo'],'Vencer duelo e atacar diagonal.',['Drible','Velocidade','Finalização']),
      slot('lm','ALA E','LMF',['LB'],8,47,'meio',['lateral-movel','perito-cruzamento'],['ala-produtivo'],'Ocupar todo o corredor.',['Resistência','Velocidade','Cruzamento']),
      slot('cm1','MLG E','CMF',['DMF'],39,53,'meio',['primeiro-volante','meia-versatil'],['volante-destruidor'],'Proteger e pressionar.',['Defesa','Resistência','Passe']),
      slot('cm2','MLG D','CMF',['DMF'],61,53,'meio',['orquestrador','meia-versatil'],['volante-destruidor'],'Organizar e cobrir.',['Passe','Resistência','Defesa']),
      slot('rm','ALA D','RMF',['RB'],92,47,'meio',['lateral-movel','perito-cruzamento'],['ala-produtivo'],'Ocupar todo o corredor.',['Resistência','Velocidade','Cruzamento']),
      ...BACK_THREE
    ]
  },
  {
    id:'3-5-2', name:'3-5-2', family:'oficial-app', idealStyles:['CONTRA_ATAQUE','POSSE_DE_BOLA'], description:'Três zagueiros, alas, meio dominante e dois atacantes.', risk:'Alas cansam e deixam corredor exposto quando não recompõem.', behavior:'Ganhar o centro e usar dupla complementar na frente.',
    slots:[
      slot('cf1','CA E','CF',['SS'],37,12,'ataque',['pivo','puxa-marcacao'],['artilheiro'],'Apoiar e abrir espaço.',['Físico','Passe','Controle']),
      slot('cf2','CA D','CF',['SS'],63,12,'ataque',['artilheiro','homem-area'],['pivo'],'Atacar área e profundidade.',['Finalização','Aceleração','Movimentação']),
      slot('lm','ALA E','LMF',['LB'],8,43,'meio',['lateral-movel','perito-cruzamento'],['ala-produtivo'],'Ocupar corredor.',['Resistência','Velocidade','Cruzamento']),
      slot('cm1','MLG E','CMF',['AMF'],32,46,'meio',['infiltracao','meia-versatil'],['armador-criativo'],'Chegar à frente.',['Aceleração','Passe','Resistência']),
      slot('dm','VOL','DMF',[],50,58,'meio',['primeiro-volante'],['orquestrador'],'Proteger o centro.',['Defesa','Posicionamento','Passe']),
      slot('cm2','MLG D','CMF',['AMF'],68,46,'meio',['orquestrador','meia-versatil'],['volante-destruidor'],'Controlar e pressionar.',['Passe','Resistência','Defesa']),
      slot('rm','ALA D','RMF',['RB'],92,43,'meio',['lateral-movel','perito-cruzamento'],['ala-produtivo'],'Ocupar corredor.',['Resistência','Velocidade','Cruzamento']),
      ...BACK_THREE
    ]
  },
  {
    id:'5-3-2', name:'5-3-2', family:'oficial-app', idealStyles:['CONTRA_ATAQUE','PASSE_LONGO'], description:'Bloco de cinco, três meios e dois atacantes.', risk:'Pode afundar demais e isolar a dupla de ataque.', behavior:'Proteger a área e sair com passe direto ou corredor.',
    slots:[
      slot('cf1','CA E','CF',['SS'],37,14,'ataque',['pivo','puxa-marcacao'],['artilheiro'],'Segurar a saída.',['Físico','Controle','Passe']),
      slot('cf2','CA D','CF',['SS'],63,14,'ataque',['artilheiro','homem-area'],['pivo'],'Atacar o espaço.',['Finalização','Aceleração','Movimentação']),
      slot('cm1','MLG E','CMF',['AMF'],30,46,'meio',['meia-versatil','infiltracao'],['orquestrador'],'Transição e apoio.',['Resistência','Passe','Aceleração']),
      slot('dm','VOL','DMF',[],50,57,'meio',['primeiro-volante'],['volante-destruidor'],'Proteger a frente da área.',['Defesa','Posicionamento','Desarme']),
      slot('cm2','MLG D','CMF',['DMF'],70,46,'meio',['orquestrador','meia-versatil'],['volante-destruidor'],'Dar o passe de saída.',['Passe','Controle','Resistência']),
      ...BACK_FIVE
    ]
  },
  {
    id:'5-2-3', name:'5-2-3', family:'oficial-app', idealStyles:['PASSE_LONGO','CONTRA_ATAQUE_RAPIDO'], description:'Defesa de cinco, dupla central e três atacantes.', risk:'Meio com apenas dois jogadores pode perder controle territorial.', behavior:'Recuperar baixo e atacar rapidamente os três da frente.',
    slots:[
      slot('lw','PE','LWF',['LMF'],13,19,'ataque',['ala-produtivo','infiltracao'],['armador-criativo'],'Atacar espaço aberto.',['Velocidade','Drible','Finalização']),
      slot('cf','CA','CF',['SS'],50,11,'ataque',['pivo','artilheiro'],['homem-area'],'Servir de referência e finalizar.',['Físico','Finalização','Controle']),
      slot('rw','PD','RWF',['RMF'],87,19,'ataque',['ala-produtivo','infiltracao'],['armador-criativo'],'Atacar espaço aberto.',['Velocidade','Drible','Finalização']),
      slot('cm1','MLG E','CMF',['DMF'],40,52,'meio',['primeiro-volante','meia-versatil'],['volante-destruidor'],'Cobrir e recuperar.',['Defesa','Resistência','Passe']),
      slot('cm2','MLG D','CMF',['DMF'],60,52,'meio',['orquestrador','meia-versatil'],['volante-destruidor'],'Lançar a transição.',['Passe alto','Controle','Resistência']),
      ...BACK_FIVE
    ]
  },
  {
    id:'4-2-4', name:'4-2-4', family:'extra', idealStyles:['CONTRA_ATAQUE_RAPIDO','POR_FORA'], description:'Quatro atacantes para pressão e volume ofensivo.', risk:'Dupla central fica exposta; exige pontas comprometidos e laterais prudentes.', behavior:'Recuperar e atacar com muitos jogadores, evitando posse longa no centro.',
    slots:[
      slot('lw','PE','LWF',['LMF'],10,21,'ataque',['ala-produtivo'],['armador-criativo'],'Amplitude e diagonal.',['Velocidade','Drible','Finalização']),
      slot('cf1','CA E','CF',['SS'],38,12,'ataque',['puxa-marcacao','pivo'],['artilheiro'],'Apoiar e arrastar.',['Controle','Físico','Passe']),
      slot('cf2','CA D','CF',['SS'],62,12,'ataque',['artilheiro','homem-area'],['pivo'],'Finalizar e atacar espaço.',['Finalização','Aceleração','Movimentação']),
      slot('rw','PD','RWF',['RMF'],90,21,'ataque',['ala-produtivo'],['armador-criativo'],'Amplitude e diagonal.',['Velocidade','Drible','Finalização']),
      slot('cm1','MLG E','CMF',['DMF'],40,55,'meio',['primeiro-volante','meia-versatil'],['volante-destruidor'],'Proteger e cobrir.',['Defesa','Resistência','Passe']),
      slot('cm2','MLG D','CMF',['DMF'],60,55,'meio',['orquestrador','meia-versatil'],['volante-destruidor'],'Dar saída rápida.',['Passe','Controle','Resistência']),
      ...BACK_FOUR
    ]
  },
  {
    id:'3-4-1-2', name:'3-4-1-2', family:'extra', idealStyles:['CONTRA_ATAQUE','POSSE_DE_BOLA'], description:'Alas, dupla central, MAT e dois atacantes.', risk:'Espaços laterais atrás dos alas.', behavior:'Criar superioridade central e atacar com trio por dentro.',
    slots:[
      slot('cf1','CA E','CF',['SS'],37,12,'ataque',['pivo','puxa-marcacao'],['artilheiro'],'Apoiar e abrir espaço.',['Físico','Controle','Passe']),
      slot('cf2','CA D','CF',['SS'],63,12,'ataque',['artilheiro','homem-area'],['pivo'],'Finalizar.',['Finalização','Aceleração','Movimentação']),
      slot('am','MAT','AMF',['SS'],50,34,'meio',['armador-criativo','infiltracao'],['classico-10'],'Criar e chegar.',['Passe','Controle','Finalização']),
      slot('lm','ALA E','LMF',['LB'],8,49,'meio',['lateral-movel','perito-cruzamento'],['ala-produtivo'],'Cobrir o corredor.',['Resistência','Velocidade','Cruzamento']),
      slot('cm1','MLG E','CMF',['DMF'],39,55,'meio',['primeiro-volante','meia-versatil'],['volante-destruidor'],'Proteger.',['Defesa','Resistência','Passe']),
      slot('cm2','MLG D','CMF',['DMF'],61,55,'meio',['orquestrador','meia-versatil'],['volante-destruidor'],'Organizar.',['Passe','Controle','Resistência']),
      slot('rm','ALA D','RMF',['RB'],92,49,'meio',['lateral-movel','perito-cruzamento'],['ala-produtivo'],'Cobrir o corredor.',['Resistência','Velocidade','Cruzamento']),
      ...BACK_THREE
    ]
  },
  {
    id:'5-4-1', name:'5-4-1', family:'extra', idealStyles:['CONTRA_ATAQUE','PASSE_LONGO'], description:'Bloco compacto com dois corredores e um atacante de referência.', risk:'Pouca presença ofensiva se os meias não avançarem.', behavior:'Fechar espaços e acelerar pelos lados ou no pivô.',
    slots:[
      slot('cf','CA','CF',['SS'],50,11,'ataque',['pivo','homem-area'],['artilheiro'],'Segurar e finalizar.',['Físico','Controle','Finalização']),
      slot('lm','ME','LMF',['LWF'],12,41,'meio',['ala-produtivo','perito-cruzamento'],['meia-versatil'],'Transição pelo lado.',['Velocidade','Resistência','Passe']),
      slot('cm1','MLG E','CMF',['DMF'],38,49,'meio',['meia-versatil','volante-destruidor'],['primeiro-volante'],'Cobrir e pressionar.',['Defesa','Resistência','Passe']),
      slot('cm2','MLG D','CMF',['DMF'],62,49,'meio',['orquestrador','meia-versatil'],['volante-destruidor'],'Dar a saída.',['Passe','Controle','Resistência']),
      slot('rm','MD','RMF',['RWF'],88,41,'meio',['ala-produtivo','perito-cruzamento'],['meia-versatil'],'Transição pelo lado.',['Velocidade','Resistência','Passe']),
      ...BACK_FIVE
    ]
  }
];

function uniqueRoleIds(items: FormationRoleId[]): FormationRoleId[] {
  return Array.from(new Set(items));
}

function metaRolesForBuiltInSlot(slotItem: FormationSlot): { primary: FormationRoleId[]; complementary: FormationRoleId[] } {
  const original = [...slotItem.primaryRoles, ...slotItem.complementaryRoles];
  const has = (id: FormationRoleId) => original.includes(id);
  switch (slotItem.position) {
    case 'GK':
      return { primary: ['goleiro-ofensivo', 'goleiro-defensivo'], complementary: [] };
    case 'CB': {
      const destroyerSlot = /(?:\bC\b|2|central|combate|área)/i.test(`${slotItem.label} ${slotItem.duty}`);
      return destroyerSlot
        ? { primary: ['zagueiro-destruidor', 'defensor-criativo'], complementary: [] }
        : { primary: ['defensor-criativo'], complementary: ['zagueiro-destruidor'] };
    }
    case 'LB':
    case 'RB':
      return { primary: ['lateral-defensivo'], complementary: ['perito-cruzamento', 'lateral-ofensivo', 'lateral-atacante'] };
    case 'DMF': {
      const builder = /sa[ií]da|primeiro passe|distribu|acelerar|organizar|cobrir o parceiro/i.test(slotItem.duty);
      return builder
        ? { primary: ['meia-versatil'], complementary: ['primeiro-volante'] }
        : { primary: ['primeiro-volante'], complementary: ['meia-versatil'] };
    }
    case 'CMF': {
      const attacking = has('infiltracao') || /chegar|infiltrar|frente|atacar/i.test(slotItem.duty);
      return attacking
        ? { primary: ['meia-versatil', 'infiltracao', 'armador-criativo'], complementary: [] }
        : { primary: ['meia-versatil', 'armador-criativo', 'infiltracao'], complementary: ['primeiro-volante'] };
    }
    case 'AMF':
      return { primary: ['infiltracao', 'armador-criativo'], complementary: ['meia-versatil'] };
    case 'SS':
      return { primary: ['infiltracao', 'armador-criativo', 'artilheiro'], complementary: ['atacante-pivo', 'ala-produtivo'] };
    case 'CF':
      return { primary: ['artilheiro'], complementary: ['atacante-pivo'] };
    case 'LWF':
    case 'RWF':
      return { primary: ['armador-criativo'], complementary: ['ala-produtivo'] };
    case 'LMF':
    case 'RMF': {
      const wingBack = /ala|corredor|cruz/i.test(`${slotItem.label} ${slotItem.duty}`);
      return wingBack
        ? { primary: ['perito-cruzamento', 'meia-versatil'], complementary: ['lateral-defensivo'] }
        : { primary: ['meia-versatil', 'infiltracao', 'armador-criativo'], complementary: ['perito-cruzamento'] };
    }
    default:
      return { primary: slotItem.primaryRoles, complementary: slotItem.complementaryRoles };
  }
}

function normalizeIdealFormationStyles(styles: TacticalStyle[]): FormationCoachStyle[] {
  const converted = styles.map((style) => {
    if (style === 'POR_FORA') return 'POSSE_DE_BOLA';
    if (style === 'PASSE_LONGO') return 'CONTRA_ATAQUE';
    if (style === 'AUTO') return 'POSSE_DE_BOLA';
    return normalizeFormationCoachStyle(style);
  });
  return Array.from(new Set(converted));
}

for (const formation of FORMATION_BLUEPRINTS) {
  formation.idealStyles = normalizeIdealFormationStyles(formation.idealStyles);
  formation.slots = formation.slots.map((slotItem) => {
    const roles = metaRolesForBuiltInSlot(slotItem);
    return {
      ...slotItem,
      primaryRoles: uniqueRoleIds(roles.primary),
      complementaryRoles: uniqueRoleIds(roles.complementary).filter((id) => !roles.primary.includes(id))
    };
  });
}


export function getFormationBlueprint(id: string): FormationBlueprint {
  return FORMATION_BLUEPRINTS.find((formation) => formation.id === id) ?? FORMATION_BLUEPRINTS[0];
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}

function roleText(result: AnalysisResult) {
  return normalizeText(`${result.parsed.playstyle ?? ''} ${result.teamMap?.functionLabel ?? ''} ${result.buildName ?? ''}`);
}

export function getFormationRoleMeta2026(roleId: FormationRoleId, position: PositionCode) {
  const role = FORMATION_ROLE_CATALOG[roleId];
  return getPlayerStyleMeta2026(role.officialName, position);
}

function roleMatchScore(result: AnalysisResult, roleIds: FormationRoleId[], position: PositionCode) {
  const text = roleText(result);
  const actualStyle = canonicalizePlayerPlaystyle(result.parsed.playstyle);
  let best = 0;
  for (const roleId of roleIds) {
    const role = FORMATION_ROLE_CATALOG[roleId];
    const roleCanonical = canonicalizePlayerPlaystyle(role.officialName);
    const meta = getPlayerStyleMeta2026(role.officialName, position);
    const metaScore = meta?.score ?? 50;
    const roleName = normalizeText(role.officialName);
    const exactStyle = Boolean(actualStyle && roleCanonical && actualStyle === roleCanonical);
    if (exactStyle) best = Math.max(best, Math.round(25 + metaScore * .75));
    else if (text.includes(roleName)) best = Math.max(best, Math.round(18 + metaScore * .62));
    else if (role.positions.includes(result.bestPosition.code) || role.usablePositions?.includes(result.bestPosition.code)) best = Math.max(best, Math.round(28 + metaScore * .34));
    const matchedTraits = role.strengths.filter((trait) => text.includes(normalizeText(trait))).length;
    best = Math.max(best, Math.round(24 + matchedTraits * 9 + metaScore * .22));
  }
  return Math.min(100, best);
}

function positionMatchScore(result: AnalysisResult, slotItem: FormationSlot) {
  const selected = result.bestPosition.code;
  if (selected === slotItem.position) return 100;
  if (slotItem.alternatives.includes(selected)) return 82;
  if (result.permittedPositions?.some((position) => position.code === slotItem.position)) return 72;
  const sameLine = slotItem.line === 'ataque'
    ? ['CF','SS','LWF','RWF','AMF'].includes(selected)
    : slotItem.line === 'meio'
      ? ['DMF','CMF','AMF','LMF','RMF'].includes(selected)
      : slotItem.line === 'defesa'
        ? ['CB','LB','RB','DMF'].includes(selected)
        : selected === 'GK';
  return sameLine ? 48 : 12;
}

export function scorePlayerForFormationSlot(result: AnalysisResult, slotItem: FormationSlot): FormationSlotFit {
  const positionFit = positionMatchScore(result, slotItem);
  const primaryFit = roleMatchScore(result, slotItem.primaryRoles, slotItem.position);
  const complementaryFit = roleMatchScore(result, slotItem.complementaryRoles, slotItem.position);
  const phase = result.teamMap?.sectorScores;
  const phaseScore = slotItem.line === 'ataque'
    ? ((phase?.finalizacao ?? 60) * .5 + (phase?.aceleracao ?? 60) * .25 + (phase?.criacao ?? 60) * .25)
    : slotItem.line === 'meio'
      ? ((phase?.passe ?? 60) * .38 + (phase?.criacao ?? 60) * .24 + (phase?.marcacao ?? 60) * .2 + (phase?.aceleracao ?? 60) * .18)
      : slotItem.line === 'defesa'
        ? ((phase?.marcacao ?? 60) * .42 + (phase?.cobertura ?? 60) * .32 + (phase?.fisico ?? 60) * .16 + (phase?.passe ?? 60) * .1)
        : result.bestPosition.code === 'GK' ? 90 : 10;
  const actualMeta = getPlayerStyleMeta2026(result.parsed.playstyle, slotItem.position);
  const metaScore = actualMeta?.score ?? 55;
  const score = Math.max(0, Math.min(100, Math.round(positionFit * .42 + primaryFit * .27 + complementaryFit * .07 + phaseScore * .14 + metaScore * .10)));
  const reasons = [
    positionFit >= 90 ? `Posição natural para ${slotItem.label}.` : positionFit >= 70 ? `Pode atuar em ${slotItem.label} com adaptação segura.` : `Posição exige adaptação relevante.`,
    primaryFit >= 85 ? 'O estilo oficial combina com a prioridade deste espaço.' : primaryFit >= 58 ? 'A função é compatível, mas não é o encaixe mais específico.' : 'O estilo não corresponde à primeira recomendação do espaço.',
    actualMeta ? `Meta 2026: ${actualMeta.verdict}. ${actualMeta.advice}` : 'Estilo oficial ainda precisa ser confirmado.',
    `${slotItem.duty}`
  ];
  const warnings: string[] = [];
  if (positionFit < 55) warnings.push('Evite forçar este jogador fora da linha natural.');
  if (actualMeta?.tier === 'evitar') warnings.push(`Estilo marcado como “${actualMeta.verdict}” para esta posição.`);
  for (const restriction of actualMeta?.restrictions ?? []) warnings.push(restriction);
  if (score < 65) warnings.push('Procure outra carta ou ajuste a função do espaço.');
  return { slot: slotItem, player: result, score, roleFit: primaryFit, positionFit, reasons, warnings };
}

export function buildFormationLineup(results: AnalysisResult[], blueprint: FormationBlueprint): FormationSlotFit[] {
  const used = new Set<string>();
  const styleCounts = new Map<string, number>();
  const output: FormationSlotFit[] = [];

  for (const slotItem of blueprint.slots) {
    const ranked = results
      .filter((result) => !used.has(result.parsed.internalId))
      .map((result) => scorePlayerForFormationSlot(result, slotItem))
      .sort((a,b) => b.score - a.score);

    const compatible = ranked.find((candidate) => {
      const style = canonicalizePlayerPlaystyle(candidate.player?.parsed.playstyle);
      if (!style) return true;
      if (slotItem.position === 'CB' && style === 'Destruidor' && (styleCounts.get('CB:Destruidor') ?? 0) >= 1) return false;
      if (['LB', 'RB'].includes(slotItem.position) && ['Lateral Ofensivo', 'Lateral Atacante'].includes(style) && (styleCounts.get('FB:ofensivo') ?? 0) >= 1) return false;
      return true;
    });

    const best = compatible ?? ranked[0];
    if (!best || best.score < 48) {
      output.push({ slot: slotItem, player: null, score: 0, roleFit: 0, positionFit: 0, reasons:['Nenhum jogador salvo encaixa com segurança.'], warnings:['Adicione ou treine uma carta para esta função.'] });
      continue;
    }

    const style = canonicalizePlayerPlaystyle(best.player?.parsed.playstyle);
    if (style === 'Destruidor' && slotItem.position === 'CB') styleCounts.set('CB:Destruidor', (styleCounts.get('CB:Destruidor') ?? 0) + 1);
    if (style && ['Lateral Ofensivo', 'Lateral Atacante'].includes(style) && ['LB', 'RB'].includes(slotItem.position)) styleCounts.set('FB:ofensivo', (styleCounts.get('FB:ofensivo') ?? 0) + 1);
    used.add(best.player!.parsed.internalId);
    output.push(best);
  }

  return output;
}

export function styleAdviceForFormation(formation: FormationBlueprint, style: TacticalStyle) {
  const safeStyle = normalizeFormationCoachStyle(style);
  const idealStyles = normalizeIdealFormationStyles(formation.idealStyles);
  const fit = idealStyles.includes(safeStyle) ? 94 : 72;
  return {
    fit,
    label: fit >= 90 ? 'Encaixe forte' : 'Encaixe adaptado',
    note: fit >= 90
      ? `${styleLabel(safeStyle)} favorece o comportamento desta formação.`
      : `É possível usar ${styleLabel(safeStyle)}, mas preserve cobertura e funções complementares.`
  };
}

export function styleLabel(style: TacticalStyle) {
  const labels: Record<TacticalStyle,string> = {
    AUTO:'Posse de bola', POSSE_DE_BOLA:'Posse de bola', CONTRA_ATAQUE:'Contra-ataque normal',
    CONTRA_ATAQUE_RAPIDO:'Contra-ataque rápido', POR_FORA:'Posse de bola', PASSE_LONGO:'Contra-ataque normal'
  };
  return labels[style];
}
