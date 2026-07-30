# Correção CI v33.00 — regressões legadas desacopladas da interface

## Problema

A interface do aplicativo foi elevada para v33.00, enquanto os motores internos de OCR, leitura e calibração continuaram corretamente na geração funcional v32.00. Seis regressões antigas comparavam essas versões internas diretamente com a versão visual do pacote, encerrando o GitHub Actions mesmo com as funções aprovadas.

## Correção

- As regressões v30.30, v30.50, v31.40, v31.50, v31.60 e v31.75 agora validam uma versão interna mínima semântica, v32.00 ou posterior.
- O marcador da leitura detalhada é conferido contra a versão real do próprio motor, incluindo início e fim do bloco.
- O app não força uma migração artificial dos motores para v33.00 e não apaga calibrações, mapas ou caches válidos apenas por causa da mudança de layout.
- O verificador de guardas de versão passou a bloquear novamente acoplamentos entre regressões legadas e a versão visual atual do aplicativo.

## Escopo preservado

Nenhuma lógica de ficha, OCR, habilidades, Ímpetos, login, formação, calibrador ou interface foi alterada por este hotfix.
