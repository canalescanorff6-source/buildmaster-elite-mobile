# Guia de publicação Google Play — BuildMaster v31.71

## Versão

- Nome: BuildMaster Elite Tático v31.71
- Versão do aplicativo: `31.71.0`
- Pacote Android: `com.buildmaster.elitetatico`
- Recurso principal: Treinador de Partidas com captura autorizada pelo Android e análise local pós-partida.

## Antes de publicar

Cadastre no GitHub as mesmas Variables e Secrets já usados nas versões anteriores:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_PLAY_CLOUD_PROJECT_NUMBER`
- `GOOGLE_PLAY_UPLOAD_KEY_BUNDLE`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, quando a publicação automática estiver ativada

O workflow **Gerar AAB v31.71 Google Play** executa os testes, gera o site estático, cria o projeto Android limpo, instala o gravador nativo, sincroniza o Capacitor, assina o AAB e valida o pacote com Bundletool.

## Permissões e declaração de privacidade

A v31.71 acrescenta:

- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_MEDIA_PROJECTION`
- `POST_NOTIFICATIONS`

A gravação começa somente depois da autorização oficial exibida pelo Android em cada sessão. O app não grava microfone, não envia o vídeo automaticamente e salva os arquivos no diretório privado do aplicativo.

Na ficha de Segurança de Dados, mantenha a declaração alinhada ao comportamento real:

- vídeos de partida ficam locais por padrão;
- relatórios leves podem permanecer no histórico local;
- nenhum vídeo é compartilhado sem ação explícita do usuário;
- o recurso não controla nem modifica o eFootball.

## Teste interno obrigatório

Antes de promover para produção, valide no canal interno:

1. autorização e cancelamento da captura;
2. gravação em 540p, 720p e 1080p;
3. parada pelo app e pela notificação;
4. retorno correto à orientação normal;
5. reprodução do MP4 salvo;
6. exclusão do vídeo e do relatório;
7. importação de vídeo existente;
8. análise local, cancelamento e exportação do relatório;
9. funcionamento em Android 8, 10, 12, 13, 14 e 15, quando houver aparelhos de teste;
10. impacto de temperatura e desempenho durante uma partida.

## Texto da atualização

Use o arquivo:

`play-store/listing/pt-BR/release-notes/31.71.0.txt`

## Summary para GitHub Desktop

`Implementa Treinador de Partidas v31.71 com gravação Android e análise local de gameplay`
