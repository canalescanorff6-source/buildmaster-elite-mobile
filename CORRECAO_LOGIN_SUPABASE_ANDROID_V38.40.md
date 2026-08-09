# Correção de login Supabase no Android — v38.40

## Sintoma corrigido

O aplicativo abria a tela de login, mas informava que não conseguia alcançar o servidor mesmo com o aparelho conectado à internet.

## Causa no cliente

O Android dependia de um único transporte (`CapacitorHttp.request`). Quando a ponte nativa falhava por incompatibilidade do WebView, DNS, TLS, timeout ou indisponibilidade do plugin, a tentativa era encerrada sem uma segunda rota independente. Além disso, a mensagem original era substituída por um erro genérico, dificultando o diagnóstico.

## Correções

- transporte HTTP nativo mantido como rota principal;
- corpo JSON normalizado como objeto para a ponte Android;
- timeouts ampliados para redes móveis lentas;
- fallback único pelo `fetch` real do WebView quando a ponte nativa lança erro;
- patch global do CapacitorHttp desativado para manter os dois transportes independentes;
- respostas HTTP do servidor não são repetidas;
- causa resumida de DNS, TLS, timeout, plugin e rede preservada;
- `navigator.onLine` deixou de bloquear o login antes da tentativa real;
- licença já validada no aparelho pode abrir em modo offline dentro do prazo configurado;
- permissões `INTERNET` e `ACCESS_NETWORK_STATE` garantidas e verificadas nos workflows do APK e da Play Store.

## Segurança preservada

O fallback offline só aceita a licença protegida já existente no mesmo aparelho, para o mesmo nome de usuário e dentro do prazo de tolerância definido no perfil. Nenhum login local permanente foi reintroduzido.
