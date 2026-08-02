# BuildMaster v38.35 — Correção de regressões legadas

A v38.35 corrige os bloqueios do diagnóstico consolidado observados depois da v38.34.

## Corrigido

- A regressão v31.82 aceita o teto protegido de 4 MiB introduzido pelo Gerador Tático, mas rejeita qualquer aumento acima de 4 MiB.
- As regressões visuais v34.00 e v36.00 reconhecem as versões mantidas da linha v38.3x.
- O cache executivo reconhece a v38.35.
- A auditoria permanece integral e continua verificando módulos órfãos, imports, localStorage, tipos `any`, rotas, segurança e arquivos essenciais.
- O diagnóstico consolidado executa a regressão específica da v38.35.

Nenhuma função do Gerador Tático, das fichas, do OCR, das habilidades, das gravações ou da Análise de Vídeo foi removida.
