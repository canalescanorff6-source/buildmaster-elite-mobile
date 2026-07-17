# BuildMaster Elite Tático v26.75 — Segurança reforçada

Esta versão aplica as oito melhorias solicitadas, na ordem definida.

## 1. Bloqueio de APK antigo no servidor

A função `license-session` exige o identificador oficial do aplicativo e a versão mínima configurada no banco. A configuração inicial da v26.75 bloqueia versões abaixo de `26.75.0` com resposta HTTP 426.

A versão mínima pode ser alterada futuramente na tabela `buildmaster_security_settings`, sem precisar modificar todos os usuários.

## 2. MFA obrigatório para administrador

O painel administrativo exige uma sessão `aal2`. A conta administrativa pode cadastrar um autenticador TOTP pelo próprio BuildMaster, usando QR Code ou chave manual. Sem a confirmação do código de seis dígitos, ações administrativas são recusadas no servidor.

## 3. Tokens protegidos pelo Android Keystore

No APK Android, tokens e dados sensíveis da sessão são armazenados em preferências criptografadas com AES-GCM. A chave AES fica protegida pelo Android Keystore e não é gravada em texto dentro do aplicativo.

Sessões antigas guardadas no `localStorage` são migradas e removidas quando o APK seguro é aberto.

## 4. Atualização oficial e APK verificado

O canal de atualização foi fixado na release oficial `buildmaster-latest`. O APK é baixado pelo módulo nativo, limitado a 250 MB, conferido por SHA-256 e só então enviado ao instalador do Android.

O manifesto e o APK precisam vir do repositório oficial configurado no código.

## 5. Período offline reduzido

- usuários comuns: 4 horas;
- administrador: 12 horas.

A licença continua sendo revalidada quando a conexão volta. Bloqueio, suspensão e vencimento continuam prevalecendo no servidor.

## 6. Backup criptografado

Os novos backups usam o formato `.bmbak` com:

- PBKDF2-SHA-256 com 210.000 iterações;
- chave de 256 bits;
- AES-GCM;
- senha mínima de 12 caracteres com letras e número;
- detecção de senha incorreta ou arquivo alterado.

Backups JSON antigos ainda podem ser importados para migração, mas os novos devem ser exportados no formato criptografado.

## 7. Controle de aparelho reforçado

Cada instalação Android cria um par de chaves ECDSA P-256 no Keystore. O servidor registra a chave pública, valida uma prova assinada e bloqueia:

- clonagem do identificador com outra chave;
- repetição de prova antiga;
- excesso de aparelhos;
- clientes sem a segurança v2.

Os vínculos de aparelhos anteriores são revogados uma única vez durante a migração para permitir o novo cadastro protegido.

## 8. Rate limit administrativo

A função `admin-users` aplica limites por administrador e por ação usando uma função atômica no banco. Criação, exclusão, troca de senha, renovação e outras operações têm limites próprios. Ações excedentes retornam erro 429.

Senhas temporárias exigem pelo menos dez caracteres, maiúscula, minúscula e número.

# Ordem de implantação obrigatória

Não publique a segurança do servidor antes de ter o APK v26.75 pronto para instalação.

1. Envie este projeto ao GitHub.
2. Execute **Gerar APK e publicar atualização segura v26.75**.
3. Baixe e guarde o APK v26.75.
4. Publique a migração e as duas Edge Functions.
5. Instale o APK v26.75.
6. Entre novamente; o aparelho será registrado com sua nova chave.
7. Em **Ajustes → Contas**, ative o MFA da conta administradora.

Depois da etapa 4, os APKs antigos deixam de validar a licença.

# Publicação do Supabase

## Pelo GitHub Actions

O workflow `Publicar contas e licenças no Supabase` usa:

- `SUPABASE_ACCESS_TOKEN`;
- `SUPABASE_PROJECT_ID`;
- `SUPABASE_DB_PASSWORD`.

Ele executa as migrações e publica as funções.

## Diretamente no painel

Na pasta `INSTALAR_SEGURANCA_V26_75` estão os três arquivos para copiar e colar:

1. SQL da migração;
2. código de `license-session`;
3. código de `admin-users`.

Os nomes das funções precisam continuar exatamente `license-session` e `admin-users`.

# Validações locais

Foram verificados:

- TypeScript;
- regressões de segurança v26.75;
- contas e licenças;
- integridade de release;
- backup e atualização;
- Cofre e migração;
- motores de ficha, habilidades, time e tática;
- exportação estática usada pelo APK;
- geração e sincronização do projeto Capacitor Android.

A compilação Gradle final não pôde ser executada neste ambiente porque o Gradle não conseguiu acessar `services.gradle.org`. O GitHub Actions fará essa confirmação ao gerar o APK.

# Limites reais

Nenhum APK é impossível de desmontar ou modificar. Esta versão move as decisões críticas para o servidor, protege credenciais no Keystore, exige MFA para o administrador e usa prova criptográfica do aparelho. Uma modificação local do APK não deve conceder acesso administrativo nem acesso ao Cofre de outra conta sem autorização válida do servidor.
