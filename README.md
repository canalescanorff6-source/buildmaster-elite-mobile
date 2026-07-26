# BuildMaster Elite Tático v30.00 — Experiência Essencial

Esta edição reconstrói a experiência principal do aplicativo para funcionar de maneira simples, escura e direta no celular.

## Como o aplicativo funciona

1. Na tela inicial, escolha **Criar ficha por print** ou **Preencher manualmente**.
2. Informe a carta e confirme somente posição, posição original e estilo.
3. O BuildMaster gera uma única **Ficha Competitiva Definitiva**.
4. Consulte apenas quatro áreas: ficha final, habilidades, como usar e exportar.
5. Salve o jogador para encontrá-lo em **Meus jogadores**.

As ferramentas técnicas continuam no projeto, mas ficam ocultas no modo simples. Elas só aparecem quando **Ferramentas avançadas** é ativado em Ajustes.

## Melhorias desta reconstrução

- tema escuro Obsidian com detalhes dourados e contraste maior;
- tela inicial com três ações principais e linguagem direta;
- navegação móvel reduzida a Início, Jogadores, Nova ficha, Meu Time e Menu;
- leitor padrão com um único print;
- criação guiada em três passos;
- página de jogadores sem filtros e controles duplicados;
- datas inválidas corrigidas com retorno seguro;
- resultado principal com uma única ficha, sem comparador ou variações visíveis;
- Top 5 de habilidades sem mostrar alternativas no modo simples;
- instruções de uso separadas em sem bola, saída, ataque e pressão;
- tema claro antigo substituído automaticamente na primeira abertura desta edição;
- modo econômico, movimento reduzido e ferramentas avançadas desativadas por padrão;
- carregamentos de backup, partidas, índices e pré-carregamento adiados até serem necessários;
- onboarding antigo não abre automaticamente.

## Estrutura mantida

- `src/`: aplicativo e motores necessários;
- `public/`: PWA, ícones e recursos;
- `scripts/`: auditoria, integridade e builds;
- `tests/`: regressões atuais;
- `supabase/`: contas, licenças e Edge Functions;
- `play-store/`: materiais da Google Play;
- `.github/workflows/`: APK direto, AAB e Supabase.

## Comandos principais

```bash
npm ci --no-audit --no-fund
npm run typecheck
npm run test:all
npm run build
```

## Colocar no GitHub

Preserve somente a pasta oculta `.git` da clonagem atual. Apague os outros arquivos antigos e copie o conteúdo deste pacote para a raiz do repositório.

A raiz correta contém diretamente `src`, `scripts`, `tests`, `public`, `.github`, `package.json` e `package-lock.json`.

## Segurança

O pacote não inclui `.git`, `node_modules`, APK, AAB, keystore, senhas, chaves privadas ou credenciais.
