# Limitações conhecidas — v38.35

- O typecheck global não foi confirmado neste ambiente porque as dependências npm não estão instaladas.
- O APK e o AAB não foram gerados localmente.
- Assinatura, Supabase incorporado, MediaStore e instalação por cima precisam ser confirmados no GitHub Actions e em aparelho Android.
- `CardVisionApp.tsx` e `analyzer.ts` continuam grandes e devem ser modularizados em uma etapa futura, sem remoção de funções.
