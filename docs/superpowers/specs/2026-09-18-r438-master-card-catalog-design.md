# R438 — Catálogo Mestre de Cartas — Design

**Data:** 2026-09-18  
**Projeto:** BuildMaster Elite Tático  
**Base auditada:** `main` em `9914ca18743c851908144c32f79cb4badd9d1589` (R435)  
**Objetivo:** separar definitivamente “carta conhecida”, “carta que o usuário possui”, “ficha gerada” e “uso tático”, criando a base estrutural para pesquisar uma carta e gerar a ficha sem reenviar print.

## 1. Problema que a R438 resolve

Hoje `SquadMappingPlayer` concentra responsabilidades demais: identidade da carta, imagem, atributos, habilidades, Ímpetos, estado de revisão, vínculo com ficha e uso tático. Isso permite mapear o elenco, mas não é um Catálogo Mestre verdadeiro.

A R438 cria uma nova autoridade de dados para cartas conhecidas. O Mapeamento continuará existindo, mas passará a receber uma projeção da carta cadastrada. O Cofre continuará armazenando fichas geradas. Nenhuma dessas duas áreas será a fonte primária da identidade da carta.

## 2. Separação de domínios

A aplicação passa a trabalhar com quatro conceitos distintos:

1. **Catálogo Mestre** — tudo que o BuildMaster sabe sobre uma edição específica de uma carta.
2. **Meu Elenco** — quais cartas do Catálogo Mestre o usuário realmente possui.
3. **Cofre** — fichas/analises geradas pelo Motor Mestre.
4. **Mapeamento/Meu Time** — uso tático das cartas possuídas.

Regra central: uma carta pode existir no Catálogo Mestre sem estar no Meu Elenco; pode estar no Meu Elenco sem possuir ficha no Cofre; e pode possuir ficha sem estar escalada em nenhuma formação.

## 3. Modelo canônico da carta

Criar o módulo `src/modules/card-catalog/masterCardCatalogR438.ts` com o contrato abaixo.

```ts
export type MasterCardCompletenessR438 =
  | 'IDENTITY_ONLY'
  | 'PARTIAL'
  | 'COMPLETE';

export type MasterCardSourceR438 =
  | 'MIGRATED_SQUAD_MAPPING'
  | 'OCR_IMPORT'
  | 'MANUAL'
  | 'CATALOG_PATCH';

export type MasterCardCatalogEntryR438 = {
  schemaVersion: 1;
  catalogCardId: string;
  cardFingerprint: string;
  playerFingerprint: string;

  playerName: string;
  cardLabel: string;
  cardType: string;
  specialTag: string | null;
  country: string | null;
  releaseDate: string | null;

  mainPosition: PositionCode;
  positions: PositionCode[];
  positionRatings: Partial<Record<PositionCode, number>>;

  playstyle: string | null;
  offensivePlaystyle: string | null;
  defensivePlaystyle: string | null;
  defensivePlaystyleConfirmed: boolean;

  overall: number | null;
  level: number | null;
  trainingPointsTotal: number | null;

  attributes: Partial<Record<AttributeKey, number>>;
  nativeSkills: string[];
  additionalSkills: string[];
  specialSkills: string[];
  impetos: Array<{ name: string; value?: number | null; active?: boolean }>;
  boosters: string[];

  height: number | null;
  weight: number | null;
  age: number | null;
  condition: {
    weakFootFrequency?: string | null;
    weakFootAccuracy?: string | null;
    form?: string | null;
    injuryResistance?: string | null;
  };
  physicalProfile: Record<string, number | null>;

  imageRef: string | null;
  portraitRef: string | null;
  sourceHash: string | null;

  completeness: MasterCardCompletenessR438;
  confidence: number;
  missingFields: string[];
  sources: MasterCardSourceR438[];
  createdAt: string;
  updatedAt: string;
};
```

### 3.1 Identidade

`catalogCardId` é o identificador estável do registro no Catálogo Mestre.

Quando houver `card-r126-*` canônico, ele participa da identidade. Quando a carta ainda estiver parcial, o registro recebe um ID provisório separado da identidade do atleta. Duas imagens diferentes do mesmo jogador nunca são fundidas apenas pelo nome.

`playerFingerprint` identifica a pessoa; `catalogCardId`/`cardFingerprint` identificam a edição da carta.

## 4. Meu Elenco separado do catálogo

Criar `src/modules/card-catalog/ownedCardCollectionR438.ts`.

```ts
export type OwnedCardRecordR438 = {
  catalogCardId: string;
  owned: true;
  favorite: boolean;
  addedAt: string;
  updatedAt: string;
  note: string;
};
```

