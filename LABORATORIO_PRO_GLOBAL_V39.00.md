# Laboratório Pro Global v39.00

## Objetivo

Comparar a Receita Canônica da carta com fichas realmente publicadas por jogadores competitivos verificados, sem substituir o motor próprio por cópia cega e sem inventar progressões ausentes.

## Nova área “Pro Global”

A tela mostra:

- ficha final do BuildMaster;
- consenso de progressão por bloco;
- Top 5 de habilidades mais recorrente;
- Ímpeto mais recorrente;
- semelhança entre a receita e cada referência;
- ficha completa de cada pro player, com link para a prova;
- biblioteca global das fichas completas já verificadas, mesmo quando são de outra carta;
- confiança, completude e identidade da versão da carta;
- índice mundial pesquisável de campeões e finalistas.

## Portão de calibração

Uma referência isolada nunca modifica a receita. A calibração automática exige, ao mesmo tempo:

1. mesma versão exata da carta;
2. mesmo orçamento de pontos;
3. mesmo fingerprint canônico da versão da carta;
4. ficha completa: progressão, habilidades e Ímpeto;
5. pelo menos dois pro players distintos;
6. duas provas independentes;
7. confiança mínima de 82%;
8. habilidades oficiais e compatíveis com a posição original da carta;
9. orçamento final fechado exatamente.

Sem esse conjunto, as fontes aparecem apenas para comparação.

## Receita independente da posição

A v38.90 continua soberana. Selecionar MLG, MAT, SA ou outra posição não muda a identidade canônica, a ficha, as habilidades ou o Ímpeto. O benchmark profissional também usa a carta, não a posição escolhida.

## Catálogo remoto

A migration `202608080001_v3900_global_pro_builds.sql` cria uma tabela pública de leitura e restrita para escrita. Ela guarda somente registros auditáveis com URL de prova. O aplicativo usa cache privado e continua funcionando sem internet.

## Regra de honestidade

O pacote não inclui fichas completas atribuídas a pro players sem prova pública verificável. Enquanto uma carta não tiver evidência suficiente, a tela informa “sem dados” e mantém o motor próprio.
