# v25.76 — Correção definitiva de runtime

Correções principais:

- migração automática de fichas antigas do Cofre para o formato atual;
- fichas antigas deixam de quebrar os painéis coletivos após gerar uma ficha nova;
- o APK não restaura resultados prontos de versões anteriores: preserva os dados e recalcula no motor atual;
- resultados completos deixam de ser gravados na sessão temporária, evitando esquema antigo e excesso de armazenamento;
- service worker e caches web são removidos dentro do APK nativo, evitando arquivos JavaScript de versões diferentes;
- build estático passou a desativar e restaurar a rota de nuvem automaticamente;
- Cofre, imagens, histórico e fichas salvas continuam preservados.

## Instalação

Gere um APK novo pelo workflow v25.76. Para garantir que o WebView não reaproveite o pacote anterior, desinstale a versão com erro e instale o APK v25.76. O Cofre local pode ser exportado antes pelo backup, caso queira preservar dados de uma instalação que será removida.
