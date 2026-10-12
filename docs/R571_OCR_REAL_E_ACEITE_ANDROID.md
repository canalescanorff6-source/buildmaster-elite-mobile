# R571 — Homologação real do OCR e do APK Android

## Objetivo

O CI GREEN confirma o código e os testes automatizados. **Não confirma que o OCR lê corretamente qualquer print no POCO X4 GT ou outro celular**. R571 quantifica a qualidade em prints reais de uma versão específica do aplicativo, sem alterar as cartas e sem confundir OCR sintético com teste de aparelho.

Os workflows oficiais já existentes são:

- `.github/workflows/build-apk.yml` — build do canal direto (requer assinatura, CI, Supabase e geração do APK).
- `.github/workflows/device-acceptance-r532.yml` — validação física posterior, vinculada ao `sourceSha` e `apkSha256` da release.
- `scripts/validate-device-acceptance-r532.mjs` — exige dispositivo real, 10 cartas testadas, conjunto de posições, Cofre com 225+ fichas e checks completos.
- `scripts/evaluate-ocr-golden-corpus-r571.mjs` — **novo** verificador da acurácia OCR; não publica APK nem marca o aceite R532.

**Nenhum JSON de exemplo substitui um teste real. Não inserir dados fictícios no aceite.**

## Preparar os prints originais

Mantenha fotos, prints, nome de quem revisou e manifesto em `.local/ocr-real/` (ignorado no Git). Não coloque screenshots privados na PR ou no repositório público. Preferir cópias locais criptografadas.

Cada captura deve representar a tela real lida pelo mesmo APK candidato, sem mascarar a região de atributos. Anotar manualmente os **26 atributos na ordem real**, nome, nível, pontos visíveis no jogo e, quando o print mostrar, habilidades adicionais e ímpetos. Testar os modos `automatic` e `zones`. Manter prints que falharam ou travaram: não excluí-los para melhorar a média.

Estrutura mínima, **apenas modelo a preencher com valores reais**:

```json
{
  "schemaVersion": 1,
  "kind": "REAL_DEVICE_OCR_CORPUS",
  "gameVersion": "6.0.0",
  "sourceSha": "COLE_O_SOURCE_SHA_REAL_DE_40_HEX",
  "apkSha256": "COLE_O_SHA256_REAL_DO_APK_DE_64_HEX",
  "cases": []
}
```

Para cada print adicione um registro em `cases`:

```json
{
  "caseId": "print-real-001",
  "sourceKind": "REAL_SCREENSHOT",
  "reviewedByHuman": true,
  "imagePath": "screens/print-real-001.png",
  "imageSha256": "SHA256_REAL_DO_ARQUIVO",
  "mode": "automatic",
  "gameVersion": "6.0.0",
  "deviceModel": "MODELO_REAL_TESTADO",
  "resolution": "2400x1080",
  "cardType": "TIPO_REAL_DA_CARTA",
  "outcome": "completed",
  "expected": {
    "playerName": "NOME_CONFERIDO_MANUALMENTE",
    "level": 1,
    "points": 0,
    "attributeRows": [70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70],
    "additionalSkills": [],
    "boosters": []
  },
  "observed": {
    "playerName": "NOME_REALMENTE_LIDO_PELO_APLICATIVO",
    "level": 1,
    "points": 0,
    "pointsSource": "print",
    "attributeRows": [70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70,70],
    "additionalSkills": [],
    "boosters": []
  }
}
```

**Os números acima são marcadores ilustrativos, não leituras verdadeiras.** Substitua todos por dados realmente conferidos. Para print que não exibe skills ou ímpetos, omita esses dois arrays em `expected` e `observed`, em vez de registrar a ausência como se fosse um campo visível. Se ocorreu crash, use `outcome: "crash"`; mantenha o caso mesmo quando `observed` estiver vazio. Modos de falha: `crash`, `timeout`, `worker_error`.

Preencha `gameVersion` com a versão **real** do eFootball em cada captura e no topo do manifesto. Não misture prints de patches diferentes no mesmo resultado. O valor `6.0.0` é apenas exemplo.

