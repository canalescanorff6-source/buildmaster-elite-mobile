# Correção do workflow — v26.72

## Causa do erro mostrado no GitHub Actions

O pacote anterior foi compactado sem a pasta oculta `.github`. Ao substituir os arquivos do repositório, o workflow antigo da v26.70 permaneceu, enquanto o código e os testes já estavam na v26.71. O teste de integridade detectou corretamente essa mistura e interrompeu a compilação.

## Correção aplicada

- o ZIP desta versão inclui a pasta `.github`;
- o workflow, APK, manifesto, cache, package.json e package-lock estão alinhados na v26.72;
- o teste agora mostra uma mensagem curta e clara quando um workflow antigo permanece;
- referências de artefato v26.70 foram removidas do workflow atual;
- credenciais locais de administrador não são mais injetadas no build de produção;
- contas, licenças, Supabase, backup e atualização automática foram preservados.

## Como enviar ao GitHub

1. Extraia o ZIP inteiro.
2. No repositório, substitua também a pasta `.github`.
3. Confirme que existe `.github/workflows/build-apk.yml`.
4. Abra esse arquivo e confira que a primeira linha menciona `v26.72`.
5. Faça um novo commit e aguarde uma nova execução. Não use apenas `Re-run jobs` no commit antigo.

## Arquivo esperado

O workflow deve gerar:

- `BuildMaster-Elite-Tatico-v26.72.apk`
- `BuildMaster-Elite-Tatico-latest.apk`
- `update-manifest.json`
