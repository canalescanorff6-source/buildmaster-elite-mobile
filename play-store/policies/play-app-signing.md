# Play App Signing e chave de upload

Use uma chave de upload permanente e separada do artefato de distribuição. O Secret `GOOGLE_PLAY_UPLOAD_KEY_BUNDLE` deve conter keystore em Base64, senha do armazenamento, alias e senha da chave. Nunca salve o keystore ou as senhas no repositório.

Ative o Play App Signing no aplicativo do Play Console, registre os certificados necessários no Supabase/Google Cloud e mantenha uma cópia segura da chave de upload e do procedimento de recuperação.
