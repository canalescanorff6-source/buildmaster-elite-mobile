# BuildMaster Elite Tático v27.00 — Central Inteligente Integrada

> Leia primeiro: `LEIA-PRIMEIRO-V27.00-CENTRAL-INTELIGENTE.txt`  
> Documentação completa: `README_V27_00_CENTRAL_INTELIGENTE.md`

# BuildMaster Elite Tático v26.70 — Backup e Atualizações

A v26.70 preserva todos os recursos da v26.60, incluindo Universo Meta, fichas DNA, Inteligência da Comunidade, Cofre, equipe, treinamento e análise de delay, e adiciona duas melhorias centrais:

- backup dedicado das fichas e dos jogadores treinados;
- Central de Atualizações integrada ao aplicativo.

## Backup de jogadores treinados

Disponível em **Cofre → Backup** e em **Ajustes → Segurança**.

O arquivo inclui:

- fichas salvas e versões da carta;
- posição escolhida;
- distribuição de treinamento;
- habilidades concluídas e pendentes;
- pastas e organização do Cofre;
- calibração, aprendizado e correções locais.

O backup completo continua disponível para incluir também preferências, Planos A/B/C, regras e sessão em andamento.

## Central de Atualizações

Disponível em **Ajustes → Atualizações**.

Ela mostra:

- versão e build instalados;
- última verificação;
- versão disponível;
- notas da atualização;
- busca manual e automática;
- botão **Backup e atualizar**.

Ao receber uma nova revisão, o aplicativo exibe um aviso no topo e leva diretamente para essa central.

## Publicação pelo GitHub Actions

O workflow **Gerar APK e publicar atualização v26.70** executa, a cada push para `main`:

1. `npm ci`;
2. TypeScript;
3. testes do projeto;
4. exportação estática do app;
5. compilação Android;
6. criação de `update-manifest.json`;
7. publicação da release `buildmaster-latest`, quando a assinatura persistente estiver configurada.

## Assinatura persistente

Para instalar atualizações por cima sem desinstalar, configure os Secrets explicados em:

- `README_ASSINATURA_ATUALIZACOES.md`

Sem esses Secrets, o workflow ainda gera o APK como artefato, mas não publica uma atualização que poderia ter assinatura incompatível.

## Documentação

- `README_V26_70.md` — funcionamento de backup e atualizações;
- `README_ASSINATURA_ATUALIZACOES.md` — criação e configuração da chave Android;
- `README_APK_FIEL.md` — geração do APK;
- `README_V26_60.md` — histórico da Inteligência da Comunidade.
