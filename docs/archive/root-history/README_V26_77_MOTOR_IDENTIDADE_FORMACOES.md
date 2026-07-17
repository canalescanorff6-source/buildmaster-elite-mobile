# BuildMaster Elite Tático v26.77

## Motor de Ficha por Identidade Real + Laboratório de Formações

Esta versão usa a v26.76 Ficha Studio corrigida como base e preserva:

- segurança v26.75;
- bloqueio de APK antigo;
- sessão persistente;
- MFA administrativo;
- Android Keystore;
- Supabase, contas e licenças;
- Cofre separado por usuário;
- backup criptografado;
- atualização verificada.

## Motor de ficha por identidade real

A aba **Resultado → Ficha** ganhou um painel central que combina:

1. identidade exata da carta;
2. posição escolhida pelo usuário;
3. estilo de jogo oficial;
4. função real em campo;
5. orçamento exato;
6. habilidades existentes e especiais;
7. faixas de rendimento por grupo de treino;
8. retorno marginal;
9. validação matemática;
10. confiança separada por dado.

### Três propostas

- **Ficha recomendada:** equilíbrio entre identidade, posição e eficiência;
- **Ficha agressiva:** amplia a principal arma da carta;
- **Ficha segura:** corrige fraquezas críticas e reduz oscilações.

### Comparador personalizado

O usuário pode alterar a distribuição, conferir custo real, diferença de nota, ganhos e perdas, sem sobrescrever a ficha original. Variantes válidas podem ser salvas como teste.

### Feedback de partidas

É possível registrar situações como jogador pesado, passe lento, finalização ruim, perda de duelos, cansaço, giro lento, boa marcação ou perda de posição. O app sugere uma correção controlada e mantém a ficha original.

## Laboratório de formações

Acesse **Meu Time → Formações**.

O laboratório inclui todas as formações já cadastradas no app:

- 4-2-2-2;
- 4-3-3;
- 4-1-2-3;
- 4-2-1-3;
- 4-2-3-1;
- 4-3-1-2;
- 4-1-3-2;
- 4-4-2;
- 4-1-4-1;
- 3-2-4-1;
- 3-4-3;
- 3-5-2;
- 5-3-2;
- 5-2-3.

Formações extras:

- 4-2-4;
- 3-4-1-2;
- 5-4-1.

### Funções por espaço

Cada espaço mostra:

- posição principal e alternativas;
- estilo/função oficial recomendado;
- alternativa complementar;
- dever tático;
- atributos-chave;
- combinação ideal com parceiros;
- melhor jogador salvo no Cofre;
- nota de posição, função e encaixe total.

Exemplo na 4-2-2-2:

- CA de apoio: Pivô ou Puxa Marcação;
- CA de ruptura: Artilheiro ou Homem de Área;
- meia criador: Armador Criativo;
- meia de chegada: Infiltração;
- volante protetor: 1º Volante;
- volante de saída: Orquestrador ou Meia versátil.

### Formações personalizadas

É possível:

- duplicar qualquer formação;
- mudar o nome;
- alterar a posição de cada espaço;
- escolher o estilo principal;
- mover o espaço horizontal e verticalmente;
- salvar por conta.

A formação personalizada não altera automaticamente a escalação principal.

## Instalação

1. Substitua todo o projeto no GitHub.
2. Faça um novo commit no branch `main`.
3. Execute **Gerar APK e publicar atualização segura v26.77**.
4. Não use apenas `Re-run jobs` de uma execução antiga.

Não é necessário refazer o Supabase ou publicar novas Edge Functions para esta versão.
