# R127 — Mapeamento de Elenco com identidade única + modularização do app

## Objetivo

Eliminar a mistura entre **jogador**, **edição da carta** e **build/função** no Mapeamento de Elenco e iniciar a desmontagem segura do `CardVisionApp.tsx` sem criar uma nova autoridade de ficha.

## Mudanças de produção

### 1. Titular e banco usam identidade de atleta

O Mapeamento deixou de usar apenas `player.id` para impedir duplicatas. Agora usa a identidade R126 do atleta. Duas versões da mesma pessoa podem permanecer no banco de cartas, mas somente uma versão pode ocupar o elenco ativo (titulares + reservas) de uma formação.

### 2. Vínculo com o Cofre não usa mais apenas o nome

Foi removido o fallback `mesmo nome = mesma ficha`.

A vinculação automática ao histórico agora exige evidência suficiente, combinando:

- identidade do atleta;
- posição natural;
- estilo;
- similaridade dos atributos observados;
- sobreposição de habilidades;
- altura;
- nível quando disponível.

Se a evidência for fraca ou duas cartas ficarem próximas demais, o Mapeamento mantém a carta como **provisória** e não herda silenciosamente dados de outra versão.

### 3. Identidade provisória sem GER

`createMappingCardFingerprint()` não usa Overall/GER nem o rótulo visual da carta. Quando existe vínculo seguro com o Cofre, a identidade provisória é substituída pelo `card-r126-*` canônico.

### 4. Migração compatível

Registros antigos do Mapeamento recebem `playerFingerprint` e `identityStatus` durante a sanitização. Backups antigos continuam legíveis.

### 5. Meu Time usa Carta + posição de uso

A deduplicação de fichas salvas no `TeamFullMapPanel` passa a usar `cardUsageIdentityKeyR126()`, em vez de `nome + posição + estilo`.

### 6. Team Optimizer carrega a identidade do titular

`EliteLineupPick` agora preserva `playerKey`. O banco é excluído diretamente pela identidade do atleta escolhido, sem reconstruir a seleção através do nome exibido.

## Modularização do CardVision

Foi criado `src/lib/appNavigationR127.ts` e retirado de `CardVisionApp.tsx`:

- tipo `MainSection`;
- roteamento seção → grupo;
- roteamento seção → workspace;
- roteamento grupo/workspace → seção;
- construção do menu principal.

Esse é o primeiro corte do monólito. Estados de OCR, sessão, Cofre e resultado ainda não foram movidos nesta rodada para evitar uma refatoração grande sem proteção suficiente.

## Regressões

Novo teste:

`tests/v40-80-r127-squad-mapping-identity-regression.ts`

Protege:

- duas cartas da mesma pessoa não entram simultaneamente em titular + banco;
- GER não fragmenta a identidade provisória;
- múltiplas cartas do mesmo nome são vinculadas ao Cofre pela evidência correta;
- nome sozinho não cria vínculo automático;
- contrato de navegação continua igual após extração do `CardVisionApp`.

Também foram executados com sucesso R122, R123, R124, R125, R126, o teste histórico v39.50 do Mapeamento e regressões de interface/navegação relacionadas.
