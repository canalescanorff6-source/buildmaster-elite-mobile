# R441 — Catálogo Mestre Atualizável + Cofre Permanente de Prints — Design

**Data:** 2026-09-18  
**Projeto:** BuildMaster Elite Tático  
**Base de implementação:** R436 → R440 sobre a `main` R435 (`9914ca18743c851908144c32f79cb4badd9d1589`) enquanto os pacotes cumulativos ainda não tiverem sido aplicados.  
**Objetivo:** permitir atualização do Catálogo Mestre sem novo APK e preservar permanentemente os prints originais usados pelo usuário, com reutilização para releitura futura e backup/restauração em ZIP.

---

## 1. Escopo da R441

A R441 reúne duas capacidades relacionadas, mas separadas internamente:

1. **Sincronização versionada do Catálogo Mestre**
   - manifesto remoto pequeno;
   - pacotes incrementais de cartas;
   - checksum;
   - validação antes de promover;
   - funcionamento offline após sincronização;
   - rollback para a versão anterior válida;
   - atualização sem reinstalar APK.

2. **Cofre Permanente de Prints Originais**
   - salvar a imagem original importada sem redimensionar nem recomprimir;
   - manter uma miniatura separada para navegação;
   - vincular o print a `sourceHash` e, quando conhecido, a `catalogCardId`;
   - reutilizar o original no leitor atual com a ação **“Refazer ficha com este print”**;
   - exportar todos os originais em ZIP;
   - restaurar ZIP e reconstruir os vínculos com as cartas.

Essas duas capacidades não devem misturar os dados pessoais do usuário com o catálogo público.

---

## 2. Decisões de arquitetura

### 2.1 Separação das fontes de verdade

A arquitetura final mantém:

- **Catálogo Mestre:** dados conhecidos das edições de cartas.
- **Meu Elenco:** IDs das cartas que o usuário realmente possui.
- **Cofre:** fichas/analises produzidas pelo Motor Mestre.
- **Cofre de Prints:** arquivos-fonte originais enviados pelo usuário.
- **Mapeamento/Meu Time:** projeções táticas de cartas do Meu Elenco.

Uma atualização do Catálogo Mestre **não pode apagar ou substituir**:
- posse;
- fichas;
- partidas;
- formações;
- notas;
- prints originais.

### 2.2 O OCR continua sendo fallback

Carta já conhecida e completa:
`Catálogo Mestre → Motor Mestre`

Carta desconhecida ou incompleta:
`Print original → resolvedor R439/R440 → OCR quando necessário → Catálogo Mestre`

O print original permanece guardado mesmo após o OCR.

---

## 3. Cofre de Prints Originais

### 3.1 Problema atual

`storeSquadMappingImage()` gera `createImageThumbnail(blob, 1600)` antes de salvar. Portanto o arquivo hoje guardado pelo Mapeamento não é a fonte original.

A R441 **não substitui esse comportamento**. Ela cria uma camada adicional.

### 3.2 Novo store IndexedDB

Atualizar `src/lib/localDatabase.ts`:

- `DB_VERSION`: `6 → 7`
- adicionar store:
  - `card-source-images`

O store deve aceitar `Blob` diretamente no IndexedDB.

Chaves:

```text
card-source:v1:<sourceHash>
```

Metadados leves podem ficar no store `cards`:

```text
card-source-meta:v1:<sourceHash>
```

### 3.3 Contrato do original

Novo módulo:

`src/modules/master-catalog/cardSourceVaultR441.ts`

```ts
export type CardSourceImageR441 = {
  sourceHash: string;
  catalogCardId: string | null;
  originalName: string;
  mime: string;
  extension: string;
  bytes: number;
  width: number;
  height: number;
  storedAt: string;
  lastUsedAt: string | null;
  originalChecksum: string;
  thumbnailRef: string | null;
};
```

A imagem é preservada **após a validação segura do formato**, porém:
- sem resize;
- sem conversão para WebP;
- sem redução de qualidade;
- sem crop.

