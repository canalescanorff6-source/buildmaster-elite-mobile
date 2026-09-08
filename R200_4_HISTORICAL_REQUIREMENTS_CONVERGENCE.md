# R200.4 — Convergência de requisitos históricos

Esta rodada cruza o estado verde R200.3 com requisitos recuperados das fases anteriores do BuildMaster Elite Tático e restaura capacidades que haviam sido reduzidas durante refatorações posteriores.

## Restaurado

- Estúdio Tático 2.0: biblioteca de sequências ampliada de 20 para 40 projetos por conta.
- Importação de sequências em JSON com limite de 1,5 MB, mantendo exportação existente.
- Importação de imagens no Estúdio por arquivos/galeria, câmera, colar e arrastar/soltar.
- Formatos reconhecidos: JPG/JPEG, PNG, WebP, GIF, BMP, SVG, AVIF, HEIC/HEIF e TIFF/TIF.
- AVIF, HEIC/HEIF e TIFF/TIF sem codec local deixam de ser descartados: o original permanece na galeria com prévia substituta e orientação para conversão PNG/JPEG.
- Papéis de imagem restaurados: cenário/fundo, marca d'água, escudo/logotipo, camada livre redimensionável e imagem de referência não exportada.
- Projetos salvos e rascunho passam a preservar as novas camadas e a referência visual.

## Preservado

- R118–R200.3 e a autoridade final Clean Slate não foram modificados.
- A ficha, Top 5, Ímpeto, identidade Jogador→Carta→Evidência→Build e posição permanente não são tocados por esta rodada.
- Estúdio continua local, sem API paga, com SVG/PNG/PDF e JSON editável.
- Atualizador continua exigindo backup, tamanho, SHA-256, pacote, versionCode e assinatura antes da instalação.
- Workflows GitHub permanecem fora do pacote mobile-update, conforme a proteção do canal móvel.
