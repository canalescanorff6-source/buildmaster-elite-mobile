# R520 — Reference Premium Redesign Foundation

Data: 2026-09-29

## Objetivo

Criar a camada visual oficial de referência do BuildMaster sem alterar o motor. A identidade parte do contrato visual definido no Prompt Mestre: navy profundo, ouro metálico e ciano técnico, com aparência mobile-first e premium.

## Implementação

Nova camada: `src/app/v44-buildmaster-reference.css`

Ela é carregada por último em `src/app/layout.tsx` e ativada pela classe `bm-v4400-reference`, permitindo consolidar o visual sem apagar os estilos históricos ainda necessários.

### Tokens principais

- navy 950/900/850/800;
- superfícies 1/2/3;
- ouro 300/400/500/600;
- ciano 300/400/500;
- texto 1/2/3;
- linhas, radius, sombras e motion.

### Superfícies cobertas

- sidebar e navegação;
- topbar;
- dock mobile;
- dashboard/home;
- cards premium;
- heroes;
- resultado/ficha;
- navegação interna de resultado;
- métricas;
- botões primários;
- estados/foco;
- safe areas mobile;
- reduced motion.

## Bootstrap visual

`CardVisionApp` agora inicia em `obsidian-gold`, alinhando o primeiro render ao contrato navy + ouro. Preferências persistidas continuam podendo substituir o preset depois da hidratação normal.

## Firewall funcional

R520 é apresentação. Não altera:

- OCR;
- PP;
- progressão;
- ficha;
- Top 5;
- Ímpeto;
- R510/R517/R518;
- persistência de resultado;
- Single Final Writer.

## Próxima continuidade

As próximas telas devem reutilizar estes tokens e componentes existentes em vez de criar novos temas independentes. Toda alteração visual deve manter o teste R519/R520 e o gate R419 verdes.
