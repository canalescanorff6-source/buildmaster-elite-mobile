# R563 — Arquivo de comentários preservados para orçamento R184

Os comentários abaixo foram movidos dos arquivos `.ts`/`.tsx` para manter a documentação sem aumentar o orçamento estrito de código-fonte de produção (R407/R184). **Nenhuma expressão ou instrução executável foi alterada por essa compactação de documentação.**

## `src/lib/skillIntelligenceV31.ts`

  // Os pools são deliberadamente maiores que cinco. Assim, mesmo quando a

  // carta já possui várias habilidades, o motor ainda consegue entregar cinco

  // opções adicionais úteis sem recorrer a habilidades de outra função.

  // Quando a carta é claramente especialista em condução, dois dos cinco

  // espaços oficiais ficam reservados ao DNA de drible. Isso impede que uma

  // carta técnica receba um Top 5 genérico apenas por atuar como SA/MAT/ponta.

  // r27: o Top 5 segue a função realmente usada na ficha final.

  // A identidade continua vindo da carta, mas a posição atual não pode ser ignorada.

/** Catálogo oficial compatível com a posição escolhida, em ordem de prioridade-base. */

/** Quantidade máxima de habilidades oficiais ainda disponíveis sem repetir a carta. */

  // O desempate usa identidade estável e ignora internalId/overall do print,

  // para a mesma carta não trocar habilidades apenas pelo GER exibido.

  // Recomendações antigas não participam da nota: elas poderiam trazer de

  // volta uma habilidade incompatível gerada por versões anteriores.

/** Sempre produz cinco opções treináveis quando existem cinco habilidades não possuídas no pool seguro da função. */

  // Primeiro preenche os cinco papéis funcionais da posição. Isso impede que

  // uma nota alta concentre 5 passes em um zagueiro ou 5 finalizações em um SA.

  // Se a carta já possuir todas as opções de uma categoria, completa apenas

  // com habilidades do pool seguro da mesma posição.

---

## `src/lib/cardIdentityFingerprintR126.ts`

/**
 * Identidade ESTÁVEL da edição da carta.
 *
 * Nunca inclui estado que o usuário pode alterar ou que é derivado da ficha:
 * GER/Overall, atributos já treinados, position ratings treináveis, progressão,
 * posição escolhida para uso, habilidades adicionais, Ímpeto, técnico ou formação.
 *
 * A edição é distinguida pela evidência estrutural mais estável disponível no print:
 * jogador + tipo/tag + posição/estilos registrados + dados físicos + nível máximo
 * + inventário nativo/especial. O `internalId` legado fica fora porque embute GER.
 */

/**
 * Identidade canônica da edição.
 * Prioridade: ID oficial verificado > catalogCardId R438 > fingerprint estrutural legado.
 * gameVersion fica fora: patches do jogo versionam evidência/scouting, não a carta.
 */

/** Aliases de migração: permitem que uma ficha antiga pelo fingerprint estrutural seja reconhecida após resolução no catálogo. */

/**
 * Impressão do ESTADO LIDO da mesma carta.
 * Serve para cache/invalidação e não para decidir se é outra edição.
 * Inclui números e recursos mutáveis que podem alterar a análise final,
 * mas continua excluindo GER para impedir qualquer dependência indireta dele.
 */

/**
 * Identidade do atleta, acima da edição da carta.
 * É usada apenas onde o jogo exige uma pessoa única no elenco/escalação.
 * Não inclui tipo de carta, idade histórica, GER ou progressão: duas cartas do
 * mesmo jogador continuam sendo o mesmo atleta para fins de escalação.
 */

---

## `src/lib/efootballV600Playstyles.ts`

/**
 * A Konami confirmou publicamente Pressão no Ataque como exemplo de estilo
 * defensivo na v6.0. Nomes adicionais podem ser preservados pelo OCR como
 * provisórios, mas só recebem peso de gameplay após confirmação.
 */

  // Layout compacto v6.0: duas linhas na área exclusiva de estilos representam

  // ataque e defesa nessa ordem. Cada linha é validada pela família correta.

  // Alguns OCRs colam as duas cápsulas numa única linha (ex.:

  // "Basic Attacking GK"). Nesse caso preservamos a ordem visual e ainda

  // exigimos que cada rótulo pertença à sua fase correta.

  /** Nome exibido na carta; pode ser provisório quando ainda não está no catálogo confirmado. */

    // Cartas antigas exibem um único estilo. Quando esse rótulo hoje pertence

    // apenas à defesa (ex.: Goleiro Ofensivo/Destruidor), o ataque deve cair em

    // Básico em vez de ficar vazio e depois herdar o estilo genérico legado.

    // Para um estilo ofensivo legado conhecido, a fase sem a bola continua

    // neutra; para um rótulo exclusivamente defensivo, preservamos a defesa.

/**
 * Peso somente da fase sem a bola. Estilos antigos que agora aparecem na seta azul
 * podem ser reutilizados como identidade defensiva sem alterar o nome ofensivo.
 * Rótulos desconhecidos continuam salvos no catálogo vivo, mas recebem peso zero
 * até existir mapeamento canônico/confirmado.
 */

---

## `src/modules/analysis/analyzerPositionCoreR142.ts`

// R142 — núcleo de posição/atributos extraído do analyzer monolítico.

// Não escreve ficha, Top 5 ou Ímpeto: somente calcula evidência/score funcional.

  // MLG/VOL/MAT/ME/MD podem vir com vários estilos. O estilo orienta a função, mas a posição da carta continua forte.

  // Regra canônica v39.20: GER/Overall é somente metadado visual da carta.

  // Ele nunca pode preencher, aumentar ou diminuir atributos ausentes, porque

  // pequenas variações do OCR criariam fichas, habilidades e Ímpetos diferentes

  // para a mesma versão. A base determinística da posição cobre apenas campos

  // realmente ausentes; todo atributo lido continua soberano.

  // O motor local não pode jogar um centroavante de área para PE só porque o OCR confundiu a grade.

  // Esta função só é usada quando o OCR não conseguiu ler claramente a posição grande da carta.

  // Por isso ela prefere FUNÇÃO REAL antes do maior overall da grade. Ex.: Gattuso/Tchouaméni

  // podem ter CB/LE com nota maior, mas DMF/VOL continua sendo a função principal de gameplay.

  // GER por posição é apenas desempate leve. O ranking principal vem de atributos + função.

  // Se a função real indica uma posição e ela aparece com nota plausível, usamos ela antes do maior overall.

  // Isso impede casos como DMF/VOL destruidor ir para LE/ZAG só porque a grade deu rating maior.
