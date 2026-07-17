# Correção do erro no GitHub Actions — v26.76

O workflow falhava em `Rodar testes do motor` porque o teste legado `tests/v26-74-polish-regression.ts` ainda procurava o texto `Elite Tático v26.75` dentro da interface.

O aplicativo e os demais arquivos já estavam corretamente na v26.76. A expectativa antiga foi atualizada para `Elite Tático v26.76`. Nenhum cálculo, login, Supabase, segurança ou layout foi alterado nesta correção.
