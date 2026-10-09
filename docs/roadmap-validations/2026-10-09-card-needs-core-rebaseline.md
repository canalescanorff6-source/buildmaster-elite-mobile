# R551 — ficha individual por edição e necessidade

A alteração do motor foi solicitada para considerar a edição, os atributos reais e a função da carta, evitando receitas por posição ou quantidade de pontos. Este rebaseline substitui a assinatura protegida pela revisão visual R530; os testes continuam fixando a assinatura exata e proibindo escritores nas superfícies visuais.

| Estado | Versão | SHA-256 do R119 |
| --- | --- | --- |
| Anterior | 40.80-r550-verified-card-evidence-v1 | 630f2097ccbb4e58d3669294f50ecf6fe4eead0b33d07716e0d49aad2c9aa1fd |
| Atual | 40.80-r551-card-needs-v1 | ad3738dc1c46276b2084f2acf9a930a35358a9c7f5b134f1307dedebf00c46d0 |

Mudanças autorizadas: utilidade marginal heurística dos atributos, base de nível 1 com prova da edição, posição escolhida preservada, grupos de goleiro corretos, salto compartilhado e bônus confirmados acima de 99. A heurística não é um limiar oficial de gameplay. Dados lidos permanecem separados da base pesquisada, e a falta de base é sinalizada na proposta.

O R119 continua o escritor final único. Habilidades e ímpetos mantêm as autoridades R457/R507. Bases, bônus e função entram na invalidação de evidência; revisões não atravessam contas.

Verificações: regressões comportamentais de necessidades/orçamento, projeção de goleiro/bônus, preservação do print bloqueado, rejeição de salto impossível, fingerprints, isolamento de conta, busca exata, habilidades/ímpetos, OCR/WASM nos originais e reconhecimento offline. A compilação e as regressões históricas continuam sendo gates de publicação.