Para PNG/JPEG/WebP/BMP/AVIF/HEIC/HEIF/TIFF válidos, o `sanitizedBlob` produzido por `validateImageFile()` é a fonte armazenada. Em screenshots comuns PNG/JPG, isso preserva os bytes de imagem de origem sem re-encode.

SVG continua sujeito à sanitização de segurança já existente; por isso “original” significa “fonte original validada pelo BuildMaster”, não bypass de segurança.

### 3.4 Deduplicação

`sourceHash` é a chave principal.

Se o mesmo print for importado novamente:
- não duplica o Blob;
- atualiza o vínculo da carta quando houver informação melhor;
- preserva `storedAt`;
- pode atualizar `lastUsedAt`.

Sem limite artificial de quantidade.

### 3.5 Falha de armazenamento

Se o original não puder ser salvo por falta de espaço:
- a importação da carta pode continuar;
- mostrar aviso explícito:
  `A carta foi importada, mas o print original não pôde ser preservado. Exporte/limpe espaço e tente novamente.`
- nunca afirmar que o original está guardado quando só existe miniatura.

---

## 4. Miniatura e original ficam separados

Fluxo ao importar:

```text
File
  ↓
validateImageFile()
  ↓
sourceHash
  ├── cardSourceVaultR441 → Blob original validado
  └── storeSquadMappingImage() → miniatura leve
```

A UI usa miniatura.

OCR/releitura futura usa o Blob original.

Isso evita carregar imagens pesadas para listar 222+ cartas.

---

## 5. “Refazer ficha com este print”

### 5.1 Ação

Na página da carta do Meu Elenco:

**Print original**
- Ver print
- Refazer ficha com este print
- Exportar print
- Substituir print

### 5.2 Reprocessamento

Ao tocar **Refazer ficha com este print**:

```text
sourceHash
  ↓
loadCardSourceImageR441()
  ↓
reconstruir File/Blob com nome e MIME originais
  ↓
pipeline atual do leitor
  ↓
R439/R440 identifica edição
  ↓
OCR atual quando necessário
  ↓
createProductionAnalysisR138
  ↓
nova ficha
```

A ficha anterior não é apagada automaticamente.

O usuário pode salvar a nova ficha normalmente; o Cofre mantém seu histórico conforme as regras atuais.

### 5.3 Garantia de motor atual

A releitura não reaproveita texto OCR antigo como fonte principal.

Ela deve passar novamente pelo pipeline de leitura presente na versão instalada do app. Essa é a razão central de preservar o print original.

---

## 6. Área “Arquivo de Prints”

Dentro de **Meu Elenco**, adicionar uma visão:

`Arquivo de Prints`

Métricas:

- quantidade de originais;
- tamanho total;
- vinculados a uma carta;
- sem vínculo;
- com original ausente mas miniatura presente.

Ações:
- Ver original;
- Refazer ficha;
- Exportar individual;
- Exportar todos em ZIP;
- Restaurar ZIP;
- Vincular manualmente uma imagem sem correspondência;
- Remover original (com confirmação), sem apagar automaticamente a carta/ficha.

Exemplo:

```text
222 prints originais
38,1 MB
218 vinculados
4 aguardando identificação
```

---

## 7. Backup ZIP dos Prints

### 7.1 Formato

Nome sugerido:

`BuildMaster-Prints-YYYY-MM-DD.zip`

Estrutura:

```text
/prints/
  <sourceHash>.png
  <sourceHash>.jpg
  ...

/manifest.json
/catalogo-local.json
/meu-elenco.json
```

`catalogo-local.json` não substitui o backup completo do app. Ele serve para reconstruir os vínculos necessários aos prints.

`meu-elenco.json` contém somente referências/posse relacionadas aos prints exportados.

### 7.2 Manifesto

```ts
export type PrintBackupManifestR441 = {
  schemaVersion: 1;
  app: 'BuildMaster Elite Tático';
  createdAt: string;
  printCount: number;
  totalBytes: number;
  entries: Array<{
    sourceHash: string;
    catalogCardId: string | null;
    file: string;
    originalName: string;
    mime: string;
    bytes: number;
    width: number;
    height: number;
    checksum: string;
    storedAt: string;
  }>;
};
```

