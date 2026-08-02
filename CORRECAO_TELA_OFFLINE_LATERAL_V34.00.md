# Correção da tela offline lateral — v34.00

## Problema observado

A interface podia exibir mais de um aviso persistente de conexão ao mesmo tempo:

- painel de licença offline do `AuthGate`;
- painel offline do monitor global `AppRuntimeStatus`;
- faixa offline da camada `PremiumExperienceLayer`.

A sobreposição fazia um dos avisos aparecer como uma tela ou painel preso na lateral do aplicativo.

## Correção

- removido o painel lateral persistente de licença offline;
- removido o painel global duplicado de rede;
- removida a faixa offline persistente da camada premium;
- mantida somente uma notificação temporária quando a rede muda;
- a sessão continua aberta durante falhas transitórias;
- a reconexão da licença continua automática em segundo plano;
- o monitor global permanece ativo para erros reais de armazenamento;
- regras CSS neutralizam marcação antiga ainda presente no cache do WebView;
- esquema de cache nativo atualizado para forçar a limpeza uma única vez após instalar esta correção.

## Resultado esperado

A tela principal e o menu lateral não ficam mais cobertos por uma tela de offline. Quando a conexão cair, aparece apenas uma notificação temporária na parte inferior, que desaparece sozinha. Quando a conexão voltar, outra notificação temporária confirma a reconexão.
