import type { TacticalFormation } from './analyzer';
import { type OpponentProfile, type OpponentStrength } from './opponentAnalysis';

export type ReadConfidence = 'alta' | 'média' | 'baixa' | 'não confirmado';
export type OpponentPrintField<T> = { value: T | null; confidence: ReadConfidence; evidence: string };
export type OpponentPrintReport = {
  formation: OpponentPrintField<TacticalFormation>;
  profile: OpponentPrintField<OpponentProfile>;
  strength: OpponentPrintField<OpponentStrength>;
  manager: OpponentPrintField<string>;
  visibleNames: string[];
  rawText: string;
  warnings: string[];
  overallConfidence: ReadConfidence;
};

const FORMATIONS: TacticalFormation[] = ['4-2-2-2','4-3-3','4-1-2-3','4-2-1-3','4-2-3-1','4-3-1-2','4-1-3-2','4-4-2','4-1-4-1','3-2-4-1','3-4-3','3-5-2','5-3-2','5-2-3'];
const MANAGERS = ['Fabio Capello','Johan Cruyff','Franz Beckenbauer','Frank Rijkaard','Cristian Chivu','Roberto Martínez','Thomas Tuchel','Didier Deschamps','Hansi Flick','Vincenzo Montella','Mikel Arteta','Pep Guardiola','Jürgen Klopp','Xabi Alonso','Julian Nagelsmann','Ronald Koeman','Massimiliano Allegri','Rúben Amorim','G. Gasperini','L. Spalletti','Simone Inzaghi','José Mourinho','Cristóbal Buena'];

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
function field<T>(value: T | null, confidence: ReadConfidence, evidence = ''): OpponentPrintField<T> { return { value, confidence, evidence }; }
function hasAny(text: string, terms: string[]) { return terms.find((term) => text.includes(normalize(term))) ?? null; }

export function readOpponentPrintText(rawText: string): OpponentPrintReport {
  const text = normalize(rawText);
  const compact = text.replace(/[–—_]/g, '-').replace(/\s+/g, ' ');

  let formation = field<TacticalFormation>(null, 'não confirmado', 'Nenhuma formação legível.');
  for (const value of FORMATIONS) {
    const flexible = value.replace(/-/g, '[\\s\\-.:]*');
    if (new RegExp(`(^|[^0-9])${flexible}([^0-9]|$)`).test(compact)) {
      formation = field(value, 'alta', `Formação ${value} encontrada no texto.`);
      break;
    }
  }

  const profileRules: Array<[OpponentProfile, string[]]> = [
    ['CONTRA_RAPIDO',['contra-ataque rapido','quick counter','contra ataque rapido']],
    ['CONTRA_LONGO',['contra-ataque longo','long ball counter','contra ataque longo']],
    ['POSSE',['posse de bola','possession game','posse']],
    ['POR_FORA',['por fora','out wide','pelas laterais']],
    ['PRESSAO_ALTA',['pressao alta','pressing','gegenpress']],
    ['BLOCO_BAIXO',['bloco baixo','defesa fechada']],
    ['BOLA_AEREA',['bola aerea','cruzamentos','jogo aereo']]
  ];
  let profile = field<OpponentProfile>(null, 'não confirmado', 'Estilo coletivo não legível.');
  for (const [value, terms] of profileRules) {
    const evidence = hasAny(text, terms);
    if (evidence) { profile = field(value, 'alta', `Expressão detectada: ${evidence}.`); break; }
  }

  const strengthRules: Array<[OpponentStrength, string[]]> = [
    ['VELOCIDADE',['velocidade','speed','aceleracao']], ['PASSE',['passe','passing','passe rasteiro']],
    ['FISICO',['contato fisico','physical contact','fisico']], ['DRIBLE',['drible','dribbling']],
    ['FINALIZACAO',['finalizacao','finishing']], ['CRUZAMENTO',['cruzamento','crossing','passe alto']],
    ['PRESSAO',['pressao','agressividade','pressing']]
  ];
  let strength = field<OpponentStrength>(null, 'não confirmado', 'Nenhuma força principal confirmada.');
  let bestHits = 0;
  for (const [value, terms] of strengthRules) {
    const hits = terms.reduce((sum, term) => sum + (text.includes(normalize(term)) ? 1 : 0), 0);
    if (hits > bestHits) { bestHits = hits; strength = field(value, hits >= 2 ? 'média' : 'baixa', `Palavras relacionadas encontradas: ${hits}.`); }
  }

  let manager = field<string>(null, 'não confirmado', 'Técnico não identificado.');
  for (const name of MANAGERS) {
    const parts = normalize(name).split(/\s+/).filter((part) => part.length > 3);
    const hits = parts.filter((part) => text.includes(part));
    if (hits.length >= Math.min(2, parts.length)) { manager = field(name, 'alta', `Nome compatível encontrado: ${hits.join(', ')}.`); break; }
    if (hits.length === 1 && manager.value === null) manager = field(name, 'baixa', `Somente parte do nome encontrada: ${hits[0]}.`);
  }

  const visibleNames = rawText.split(/\n+/).map((line) => line.trim()).filter((line) => /^[A-Za-zÀ-ÿ.' -]{4,32}$/.test(line) && !/posse|contra|formacao|equipe|time|overall|jogador/i.test(line)).slice(0, 11);
  const confirmed = [formation, profile, strength, manager].filter((item) => item.confidence === 'alta' || item.confidence === 'média').length;
  const overallConfidence: ReadConfidence = confirmed >= 3 ? 'alta' : confirmed === 2 ? 'média' : confirmed === 1 ? 'baixa' : 'não confirmado';
  const warnings = [];
  if (!formation.value) warnings.push('Formação não confirmada; selecione manualmente antes de aplicar.');
  if (!profile.value) warnings.push('Estilo coletivo não confirmado; o print pode não mostrar essa área.');
  if (strength.confidence === 'baixa') warnings.push('A força principal foi apenas inferida por palavras soltas e precisa de confirmação.');
  if (rawText.trim().length < 20) warnings.push('Pouco texto extraído. Use um print direto, sem recorte excessivo.');

  return { formation, profile, strength, manager, visibleNames, rawText, warnings, overallConfidence };
}
