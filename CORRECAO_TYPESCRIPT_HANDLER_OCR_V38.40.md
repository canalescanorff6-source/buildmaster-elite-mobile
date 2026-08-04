# Correção TypeScript do botão de leitura — v38.40

## Erro corrigido

O botão **Ler imagem e continuar** passava `analyzeSelectedImage` diretamente ao `onClick`.
Essa função aceita os parâmetros opcionais `fileOverride?: File` e `resumed?: boolean`, enquanto o React entrega um `MouseEvent` ao manipulador do botão. O TypeScript rejeitava essa incompatibilidade com `TS2322`.

## Correção aplicada

```tsx
onClick={() => void analyzeSelectedImage()}
```

O evento do clique não é mais repassado como se fosse um arquivo. A regressão v38.40 também foi ampliada para impedir que o manipulador incompatível volte ao código.
