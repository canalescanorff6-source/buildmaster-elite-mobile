# BuildMaster Elite Tático — Atualização Contínua v37.70

## Objetivo
Permitir atualizar regras, catálogo de habilidades e Ímpetos/Boosters sem gerar outro APK, mantendo histórico, auditoria e proteção contra pacotes antigos ou inválidos.

## Implementado
- pacote remoto de regras com schema 3770;
- versão declarada do eFootball;
- datas de publicação, atualização e expiração;
- versão mínima compatível do app;
- checksum determinístico do pacote;
- histórico das últimas 12 versões por conta;
- restauração de versão anterior;
- catálogo remoto de habilidades adicionais, habilidades especiais e Boosters;
- suporte a aliases e itens ativos, depreciados ou em prévia;
- habilidades remotas ativas podem entrar no Top 5 quando promovidas por regra válida;
- Boosters remotos podem ser recomendados por regras dinâmicas;
- itens depreciados são bloqueados automaticamente;
- alertas de pacote envelhecendo, desatualizado, expirado, incompatível ou com checksum incorreto;
- nível de confiança calculado por integridade, datas, versão do jogo, compatibilidade, regras, catálogo e fonte;
- backup integral inclui pacote, catálogo remoto e histórico v37.70;
- nova tela “Atualização v37.70” dentro do resultado.

## Arquivo modelo
`public/rules/buildmaster-regras-v37-70-modelo.json`

Esse arquivo pode ser hospedado em uma URL pública. O app baixa, normaliza, audita e somente ativa quando não houver bloqueio crítico.

## Proteções
- pacote inválido não substitui silenciosamente a base anterior;
- posição escolhida pelo usuário permanece autoritativa;
- pontos continuam fechando exatamente;
- habilidade já possuída continua bloqueada;
- versões antigas continuam disponíveis no histórico;
- regras e catálogo são separados por conta.
