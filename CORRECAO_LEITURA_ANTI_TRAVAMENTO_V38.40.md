# BuildMaster v38.40 — Hotfix anti-travamento da leitura de cartas

Este hotfix é aplicado sobre o mesmo pacote que corrigiu o acesso da conta principal.

## Problema corrigido

Ao tocar em **Ler imagem e continuar / Analisar carta**, o estado de leitura podia ficar preso. O usuário era enviado cedo demais para a área de resultado, perdia o controle de cancelamento e operações do IndexedDB/checkpoint ou do Tesseract podiam aguardar indefinidamente.

## Correções

- o checkpoint em segundo plano passou a ser persistido em modo best-effort e não bloqueia mais o início do OCR;
- a tela do leitor permanece visível durante o processamento;
- a área de Resultado só abre depois de existir uma leitura/draft utilizável;
- Cancelar leitura permanece acessível;
- o Leitor Total também ganhou cancelamento durante o processamento;
- abertura e transações do IndexedDB possuem watchdog, `onblocked` e `onabort`;
- uma operação Tesseract que ultrapassa o tempo seguro é encerrada e o worker é reiniciado;
- o número de passagens de alta precisão é adaptado à capacidade do aparelho;
- entre passagens, o leitor devolve um frame ao navegador para manter toque e navegação responsivos;
- login, conta principal, Cofre e fichas existentes foram preservados.

## Testes

- regressão OCR em segundo plano;
- regressão OCR anti-travamento;
- Cofre nativo;
- Mapeamento de elenco;
- identidade visual;
- abertura Android;
- base local grande;
- inicialização fail-open;
- login e Supabase;
- recuperação da conta principal;
- rota inicial/deep link;
- sintaxe TypeScript/TSX;
- contratos interativos;
- acessibilidade;
- pré-voo de produção;
- auditoria estrutural;
- manifesto de integridade.
