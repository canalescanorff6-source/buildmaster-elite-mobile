import assert from 'node:assert/strict';
import { getAdaptiveSinglePrintZones } from '../src/modules/card-reader/singlePrintPro';
import { readDetailedPrint } from '../src/modules/card-reader/detailedPrintReader';
import { EFHUB_EXPECTED_COUNTS, EFHUB_PROFILE_VERSION, looksLikeEfhubProfileText } from '../src/modules/card-reader/efhubProfile';
import type { PremiumZoneReading } from '../src/lib/premiumReading';
import { assertInternalVersionAtLeast } from './_internal-version';

function reading(key: PremiumZoneReading['key'], text: string, confidence = 93): PremiumZoneReading {
  return {
    key,
    label: String(key),
    text,
    confidence,
    status: 'confirmed',
    originPreview: null,
    enhancement: 'contrast',
    rawPasses: [
      { text, confidence, enhancement: 'contrast', kind: `${key}:exact` },
      { text, confidence: confidence - 2, enhancement: 'sharp', kind: `${key}:tight` },
      { text, confidence: confidence - 4, enhancement: 'binary', kind: `${key}:wide` }
    ],
    alternatives: [],
    passCount: 3,
    agreement: 3,
    consistency: 96
  };
}

assertInternalVersionAtLeast(EFHUB_PROFILE_VERSION, 32, 0, 'Perfil eFHUB');
assert.deepEqual(EFHUB_EXPECTED_COUNTS, { attributes: 26, positions: 13, physicalModel: 16 });

const geometry = getAdaptiveSinglePrintZones(1400, 1600);
assert.equal(geometry.template, 'detailed-profile');
assert.equal(geometry.zones.length, 19);
assert.equal(geometry.zones.filter((zone) => zone.key === 'skills').length, 7);
assert.equal(geometry.zones.find((zone) => zone.key === 'attributes')?.label, 'Tabela completa de 26 atributos');

const attributes = [
  'Talento ofensivo 67', 'Controle de bola 77', 'Drible 74', 'Condução firme 77',
  'Passe rasteiro 80', 'Passe alto 75', 'Finalização 72', 'Cabeçada 65', 'Bola parada 68', 'Curva 70',
  'Talento defensivo 77', 'Dedicação defensiva 83', 'Desarme 82', 'Agressividade 83',
  'Talento de GO 40', 'Firmeza de GO 40', 'Defesa de GO 40', 'Reflexos de GO 40', 'Alcance de GO 40',
  'Velocidade 79', 'Aceleração 83', 'Força do chute 82', 'Salto 78', 'Contato físico 82', 'Equilíbrio 76', 'Resistência 83'
].join('\n');
const positions = ['LWF 85', 'CF 83', 'RWF 85', 'SS 84', 'AMF 85', 'LMF 87', 'CMF 88', 'RMF 87', 'DMF 88', 'LB 89', 'CB 88', 'RB 89', 'GK 45'].join('\n');
const physical = [
  'Comprimento do braço 6', 'Largura dos ombros 5', 'Comprimento do pescoço 5', 'Chest 7',
  'Tamanho do pescoço 10', 'Altura do ombro 0', 'Comprimento da perna 12', 'Tamanho da coxa 5',
  'Tamanho da cintura 8', 'Tamanho do braço 6', 'Tamanho da panturrilha 7',
  'Raio de cobertura das pernas 164.6', 'Raio de cobertura dos braços 151.2', 'Altura de salto 248.6',
  'Colisão do tronco 46.3', 'Altura com base no comprimento 173'
].join('\n');
const skills = [
  'Precisão à distância', 'Passe de primeira', 'Marcação ind.', 'Volta para marcar', 'Interceptação',
  'Espírito guerreiro', 'Bloqueador', 'Carrinho', 'Esticada de Perna', 'Sombra veloz'
].join('\n');

const fullText = [
  'Edgar Davids', 'O destruidor', 'GER: 88', 'POSIÇÃO PRINCIPAL: DMF',
  'Altura 168 cm', 'Peso 69 kg', 'Idade 25', 'Nível 33',
  'Pior pé (frequência) Raramente', 'Pior pé (precisão) Alta', 'Condição física Estável', 'Resistência à lesão Médio',
  'Duelo +3', 'Sem Impulso', positions, attributes, 'MODELO DE JOGADOR', physical, 'HABILIDADES', skills
].join('\n');
assert.equal(looksLikeEfhubProfileText(fullText), true);

const result = readDetailedPrint(fullText, [
  reading('name', 'Edgar Davids'),
  reading('playstyle', 'O destruidor'),
  reading('overall', 'GER 88'),
  reading('mainPosition', 'DMF'),
  reading('identityMeta', 'Altura 168 cm\nPeso 69 kg\nIdade 25\nNível 33'),
  reading('condition', 'Pior pé (frequência) Raramente\nPior pé (precisão) Alta\nCondição física Estável\nResistência à lesão Médio'),
  reading('positionGrid', positions),
  reading('impetos', 'Duelo +3\nSem Impulso'),
  reading('attributes', attributes),
  reading('physicalModel', physical),
  reading('skills', `HABILIDADES\n${skills}`)
]);

assert.equal(result.profileAudit.detected, true);
assert.equal(result.profileAudit.ready, true);
assert.equal(result.identity.playerName?.value, 'Edgar Davids');
assert.equal(result.identity.playstyle?.value, 'Destruidor');
assert.equal(result.coverage.attributeCount, 26);
assert.equal(result.coverage.positionCount, 13);
assert.equal(result.coverage.physicalCount, 16);
assert.ok(result.skills.some((skill) => skill.value === 'Esticada de Perna'));
assert.ok(result.skills.some((skill) => skill.value === 'Sombra veloz'));
assert.ok(result.skills.some((skill) => skill.value === 'Marcação individual'));
assert.equal(result.skillCandidates.length, 0);

console.log('v31.75 leitor eFHUB dinâmico, portões 26/13/16 e habilidades completas aprovados.');
