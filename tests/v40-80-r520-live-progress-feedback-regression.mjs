import assert from 'node:assert/strict';
import fs from 'node:fs';

const progressBars = fs.readFileSync('src/components/ProgressBarsV4010.tsx', 'utf8');

assert.match(
  progressBars,
  /function usePhaseElapsed\(/,
  'R520: updater/leitor devem informar tempo decorrido nas etapas longas em vez de parecerem travados.',
);
assert.match(
  progressBars,
  /Aguardando o primeiro bloco do APK|aguardando o primeiro bloco do APK/i,
  'R520: download ainda sem bytes deve explicar que o Android/servidor ainda está iniciando a transferência.',
);
assert.match(
  progressBars,
  /Verificando tamanho, SHA-256, pacote e assinatura/,
  'R520: etapa de verificação deve dizer exatamente o que está sendo conferido.',
);
assert.match(
  progressBars,
  /Preparando o APK baixado|Copiando o APK baixado/,
  'R520: etapa pós-download deve ser explícita e não fingir extração inexistente.',
);
assert.doesNotMatch(
  progressBars,
  /Extraindo atualização|Extraindo APK/,
  'R520: não deve rotular como extração quando o fluxo real baixa um APK diretamente.',
);
assert.match(
  progressBars,
  /OCR local continua trabalhando|leitura continua ativa/i,
  'R520: leitor deve dar feedback temporal durante OCR longo sem inventar porcentagem.',
);

console.log('R520 aprovada: updater e leitor exibem progresso vivo, tempo decorrido e etapas reais sem percentuais fictícios.');
