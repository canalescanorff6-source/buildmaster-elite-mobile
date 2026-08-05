# Correção de duplicidade do ícone Android — v38.40

## Falha corrigida

O Gradle interrompia `:app:mergeReleaseResources` porque `ic_launcher_background` era declarado ao mesmo tempo em:

- `values/launch_background.xml`, criado pelo template Android/Capacitor;
- `values/buildmaster_branding.xml`, instalado pela identidade BM.

## Solução

- removida a declaração duplicada da identidade;
- mantida a cor exclusiva `buildmaster_branding_background`;
- o instalador agora elimina automaticamente qualquer declaração legada de `ic_launcher_background`;
- o teste de regressão simula o recurso padrão do Capacitor e exige apenas uma declaração após a instalação.

A correção preserva o novo ícone, o Adaptive Icon, o modo monocromático e a splash premium.
