# BuildMaster v38.40 — Identidade Premium BM

Base aplicada: `buildmaster-elite-mobile-v38.40-mapeamento-regressao-v34-corrigida.zip`.

## O que foi implementado

- novo ícone oficial BM em azul, prata e campo tático;
- ícones Android legados em todas as densidades;
- Adaptive Icon para Android 8 ou superior;
- ícone monocromático para temas dinâmicos do Android 13 ou superior;
- ícones PWA de 192 e 512 pixels, incluindo variantes maskable;
- nova marca usada no login, cabeçalho, menu e demais áreas que usam `BuildMasterMark`;
- splash premium vertical dentro do aplicativo;
- splash nativa Android antes da abertura do conteúdo web;
- cache atualizado para impedir que a arte antiga continue sendo reutilizada;
- instalação automática da identidade no projeto Android limpo gerado pelo GitHub Actions;
- aplicação idêntica nos workflows de APK direto e AAB da Google Play.

## Instalação automática no Android

O script `scripts/install-android-branding.mjs` é executado logo depois de `cap add android`. Ele instala:

- `ic_launcher`;
- `ic_launcher_round`;
- foreground e background adaptativos;
- recurso monocromático;
- splash nativa;
- referências corretas no `AndroidManifest.xml`.

Isso evita que o Capacitor recoloque o ícone padrão sempre que o diretório `android` é recriado.

## Segurança e dados

A mudança não adiciona permissões e não altera a assinatura, o armazenamento privado, o login, o Cofre ou o Mapeamento. A atualização pode ser instalada por cima da versão atual.

## Validação

- regressões v38.40 aprovadas;
- regressões visuais v34.00 e v36.00 aprovadas;
- simulação de instalação em projeto Android limpo aprovada;
- sintaxe aprovada em 359 arquivos TypeScript/TSX;
- 761 botões e 30 imagens aprovados nos contratos interativos;
- auditoria aprovada em 122 verificações;
- pré-voo aprovado em 137 verificações.
