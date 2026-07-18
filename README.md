# BuildMaster Elite Tático v27.24 — Atualização Automática Direta

A v27.24 corrige a falha da primeira rota do GitHub. O aplicativo agora consulta primeiro o manifesto fixo do canal automático, que aponta diretamente para um APK de release imutável. A API `releases/latest` continua disponível, mas somente como rota de reserva.

## O que mudou

- Canal direto como rota principal, sem depender da API do GitHub.
- APK publicado uma única vez na release imutável.
- Manifesto fixo compatível com versões antigas.
- Validação pública antes e depois da ativação do manifesto.
- SHA-256, tamanho, pacote, versionCode, versão e assinatura conferidos.
- Diagnóstico e histórico técnico mantidos na Central de Atualizações.

## Validação local

```bash
npm ci
npm run typecheck
npm run test:all
```

## Publicação

Envie todo o conteúdo para a branch `main`, incluindo a pasta `.github`. O workflow **Gerar APK v27.24 e publicar atualização automática direta** criará e publicará o pacote.
