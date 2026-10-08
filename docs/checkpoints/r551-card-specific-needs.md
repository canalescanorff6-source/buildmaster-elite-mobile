# R551 — checkpoint de trabalho, sem publicação

Objetivo autorizado: identificar a edição exata de cada carta e melhorar treino, habilidades adicionais e ímpetos para desempenho em campo. Posse de bola central, sem ranking por GER, sem copiar receita por posição ou orçamento. A quantidade de níveis/PP deve permanecer comprovada. Carta já rápida não recebe velocidade só por ser atacante. Adaptação de pontas a SA/CA exige avaliar atributos, habilidades e proficiência.

Base publicada: 860f74ded63e6afc40f3a3e537317441d67ba2f8 (PR122), árvore d50da2035541a507c0f598546c2723c5005c3f47. Main permaneceu nessa base quando este checkpoint foi criado.

Ambiente interrompido: ferramentas de leitura/execução/edição local falharam com HTTP409 environment_offline, Environment is not connected. Até mesmo true/pwd e leitura independente do revisor não funcionaram. Não há nova versão liberada.

## Conteúdo persistido neste branch

- Cópias de recuperação dos dois arquivos de metadados em snapshots, sem substituir código em produção. Tipo explícito tem precedência sobre comentários incidentais; Distinguido é Highlight. Catálogo separa habilidades nativas/adicionais e preserva características físicas.
- Registro de implementação, evidências de testes e revisão abaixo. O restante das alterações locais NÃO foi transferido, pois o filesystem ficou inacessível.

As cópias de recuperação refletem a correção de metadados reproduzida localmente. Elas ainda precisam ser reconciliadas com a cópia local e com o orçamento de fonte antes de serem aplicadas à produção.

## Workspace para retomar

/workspace/scratch/db5eddbc757e/buildmaster-card-needs
Branch local fix/card-specific-needs; commit-base local da620e6 tem a mesma árvore do main acima. node_modules é link de dependências, está excluído do índice; não fazer commit desse link.
Não usar o diff amplo de buildmaster-automatic-ocr, cuja HEAD antiga não corresponde aos arquivos físicos.

## Alterações locais em avaliação (não publicadas)

1. productionAnalysisR128 grava requestedUsagePosition, autonomousCardR417 respeita escolha explícita e mantém GK em GK.
2. CleanSlate é o único escritor. Versão local 40.80-r551-card-needs-v1. Curva heurística de utilidade: linear até85, depois85+14*log1p((v-85)/14), cap de modelo99. Identidade recebe bônus por ganho útil real, não por níveis colocados em força já saturada. Pressão usa a mesma utilidade. Isso NÃO é um limiar oficial nem prova de melhor gameplay.
3. Adaptação explícita com proficiência HIGH/INTERMEDIATE pode usar demanda alvo se ganho funcional material. Não forçar variedade artificial entre cartas que tenham evidências equivalentes.
4. Foi gerado src/data/cardEditionReferences.json a partir de225 crops + revisãoV56 do usuário + pesquisaV3. 132 referências têm nível/PP lidos e26 atributos-base sem conflitos da auditoria. Há34 conflitos deID: MessiCAP050 é ShowTime, ID/ediçãoEpic anterior NÃO deve ser herdado. Referências sem prova permanecem pendentes. Hashes completos e retrato foram calculados no Chromium. Original Olmo ainda não reconhecido pelo teste: não afrouxar limiar só para passar.
5. readerCardEdition tenta nome+arte com margem, depois catálogo local. V2 só roda identificação após fechar OCR. trainingBase guarda nível1, bônus fixos e fontes em separado; metadados seguem pela facade. Valores do print devem permanecer intactos no formulário. Bônus do técnico e slot selecionável não devem ser inventados.
6. Consulta externa por carta em ResultWorkspace com contexto textual individual e link para ChatGPT, sem API paga nem envio automático. Não é IA autenticada dentro do app. Novo Sign in with ChatGPT para projetos pessoais/OSS está documentado oficialmente, mas OAuth Android/local listener ainda NÃO foi implementado nem testado.
7. Posse como padrão inicial para interface e geração pelo catálogo; escolhas explícitas de outros estilos devem permanecer respeitadas.
8. Fonte ganhou16KiB: teto5.90625MiB, checkpoint6127616, reserva65536, limites de JS compilado mantidos. Convergências R432/R443/R414 e testes foram atualizados. Patchers históricos R406-fix4/fix5 reconhecem a versão nova.

## Verificação observada

PASS: novo teste de metadados; novo caso de saturação/necessidade e posição explícita; Reader22arquivos+4configurações; finalAdditionalSkillSetR457; finalImpetoDecisionR457; stage2identidade; stage4buscaexata; convergênciasR432/R443.
TypeScript: único erro observado foi additionalSkills opcional no contextoChatGPT; corrigido com default[]; tsc direto passou.
test:r457:r125-fast: A, B, C passaram; restante ficou sem coleta final quando ambiente desligou.
FAIL pendente: card-edition-browser-regression.mjs não reconhece Olmo original. A arte in-game tem texto/layout diferente da arte EFHub; a regra precisa de verificação conservadora.
Não foi feito build de produção, CI novo, merge ou APK.

## Três achados importantes de revisão — corrigir antes da publicação

- CleanSlate troca parsed.attributes por base pesquisada antes de checar bloqueio. Retorno BLOCKED_INSUFFICIENT_DATA também deve restaurar displayedAttributes; o retorno READY já restaura. Revisor reproduziu velocidade de print82 virando78 na prévia bloqueada.
- V2 após await identifyReadCardEdition retorna diretamente se conta muda e pula clearFinal/limpeza. Separar retorno por geração obsoleta de limpeza por conta alterada. Guardar conta de origem do draft e impedir runAnalysis posterior em outra conta. Não salvar revisão de outra conta.
- trainingBase.attributes/fixedBonus afetam treino, mas ficaram fora de cardEvidenceFingerprintR126/selo de produção. Revisor reproduziu isCurrentProductionAnalysisR128=true após alterar base. Incluir novo dado na evidência de frescor, sem mudar identidade estável da carta, e testar invalidação/rebuild. Avaliar requestedUsagePosition no mesmo guardião.

Revisor /root/card_needs_review fez revisão somente leitura e não editou arquivos.

## Próximos passos concretos

Recuperar workspace; corrigir os três achados com regressões reproduzindo prévia bloqueada, troca de conta durante identificação e invalidação de base. Resolver reconhecimento de arte para os originais com margem/prova; dados ambíguos não herdam atributos de outra edição. Conferir treinamento a partir de base verificada e bônus separados (o cálculo existente cap99 não prova atributos oficiais pós-booster). Não tratar print já treinado como nível1 quando não houver base comprovada. Rodar checks relevantes, revisão final, publicarPR/CI, merge e APK assinado apenas após passar. Usuário já autorizou o trabalho; não repetir pedido de permissão.

Arquivos de pesquisa existentes antes da falha: Regra_Preparacao_Competitiva_Tiago.md, Mapeamento_Pesquisado_Posse_Tiago_V3.json, Fichas_Pesquisadas_Elenco_Tiago_V3.pdf, card-type-review/tmp/latest-records.json, card-type-review/source/efootball_card_crops_all_225_v12.zip. Nele MaldiniCAP010, RijkaardCAP104 e NeymarCAP090 são protegidos. Não inventar treino/habilidades/ímpetos nem trocar essas fichas.
