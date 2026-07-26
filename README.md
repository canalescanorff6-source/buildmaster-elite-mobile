# BuildMaster Elite Tático v30.20 — IA Local + Ímpetos + Motor Mundial

O BuildMaster transforma o print ou os dados de uma carta do eFootball em **uma única Ficha Competitiva Definitiva**. A interface foi mantida simples; a análise avançada acontece por trás da tela.

## Fluxo principal

1. Escolha **Criar ficha por print** ou **Preencher manualmente**.
2. Confirme a carta, a posição desejada, a posição original, o estilo e os pontos disponíveis.
3. O motor próprio calcula a progressão com custo real dos níveis e preservação da identidade da carta.
4. O Motor Mundial compara apenas referências auditadas da mesma carta e usa seus registros de partidas como desempate.
5. O resultado mostra uma ficha final, as habilidades pendentes, como usar e o nível de confiança.

## Motor Mundial de Fichas

A v30.20 acrescenta:
- **IA local sem API paga**: seis submotores explicáveis analisam leitura, DNA, função, ficha, habilidades e Ímpeto diretamente no aparelho.
- **Ímpeto visível no modo simples**: a escolha principal agora possui aba própria, nota, confiança, atributos afetados, evidências e itens a evitar.
- **Leitura anti-falso-positivo de Ímpeto**: nomes de habilidades como “Chute de primeira” não são mais confundidos com o Ímpeto “Chute”.


- índice mundial de jogadores competitivos verificados, separado entre mobile e console;
- base online atualizável no Supabase, com lista local segura para uso offline;
- busca protegida de vídeos pela YouTube Data API, sem expor a chave no APK;
- pesquisa montada com jogador, tipo/edição da carta, overall, posição e gamer tag;
- OCR do print da progressão e confirmação manual antes de aceitar números;
- auditoria de carta exata, orçamento de pontos, posição, plataforma e autoridade da fonte;
- fusão entre motor próprio, consenso profissional e desempenho nas partidas registradas;
- limites de influência para impedir cópia cega ou descaracterização da carta;
- uma única **Ficha Competitiva Definitiva — Motor Mundial**.

O aplicativo não baixa vídeos, não raspa conteúdo protegido e não inventa progressões. Uma referência só entra no cálculo depois que os blocos são registrados e a identidade da carta é validada.

## Regras de segurança da ficha

- nenhuma fonte: o motor próprio decide;
- uma fonte exata: serve como evidência, sem dominar o resultado;
- duas ou mais fontes compatíveis: o consenso pode fazer pequenos ajustes;
- consenso forte: alteração limitada e sempre dentro do orçamento real;
- dados contraditórios: prevalece a solução mais segura;
- histórico suficiente de partidas: o desempenho do usuário vira critério de desempate;
- todas as diferenças e guardrails ficam explicados no resultado.

## Experiência e desempenho

- tema Obsidian escuro, contraste reforçado e detalhes dourados;
- início com ações diretas e navegação móvel reduzida;
- leitor padrão com um único print;
- ferramentas avançadas desligadas por padrão;
- OCR, pesquisa mundial e módulos pesados carregados somente quando utilizados;
- movimento reduzido e modo econômico como padrão;
- habilidades já adicionadas podem ser marcadas, deixando visíveis apenas as pendentes;
- Central de Atualizações destacada nos Ajustes.

## Configuração do Supabase

Aplique todas as migrações e publique as Edge Functions pelo workflow **Publicar contas e licenças no Supabase**.

Secrets do GitHub necessários para o workflow:

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_ID
SUPABASE_DB_PASSWORD
```

Para ativar a busca automática protegida de vídeos, adicione também:

```text
YOUTUBE_DATA_API_KEY
```

Essa chave é enviada ao Supabase como Secret de servidor. Nunca use `NEXT_PUBLIC_YOUTUBE_DATA_API_KEY` e nunca coloque a chave dentro do APK.

A nova infraestrutura está em:

```text
supabase/migrations/202607260001_v3010_world_pro_registry.sql
supabase/functions/pro-build-search/index.ts
```

Sem a chave do YouTube, o aplicativo continua funcionando e abre uma pesquisa exata no YouTube como fallback.

## Variáveis públicas do build

Use `.env.example` como referência:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_BUILDMASTER_DISTRIBUTION
NEXT_PUBLIC_GOOGLE_PLAY_CLOUD_PROJECT_NUMBER
NEXT_PUBLIC_BUILDMASTER_UPDATE_BETA_URL
```

## Comandos de validação

```bash
npm ci --no-audit --no-fund
npm run typecheck
npm run test:all
npm run build
npm run release:play-preflight
```

## Estrutura do pacote

- `src/`: interface, OCR e motores de análise;
- `public/`: PWA, ícones e Service Worker;
- `scripts/`: auditoria, integridade, builds e pré-voos;
- `tests/`: regressões de publicação e Motor Mundial;
- `supabase/`: contas, licenças, índice Pro e Edge Functions;
- `play-store/`: materiais e notas da Google Play;
- `.github/workflows/`: APK direto, AAB e Supabase.

## Colocar no GitHub

Preserve somente a pasta oculta `.git` da clonagem atual. Apague os outros arquivos antigos e copie o conteúdo deste pacote para a raiz do repositório.

A raiz correta contém diretamente:

```text
src
scripts
tests
public
supabase
play-store
.github
package.json
package-lock.json
```

## Segurança do pacote

O arquivo entregue não inclui `.git`, `node_modules`, `.next`, `out`, Android gerado, APK, AAB, keystore, senha, chave privada ou credencial.
