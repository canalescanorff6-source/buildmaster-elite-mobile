# R157 — Split Session Persistence + Safe Flush

## Objetivo
Reduzir serialização e escrita repetida durante o autosave da sessão ativa sem perder recuperação após background/fechamento e sem criar uma segunda autoridade de sessão.

## Problema confirmado
A sessão R137 armazenava `preview` e `playerCardImage` (data URLs) dentro do mesmo JSON dos campos textuais. Cada autosave após uma mudança de texto, posição, formação ou campo manual precisava serializar novamente as imagens, mesmo quando elas não haviam mudado.

Em uma amostra sintética conservadora usada pela regressão R157:
- snapshot monolítico com duas imagens: 1.060.665 bytes;
- metadados R157 para o mesmo estado: 647 bytes;
- o payload textual recorrente passa a representar menos de 0,1% do snapshot antigo nessa amostra.

## Implementação
A autoridade continua sendo `activeSessionRepositoryR137.ts`; R157 apenas evolui esse mesmo repositório.

A sessão passa a ser dividida em:
- metadados: chave canônica `ACTIVE_SESSION_KEY`;
- preview de recuperação: chave derivada R157;
- arte da carta: chave derivada R157.

`useActiveSessionAutosaveR157`:
- persiste mídia somente quando `preview`/`playerCardImage` mudam;
- coalesce mudanças textuais por 900 ms;
- faz flush imediato em `pagehide`;
- faz flush quando `document.visibilityState === 'hidden'`;
- preserva limpeza do rascunho premium quando não existe trabalho ativo.

## Compatibilidade
- snapshots monolíticos R137 continuam restauráveis;
- após o próximo autosave são naturalmente convertidos ao formato dividido;
- backup integral R141 reunifica metadados + mídia;
- restore de backup volta a escrever pelo formato dividido R157;
- `result` e `draftResult` continuam não persistidos: a autoridade derivada é recalculada.

## Startup
O primeiro desenho da R157 criava um arquivo de repositório paralelo e levou a árvore estática ao teto de 265 módulos. Isso foi rejeitado.

A implementação final evolui o repositório R137 existente:
- árvore estática: 264 módulos;
- fonte estática alcançável: 3.854.429 bytes;
- limites R155 preservados: <=265 módulos / <=3.900.000 bytes.

## Escopo esportivo
Nenhum arquivo do Clean Slate, beam, score, Top 5, Ímpeto ou calibração foi alterado.

## Validação
- R119–R157: regressões principais aprovadas;
- typecheck:v4080 aprovado;
- typecheck de toda `src` aprovado;
- sintaxe: 627 TS/TSX;
- contratos: 790 botões + 34 imagens com alt;
- acessibilidade/visual aprovado;
- auditoria: 127/127;
- preflight produção: 138/138;
- Play: 27/27;
- CardVisionApp: 3886 linhas;
- orçamento R155: 264 módulos / 3.854.429 bytes.
