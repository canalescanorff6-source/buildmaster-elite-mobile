# Play Integrity

O build Google Play inclui o bridge nativo de Play Integrity e envia o token para a Edge Function `play-integrity-verify`. O backend valida pacote, hash da solicitação, reconhecimento do app, licenciamento e integridade do aparelho.

Configure `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, vincule o projeto Google Cloud ao aplicativo e use um hash novo para cada ação sensível. Nunca confie apenas no resultado do cliente e não armazene o token bruto em logs.
