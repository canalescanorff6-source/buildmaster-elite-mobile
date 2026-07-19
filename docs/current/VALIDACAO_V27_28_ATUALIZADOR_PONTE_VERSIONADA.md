# BuildMaster Elite Tático v27.28.0 — validação do atualizador com ponte versionada

## Sintoma confirmado no aparelho

A v27.26 instalada encontra corretamente a v27.27 e mostra o `versionCode` novo, mas interrompe o download com a mensagem de que o arquivo recebido não corresponde ao pacote publicado. Isso confirma que a consulta do manifesto funciona e que a falha acontece antes da instalação do Android, durante a comparação de tamanho/SHA-256 do APK recebido.

## Causa encontrada no código da v27.26

O código dizia que alternaria automaticamente entre canais, mas uma nova consulta selecionava novamente o mesmo manifesto principal quando as rotas tinham o mesmo `versionCode`. Na prática, as tentativas podiam repetir a mesma URL e os mesmos bytes divergentes, sem chegar de verdade à origem alternativa.

Além disso, a rota principal da v27.27 apontava para um ativo de outra release. Embora o manifesto público, o tamanho e o SHA-256 publicados estivessem coerentes, o cliente Android podia continuar recebendo uma resposta diferente nessa rota específica e não possuía diagnóstico suficiente para mostrar qual host, tamanho e hash tinham sido recebidos.

## Correção estrutural da v27.28

1. O canal principal passa a apontar para um APK com nome exclusivo e versionado dentro da release fixa `buildmaster-latest`.
2. Esse ativo versionado nunca é substituído e nunca usa `--clobber`.
3. O workflow baixa novamente o ativo público usando o mesmo User-Agent e os mesmos cabeçalhos do atualizador da v27.26.
4. O manifesto principal só é publicado depois que tamanho e SHA-256 do ativo público forem iguais ao APK assinado localmente.
5. A release imutável permanece como segunda rota independente.
6. `BuildMaster-Elite-Tatico-latest.apk` permanece somente como ponte para versões muito antigas.
7. A v27.28 guarda todas as alternativas válidas e percorre URLs realmente diferentes, sem selecionar repetidamente a mesma rota.
8. O downloader nativo alterna entre redirecionamento manual e redirecionamento automático do Android.
9. Parâmetros ant_cache só são acrescentados ao arquivo mutável `latest.apk`; ativos versionados são baixados pela URL exata.
10. Em caso de divergência, o aplicativo passa a mostrar tamanho esperado/recebido, prefixo do SHA esperado/recebido, host final, status HTTP, tipo de conteúdo e codificação.
11. O APK inválido é removido imediatamente antes de tentar a próxima origem oficial.

## O que não precisa ser alterado

- Supabase não participa do download ou da instalação do APK.
- Não é necessário trocar `ANDROID_SIGNING_BUNDLE`.
- Não é necessário criar uma release manualmente.
- A permissão `Read and write permissions` já é suficiente, e o workflow também declara `contents: write`.

## Validações realizadas

- TypeScript sem erros.
- Teste de regressão específico da v27.28 aprovado.
- Build estático do Next.js concluído.
- Projeto Android criado e sincronizado pelo Capacitor.
- Plugin Java de atualização regenerado e conferido com User-Agent v27.28.
- Workflow YAML carregado sem erro.
- Todos os blocos shell do workflow passaram em `bash -n`.
- Suítes de atualização, assinatura, segurança, contas, backup, fichas, OCR, time, interface e publicação aprovadas em execuções divididas.
- O comando único `test:all` ultrapassou o limite de tempo do ambiente, mas os testes restantes foram executados separadamente e passaram.
- Nenhum APK, keystore, senha, token ou chave privada foi incluído no pacote entregue.

## Limite da validação local

O APK assinado final só pode ser produzido pelo GitHub Actions com o Secret existente no repositório. A confirmação definitiva exige o workflow da v27.28 em verde e o teste no aparelho. A correção, porém, foi direcionada ao comportamento real observado na v27.26: repetir uma rota divergente enquanto a interface dizia que alternaria.
