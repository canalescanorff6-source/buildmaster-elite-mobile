# Hotfix v38.40 — regressão v37.40 e salvamento para revisão

## Causa da falha no GitHub Actions

A regressão v37.40 ainda exigia que o botão de salvamento fosse desativado quando `validation.canGenerate` fosse falso. Esse contrato antigo entrou em conflito com o hotfix de armazenamento da v38.40, no qual uma ficha com alertas deve continuar salvável no Cofre com o status **Revisar**.

## Correções aplicadas

- A precisão estrutural continua classificando fichas incompletas como bloqueadas para uso definitivo.
- O bloqueio estrutural não impede mais o usuário de preservar a ficha no Cofre.
- A tela principal e o cartão Premium Clean exibem **Salvar para revisar** quando há alertas.
- O botão só fica indisponível quando não existe uma função de salvamento conectada, nunca por causa de alertas de OCR ou validação.
- A regressão v37.40 foi atualizada para verificar o contrato atual sem remover as validações de identidade, pontos, habilidades e confiança.
- A regressão de armazenamento v38.40 agora cobre também o cartão Premium Clean, evitando que uma segunda trava escondida volte no futuro.

## Resultado esperado

Fichas aprovadas são salvas normalmente. Fichas com dados incertos também podem ser salvas, mas recebem o status **Revisar** para correção posterior, mantendo a proteção técnica sem perder o trabalho do usuário.