A R438 não precisa de quantidade múltipla da mesma carta porque o uso tático depende da edição, não de cópias físicas. Se esse requisito aparecer depois, ele pode ser adicionado sem alterar a identidade da carta.

## 5. Persistência local

O código atual já possui o store `cards` no IndexedDB (`src/lib/localDatabase.ts`). A R438 reutilizará esse store em vez de criar um banco paralelo.

Chaves previstas:

- `master-card:v1:<catalogCardId>` → `MasterCardCatalogEntryR438`
- `owned-card:v1:<catalogCardId>` → `OwnedCardRecordR438`
- `master-card-index:v1` → índice leve para busca
- `master-card-meta:v1` → versão do catálogo, datas e contagens

O catálogo completo não será salvo em `localStorage`.

## 6. Índice de pesquisa

Criar `masterCardSearchIndexR438.ts` com índice normalizado por:

- nome;
- cardLabel;
- cardType;
- specialTag;
- data/versão;
- posição;
- estilo ofensivo;
- estilo defensivo;
- habilidades;
- Ímpetos;
- `catalogCardId`;
- `cardFingerprint`.

A pesquisa deve retornar todas as versões compatíveis do mesmo atleta. O ranking da busca prioriza nome exato e depois identidade/variante da carta; nunca escolhe automaticamente uma versão quando houver duas correspondências plausíveis.

## 7. Completude e verdade dos dados

A R438 não inventa dados ausentes.

### `IDENTITY_ONLY`

Há identidade suficiente para mostrar a carta no catálogo, mas faltam dados essenciais para gerar ficha.

### `PARTIAL`

Há identidade e parte dos dados técnicos, porém ainda falta pelo menos um bloco obrigatório.

### `COMPLETE`

Requisitos mínimos:

- nome válido;
- posição principal;
- nível válido;
- PP conhecido ou derivável com segurança;
- 26 atributos presentes para jogador de linha, ou conjunto canônico de GO quando aplicável pelo parser atual;
- inventário de habilidades conhecido;
- posições conhecidas;
- identidade da edição suficientemente estável.

Ímpeto, estilo defensivo, booster ou dados físicos podem ser nulos quando a própria carta/versão não os possui. “Ausente confirmado” é diferente de “não lido”.

## 8. Progressão

A R438 reutiliza `inferPointsFromCardLevel` de `src/modules/builds/pointBudget.ts`.

Exemplo confirmado pelo contrato atual:

- nível 32 → `(32 - 1) × 2` = **62 PP**.

Regra: PP só é derivado se o nível estiver dentro do intervalo aceito pelo motor atual. Um PP explicitamente confirmado tem precedência sobre o derivado.

## 9. Migração do Mapeamento atual

Criar `masterCardMigrationR438.ts`.

A migração lê os `SquadMappingPlayer` existentes e cria/atualiza registros do Catálogo Mestre sem apagar o estado antigo.

Mapeamento mínimo:

- `name` → `playerName`
- `cardLabel` → `cardLabel`
- `cardFingerprint` → `cardFingerprint`
- `playerFingerprint` → `playerFingerprint`
- `mainPosition`, `positions`, `positionRatings`
- `playstyle` → `playstyle` e `offensivePlaystyle` quando aplicável
- `overall`, `level`
- `attributes`
- `skills` → `nativeSkills` somente quando a origem comprovar que são habilidades possuídas; caso contrário, preservá-las em evidência de migração sem recategorizar silenciosamente
- `impetos`
- `height`, `weight`, `age`
- `physicalModel`
- `imageRef`, `sourceHash`

A migração deve ser idempotente: executar duas vezes não duplica cartas nem membros do Meu Elenco.

Todos os registros migrados do Mapeamento entram em `Meu Elenco`, porque já representam cartas declaradas como pertencentes ao usuário.

## 10. Projeção para o Mapeamento

Criar `masterCardToSquadMappingR438.ts`.

O Mapeamento deixa de ser a fonte primária da carta. Para compatibilidade, ele ainda recebe um `SquadMappingPlayer`, produzido a partir de `MasterCardCatalogEntryR438` + `OwnedCardRecordR438`.

A projeção preserva:

- `cardFingerprint`;
- `playerFingerprint`;
- atributos;
- posições;
- estilos;
- habilidades;
- Ímpetos;
- imagem;
- nível;
- completude/confiança convertidas para o estado que o Mapeamento já entende.

Preferências táticas, posições treinadas, `locked`, `excluded`, `note`, pins e testes de formação continuam pertencendo ao Mapeamento e não ao Catálogo Mestre.

## 11. Geração de ficha

Criar `masterCardAnalysisRequestR438.ts`.

Somente uma carta `COMPLETE` pode seguir pelo botão **Gerar ficha** sem OCR.

O módulo converte a carta para texto estruturado/entrada aceita pela autoridade existente e chama exclusivamente:

