# R161 — Reader Surface + Evidence Lazy Boundary

## Objetivo
Reduzir ainda mais o caminho crítico de abertura sem alterar a inteligência esportiva, o OCR, as regras de evidência ou a autoridade final da ficha.

## Mudanças
- `PhasePlaystyleSelectorR124` saiu do runtime estático do `CardVisionApp` e passou para `AppLazyPanels`.
- `ReaderImageSourceCardV4010` passou para carregamento dinâmico.
- `ReaderInterruptedCardV3840` e `ReaderLiveProgressCardV3840` passaram para carregamento dinâmico.
- `cardReviewWorkflowR131` e `cardPhysicalPermanentEvidenceBoundaryR134` agora entram por `readerEvidenceRuntimeR161` memoizado.
- A entrada em **Leitor** mantém o preload R160 e antecipa o chunk de evidência R161 e as superfícies visuais do leitor somente após intenção explícita do usuário.
- Nenhuma regra de confiança, confirmação, aprendizado, build, posição, habilidade ou Ímpeto foi modificada.

## Medição estática
- R160: 227 módulos / 3.342.810 bytes.
- R161: 214 módulos / 3.255.139 bytes.
- Redução: 13 módulos / 87.671 bytes (~2,62% adicionais de fonte estática).

## Contratos preservados
- R124: estilos por fase e catálogo vivo.
- R131: revisão/aprendizado somente com evidência confirmada.
- R134: fronteira física permanente.
- R138: autoridade canônica da análise de produção.
- R155–R160: startup progressivo, memória de imagens, persistência dividida, superfícies lazy e runtime lazy do OCR.

## Nova trava
`test:r161` impede reintrodução de imports runtime estáticos das superfícies/evidências retiradas e fixa orçamento máximo de 216 módulos / 3.280.000 bytes.
