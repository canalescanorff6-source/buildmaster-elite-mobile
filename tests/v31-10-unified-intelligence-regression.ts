import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeCard, OFFICIAL_ADDITIONAL_SKILL_NAMES } from '../src/lib/analyzer';
import { applyCompleteCardIntelligence } from '../src/lib/cardIntelligencePipeline';

const projectRoot = path.resolve(__dirname, '..');
const readProjectFile = (relativePath: string): string => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');

const cfText = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Finalizador Individual
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Chute de primeira, Cabeçada, Precisão à distância
Talento ofensivo: 91
Controle de bola: 84
Drible: 81
Condução firme: 79
Passe rasteiro: 70
Passe alto: 66
Finalização: 93
Cabeceio: 85
Curva: 81
Velocidade: 88
Aceleração: 89
Força do chute: 92
Salto: 86
Contato físico: 83
Equilíbrio: 79
Resistência: 82
[FIM AJUSTES]`;

const amfText = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Criador Individual
POSIÇÃO PRINCIPAL: AMF
ESTILO DE JOGO: Armador Criativo
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Passe de primeira, Passe em profundidade, Controle com a sola
Talento ofensivo: 87
Controle de bola: 91
Drible: 88
Condução firme: 90
Passe rasteiro: 92
Passe alto: 89
Finalização: 78
Curva: 87
Velocidade: 79
Aceleração: 84
Força do chute: 80
Contato físico: 69
Equilíbrio: 88
Resistência: 83
[FIM AJUSTES]`;

