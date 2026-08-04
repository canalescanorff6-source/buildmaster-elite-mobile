# Hotfix v38.40 — Cofre na memória interna do APK

## Problemas corrigidos

- Fichas com alertas de OCR/estrutura não ficam mais impedidas de salvar.
- Quando a conferência ainda precisa de ajuste, a ficha é salva com o status **Revisar**.
- O Cofre passa a usar primeiro um arquivo nativo na memória interna privada do aplicativo Android.
- O salvamento principal não depende mais da pequena cota do `localStorage` do WebView.
- Fichas antigas do IndexedDB/localStorage são migradas automaticamente para o Cofre nativo ao abrir o app.
- O print completo não é duplicado dentro de cada ficha; os dados calculados, habilidades, Booster, notas e imagem recortada continuam preservados.
- O aviso genérico “O aparelho bloqueou ou ficou sem espaço” deixou de aparecer por falhas de leitura/limpeza de dados antigos.
- Em caso de cota cheia no armazenamento web secundário, o app remove apenas caches e históricos legados dispensáveis e tenta novamente.

## Local do salvamento

No APK Android, o arquivo fica em `getFilesDir()/buildmaster-vault`, área privada do aplicativo. Não exige permissão de fotos, arquivos ou armazenamento externo. O conteúdo permanece durante atualizações instaladas por cima e é removido somente se o aplicativo for desinstalado ou se os dados dele forem apagados nas configurações do Android.

## Compatibilidade

- Android APK: arquivo nativo interno como rota principal.
- Navegador/PWA: IndexedDB como rota principal.
- Emergência: cópia compacta em localStorage somente quando as duas rotas anteriores estiverem indisponíveis.