Cada `imageSha256` deve ser calculado do **arquivo original**. No Linux, macOS ou Git Bash: `sha256sum .local/ocr-real/screens/print-real-001.png`. Para o APK, obtenha o hash da release no GitHub Actions e confira os mesmos bytes do APK instalado. Também anote o `sourceSha` da release; resultados de APKs distintos nunca devem ser misturados.

## Executar os comandos no repositório

Gerar relatório de diagnóstico, mesmo se ainda não houver corpus:

```bash
npm run ocr:r571:report
```

Para executar com o manifesto real e gerar relatório agregado:

```bash
node scripts/evaluate-ocr-golden-corpus-r571.mjs \
  --corpus .local/ocr-real/manifest.json \
  --output .local/ocr-real/report.json
```

Para o gate de uma **release física específica** (sem expor nomes/prints em logs):

```bash
export SOURCE_SHA="SHA40_DA_RELEASE"
export APK_SHA256="SHA64_DO_APK_IMUTAVEL"
node scripts/evaluate-ocr-golden-corpus-r571.mjs \
  --corpus .local/ocr-real/manifest.json \
  --output .local/ocr-real/report.json \
  --strict
```

O comando `--strict` retorna erro se faltar corpus, assinatura de imagem, origem do APK, diversidade ou qualidade mínima. Ele exige inicialmente: 30 prints reais, três tipos de cartas, dois modelos de dispositivo, duas resoluções, ambos os modos, oito capturas com skills e oito com ímpetos; sem travamentos. Limiares de engenharia em `OCR_CORPUS_R571_RELEASE_THRESHOLDS`: nome, nível e pontos ≥99%; 26 atributos avaliados individualmente ≥99,5%; pelo menos 90% das capturas com **todos os 26** corretos; skills e boosters visíveis ≥95%. Esses limites são **critérios internos propostos de aprovação**, não metas oficiais do jogo nem prova de acurácia universal. Podem ser endurecidos depois de dados reais.

O relatório contém apenas métricas agregadas e códigos de erro; não inclua capturas ou nomes dos jogadores nos artefatos públicos. Prints em diferentes níveis, temas e versões do jogo exigem revalidação do corpus.

## Build Android debug preventivo

A PR R571 também executa um workflow **Build Android debug sem publicar**. Ele recompila o projeto web com OCR local, recria o Android nativo via Capacitor, instala os módulos internos e exige `assembleDebug` GREEN. O artefato de teste é salvo como `r571-buildmaster-debug-apk-<run_id>` por cinco dias.

**Atenção:** o APK debug NÃO é o APK assinado oficial e NÃO substitui a release do canal direto. Um teste feito com o debug não pode preencher o recibo R532, que exige a mesma assinatura/versão/SHA-256 do APK imutável distribuído. A compilação debug não comprova ausência de travamentos em hardware real.

## Aceite físico e fechamento da versão

1. Confirmar GitHub Actions GREEN para o último commit, inclusive build do APK assinado.
2. Baixar a release imutável, conferir o SHA-256 do APK e instalá-lo de verdade no celular Android.
3. Rodar e revisar o corpus real R571, incluindo casos com OCR incompleto, alterações de tela, modo automático e zonas.
4. Executar a matriz de teste manual R532: abrir aplicativo, login, Reader/OCR, fichas, 5 habilidades, ímpetos, formação, Cofre, exportação, atualizações, restauração e testes de volume/ausência de travamentos.
5. Somente após teste físico verdadeiro, usar `device-acceptance-r532.yml` com JSON de aceite preenchido. O workflow vincula o recibo ao **mesmo APK** da release pelo checksum, versão e commit.
6. Não marcar "100% pronto", "OCR aprovado" nem "ANDROID ACCEPTED" apenas com os testes de unidade da R571.

## Limitações deliberadas

- Não oferece testes físicos automáticos sem um dispositivo real e capturas revisadas.
- Não substitui a implementação OCR: identifica **onde** erramos e em que contexto para posterior correção específica.
- Não coleta prints, senhas, tokens, dados pessoais ou evidência de partida automaticamente.
- A regressão de CI R571 usa **dados simulados somente para testar a lógica do verificador**. A existência de um teste GREEN nesse workflow significa somente que a ferramenta de medição passou, nunca que o OCR físico passou.
