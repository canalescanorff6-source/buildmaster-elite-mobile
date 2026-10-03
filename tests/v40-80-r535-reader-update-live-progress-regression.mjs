import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const worker = read('src/lib/ocrWorkerManager.ts');
const progressUi = read('src/components/ProgressBarsV4010.tsx');

const fileDigest = worker.match(/export async function fileDigest[\s\S]*?\n}/)?.[0] ?? '';
assert.match(worker, /const DIGEST_CHUNK_BYTES = 256 \* 1024;/,
  'R535: a assinatura da imagem deve trabalhar em blocos pequenos e limitados.');
assert.match(fileDigest, /for \(let offset = 0; offset < file\.size; offset \+= DIGEST_CHUNK_BYTES\)/,
  'R535: o leitor deve percorrer o arquivo em chunks, sem copiar a imagem inteira de uma vez.');
assert.match(fileDigest, /file\.slice\(offset, Math\.min\(file\.size, offset \+ DIGEST_CHUNK_BYTES\)\)\.arrayBuffer\(\)/,
  'R535: cada leitura da assinatura deve usar somente o slice atual.');
assert.doesNotMatch(fileDigest, /const bytes = await file\.arrayBuffer\(\)/,
  'R535: o checkpoint de 10% não pode alocar um ArrayBuffer do print inteiro.');
assert.match(fileDigest, /Preparando assinatura segura da imagem/,
  'R535: a etapa logo após 10% precisa continuar emitindo atividade visível.');
assert.match(fileDigest, /Assinatura simplificada pronta/,
  'R535: falha no hash criptográfico deve degradar para uma identidade segura de cache em vez de abortar silenciosamente o leitor.');

assert.match(progressUi, /function useUpdatePhaseActivity\(/,
  'R535: o progresso de atualização precisa manter relógio de atividade por etapa.');
assert.match(progressUi, /Etapa \$\{stageIndex\} de \$\{stageTotal\}/,
  'R535: o usuário deve enxergar a posição da atualização no fluxo completo.');
assert.match(progressUi, /sem novos bytes há/,
  'R535: download temporariamente sem bytes novos deve continuar explicando que está ativo.');
assert.match(progressUi, /Aguardando os primeiros dados há/,
  'R535: a espera antes do primeiro byte deve ficar explícita em vez de parecer uma barra travada.');
assert.match(progressUi, /Conferindo SHA-256, tamanho, pacote e versão/,
  'R535: a validação pós-download precisa ser descrita de forma concreta.');
assert.doesNotMatch(progressUi, /Extraindo atualização|Extraindo APK/,
  'R535: não deve afirmar extração se o fluxo real apenas baixa, copia, verifica e abre o instalador.');

console.log('R535 aprovada: leitor usa assinatura em chunks e atualização mostra atividade real do início ao instalador sem progresso fictício.');
