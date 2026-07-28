# Correção do workflow da v31.74

O GitHub Actions interrompia o diagnóstico consolidado mesmo com a criação de contas aprovada.

## Causas corrigidas

- O pré-voo ainda exigia `31.73.0`.
- O manifesto e o cache PWA ainda eram validados como v31.73.
- A bateria consolidada ainda não incluía `test:v3174`.
- O pré-voo Google Play ainda lia as notas `31.73.0.txt`.
- O manifesto SHA-256 estava anterior às últimas alterações.

## Validações

- Pré-voo de produção: 120 verificações aprovadas.
- Pré-voo Google Play: 27 verificações aprovadas.
- Auditoria estrutural: 80 verificações aprovadas.
- Regressões v30.00 e v31.74 aprovadas.
- Integridade do projeto regenerada e verificada.

Envie o projeto completo para `main`, porque o manifesto de integridade corresponde ao conjunto integral de arquivos.