const tallCfText = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Finalizador Aéreo Individual
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Homem de Área
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Chute de primeira
Altura: 195
Finalização: 90
Cabeceio: 92
Salto: 90
Contato físico: 91
Velocidade: 80
Aceleração: 77
[FIM AJUSTES]`;

const agileCfText = `[AJUSTES MANUAIS]
CONFIRMAÇÃO MANUAL: SIM
NOME DO JOGADOR: Finalizador Ágil Individual
POSIÇÃO PRINCIPAL: CF
ESTILO DE JOGO: Artilheiro
PONTOS TOTAIS: 64
HABILIDADES JÁ POSSUI: Chute de primeira
Altura: 168
Finalização: 90
Controle de bola: 91
Drible: 90
Condução firme: 91
Equilíbrio: 94
Velocidade: 91
Aceleração: 93
[FIM AJUSTES]`;

const scenarios = [
  { id: 'finalizador', text: cfText, position: 'CF', fileName: 'finalizador.png' },
  { id: 'criador', text: amfText, position: 'AMF', fileName: 'criador.png' },
  { id: 'aereo', text: tallCfText, position: 'CF', fileName: 'alto.png' },
  { id: 'agil', text: agileCfText, position: 'CF', fileName: 'agil.png' },
] as const;

const results = scenarios.map((scenario) => ({
  ...scenario,
  result: applyCompleteCardIntelligence(analyzeCard(scenario.text, 'COMPETITIVE', scenario.position, scenario.fileName)),
}));

for (const scenario of results) {
  const { result } = scenario;
  try {
    assert.ok(result.unifiedIntelligence, 'A inteligência integrada precisa existir.');
    assert.match(
      result.unifiedIntelligence?.engineVersion ?? '',
      /^(?:(?:31\.10|31\.30|31\.82)-unified-intelligence-|(?:(?:32\.00|35\.00)-unified-calibrated-|35\.10-unified-max-gameplay-|35\.20-unified-dna-gameplay-|38\.(?:37|38|39|40)-automatic-card-gameplay-))/,
      'O motor deve pertencer a uma versão reconhecida da inteligência integrada ou do perfil automático.',
    );
    assert.ok((result.unifiedIntelligence?.simulation.generatedCandidates ?? 0) >= 500, 'A simulação precisa gerar ao menos 500 candidatas.');
    assert.ok((result.unifiedIntelligence?.simulation.validCandidates ?? 0) >= 10, 'A simulação precisa manter ao menos 10 candidatas válidas.');
    assert.equal(result.recommendedSkills.length, 5, 'A carta precisa receber exatamente cinco habilidades adicionais.');
    assert.equal(new Set(result.recommendedSkills).size, 5, 'As cinco habilidades adicionais precisam ser únicas.');
    assert.ok(
      result.recommendedSkills.every((skill) => OFFICIAL_ADDITIONAL_SKILL_NAMES.includes(skill as typeof OFFICIAL_ADDITIONAL_SKILL_NAMES[number])),
      'Todas as habilidades recomendadas precisam existir no catálogo oficial.',
    );
    assert.ok(
      result.recommendedSkills.every((skill) => !result.parsed.nativeSkills.some((owned) => owned.toLocaleLowerCase('pt-BR') === skill.toLocaleLowerCase('pt-BR'))),
      'Nenhuma habilidade nativa pode reaparecer nas cinco adicionais.',
    );
    assert.equal(result.unifiedIntelligence?.skillPlan.length, 5, 'O plano inteligente precisa explicar as cinco habilidades.');
    assert.ok(result.unifiedIntelligence?.skillPlan.every((skill) => skill.reasons.length >= 2), 'Cada habilidade precisa ter ao menos dois motivos técnicos.');
    assert.ok((result.unifiedIntelligence?.impetoPlan.score ?? 0) >= 0, 'O plano de Ímpeto/Booster precisa ter uma nota válida.');
    assert.ok(result.unifiedIntelligence?.learning.abComparison, 'A comparação A/B precisa permanecer disponível.');
    assert.ok(Array.isArray(result.unifiedIntelligence?.learning.testedPlans), 'Os planos testados precisam permanecer registrados.');
    assert.ok(result.trainingPointsUsed <= result.trainingPointsTotal, 'A ficha não pode ultrapassar o orçamento de pontos.');
    assert.ok(result.buildVariants.length >= 1 && result.buildVariants.length <= 5, 'O motor pode produzir de uma a cinco fichas alternativas.');
    assert.match(result.buildName, /(?:Inteligência v31|Ficha Elite Suprema|Ficha v32|Ficha v35|Ficha Automática v(?:38\.(?:37|38|39|40)|40\.(?:00|10|20|30|40|50|60|70|80)))/);
  } catch (error) {
    console.error(`\n[v31.00] Cenário que falhou: ${scenario.id}`);
    console.error(`[v31.00] engineVersion: ${result.unifiedIntelligence?.engineVersion ?? 'ausente'}`);
    console.error(`[v31.00] buildName: ${result.buildName}`);
    console.error(`[v31.00] skills: ${JSON.stringify(result.recommendedSkills)}`);
    console.error(`[v31.00] pontos: ${result.trainingPointsUsed}/${result.trainingPointsTotal}`);
    console.error(`[v31.00] variantes: ${result.buildVariants.length}`);
    throw error;
  }
}

const cf = results[0].result;
const amf = results[1].result;
const tallCf = results[2].result;
const agileCf = results[3].result;

assert.notDeepEqual(cf.recommendedSkills, amf.recommendedSkills, 'Cartas de estilos e funções diferentes não podem receber a mesma lista genérica.');
assert.notDeepEqual(tallCf.recommendedSkills, agileCf.recommendedSkills, 'Cartas da mesma posição precisam divergir quando corpo e atributos pedem funções distintas.');
assert.ok(tallCf.recommendedSkills.some((skill) => ['Cabeçada', 'Superioridade aérea', 'Finalização acrobática'].includes(skill)), 'O centroavante aéreo precisa receber uma habilidade sustentada pelo modelo corporal.');
assert.ok(agileCf.recommendedSkills.some((skill) => ['Toque duplo', 'Controle com a sola', 'Giro 360°', 'Elástico', 'Corte com virada'].includes(skill)), 'O centroavante ágil precisa receber uma habilidade de controle corporal.');
assert.ok(!tallCf.recommendedSkills.includes('Chapéu'), 'Uma habilidade de efeito não pode ocupar uma vaga funcional no centroavante aéreo.');
assert.ok(cf.recommendedSkills.some((skill) => ['Toque de calcanhar', 'Controle com a sola', 'Passe de primeira', 'Finalização acrobática', 'Efeito de longe', 'Chute ascendente', 'Chute com o peito do pé', 'Controle da cavadinha', 'Toque duplo'].includes(skill)));
assert.ok(amf.recommendedSkills.some((skill) => ['Passe na medida', 'Toque de calcanhar', 'Passe sem olhar', 'Toque duplo', 'Curva para fora'].includes(skill)));

const learningEngine = readProjectFile('src/lib/unifiedCardIntelligence.ts');
assert.match(learningEngine, /testedPlans/);
assert.match(learningEngine, /variantASamples/);
assert.match(learningEngine, /Ficha testada em/);
const workspace = readProjectFile('src/components/result/ResultWorkspace.tsx');
assert.match(workspace, /Ficha A • principal/);
assert.match(workspace, /Ficha B • teste/);
assert.match(workspace, /trainingPlan: selectedPlan/);
const pipeline = readProjectFile('src/lib/cardIntelligencePipeline.ts');
assert.match(pipeline, /applyUnifiedCardIntelligence/);
const ui = readProjectFile('src/components/result/UnifiedIntelligenceCard.tsx');
assert.match(ui, /Habilidades personalizadas para esta carta/);
assert.match(ui, /Teste A\/B/);
assert.match(ui, /Comparação A\/B real/);
const css = readProjectFile('src/app/globals.css');
assert.match(css, /BuildMaster v31\.10 — inteligência integrada/);
assert.match(css, /teste A\/B registrado por partida/);

console.log('v31.10 DNA 2.0, simulador profundo, integração, aprendizado e habilidades personalizadas aprovados.');
