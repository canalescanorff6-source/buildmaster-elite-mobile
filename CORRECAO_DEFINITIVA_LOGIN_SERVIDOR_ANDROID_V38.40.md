# Correção definitiva do login e conexão com o servidor — v38.40

## Sintoma analisado

O aplicativo chegava à tela de login, mas exibia “Não foi possível alcançar o servidor” e sugeria desligar VPN ou DNS privado mesmo quando o usuário não estava usando nenhum desses recursos.

## Causas encontradas no projeto completo

1. A mensagem sobre VPN/DNS era genérica e aparecia para qualquer falha de transporte, sem que o aplicativo tivesse detectado uma VPN.
2. O login dependia da ponte HTTP do Capacitor e do WebView; falhas do plugin, do WebView ou da pilha de rede podiam encerrar a validação.
3. O cabeçalho privado `X-BuildMaster-Version` era enviado também para o endpoint de autenticação e podia aumentar a incompatibilidade de CORS no fallback Web.
4. O indicador `navigator.onLine`, que não é confiável em todos os Androids, ainda desabilitava o botão Entrar.
5. O workflow conseguia gerar um APK mesmo sem verificar previamente se o projeto Supabase e a chave pública respondiam.

## Correções implementadas

- adicionada uma ponte HTTPS própria no plugin Android `BuildMasterSecurity`, independente do WebView;
- ordem de tentativa: HTTPS nativo do BuildMaster, `CapacitorHttp` e `fetch` Web;
- restrição do transporte nativo a HTTPS e aos endpoints autorizados do projeto Supabase;
- diagnósticos separados para DNS, TLS, timeout, plugin e rede;
- URL e chave pública normalizadas para remover espaços e barras excedentes;
- cabeçalho `X-BuildMaster-Version` limitado às Edge Functions;
- remoção da falsa orientação para desligar VPN ou DNS;
- botão Entrar não depende mais de `navigator.onLine`;
- preservação do acesso offline já validado no mesmo aparelho e dentro do prazo configurado;
- preflight do Supabase em `/auth/v1/health` nos workflows de APK e AAB;
- o build é bloqueado se URL, chave ou projeto Supabase não responderem corretamente;
- permissões Android de internet e estado da rede continuam verificadas no build.

## Dados preservados

A alteração não apaga jogadores, fichas, Cofre, Mapeamento de Elenco, imagens, backups ou configurações. A instalação deve ser feita por cima do APK atual.

## Arquivos principais alterados

- `src/lib/accountAuth.ts`
- `src/lib/secureStorage.ts`
- `src/components/AuthGate.tsx`
- `scripts/install-android-security-plugin.mjs`
- `.github/workflows/build-apk.yml`
- `.github/workflows/build-play-store.yml`
- `tests/v38-40-login-transport-fallback-regression.mjs`

## Validações executadas

- sintaxe de 414 arquivos TypeScript/TSX;
- geração do Java nativo;
- regressão completa v38.40;
- criação, recuperação e validação de contas;
- integração completa v38.32;
- abertura Android e inicialização fail-open;
- auditoria estrutural com 124 verificações;
- pré-voo de produção com 138 verificações;
- sintaxe YAML dos dois workflows.

O APK final ainda precisa ser compilado, assinado e testado no aparelho pelo GitHub Actions. Caso o preflight do Supabase falhe, o workflow mostrará a causa antes de publicar um APK inutilizável.
