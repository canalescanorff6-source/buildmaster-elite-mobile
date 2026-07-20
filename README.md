# BuildMaster Elite Tático v27.34

Aplicativo Android/Next.js para criação de fichas, leitura de prints, análise de jogadores, gestão do elenco, planos de partida, Cofre, contas/licenças, treinos e produção de artes táticas do eFootball.

## Estúdio Tático Completo

A v27.34 transforma as formações do BuildMaster em pôsteres táticos locais, sem API paga, usando os estilos oficiais da carta e o Meta eFootball 2026:

- formação e escalação automáticas;
- 22 estilos oficiais de jogador, normalizados por posição;
- somente Posse de bola, Contra-ataque rápido e Contra-ataque normal como estilos do técnico nas formações;
- regras Meta 2026, incluindo um único ZAG Destruidor e prioridade para 1º Volante + Meia versátil;
- setas automáticas ou editáveis;
- quatro tipos de linha: apoio, reciclagem, defesa e movimentação;
- textos, instruções e princípios editáveis;
- cinco temas e cores personalizadas;
- biblioteca por conta, duplicação e rascunho automático;
- exportação PNG, SVG, impressão/PDF, JSON e compartilhamento.

## Atualização Android reforçada

O atualizador usa o `DownloadManager` do Android como transporte principal. Ao concluir o download, os bytes são lidos pela API oficial `openDownloadedFile`, copiados para o armazenamento privado do aplicativo e conferidos antes da instalação. O transporte HTTP permanece como reserva.

A validação inclui:

- tamanho real e SHA-256;
- cabeçalho do APK;
- pacote, versão e `versionCode`;
- certificado de assinatura;
- ativo imutável e espelhos oficiais;
- exclusão automática de arquivos incompletos;
- diagnóstico técnico e memória de saúde das rotas.

O workflow `.github/workflows/build-apk.yml` publica o APK somente depois dos testes e ativa o manifesto apenas após validar publicamente o mesmo arquivo.

## Validação local

```bash
npm ci
npm run typecheck
npm run quality:audit
npm run test:all
npm run apk:build-web
```

Relatório: `docs/current/VALIDACAO_V27_34_META_EFOOTBALL_2026.md`  
Instruções: `LEIA-PRIMEIRO-V27.34-META-EFOOTBALL-2026.txt`

O APK oficial assinado é gerado pelo GitHub Actions com o secret permanente `ANDROID_SIGNING_BUNDLE`.