### 7.3 ZIP sem nova dependência

Criar módulo:

`src/modules/master-catalog/printBackupZipR441.ts`

O ZIP será escrito com método **STORE (sem recompressão)**:
- PNG/JPEG/WebP já são comprimidos;
- evita custo alto de CPU;
- evita dependência JS adicional;
- CRC32 obrigatório;
- central directory e EOCD válidos.

Na restauração:
- localizar EOCD;
- ler central directory;
- rejeitar caminhos inseguros (`../`, absolutos);
- aceitar apenas arquivos declarados no manifesto;
- validar tamanho e checksum;
- importar um arquivo por vez;
- não carregar todos os 222 Blobs simultaneamente na memória.

### 7.4 Restauração segura

Antes de gravar:
- validar `schemaVersion`;
- validar `manifest.json`;
- validar checksum individual;
- validar MIME/extensão;
- validar limite individual de imagem;
- detectar duplicatas por `sourceHash`.

Comportamento:
- já existente e checksum igual → pular;
- já existente e checksum divergente → manter o local e marcar conflito;
- novo → restaurar;
- carta ausente no Catálogo Mestre → manter print sem vínculo, nunca inventar carta.

Resumo:

```text
Restaurados: 210
Já existentes: 10
Conflitos: 1
Sem vínculo: 1
```

---

## 8. Atualização do Catálogo Mestre sem APK

### 8.1 Reutilizar padrão remoto existente

O projeto já possui:
- URL configurável;
- `fetchWithTimeout`;
- pacote remoto versionado;
- checksum/auditoria;
- restauração de versão para regras.

A R441 reaproveita o padrão, mas **não coloca milhares de cartas dentro do pacote de regras v37.70**.

### 8.2 URL do catálogo

Nova chave:

```text
buildmaster_master_catalog_manifest_url_r441
```

A URL aponta para `catalog-manifest.json`.

Ela pode vir de:
1. URL padrão embutida/configurada no build;
2. override manual em configurações avançadas.

Sem URL válida, o catálogo local continua funcionando normalmente.

### 8.3 Manifesto remoto

Novo contrato:

```ts
export type MasterCatalogManifestR441 = {
  schemaVersion: 1;
  catalogVersion: string;
  gameVersion: string;
  publishedAt: string;
  minimumAppVersion: string;
  cardCount: number;
  previousCatalogVersion: string | null;
  chunks: Array<{
    id: string;
    url: string;
    sha256: string;
    bytes: number;
    mode: 'base' | 'delta';
    fromVersion: string | null;
    toVersion: string;
  }>;
  releaseNotes: string[];
};
```

### 8.4 Chunks

Cada chunk contém:

```ts
export type MasterCatalogChunkR441 = {
  schemaVersion: 1;
  id: string;
  fromVersion: string | null;
  toVersion: string;
  upsert: MasterCardRecordR438[];
  remove: string[];
};
```

`remove` não apaga Meu Elenco. Ele remove/depreca apenas a versão pública do catálogo quando a política permitir.

Se uma carta removida remotamente estiver no Meu Elenco:
- preservar snapshot local suficiente para a carta continuar utilizável;
- marcar como `catalogStatus: 'retired'`;
- nunca apagar posse.

---

## 9. Processo de sincronização

```text
Verificar atualização
      ↓
baixar manifest
      ↓
sanitizar contrato
      ↓
comparar versão
      ↓
verificar minimumAppVersion
      ↓
selecionar chunks necessários
      ↓
baixar um por vez
      ↓
SHA-256 do conteúdo
      ↓
parse/sanitize
      ↓
montar catálogo candidato em memória/lote temporário
      ↓
validar duplicatas/identidade
      ↓
criar restore point
      ↓
promover atomicamente
      ↓
gravar versão ativa
```

Se qualquer etapa falhar:
- abortar;
- manter catálogo atual;
- mostrar motivo;
- não alterar Meu Elenco.

---

## 10. Atualização incremental

Exemplo:

Local:
`2026.09.18-12` com 222 cartas

Remoto:
`2026.09.20-13` com 227 cartas

Manifesto informa delta:

