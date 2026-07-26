# BuildMaster Elite Tático v30.40 — Inteligência Profunda + Leitura Detalhada

O BuildMaster transforma o print ou os dados de uma carta do eFootball em **uma única Ficha Competitiva Definitiva**. A interface foi mantida simples; a análise avançada acontece por trás da tela.

## Fluxo principal

1. Escolha **Criar ficha por print** ou **Preencher manualmente**.
2. Confirme a carta, a posição desejada, a posição original, o estilo e os pontos disponíveis.
3. O motor próprio calcula a progressão com custo real dos níveis e preservação da identidade da carta.
4. O Motor Mundial compara apenas referências auditadas da mesma carta e usa seus registros de partidas como desempate.
5. O resultado mostra uma ficha final, as habilidades pendentes, como usar e o nível de confiança.


## Recorte inteligente da carta — v30.40

Ao importar qualquer print, o aplicativo mantém a imagem completa somente para a leitura de nome, atributos, habilidades, Ímpetos e demais dados. Para a ficha e o Cofre, ele detecta e mostra **somente a carta do jogador**, em formato vertical, limpo e compacto.

- detecção local sem API paga;
- enquadramento automático pela borda, contraste e proporção da carta;
- recorte corrigido novamente quando o leitor reconhece o tipo exato da tela;
- controles simples para mover, aproximar, afastar ou redetectar;
- imagem original disponível apenas em “Ver print completo”;
- resultado sem GER, posição ou estilo duplicados sobre a própria carta.

A leitura sempre usa o arquivo original completo. Ajustar o recorte visual não remove informações do OCR.

## Inteligência Profunda da Carta

A v30.40 acrescenta:
- **leitura detalhada de perfis completos**: identifica nome, estilo, GER, posição, nível, altura, peso, idade, condição, técnico, bônus, Ímpetos, 13 posições, 26 atributos, sequência de progressão, modelo físico e habilidades;
- **geometria adaptativa do print**: quando detecta uma tela detalhada, o leitor troca automaticamente as áreas de OCR para não misturar atributos, posições, habilidades e medidas físicas;
- **simulador local de distribuições**: compara a ficha atual, variantes do motor, fusão profissional, cenários de tolerância e redistribuições controladas;
- **sinergias por função**: avalia combinações como ataque ao espaço, giro e criação, defesa de cobertura, domínio aéreo e proteção do corredor;
- **faixas competitivas**: separa atributo excelente, competitivo e que ainda precisa de correção;
- **modelo físico integrado**: usa comprimento das pernas, raio de cobertura, altura de salto, colisão de tronco e atributos físicos como evidência, sem transformar valores duvidosos em fatos;
- **IA local sem API paga**: os motores explicáveis rodam no aparelho e não dependem de ChatGPT, Gemini ou assinatura externa;
- **Ímpeto integrado à ficha e às habilidades**: a recomendação cruza função, distribuição, atributos, habilidades existentes e Ímpetos já detectados;
- **proteção contra OCR enganoso**: a ordem visual da progressão fica marcada para confirmação quando os ícones não permitem saber o nome exato de cada grupo.

## Motor Mundial de Fichas

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
