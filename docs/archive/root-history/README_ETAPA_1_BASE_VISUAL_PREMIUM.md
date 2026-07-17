# BuildMaster Elite Tático — Etapa 1: Base Visual Premium

Esta etapa reformula a base visual sem alterar o motor de fichas, Supabase, contas, Cofre, backup ou atualização do APK.

## Alterações aplicadas

- Nova identidade visual clean premium, com menos excesso de brilho e melhor hierarquia.
- Paleta escura sofisticada em grafite, verde elite e azul informativo.
- Tema claro compatível, com contraste e superfícies próprias.
- Tipografia padronizada com fontes nativas do sistema, sem depender do Google Fonts no APK.
- Sistema unificado de espaçamentos, raios, bordas e sombras.
- Cards e painéis com acabamento consistente.
- Botões primários e secundários padronizados.
- Campos, selects e textareas com foco, contraste e toque aprimorados.
- Ícones com espessura e alinhamento consistentes.
- Novo carregamento de sessão/licença no login.
- Botão de login com indicador real de validação.
- Splash e barras de carregamento refinados.
- Skeleton base disponível para telas futuras.
- Suporte a `prefers-reduced-motion` para reduzir animações.
- Cores do PWA/Android atualizadas para a nova identidade.

## Arquivos principais alterados

- `src/app/globals.css`
- `src/components/AuthGate.tsx`
- `src/app/layout.tsx`
- `public/manifest.webmanifest`

## Validações executadas

- TypeScript: aprovado.
- Organização da interface: aprovada.
- Contas e licenças: aprovadas.
- Backup e atualizações: aprovados.
- Exportação estática para APK: aprovada.
- Suítes de regressão do motor, fichas, habilidades, técnicos, Cofre, time e tática: aprovadas.

## Observação

Esta é somente a Etapa 1. A navegação, Home, Leitor, Manual, Resultado, Cofre, Meu Time e Ajustes serão reorganizados nas próximas etapas, mantendo esta mesma base visual.