```text
fromVersion: 2026.09.18-12
toVersion: 2026.09.20-13
upsert: 5
remove: 0
```

A UI mostra:

`5 cartas novas disponíveis`

Depois:

`Catálogo atualizado para 2026.09.20-13 • 227 cartas`

Nenhum APK novo.

---

## 11. Rollback

Guardar:
- versão ativa;
- uma versão anterior completa/snapshot lógico;
- metadados de atualização.

Chaves no store `cards`:

```text
catalog-sync:v1:state
catalog-sync:v1:previous
catalog-sync:v1:history:<version>
```

Ação:
**Restaurar catálogo anterior**

Rollback afeta somente Catálogo Mestre.

Não altera:
- Meu Elenco;
- prints;
- fichas;
- formações;
- partidas.

---

## 12. Funcionamento offline

Depois que a sincronização termina, o Catálogo Mestre está todo local.

Sem internet:
- pesquisar carta funciona;
- Meu Elenco funciona;
- gerar ficha funciona;
- refazer ficha com print funciona;
- formação funciona;
- backup ZIP funciona.

Somente:
- verificar atualização;
- baixar chunks;
dependem de rede.

---

## 13. Interface

### 13.1 Meu Elenco

Adicionar:

**Catálogo**
- Versão atual: `...`
- Última verificação
- `Verificar atualizações`
- `Atualizar catálogo`
- `Restaurar versão anterior`

### 13.2 Arquivo de Prints

Adicionar card:

**Arquivo de Prints**
- `222 originais`
- `38,1 MB`
- `218 vinculados`
- `4 para revisar`

Ações:
- `Abrir arquivo`
- `Exportar ZIP`
- `Restaurar ZIP`

### 13.3 Detalhe da carta

Bloco:

**Print original**
- status;
- dimensões;
- tamanho;
- data de importação.

Ações:
- `Ver print`
- `Refazer ficha com este print`
- `Exportar`
- `Substituir`

---

## 14. Integração com R436–R440

### R436
Meu Elenco continua sendo a coleção do usuário.

### R437
Importação retomável deve salvar o original **antes** de considerar a carta concluída; se o original falhar, a fila registra essa condição.

### R438
`catalogCardId` é o vínculo primário entre carta e print.

### R439
O resolvedor usa o print original quando precisa de nova leitura.

### R440
A assinatura visual é calculada a partir do original/crop; pode ser reaprendida em uma futura releitura.

---

## 15. Compatibilidade com atualização do APK

O banco local é account-scoped e deve permanecer sob o mesmo app ID/origem durante atualização normal do APK.

A R441 não promete sobreviver a:
- desinstalação;
- “limpar armazenamento/dados” do Android;
- troca de aparelho sem restauração.

Por isso o ZIP é parte obrigatória da estratégia de recuperação.

Antes de atualização crítica, o app pode recomendar:
`Faça um backup ZIP dos prints originais.`

O backup completo atual do BuildMaster continua existindo; o ZIP de prints é complementar e portátil.

---

## 16. Tratamento de espaço

Antes de salvar:
- consultar tamanho da imagem;
- quando disponível, consultar `navigator.storage.estimate()` e `nativeVaultInfo()` para diagnóstico.

Não impor um teto numérico arbitrário de quantidade.

Se faltar espaço:
- não apagar prints antigos automaticamente;
- informar quantos MB a nova operação requer;
- permitir ao usuário remover originais manualmente depois de exportar ZIP.

---

## 17. Segurança e integridade

Obrigatório:

- SHA-256 para chunks do catálogo;
- SHA-256 para prints no manifesto de backup;
- CRC32 do ZIP;
- path traversal bloqueado;
- sem execução de conteúdo do ZIP;
- validar imagens restauradas;
- manifestos com `schemaVersion`;
- atualização remota nunca executa código;
- JSON remoto apenas dados;
- rollback seguro;
- nenhuma atualização remota altera dados pessoais.

---

## 18. Testes obrigatórios

### 18.1 Cofre de Prints

