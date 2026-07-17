# Correção final dos pontos 2/2

Esta versão bloqueia definitivamente orçamentos inválidos como 2/2.

Regra usada:
- Se o nível máximo for lido, os pontos são calculados por ele. Ex.: nível 32 = 62 pontos; nível 33 = 64 pontos.
- Se o OCR ler algum valor abaixo de 20 como pontos, o valor é descartado.
- Se o app não conseguir ler nível nem pontos com segurança, usa 64 pontos como fallback seguro.
- O service worker foi atualizado para evitar cache antigo no celular.

Se ainda aparecer 2/2 após o deploy, limpe os dados do site no navegador/PWA e abra novamente.
