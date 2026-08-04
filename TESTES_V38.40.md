# Testes da v38.40

Aprovados neste ambiente:

- regressão v38.40;
- regressões v38.39;
- Otimização Invisível v38.20;
- grupo v31.70 de sessão, rotas e gravador;
- sintaxe de 355 arquivos TypeScript/TSX;
- 726 botões e 27 imagens;
- acessibilidade e contraste;
- orçamento de código em 89,4%;
- auditoria estrutural com 111 verificações;
- pré-voo com 127 verificações;
- manifesto de integridade com 792 arquivos;
- ZIP verificado.

Não executado integralmente:

- npm ci, porque este pacote não contém node_modules e o ambiente anterior apresentou indisponibilidade do registry;
- APK em aparelho físico;
- comportamento prolongado em segundo plano em diferentes fabricantes Android.

A confirmação final do serviço nativo, instalação por cima e geração do APK será feita pelo GitHub Actions.