- salva Blob sem resize;
- bytes/checksum permanecem idênticos para PNG/JPG;
- importação duplicada não duplica;
- vínculo com `catalogCardId` pode ser enriquecido;
- 222+ prints não sofrem corte por contador;
- miniatura e original têm stores/refs diferentes;
- falha de espaço não declara sucesso falso.

### 18.2 Refazer ficha

- carrega o Blob original;
- passa pelo leitor atual;
- não usa miniatura;
- não apaga ficha antiga;
- carta parcial continua obedecendo gates R438/R439.

### 18.3 ZIP

- ZIP abre como arquivo válido;
- contém `manifest.json`;
- arquivos usam `sourceHash`;
- CRC32 válido;
- restore ignora duplicata idêntica;
- conflito divergente não sobrescreve silenciosamente;
- `../evil.png` é rejeitado;
- checksum errado é rejeitado;
- restauração mantém print sem vínculo quando a carta não existe.

### 18.4 Catálogo remoto

- manifesto inválido não altera catálogo;
- checksum divergente não altera catálogo;
- `minimumAppVersion` incompatível bloqueia promoção;
- delta válido adiciona cartas;
- mesma versão é idempotente;
- update de carta existente preserva identidade;
- remove remoto não apaga posse;
- falha no segundo chunk deixa versão anterior intacta;
- rollback restaura catálogo anterior.

### 18.5 Regressões

Manter verdes:
- R436 Meu Elenco;
- R437 lote retomável;
- R438 Catálogo Mestre;
- R439 resolvedor;
- R440 identidade visual;
- Motor Mestre R138;
- backup existente R141/R162;
- startup/lazy boundaries.

---

## 19. Arquivos previstos

### Novos

```text
src/modules/master-catalog/cardSourceVaultR441.ts
src/modules/master-catalog/printBackupZipR441.ts
src/modules/master-catalog/masterCatalogSyncR441.ts
src/modules/master-catalog/masterCatalogManifestR441.ts
src/modules/master-catalog/masterCatalogUiModelR441.ts

tests/v40-80-r441-card-source-vault-runtime-regression.ts
tests/v40-80-r441-print-backup-zip-regression.ts
tests/v40-80-r441-master-catalog-sync-regression.ts
tests/v40-80-r441-master-catalog-integration-regression.mjs
```

### Modificados

```text
src/lib/localDatabase.ts
src/modules/squad-mapping/SquadMappingCenter.tsx
src/modules/squad-mapping/squadMappingImageStorage.ts
src/components/CardVisionApp.tsx
src/modules/backup/cardVisionBackupRuntimeR162.ts
src/modules/backup/backupSectionCollectorR141.ts
package.json
scripts/repair-root-tsconfig.mjs
```

A implementação deve evitar aumentar ainda mais `CardVisionApp.tsx`; lógica pesada permanece em módulos R441 e entra por import dinâmico quando apropriado.

---

## 20. Critérios de conclusão

A R441 somente pode ser considerada concluída quando:

1. um print importado gera miniatura **e** original preservado;
2. “Refazer ficha com este print” usa o original;
3. 222 prints podem ser exportados/restaurados por ZIP sem limite artificial;
4. update remoto válido modifica somente o Catálogo Mestre;
5. update inválido mantém o catálogo anterior;
6. rollback funciona;
7. app continua operando offline;
8. posse/fichas/formações/partidas permanecem intactas;
9. regressões R436–R440 continuam verdes;
10. CI completo e APK passam.

---

## 21. Fluxo final aprovado

```text
Você envia uma carta nova
        ↓
PRINT ORIGINAL É SALVO NO COFRE DE PRINTS
        ↓
a carta entra/é resolvida no Catálogo Mestre
        ↓
nova versão do catálogo é publicada
        ↓
BuildMaster detecta atualização
        ↓
“3 cartas novas disponíveis”
        ↓
ATUALIZAR
        ↓
carta aparece no Catálogo Geral
        ↓
Adicionar ao Meu Elenco
        ↓
Gerar ficha
        ↓
print original continua preservado
        ↓
[Refazer ficha com este print]
        ↓
leitor/motor mais novo relê o original quando você quiser
```

Esse fluxo é a autoridade da R441.
