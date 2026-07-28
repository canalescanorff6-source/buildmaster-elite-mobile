# BuildMaster Elite Tático v31.73 — Restauração de Criar Contas

## Problema confirmado no vídeo

O atalho **Criar contas** estava presente, mas o formulário não era exibido. A tela ficava presa em `MFA_REQUIRED`, exigindo um autenticador que não fazia parte do fluxo antigo usado pelo administrador.

## Correção

- restaura o formulário completo de criação de contas;
- mantém login por usuário e senha, sem e-mail visível;
- validade por 1, 7, 15, 30, 60, 90, 180 ou 365 dias;
- data específica ou conta sem vencimento;
- limite de aparelhos;
- renovação rápida, suspensão, bloqueio, reativação, troca de senha e exclusão;
- MFA passa a ser opcional;
- migração redefine `admin_mfa_required` para `false`;
- botão de recuperação permite destravar bancos que ficaram com a política antiga;
- publicação automática da migração e da função `admin-users` pelo GitHub Actions.

## Publicação obrigatória

A correção precisa de duas execuções verdes:

1. **Publicar contas e licenças no Supabase**;
2. **Build, testes, assinatura e publicação verificada**.

Instalar somente o APK sem publicar o Supabase não corrige a política antiga do banco.
