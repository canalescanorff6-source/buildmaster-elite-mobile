# BuildMaster v40.20 — Leitura dos 8 Quadrados

## Correções principais

- O modo manual usa exatamente 8 leituras OCR primárias: Identidade, Carta, Bio, Posições, Ímpetos, Atributos, Modelo físico e Habilidades.
- O modelo português continua sendo o `4.0.0_best_int`, preservando a precisão, mas é descompactado no GitHub Actions e entra no APK como `por.traineddata`.
- O WebView não precisa mais descompactar `por.traineddata.gz` durante a análise da carta.
- Nome, Atributos e Habilidades recebem no máximo uma conferência seletiva se o primeiro passe vier vazio ou com confiança baixa.
- A leitura completa tem limite global de 90 segundos; não pode permanecer processando indefinidamente.
- A inicialização do worker OCR tem limite de 18 segundos e cada quadrado possui prazo próprio.
- O parser reconhece tanto a assinatura antiga `40.00-calibrated-fields-r1` quanto a nova `40.20-eight-macros-r1`, evitando descartar nomes lidos pelo novo motor.
- A porcentagem da leitura é monotônica: não volta para trás.
- A estimativa de tempo usa o prazo global e a média real dos quadrados concluídos, impedindo previsões que só aumentam.

## Objetivo de tempo

O alvo é concluir a leitura dentro de aproximadamente 1 minuto a 1 minuto e 30 segundos no Android, dependendo do aparelho e da complexidade do print. Se um campo crítico exigir conferência, somente esse campo é relido.

## Validações executadas localmente

- Sintaxe TypeScript/TSX: 431 arquivos aprovados.
- Contratos interativos: 775 botões e 32 imagens com `alt` aprovados.
- Visual/acessibilidade: aprovado.
- Rotas críticas: aprovadas.
- Pré-voo: 138 verificações aprovadas.
- Auditoria estrutural: 127 verificações aprovadas.
- Integridade: 1034 arquivos aprovados.
- Regressão v40.00: aprovada.
- Regressão v38.40 do leitor calibrado: aprovada.
- Regressão v40.20 dos 8 quadrados: aprovada.
- Regressão v40.20 de bootstrap Android: aprovada.

## Limitação de validação

O pacote não contém `node_modules`; portanto, `npm ci` e o typecheck global completo serão executados pelo GitHub Actions antes da geração do APK.
