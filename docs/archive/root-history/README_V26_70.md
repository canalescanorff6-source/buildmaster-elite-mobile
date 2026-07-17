# BuildMaster Elite Tático v26.70 — Backup e Atualizações

## Backup de fichas e jogadores treinados

O Cofre possui um novo botão **Jogadores treinados**. O arquivo inclui:

- fichas salvas;
- posição escolhida;
- distribuição dos pontos;
- habilidades concluídas e pendentes;
- pastas do Cofre;
- calibração e aprendizado local relacionados aos jogadores.

O backup completo continua disponível em **Ajustes → Segurança** e inclui também preferências, planos, regras e sessão em andamento.

Antes de abrir o download de uma atualização, o aplicativo cria automaticamente um backup de jogadores e fichas.

## Central de atualizações

A nova tela fica em **Ajustes → Atualizações**.

Ela mostra:

- versão instalada;
- identificação do build;
- data da última busca;
- nova versão disponível;
- notas da atualização;
- botão para criar backup e baixar o APK.

O aplicativo verifica um arquivo `update-manifest.json`. A URL pode ser configurada dentro do próprio app.

## Publicação automática pelo GitHub Actions

O workflow `.github/workflows/build-apk.yml` foi preparado para, a cada envio para a branch `main`:

1. instalar as dependências;
2. validar TypeScript;
3. executar os testes;
4. gerar o APK;
5. gerar `update-manifest.json`;
6. publicar os dois em uma release móvel chamada `buildmaster-latest`.

O APK compilado recebe automaticamente esta URL durante o build:

```text
https://github.com/OWNER/REPOSITORY/releases/download/buildmaster-latest/update-manifest.json
```

O GitHub preenche `OWNER/REPOSITORY` usando o próprio repositório.

### Repositório público ou privado

- Em repositório público, o app consegue consultar e baixar a release sem autenticação.
- Em repositório privado, use uma URL pública própria, Vercel, servidor ou serviço de atualização. O app permite substituir a URL do manifesto.

## Limitação de segurança do Android

O GitHub Actions gera e publica automaticamente a atualização. O aplicativo avisa e abre o download, mas o Android exige confirmação do usuário para instalar um APK baixado fora da Play Store.

Atualizações totalmente silenciosas exigem distribuição pela Play Store ou uma solução OTA nativa. Alterações em permissões, plugins Capacitor, código Android, ícone, splash e outras partes nativas sempre exigem um APK novo.

## Assinatura persistente

Para que o Android aceite instalar a atualização por cima da versão anterior, configure os quatro Secrets de assinatura descritos em `README_ASSINATURA_ATUALIZACOES.md`.

Sem esses Secrets, o workflow continua gerando um APK de teste, mas não publica a release automática para evitar oferecer uma atualização com assinatura incompatível.

## Integridade e continuidade das preferências

- O manifesto aceita somente URLs de download HTTPS, com exceção de localhost para desenvolvimento.
- A data do manifesto é validada antes de exibir a atualização.
- O workflow calcula o SHA-256 do APK e grava no manifesto.
- A URL do manifesto, a verificação automática e a revisão ignorada usam chaves estáveis, para não serem perdidas a cada nova versão.
