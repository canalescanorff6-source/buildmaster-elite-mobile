# BuildMaster Elite Tático v38.34 — Correção completa do CI

A v38.34 preserva o Gerador Tático Profissional da v38.33, corrige o CI e mantém o Estúdio de Formações em um gerador local de artes táticas detalhadas, sem IA paga. O template usa SVG determinístico, mantém exatamente 11 jogadores, organiza setas atrás dos marcadores e exporta PNG/PDF no padrão premium Marques Fichas.

Consulte primeiro:

- `CORRECAO_COMPLETA_CI_V38.34.md`;
- `TESTES_V38.34.md`;
- `ARQUIVOS_ALTERADOS_V38.34.md`;
- `INSTRUCOES_PUBLICACAO_V38.34.md`;
- `RELEASE_NOTES_V38.34.md`.

A documentação da v38.33 permanece no projeto como histórico do Gerador Tático Profissional.

---

# BuildMaster Elite Tático v38.32 — Integração completa

A v38.32 foi construída sobre a v38.31 e integra criação de usuários confirmada, gravações com Galeria e compartilhamento, Análise de Vídeo Inteligente 2.0, Estúdio de Formações Meta Premium, exportação tática e backup completo, sem criar outro aplicativo nem alterar o `applicationId`.

Consulte:

- `ATUALIZACAO_COMPLETA_V38.32.md`;
- `TESTES_V38.32.md`;
- `INSTRUCOES_PUBLICACAO_V38.32.md`;
- `LIMITACOES_V38.32.md`.

---

# BuildMaster Elite Tático v38.20 — Otimização Invisível

## Correção v38.21

A v38.21 corrige a falha do grupo **TypeScript completo** da v38.20, removendo símbolos antigos sem uso da interface clean e adicionando uma regressão preventiva específica. Nenhuma função visual ou motor da v38.20 foi removido.


A v38.20 preserva integralmente a interface clean da v38.10 e melhora o desempenho por trás das telas: processamento adaptativo de imagens, OCR serializado, liberação automática do worker, pré-carregamento inteligente e manutenção segura dos caches temporários.

Consulte `OTIMIZACAO_INVISIVEL_V38.20.md` para o escopo completo.

---

# BuildMaster Elite Tático v38.10 — Resultado Premium Clean

A versão v38.10 mantém todos os motores de precisão, habilidades, Booster, validação e atualização contínua, mas apresenta o resultado básico em um único card clean. A ficha pode ser exportada em PNG vertical ou quadrado, pronta para compartilhamento.

Consulte `RESULTADO_PREMIUM_CLEAN_V38.10.md` para o escopo completo.

---

# BuildMaster Elite Tático v37.00 — Inteligência Profissional

Aplicativo para criar, testar e recalibrar fichas de gameplay no eFootball com foco em desempenho real, posição escolhida, habilidades adicionais oficiais e evidência de partidas.

## v37.00 — Central Profissional

A v37.00 conecta os motores que já existiam em um fluxo único de análise:

- validação das fichas por partidas reais;
- oito perfis de gameplay por contexto;
- compatibilidade completa nas treze posições;
- matriz de habilidades com Top 5, reservas, obrigatória, opcional e bloqueios;
- banco local por versão da carta;
- aprendizado pessoal controlado;
- integração com OCR, Meu Time, vídeo, Ímpetos e histórico;
- recalibração orientada por evidência, sem perseguir overall.

## Base visual preservada

A interface Premium Revolution da v36.00 permanece como Design System principal: home executiva, superfícies sólidas, dock móvel, menu lateral e contraste consistente. A Central Profissional acrescenta painéis responsivos próprios sem reintroduzir transparências excessivas.

## Proteções

- A posição escolhida não apaga a ficha da posição natural.
- A formação, sozinha, não muda a distribuição individual.
- Nenhuma habilidade adicional inexistente é recomendada.
- O app não repete habilidade que a carta já possui.
- Aprendizado e evidência não alteram a ficha silenciosamente.
- Conversões de posição recebem nota honesta e podem ser classificadas como não recomendadas.

Consulte `CENTRAL_PROFISSIONAL_V37.00.md` para o contrato funcional completo e `PREMIUM_REVOLUTION_V36.00.md` para a base visual.

