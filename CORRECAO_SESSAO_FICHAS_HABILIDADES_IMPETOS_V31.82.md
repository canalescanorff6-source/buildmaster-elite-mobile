# Correção de sessão, fichas, habilidades e Ímpetos — v31.82

## Sessão persistente

A sessão protegida agora usa cache em memória, leitura com novas tentativas do armazenamento nativo e renovação single-flight. Isso impede que duas validações concorrentes rotacionem o mesmo refresh token e façam o usuário voltar ao login ao trocar de tela, abrir o seletor de imagem ou retornar de outro aplicativo.

Falhas temporárias mantêm o workspace aberto dentro do prazo offline. Bloqueio, suspensão, licença vencida e encerramento de sessão confirmado continuam encerrando o acesso de forma segura.

## Ficha definitiva

O Motor Supremo prioriza finalistas que consumam exatamente o orçamento informado. Planos incompletos podem aparecer apenas como comparação, mas não vencem uma alternativa válida de orçamento exato.

## Cinco habilidades adicionais

O Top 5 é reconstruído depois da ficha final e passa novamente pelas travas de nomes oficiais, posição escolhida, função, estilo, atributos, diversidade e antirrepetição. Habilidades nativas e especiais nunca entram como recomendação adicional.

## Ímpetos

O ranking de Ímpetos é executado novamente depois da ficha definitiva e do Top 5. Assim, a escolha considera a distribuição que realmente será usada. Ímpetos já presentes na carta são removidos das recomendações úteis.

## Testes adicionados

- typecheck isolado da sessão e AuthGate;
- regressão de concorrência e persistência de sessão;
- regressão estrutural da ordem ficha → habilidades → Ímpetos;
- teste runtime com 64/64 pontos, cinco habilidades únicas e exclusão de Ímpeto existente.
