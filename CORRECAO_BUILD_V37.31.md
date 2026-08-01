# Correção do build v37.31

## Erro corrigido
A execução do workflow estava falhando por regressões dos testes v34.00 e v36.00.

## Causa
Na reformulação visual mais recente, alguns textos da navegação foram alterados e quebraram as verificações automáticas de regressão que esperavam manter compatibilidade histórica.

## Ajustes feitos
- restaurada a string exigida pelos testes: "Buscar no aplicativo";
- restaurada a assinatura exigida pelos testes: "Professional Suite · v37.00";
- mantida a reformulação premium no restante da interface;
- adicionada observação de compatibilidade no componente de navegação.

## Validação
Testes executados com sucesso:
- v34-00-identity-themes-profile-regression
- v34-00-studio-clean-regression
- v34-00-touch-scroll-menu-regression
- v36-00-premium-revolution-regression
