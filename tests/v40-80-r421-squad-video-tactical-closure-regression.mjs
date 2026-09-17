import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.resolve(root, p), 'utf8');

const matchEngine = read('src/modules/matches/matchTrainerEngine.ts');
const matchCenter = read('src/modules/matches/MatchTrainerCenter.tsx');
const tacticalEngine = read('src/modules/tactical-studio/tacticalStudio2Engine.ts');
const tacticalStorage = read('src/modules/tactical-studio/tacticalStudio2Storage.ts');
const squadEngine = read('src/modules/squad-mapping/squadMappingEngine.ts');

assert.match(matchEngine, /\| 'interception'/, 'R421: MatchEventKind ainda não possui interceptação explícita.');
assert.match(matchEngine, /'interception':\s*\{[\s\S]{0,900}?group:\s*'positive'[\s\S]{0,900}?phase:\s*'defense'/, 'R421: interceptação precisa ser um evento defensivo positivo revisável.');
assert.match(matchEngine, /playerCardFingerprint\?: string \| null;/, 'R421: marcador não preserva identidade da carta vinculada.');
assert.match(matchEngine, /playerHistoryId\?: string \| null;/, 'R421: marcador não preserva vínculo com a ficha do Cofre.');
assert.match(matchEngine, /playerLabel\?: string \| null;/, 'R421: marcador não preserva nome humano do jogador.');
assert.match(matchEngine, /POSITIVE_KINDS[\s\S]{0,450}'interception'/, 'R421: interceptação não entra nas ações positivas.');
assert.match(matchEngine, /DEFENSE_KINDS[\s\S]{0,500}'interception'/, 'R421: interceptação não entra na leitura defensiva.');
assert.match(matchEngine, /Passe, marcação, finalização e interceptação só viram diagnóstico específico após confirmação humana/, 'R421: safeguard contra diagnóstico automático específico ausente.');

assert.match(matchCenter, /loadSquadMappingState/, 'R421: Match Trainer ainda não carrega o Mapeamento de Elenco.');
assert.match(matchCenter, /mappedPlayersR421/, 'R421: Match Trainer não mantém jogadores do elenco para vínculo.');
assert.match(matchCenter, /playerCardFingerprint:\s*selectedMappedPlayerR421\?\.cardFingerprint/, 'R421: marcador não sela a carta selecionada.');
assert.match(matchCenter, /playerHistoryId:\s*selectedMappedPlayerR421\?\.linkedHistoryId/, 'R421: marcador não sela a ficha vinculada.');
assert.match(matchCenter, /\{ kind: 'interception', label: 'Boa interceptação' \}/, 'R421: ação rápida de interceptação não está disponível na revisão.');
assert.match(matchCenter, /<select value=\{markerPlayer\}/, 'R421: jogador ainda é texto livre em vez de seleção do elenco.');

assert.doesNotMatch(tacticalEngine, /Apoio por fora|Amplitude oposta/, 'R421: sequência padrão ainda força jogo por fora.');
assert.match(tacticalEngine, /Aproximar por dentro/, 'R421: progressão central curta não foi materializada.');
assert.match(tacticalEngine, /Apoio interior/, 'R421: criação central não foi materializada.');

assert.match(tacticalStorage, /typeof project\.id !== 'string'/, 'R421: importação tática ainda aceita projeto sem identidade.');
assert.match(tacticalStorage, /project\.frames\.every/, 'R421: importação tática ainda valida apenas a existência de frames.');
assert.match(tacticalStorage, /frame\.actions\.every/, 'R421: ações importadas não são validadas estruturalmente.');
assert.doesNotMatch(tacticalStorage, /\.slice\(0,\s*MAX_TACTICAL_SEQUENCE_PROJECTS\)/, 'R421: teto artificial de projetos reapareceu.');

assert.match(squadEngine, /avoidWingers:\s*true/, 'R421: perfil central do Mapeamento perdeu o bloqueio de pontas.');
assert.match(squadEngine, /favorCentralTriangles:\s*true/, 'R421: perfil central do Mapeamento perdeu os triângulos centrais.');
assert.doesNotMatch(squadEngine, /result\.training\s*=/, 'R421: Mapeamento não pode reescrever a ficha permanente.');

console.log('R421 aprovada: elenco, vídeo revisável e Estúdio Tático convergem sem reescrever a ficha permanente.');
