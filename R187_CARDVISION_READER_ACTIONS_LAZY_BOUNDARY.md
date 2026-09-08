# R187 — CardVision Reader Actions Lazy Boundary

## Base canônica
- Base de entrada: R186 — Analyzer Evidence + Skill Boundaries.
- Package version preservada: `40.80.0`.
- Autoridade esportiva final preservada: R119 Clean Slate.
- SHA-256 R119 preservado: `765f6b634b8671f2f2725d0164e34a61a18714d18c22f3d92f9c95d92557cb96`.

## Objetivo
Reduzir a responsabilidade do `CardVisionApp.tsx` sem criar estado paralelo e sem alterar fichas, DNA, progressão, Top 5, Ímpetos, orçamento ou posição de uso.

A fronteira escolhida foi a orquestração do Leitor/OCR, que ainda estava fisicamente misturada ao shell apesar de R160–R164 já manterem os motores pesados lazy.

## Mudanças
### Nova fronteira
Arquivo:
- `src/modules/card-reader/cardVisionReaderActionsR187.ts`

Responsabilidades movidas:
- composição do runtime R163 de análise;
- composição do runtime R164 de interação;
- retomada/cancelamento do OCR;
- fila local de prints;
- recorte e redetecção da carta;
- aplicação de enhancement;
- hidratação de evidência R131/R134;
- análise de Print Único e Leitura Total;
- finalização da leitura;
- aprendizado OCR confirmado;
- persistência das correções OCR confirmadas.

### Lazy boundary real
`CardVisionApp.tsx` usa somente `import type` no startup e adquire R187 por `import()` quando uma ação do leitor é executada.

`useCardVisionNavigationControllerR176.ts` antecipa o chunk R187 somente quando o usuário entra na seção Leitor.

Resultado: a nova fronteira não aumentou a árvore estática inicial.

### O que permaneceu no shell
- estado React canônico;
- bootstrap do modo manual, pois R176 precisa dessa função antes da fronteira do leitor;
- calibração EFHub síncrona usada diretamente pelo componente visual;
- navegação e montagem dos painéis.

Isso evita dependência circular entre navegação e leitor.

## Métricas
### CardVisionApp
- R186: 2168 linhas / 164049 bytes.
- R187: 2019 linhas / 156040 bytes.
- redução: 149 linhas (~6,9%).
- redução: 8009 bytes (~4,9%).

### Árvore estática do CardVision
- R186: 182 módulos / 2444723 bytes.
- R187: 182 módulos / 2436809 bytes.
- ganho de startup: 7914 bytes sem aumentar teto.

### Orçamento total de src
- 421 arquivos.
- 5321997 / 5505024 bytes.
- margem: 183027 bytes.
- uso: 96,7%.

O orçamento total de fonte inclui o novo controlador lazy; o runtime inicial, entretanto, ficou menor.

## Regressões históricas realinhadas
Testes antigos que procuravam responsabilidades dentro do monólito foram atualizados para apontar às autoridades atuais, sem remover requisitos:
- R160 — fila lazy;
- R161 — evidência R131/R134;
- R163 — análise lazy;
- R164 — interação lazy;
- v38.40 — background OCR, anti-freeze, fila, branding, backup de base grande, fail-open e deep links;
- R185 — Chrome continua estritamente visual;
- R184/R186 — gates históricos agora aceitam revisões posteriores sem congelar o final da cadeia.

## Validação esportiva
A modularização não alterou regras esportivas.

Aprovados:
- R119 Clean Slate;
- R119 Output Quality;
- R122 Máximo Online + DNA;
- R125 role-aware/card-specific;
- R184 Position Stability;
- R186 equivalência congelada da ficha.

R119 permaneceu byte-identical pela assinatura SHA-256 congelada.

## Validação do Leitor/OCR
- R160: aprovado.
- R161: aprovado.
- R162: aprovado.
- R163: aprovado.
- R164: aprovado.
- bateria v38.40: 15/15 aprovada.

Foram preservados:
- checkpoint de background;
- retomada explícita;
- cancelamento real;
- watchdog OCR;
- fila separada da leitura ativa;
- calibração rápida EFHub;
- aprendizado apenas de evidência confirmada;
- ausência de reload destrutivo no WebView.

## Gates finais
- TypeScript autocontido de `src`: aprovado.
- Sintaxe: 653 TS/TSX.
- Interativos: 790 botões tipados e 34 imagens com alt.
- Visual/acessibilidade: aprovado.
- Auditoria: 127/127.
- Pré-voo: 138/138.
- Google Play: 27/27.
- Java nativo: aprovado.
- R180–R187: aprovados.

## Android
A fonte e os workflows continuam prontos.

O ambiente local ainda não possui toolchain Android completo:
- `ANDROID_HOME`/`ANDROID_SDK_ROOT` ausente;
- `sdkmanager` indisponível;
- `adb` indisponível;
- ambiente Capacitor/npm não completo para o build físico local.

A assinatura e geração final de APK/AAB continuam sob responsabilidade do GitHub Actions autorizado.

## Próxima fronteira
O maior módulo continua sendo `src/components/CardVisionApp.tsx` com ~156 KB. A próxima revisão deve atacar outra responsabilidade coesa do shell — preferencialmente exportação/ações de resultado ou configuração derivada — sem voltar a aumentar a árvore estática e sem tocar no R119.
