# Correção CI v38.40 — quatro regressões legadas

## Falhas corrigidas

- Regressões v33.00
- Regressões v37.71
- Regressões v38.00
- Regressões v38.31

## Causa

A correção de abertura Android moveu o contrato do cache nativo para um módulo auxiliar. As regressões antigas ainda validavam o contrato estático dentro de `RegisterServiceWorker.tsx`. Além disso, a compactação defensiva do Cofre preservava `folderId` pelo spread do objeto, mas a regressão v38.00 exigia a preservação explícita desse campo.

## Alterações

- restaurado o contrato literal `NATIVE_CACHE_SCHEMA` em `RegisterServiceWorker.tsx`;
- mantida a invalidação real por build usando `CURRENT_BUILD_ID` em `nativeWebCacheRecoveryV3840.ts`;
- adicionada verificação conjunta de esquema e fingerprint do build;
- mantida a recuperação única do WebView sem apagar dados do usuário;
- preservado explicitamente `folderId` ao compactar as fichas do Cofre;
- atualizado o manifesto de integridade da v38.40.

## Validação

Os grupos abaixo foram executados e aprovados localmente:

- `npm run test:v3300`
- `npm run test:v3771`
- `npm run test:v3800`
- `npm run test:v3831`
- `npm run test:v3840`
- `npm run integrity:verify`

A instalação completa das dependências não pôde ser refeita neste ambiente por indisponibilidade de um pacote no cache interno. O GitHub Actions executará `npm ci` normalmente antes do diagnóstico consolidado.
