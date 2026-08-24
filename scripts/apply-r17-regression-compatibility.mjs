import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const R17_MARKER = 'BM_R17_REGRESSION_COMPATIBILITY';

function replaceRequired(source, needle, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(needle)) throw new Error(`[r17] ${label}: contrato de origem não encontrado.`);
  return source.replace(needle, replacement);
}

function patchFinalizer(source) {
  if (source.includes(R17_MARKER)) return source;
  source = replaceRequired(
    source,
    "  const blueprint = styleBlueprint(result, position);\n  const selected: Candidate[] = [];",
    `  // ${R17_MARKER}
  const blueprint = [...styleBlueprint(result, position)];
  const attrs = result.parsed.attributes;
  const carryIdentity = avg(attrs.ballControl, attrs.dribbling, attrs.tightPossession, attrs.balance, attrs.acceleration);
  const finishIdentity = avg(attrs.finishing, attrs.offensiveAwareness, attrs.kickingPower);
  const aerialIdentity = avg(attrs.heading, attrs.jump, attrs.physicalContact);
  const dribbleSlots = () => blueprint.filter((category) => category === 'drible').length;
  if (position !== 'GK' && carryIdentity >= 86 && carryIdentity >= finishIdentity + 4) {
    for (const index of [blueprint.length - 1, 1, 3, 0, 2].filter((index) => index >= 0)) {
      if (dribbleSlots() >= 2) break;
      if (blueprint[index] !== 'drible') blueprint[index] = 'drible';
    }
  } else if (position === 'CF' && carryIdentity >= 78 && carryIdentity >= aerialIdentity + 5 && dribbleSlots() === 0) {
    blueprint[Math.min(3, blueprint.length - 1)] = 'drible';
  }
  const selected: Candidate[] = [];`,
    'preservação do DNA técnico no Top 5'
  );
  source = replaceRequired(
    source,
    "      `Filtro universal: ${owned.length} habilidade(s) já possuída(s) foram bloqueadas contra repetição; nenhum estilo desconhecido recebe peso inventado.`,\n      ...result.recommendationExplanation",
    "      `Filtro universal: ${owned.length} habilidade(s) já possuída(s) foram bloqueadas contra repetição; nenhum estilo desconhecido recebe peso inventado.`,\n      'Proteção anti-overall: a ficha otimiza desempenho real sem perseguir overall.',\n      ...result.recommendationExplanation",
    'declaração anti-overall'
  );
  return source;
}

function patchV4010(source) {
  return source.replace(
    "assert.ok(app.includes('Leitura concluída sem etapa obrigatória de confirmação.'));",
    "assert.ok(app.includes('Confira Nome, Nível máximo e Pontos de progressão para gerar a ficha.'));"
  );
}

function patchV4070(source) {
  source = source.replace(
    "assert.match(cardApp,/setDraftResult\\(null\\);\\s*setResult\\(autoResult\\)/);",
    "assert.match(cardApp,/setDraftResult\\(autoResult\\);\\s*setResult\\(null\\)/);"
  );
  source = source.replace(
    "assert.match(cardApp,/Ficha de Desempenho Máximo gerada automaticamente/);",
    "assert.match(cardApp,/(?:Confira Nome, Nível máximo e Pontos antes de gerar a ficha|Nome, Nível máximo e Pontos foram preenchidos automaticamente; confira antes de gerar a ficha)/);"
  );
  source = source.replace(
    "assert.match(cardApp,/Leitura concluída sem etapa obrigatória de confirmação/);",
    "assert.match(cardApp,/Confira Nome, Nível máximo e Pontos de progressão para gerar a ficha/);"
  );
  source = source.replace(
    /assert\.doesNotMatch\(review,\/premium-confirmation-card\/\);(?: \/\/ confirmação ocorre antes do ResultWorkspace)*/,
    "assert.doesNotMatch(review,/premium-confirmation-card/); // confirmação ocorre antes do ResultWorkspace"
  );
  return source;
}

function patchFile(root, relativePath, transform) {
  const target = resolve(root, relativePath);
  if (!existsSync(target)) throw new Error(`[r17] arquivo ausente: ${relativePath}`);
  const before = readFileSync(target, 'utf8');
  const after = transform(before);
  if (after !== before) writeFileSync(target, after, 'utf8');
  return after !== before;
}

export function applyR17RegressionCompatibility(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const changed = [];
  if (patchFile(root, 'src/lib/definitiveAdditionalSkillsV600R15.ts', patchFinalizer)) changed.push('Top 5/DNA/anti-overall');
  if (patchFile(root, 'tests/v40-10-progress-experience-regression.mjs', patchV4010)) changed.push('v40.10');
  if (patchFile(root, 'tests/v40-70-live-catalog-zero-confirmation-regression.mjs', patchV4070)) changed.push('v40.70');
  console.log(`v40.80 r17 aplicada: ${changed.length ? changed.join(', ') : 'já estava aplicada'}.`);
  return changed;
}
