# Correção do CI v32.00 — isolamento das regressões legadas

## Sintoma

O diagnóstico completo do GitHub Actions encerrava com `Regressões v30.00 (código 1)`, embora a mega calibração v32.00 estivesse aprovada.

## Causa

O script legado `test:v3000` executava novamente quatro validações globais já executadas pelo `ci-doctor`: pré-voo de produção, pré-voo Google Play, sintaxe e contratos interativos. Isso misturava falhas modernas com o grupo v30.00 e criava atribuição incorreta no resumo.

Durante a auditoria também foi encontrado um teste v30.30 preso ao marcador textual `LEITURA DETALHADA V31.x`. A saída correta da versão atual é `LEITURA DETALHADA V32.00`.

## Correções

- criado `test:v3000:core`, contendo somente o typecheck e as três regressões realmente pertencentes à v30.00;
- `test:v3000` agora delega ao núcleo isolado;
- `ci-doctor` executa diretamente `test:v3000:core`, sem repetir pre-hooks;
- validações globais permanecem nos grupos próprios e continuam obrigatórias;
- teste v30.30 deriva a versão atual do `package.json`;
- guarda automática impede que o marcador de leitura volte a ficar preso à v31;
- regressão v32.00 garante que o isolamento do CI seja preservado.

## Efeito

O diagnóstico passa a indicar o grupo exato que falhou. A correção não altera o motor de fichas, habilidades, Ímpetos, OCR, sessão, calibrador ou interface do aplicativo.
