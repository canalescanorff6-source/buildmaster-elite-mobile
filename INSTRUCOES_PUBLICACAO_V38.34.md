# Publicação da v38.34

## Substituição segura no repositório

1. Faça uma cópia da pasta atual do projeto.
2. Extraia o ZIP da v38.34 em uma pasta nova.
3. No repositório local, preserve apenas a pasta oculta `.git`.
4. Substitua o restante do conteúdo pelos arquivos da v38.34.
5. Não altere o `applicationId` nem arquivos da chave de assinatura.
6. Confirme que `src/app/page.tsx` contém `AuthGate` e `CardVisionApp` antes do commit.
7. Abra o GitHub Desktop e confirme que não há remoção inesperada de módulos funcionais.

A substituição limpa é importante porque arquivos antigos ou criados manualmente no repositório podem permanecer mesmo quando não fazem parte do ZIP.

## Summary do GitHub Desktop

```text
v38.34 — corrige orçamento, rota inicial, auditoria e TypeScript do gerador tático
```

## Workflow que deve ser acompanhado

**Gerar APK Canal Direto**

A execução deve passar por:

- diagnóstico consolidado;
- TypeScript completo;
- regressões v38.33 e v38.34;
- exportação estática;
- sincronização do Android;
- assinatura;
- SHA-256 e manifesto de publicação.

## Se o workflow ainda falhar

Copie todas as linhas que contenham:

```text
error TS
```

Também copie o resumo do grupo que falhou. Não reutilize um APK produzido por uma execução incompleta.

## Atualização sobre o APK instalado

A v38.34 mantém o mesmo identificador técnico do aplicativo. A instalação como atualização ainda depende de o GitHub usar a mesma chave de assinatura e produzir um `versionCode` superior ao pacote instalado.
