# Versão atual do projeto

**BuildMaster Elite Tático v27.33.0 — App completo, Estúdio Tático editável e atualizador Android reforçado**

A versão reúne os módulos já existentes do BuildMaster e conclui o Estúdio Tático local com setas editáveis, cores personalizadas, biblioteca, PNG, SVG, PDF/impressão, JSON e compartilhamento.

O atualizador passou a ler downloads concluídos pela API oficial do `DownloadManager` (`openDownloadedFile`) antes de copiar e validar os bytes no armazenamento privado. Isso evita depender do caminho físico retornado por diferentes versões e fabricantes do Android. O HTTP direto continua disponível como transporte reserva.

Consulte `VALIDACAO_V27_33_APP_COMPLETO.md`.
