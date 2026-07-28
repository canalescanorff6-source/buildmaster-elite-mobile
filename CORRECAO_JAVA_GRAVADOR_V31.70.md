# Correção Java do Gravador — BuildMaster v31.70

## Falha corrigida

O GitHub Actions parava em `:app:compileReleaseJavaWithJavac` com `illegal escape character` no arquivo Java gerado para o gravador de partidas.

A origem estava no gerador `scripts/install-match-recorder-plugin.mjs`: expressões regulares para arquivos `.mp4` possuíam duas barras no template JavaScript, mas precisavam de quatro para que o Java final recebesse duas barras válidas.

## Ajustes

- Corrigido `replaceFirst("\\.mp4$", "")` no Java gerado.
- Corrigido `name.matches("match-[0-9]{10,20}\\.mp4")` no Java gerado.
- Criado o portão `quality:native-java`.
- O portão gera os dois arquivos Java nativos em um projeto temporário e verifica todos os literais contra escapes ilegais.
- A regressão do instalador agora confirma as expressões MP4 corretas e rejeita a forma inválida.
- Os workflows de APK e Google Play executam o novo portão antes da criação do projeto Android.
- O pré-voo de produção exige a presença do portão para impedir regressão futura.

## Validações executadas

- Java nativo gerado: aprovado, sem escapes ilegais.
- Instalador MediaProjection idempotente: aprovado.
- Testes v31.70: aprovados.
- Sintaxe TypeScript/TSX: aprovada em 251 arquivos.
- Contratos interativos: 684 botões e 24 imagens aprovados.
- Rotas críticas, isolamento TypeScript e segurança de recorte: aprovados.
- Pré-voo de produção: 105 verificações aprovadas.

O typecheck global local depende das dependências instaladas por `npm ci`. No GitHub, essa etapa já havia sido aprovada no mesmo run antes de a compilação Java encontrar a falha corrigida neste pacote.