```ts
createProductionAnalysisR138(...)
```

Nenhum segundo motor de ficha será criado.

Se a carta estiver `IDENTITY_ONLY` ou `PARTIAL`, a UI exibe os campos que faltam e oferece completar a carta; não gera resultado com dados inventados.

## 12. UI da R438

A R438 cria uma superfície **Catálogo Mestre** dentro da área hoje chamada Mapeamento/Meu Elenco, preservando o ID interno de navegação `mapeamento` nesta versão para não quebrar snapshots/deep links existentes.

A tela terá três visões:

1. **Meu Elenco** — somente cartas possuídas.
2. **Catálogo Geral** — todas as cartas conhecidas localmente.
3. **Revisar** — cartas `IDENTITY_ONLY` ou `PARTIAL`.

Cada card mostra no mínimo:

- imagem/miniatura;
- nome;
- cardLabel/variante;
- posição;
- estilo;
- nível e PP quando conhecidos;
- status `Completa`, `Parcial` ou `Identidade`;
- ação `Abrir carta`.

Ao abrir a carta:

- dados de identidade;
- posições;
- estilos;
- atributos;
- habilidades;
- especiais;
- Ímpetos;
- imagem;
- evidência/completude;
- ações `Gerar ficha`, `Comparar`, `Usar no Mapeamento` quando válidas.

## 13. Imagens

A R438 reutiliza o armazenamento de imagem já existente do Mapeamento e não duplica blobs.

O registro do Catálogo Mestre guarda apenas referências (`imageRef`, `portraitRef`, `sourceHash`). A migração preserva imagens existentes.

R440 poderá adicionar perceptual hash; R438 não deve antecipar essa dependência.

## 14. Futuro R439–R443 e limites desta versão

A R438 prepara, mas não implementa ainda:

- resolução automática das 222 imagens contra um catálogo externo (R439);
- perceptual hash/identidade visual forte (R440);
- sincronização remota sem APK (R441);
- adicionar uma carta conhecida ao Meu Elenco com zero print (R442);
- fechamento completo de comparação/formação/Cofre a partir do catálogo remoto (R443).

A R438 deve funcionar totalmente offline e sem exigir backend.

## 15. Compatibilidade

A R438 não pode quebrar:

- Cofre e `SavedAnalysis`;
- `cardIdentityFingerprintR126`;
- Motor Mestre `createProductionAnalysisR138`;
- formação e ranking existentes;
- armazenamento nativo de imagens;
- leitura OCR existente;
- backups existentes do Mapeamento;
- snapshots/deep links atuais.

Nenhuma migração destrutiva será usada.

## 16. Testes obrigatórios

### Runtime do catálogo

- salva e carrega carta completa;
- nível 32 deriva 62 PP;
- não deriva PP inválido;
- duas edições do mesmo Cristiano Ronaldo permanecem separadas;
- mesma identidade canônica não duplica;
- carta incompleta não gera ficha;
- carta completa gera request para `createProductionAnalysisR138`;
- busca por `Cristiano Ronaldo` retorna todas as versões.

### Migração

- `SquadMappingPlayer` vira `MasterCardCatalogEntryR438`;
- todos os jogadores migrados entram no Meu Elenco;
- segunda execução não duplica;
- imagem/referências são preservadas;
- dados não comprovados não são promovidos silenciosamente a dados confirmados.

### Integração

- `Meu Elenco` lê do Catálogo Mestre;
- Mapeamento recebe projeção do catálogo;
- Cofre permanece separado;
- o Motor Mestre continua sendo a única autoridade de geração;
- não existe teto artificial de 120/500 cartas no Catálogo Mestre.

## 17. Critérios de aceitação

A R438 está aceita quando:

1. uma carta pode existir no Catálogo Mestre sem ficha;
2. a posse da carta é armazenada separadamente;
3. duas edições do mesmo jogador não colidem;
4. o Mapeamento deixa de ser a autoridade da identidade da carta;
5. cartas existentes do Mapeamento migram sem perda e sem duplicação;
6. carta completa gera ficha pelo Motor Mestre sem OCR;
7. carta parcial é bloqueada com lista explícita do que falta;
8. Catálogo Mestre funciona offline usando o store `cards` existente;
9. nenhuma regressão destrói Cofre, Mapeamento, OCR ou imagens existentes.

## 18. Decisão arquitetural final

A R438 cria o **Catálogo Mestre como nova fonte de verdade da carta** e o **Meu Elenco como relação de posse**. Cofre e Mapeamento permanecem consumidores especializados. Essa separação é a fundação necessária para chegar ao fluxo final desejado: pesquisar uma carta conhecida, adicioná-la ao Meu Elenco e gerar sua ficha sem reenviar print.
