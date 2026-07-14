# Assinatura persistente para atualizar o APK por cima

O Android só aceita atualizar um aplicativo instalado quando o novo APK usa a **mesma chave de assinatura** e possui um `versionCode` igual ou maior.

O workflow v26.70 aumenta o `versionCode` em cada execução usando `github.run_number`. Para manter a mesma assinatura, configure estes Secrets no repositório:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

## 1. Criar a chave uma única vez

No computador com Java instalado:

```bash
keytool -genkeypair -v \
  -keystore buildmaster-release.keystore \
  -alias buildmaster \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Guarde o arquivo e as senhas. Se perder essa chave, não será possível atualizar por cima dos APKs assinados com ela.

## 2. Converter para Base64

### Windows PowerShell

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("buildmaster-release.keystore")) | Set-Content -NoNewline buildmaster-keystore-base64.txt
```

### Linux

```bash
base64 -w 0 buildmaster-release.keystore > buildmaster-keystore-base64.txt
```

## 3. Criar os Secrets

No GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

Use o conteúdo de `buildmaster-keystore-base64.txt` no Secret `ANDROID_KEYSTORE_BASE64`. Cadastre também as senhas e o alias nos outros três Secrets.

## 4. Primeira instalação

Se a versão atualmente instalada foi assinada por uma chave de debug diferente, será necessário:

1. exportar o backup;
2. desinstalar a versão antiga;
3. instalar uma vez o primeiro APK assinado com a chave persistente;
4. restaurar o backup.

Depois disso, os próximos APKs publicados pelo mesmo workflow poderão ser instalados por cima, preservando os dados.

## Segurança

- Não envie o arquivo `.keystore` para o repositório.
- Não coloque senhas em arquivos do projeto.
- Guarde uma cópia offline segura da chave.
- A release automática é pulada quando os Secrets não estão configurados; o workflow ainda gera um APK de teste como artefato.
