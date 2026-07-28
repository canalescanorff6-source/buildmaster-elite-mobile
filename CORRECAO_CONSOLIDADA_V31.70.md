# BuildMaster v31.71 — Correção consolidada de CI e publicação

Este pacote reúne em uma única base limpa todas as correções aplicadas durante a implementação do Treinador de Partidas:

- rota raiz restaurada com `AuthGate` e `CardVisionApp`;
- Política de Privacidade mantida somente em `/privacidade`;
- exclusão de conta mantida somente em `/excluir-conta`;
- isolamento dos stubs de testes no TypeScript;
- correções de tipagem do recorte OCR;
- remoção da importação não utilizada;
- escapes Java válidos no gravador MediaProjection;
- validação preventiva do Java nativo gerado;
- diagnóstico consolidado que continua após uma falha e lista todos os grupos problemáticos no mesmo job.

## Novos comandos

```bash
npm run ci:preflight
npm run ci:verify
```

`ci:preflight` executa verificações independentes de build. `ci:verify` acrescenta o typecheck completo e todas as regressões históricas.

## Aplicação correta

Para evitar arquivos antigos ou patches incompletos, substitua o conteúdo do repositório pelo conteúdo deste pacote completo. Não misture patches antigos sobre esta versão.
