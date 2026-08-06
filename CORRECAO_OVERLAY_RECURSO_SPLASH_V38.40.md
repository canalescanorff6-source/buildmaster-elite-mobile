# Correção de atualização por sobreposição — v38.40

## Problema

Ao copiar a nova versão por cima do repositório, o arquivo legado
`resources/android-branding/res/drawable-nodpi/buildmaster_native_splash.png`
podia continuar no Git porque a extração de um ZIP não remove arquivos antigos.
O teste da identidade bloqueava o CI antes da limpeza automática.

## Correção

- o teste deixa de falhar apenas pela presença do resíduo legado na pasta-fonte;
- o instalador ignora esse arquivo durante a cópia dos recursos;
- o instalador remove o resíduo do projeto Android antes e depois da cópia;
- a regressão simula deliberadamente um repositório atualizado por sobreposição.

O recurso válido permanece sendo `buildmaster_native_splash_image.png`, referenciado
pelo XML `buildmaster_native_splash.xml`.
