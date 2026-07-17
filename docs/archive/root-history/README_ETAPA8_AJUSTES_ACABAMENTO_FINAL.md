# Etapa 8 — Ajustes, contas e acabamento final

Esta versão reúne as Etapas 1 a 8 da reformulação premium do BuildMaster Elite Tático.

## Ajustes reorganizados

- Aparência e acessibilidade
- Desempenho
- Segurança e integridade
- Backup e restauração
- Atualizações
- Contas e licenças

## Aparência e acessibilidade

- Tema escuro e claro
- Cinco cores de destaque
- Texto compacto, padrão ou grande
- Interface compacta ou confortável
- Animações pelo sistema, reduzidas ou completas
- Contraste reforçado
- Foco visível por teclado
- Atalho “Pular para o conteúdo”
- Adaptação para 360 px, celulares comuns, tablets e modo paisagem

## Painel administrativo

- Teste real da licença e das Edge Functions pelo APK instalado
- Criação de usuário com senha segura gerada no app
- Exibição e cópia dos dados da conta recém-criada
- Busca e filtro por status
- Renovação rápida por 7, 30 ou 90 dias
- Suspensão, bloqueio, ativação, troca de senha e limite de aparelhos
- Desconexão de aparelhos e exclusão de contas comuns

## Backup e atualização

- Backup separado da área de segurança
- Backup dos jogadores ou backup completo
- Restauração seletiva
- Sincronização do Cofre por conta
- Verificação de manifesto com fallback HTTP nativo do Android
- Fluxo verificar → proteger → instalar

## Validações

- TypeScript aprovado
- Suíte completa de contas e licenças aprovada
- Backup e atualização aprovados
- Cofre e migração aprovados
- Fichas, habilidades, técnicos e prints aprovados
- Time, entrosamento, escalação, adversário e planos aprovados
- Compilação Next.js e geração das páginas estáticas concluídas; o processo local permaneceu aberto na etapa final de coleta de rastros, limitação já observada neste ambiente

O teste ao vivo do Supabase depende das variáveis reais do GitHub. A nova ação **Testar Supabase**, dentro de Ajustes → Contas, valida no APK a autenticação, a função `license-session` e, para administradores, a função `admin-users`.
