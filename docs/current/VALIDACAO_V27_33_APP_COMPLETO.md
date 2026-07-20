# Validação — BuildMaster Elite Tático v27.33.0

## Entrega

A v27.33 consolida a base completa do aplicativo e acrescenta um Estúdio Tático realmente editável, além de reforçar o transporte do atualizador Android.

## Estúdio Tático

Foram implementados e verificados:

- criação de pôster vertical e horizontal;
- geração local por SVG/Canvas, sem API paga;
- PNG em qualidade 1x, 1,5x e 2x;
- SVG editável;
- impressão e salvamento em PDF pelo sistema;
- exportação e importação do projeto em JSON;
- compartilhamento pelo Android/Web Share quando disponível;
- cinco temas e quatro cores personalizáveis;
- setas automáticas e editor manual de setas;
- tipos apoio, reciclagem, defesa e movimentação sem bola;
- origem, destino, curvatura, rótulo, ativação e exclusão por seta;
- nomes e funções dos jogadores editáveis;
- instruções ofensivas, defensivas e alertas editáveis;
- biblioteca com até 60 projetos, duplicação, exclusão e migração da v27.32;
- rascunho automático separado por formação.

## Atualizador Android

O transporte principal usa `DownloadManager`. A v27.33 deixou de depender do caminho físico do arquivo baixado: o conteúdo é aberto por `DownloadManager.openDownloadedFile`, lido via `ParcelFileDescriptor`, copiado para arquivo privado e só então validado.

Também permanecem:

- HTTP próprio como reserva;
- bloqueio de downloads concorrentes;
- tentativas limitadas e alternância de rota/transporte;
- tamanho real e SHA-256;
- cabeçalho ZIP/APK;
- packageId, versão, `versionCode` e assinatura;
- exclusão de APK incompleto ou recusado;
- diagnóstico de host, HTTP, tamanho e hash;
- release imutável, ativo versionado e `BuildMaster-Elite-Tatico-latest.apk` para compatibilidade;
- manifesto ativado somente após validação pública do APK.

## Validações executadas

- TypeScript estrito: aprovado.
- Teste específico da v27.33: aprovado.
- Auditoria automática: 31 verificações obrigatórias aprovadas.
- Todas as regressões listadas em `test:all`: executadas em grupos e aprovadas.
- Exportação estática Next.js: aprovada.
- Projeto Capacitor Android: criado e sincronizado.
- Instalação do plugin nativo v27.33: aprovada.
- Dependências de produção: 0 vulnerabilidades no `npm audit --omit=dev`.
- Pacote final: sem `node_modules`, `.next`, `out`, `android`, APK, keystore ou segredo.

## Limite desta validação

A compilação Gradle local não foi concluída porque o ambiente de validação não conseguiu resolver `services.gradle.org`. O APK release assinado precisa ser gerado pelo GitHub Actions, onde também está protegido o `ANDROID_SIGNING_BUNDLE`. A confirmação final em aparelho depende do APK real assinado e da permissão do Android para instalar aplicativos desconhecidos.

## Alertas estruturais não bloqueantes

Três arquivos herdados ainda são grandes e devem ser modularizados em uma versão futura sem misturar essa refatoração com a correção do atualizador:

- `src/app/legacy-compat.css`;
- `src/components/CardVisionApp.tsx`;
- `src/lib/analyzer.ts`.
