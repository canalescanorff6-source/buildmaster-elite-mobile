# BuildMaster Elite Tático v24.7 — Cofre de Fichas Persistente

Versão baseada na linha estável v24, sem mudanças de APK/v27.

## Principal melhoria

O histórico agora virou **Cofre de Fichas**:

- salva as fichas no navegador usando **IndexedDB**;
- mantém as fichas no mesmo celular/navegador até o usuário apagar;
- permite acompanhar habilidades concluídas;
- permite abrir uma ficha salva sem repetir print/OCR/manual;
- limite aumentado para até 200 fichas;
- permite exportar backup JSON;
- permite importar backup JSON.

## Onde fica salvo?

Fica salvo localmente no navegador/PWA do aparelho, no banco local IndexedDB do domínio do app.

Continua salvo ao fechar o navegador, reiniciar o celular ou sair e voltar no app.

Pode ser perdido se o usuário limpar dados do site, apagar armazenamento do navegador, desinstalar o PWA apagando os dados ou trocar de celular sem exportar backup.

## Recomendações

Use **Exportar backup** de tempos em tempos para guardar as fichas em arquivo JSON. Depois é possível usar **Importar backup** para recuperar.

## Validação

Arquivos JSON verificados:

- package.json
- package-lock.json
- manifest.webmanifest



## v24.7 — Neon Cloud

Esta versão adiciona sincronização opcional com Neon Postgres. O Cofre local continua funcionando mesmo sem configurar a nuvem.

Para ativar a nuvem, configure no Vercel:

```env
DATABASE_URL=postgresql://...
BUILDMASTER_CLOUD_OWNER=tiago-buildmaster
```

Depois faça redeploy com Clear Build Cache e use os botões **Sincronizar Neon** e **Baixar nuvem** no Cofre de Fichas.

Nunca coloque a `DATABASE_URL` dentro do código ou no GitHub.

## APK Android v24.8

Esta versão inclui geração de APK Android por GitHub Actions. Veja o arquivo `README_APK_SEM_ERRO.md`.


## v24.9 APK Nativo

Esta versão adiciona um APK que abre o BuildMaster dentro do próprio aplicativo Android, sem abrir o navegador. Use o workflow **Gerar APK Android Nativo** no GitHub Actions.

Veja `README_APK_NATIVO.md`.

## APK fiel ao projeto

Esta versão inclui o workflow **Gerar APK Android Fiel ao Projeto** para criar um APK com o mesmo visual do BuildMaster web estável. Veja `README_APK_FIEL.md`.
