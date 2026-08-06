# Correção do ciclo de recurso da splash Android — v38.40

## Falha corrigida

O Android tratava os arquivos abaixo como o mesmo recurso, porque todas as pastas `drawable-*` compartilham o mesmo namespace:

- `drawable/buildmaster_native_splash.xml`
- `drawable-nodpi/buildmaster_native_splash.png`

O XML continha `@drawable/buildmaster_native_splash`, que acabava resolvendo para o próprio XML e gerava:

```text
ResourceCycle: Drawable buildmaster_native_splash should not reference itself
```

## Solução

O bitmap foi renomeado para `buildmaster_native_splash_image.png` e o XML agora referencia `@drawable/buildmaster_native_splash_image`. O instalador também remove automaticamente o nome legado antes de copiar os recursos.

Foi adicionada uma regressão que bloqueia nomes iguais entre o XML e o PNG e confirma a instalação em um projeto Android limpo.
