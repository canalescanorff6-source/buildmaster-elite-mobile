# Validação v27.22 — Ponte automática

## Causa do bloqueio anterior

O canal usava ativos que podiam ser substituídos mantendo o mesmo endereço. Durante a propagação do GitHub, o manifesto e o APK podiam vir de publicações diferentes. O atualizador da v27.00 detectava corretamente a divergência de tamanho ou SHA-256 e bloqueava a instalação.

## Arquitetura corrigida

A publicação agora é atômica e compatível com a v27.00:

1. Gera um nome exclusivo no formato aceito pelo atualizador antigo.
2. Publica o APK sem `--clobber`.
3. Baixa publicamente esse mesmo APK.
4. Valida SHA-256, tamanho, pacote, `versionCode`, versão e assinatura.
5. Só então substitui o `update-manifest.json` fixo.
6. Baixa o manifesto final e o APK indicado por ele para validar o conjunto completo.
7. Mantém todos os APKs históricos, garantindo que um manifesto antigo em cache continue válido.

## Contrato da v27.00 preservado

- Manifesto: `buildmaster-latest/update-manifest.json`
- APK: release `buildmaster-latest`
- Nome aceito: `BuildMaster-Elite-Tatico-vX.Y.Z-NUMERO-SHA.apk`
- Aplicativo: `com.buildmaster.elitetatico`
- Atualização obrigatoriamente com `versionCode` maior
- Integridade por tamanho e SHA-256
- Mesma assinatura da versão instalada

## Testes realizados

- TypeScript sem erros.
- Exportação estática do APK concluída.
- YAML do workflow carregado com sucesso.
- Trinta blocos `run` do workflow passaram em `bash -n`.
- Teste específico da ponte automática aprovado.
- Testes de atualização, assinatura, segurança, backup e integridade de release aprovados.
- Demais suítes funcionais executadas por grupos e aprovadas.

## Limite do Android

O processo deixa de exigir download manual. O aplicativo baixa e valida o APK sozinho. O instalador do Android ainda apresenta a confirmação final ao usuário, pois uma instalação comum fora de gerenciamento corporativo não pode ser concluída silenciosamente.
