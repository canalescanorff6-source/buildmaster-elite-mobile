# BuildMaster Elite Tático v27.32 — Estúdio Tático Automático completo

## Entrega

A v27.32 transforma o gerador de formação em um módulo utilizável dentro do aplicativo, sem API de imagem e sem custo por exportação.

### Geração local

- SVG vetorial gerado dentro do aparelho.
- PNG vertical em 1536 × 2304.
- PNG horizontal em 2304 × 1536.
- Compartilhamento pelo menu nativo quando o aparelho permite.
- Nenhum envio de formação, escalação ou imagem para serviço externo.

### Editor

- título, subtítulo e foco editáveis;
- cinco temas: Ouro Premium, Azul Tático, Escuro Competitivo, Vermelho Pressão e Verde Clássico;
- formato vertical ou horizontal;
- ativação individual de setas, legenda, painéis, princípios, nomes, pontuação e rodapé;
- substituição do nome e da função exibidos em cada posição;
- edição das instruções ofensivas, defensivas, riscos e justificativa.

### Biblioteca

- salvar até 40 projetos por conta;
- carregar, atualizar, duplicar e excluir;
- rascunho automático;
- exportar e importar projeto em JSON;
- projetos não alteram a ficha ou a formação original.

### Integração

O Estúdio usa a formação selecionada no Laboratório de Formações, a escalação analisada, as posições, os papéis táticos e o estilo coletivo. O botão “Gerar automático” reconstrói os textos a partir desses dados.

## Atualizador preservado

A base mantém o atualizador Android da v27.30:

- DownloadManager do Android como transporte principal;
- HTTP direto como reserva;
- rotas imutável, versionada e `BuildMaster-Elite-Tatico-latest.apk`;
- verificação de tamanho, SHA-256, pacote, versão, versionCode e assinatura;
- `contents: write` no GitHub Actions;
- manifesto publicado somente depois da validação pública do APK.

A confirmação final do fluxo automático depende do APK assinado pelo GitHub Actions e do teste no aparelho. O Android pode continuar exigindo o toque final em “Atualizar”.

## Validações executadas

- TypeScript estrito aprovado.
- Regressão específica v27.32 aprovada.
- Auditoria automática: 31 verificações aprovadas.
- Suítes do atualizador, contas, fichas, OCR, backup, segurança, formações, time e adversário aprovadas em grupos.
- Exportação estática Next.js aprovada.
- Amostra SVG e PNG gerada usando o próprio motor do aplicativo.

## Arquivos importantes

- `src/components/TacticalPosterStudioPanel.tsx`
- `src/lib/tacticalPoster.ts`
- `src/lib/tacticalPosterLibrary.ts`
- `src/app/tactical-poster-v2732.css`
- `docs/current/AMOSTRA_ESTUDIO_TATICO_V27_32.png`
- `docs/current/AMOSTRA_ESTUDIO_TATICO_V27_32.svg`
