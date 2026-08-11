import { spawnSync } from 'node:child_process';

const full = process.argv.includes('--full');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const CI_SOURCE_BUILD = 'v40.00-ci-card-reader-rebuild-20260810-r1';
const EXPECTED_FULL_GROUPS = 85;

const quickChecks = [
  ['Configuração TypeScript raiz', ['run', 'quality:root-tsconfig']],
  ['Compatibilidade das dependências', ['run', 'quality:dependencies']],
  ['Orçamento do código-fonte', ['run', 'quality:bundle']],
  ['Guardas de versão das regressões', ['run', 'quality:version-guards']],
  ['Contrato preventivo do CI', ['run', 'quality:ci-contract']],
  ['Rotas críticas', ['run', 'quality:routes']],
  ['Sintaxe TypeScript/TSX', ['run', 'quality:syntax']],
  ['Contratos interativos', ['run', 'quality:interactive']],
  ['Visual e acessibilidade', ['run', 'quality:visual']],
  ['Isolamento do TypeScript', ['run', 'quality:typecheck-isolation']],
  ['Tipos do recorte OCR', ['run', 'quality:card-crop-types']],
  ['Java nativo gerado', ['run', 'quality:native-java']],
  ['Pré-voo de produção', ['run', 'release:preflight']],
  ['Pré-voo Google Play', ['run', 'release:play-preflight']],
  ['Auditoria estrutural', ['run', 'quality:audit']],
];

const fullChecks = [
  ['TypeScript completo', ['run', 'typecheck']],
  ['Regressões v30.00', ['run', 'test:v3000:core']],
  ['Regressões v30.10', ['run', 'test:v3010']],
  ['Regressões v30.20', ['run', 'test:v3020']],
  ['Regressões v30.30', ['run', 'test:v3030']],
  ['Regressões v30.40', ['run', 'test:v3040']],
  ['Regressões v30.50', ['run', 'test:v3050']],
  ['Regressões v31.00', ['run', 'test:v3100']],
  ['Regressões v31.10', ['run', 'test:v3110']],
  ['Regressões v31.20', ['run', 'test:v3120']],
  ['Regressões v31.30', ['run', 'test:v3130']],
  ['Regressões v31.40', ['run', 'test:v3140']],
  ['Regressões v31.50', ['run', 'test:v3150']],
  ['Regressões v31.60', ['run', 'test:v3160']],
  ['Regressões v31.70', ['run', 'test:v3170']],
  ['Regressões v31.71', ['run', 'test:v3171']],
  ['Regressões v31.72', ['run', 'test:v3172']],
  ['Regressões v31.73', ['run', 'test:v3173']],
  ['Regressões v31.74', ['run', 'test:v3174']],
  ['Regressões v31.75', ['run', 'test:v3175']],
  ['Regressões v31.76', ['run', 'test:v3176']],
  ['Regressões v31.77', ['run', 'test:v3177']],
  ['Regressões v31.78', ['run', 'test:v3178']],
  ['Regressões v31.79', ['run', 'test:v3179']],
  ['Regressões v31.80', ['run', 'test:v3180']],
  ['Regressões v31.81', ['run', 'test:v3181']],
  ['Regressões v31.82', ['run', 'test:v3182']],
  ['Regressões v32.00', ['run', 'test:v3200']],
  ['Regressões v33.00', ['run', 'test:v3300']],
  ['Regressões v34.00', ['run', 'test:v3400']],
  ['Regressões v35.00', ['run', 'test:v3500']],
  ['Regressões v35.10', ['run', 'test:v3510']],
  ['Regressões v35.20', ['run', 'test:v3520']],
  ['Regressões v36.00', ['run', 'test:v3600']],
  ['Regressões v37.00', ['run', 'test:v3700']],
  ['Regressões v37.40', ['run', 'test:v3740']],
  ['Regressões v37.50', ['run', 'test:v3750']],
  ['Regressões v37.60', ['run', 'test:v3760']],
  ['Regressões v37.70', ['run', 'test:v3770']],
  ['Regressões v37.71', ['run', 'test:v3771']],
  ['Regressões v37.80', ['run', 'test:v3780']],
  ['Regressões v37.90', ['run', 'test:v3790']],
  ['Regressões v38.00', ['run', 'test:v3800']],
  ['Regressões v38.10', ['run', 'test:v3810']],
  ['Regressões v38.20', ['run', 'test:v3820']],
  ['Regressões v38.21', ['run', 'test:v3821']],
  ['Regressões v38.22', ['run', 'test:v3822']],
  ['Regressões v38.30', ['run', 'test:v3830']],
  ['Regressões v38.31', ['run', 'test:v3831']],
  ['Regressões v38.32', ['run', 'test:v3832']],
  ['Regressões v38.33', ['run', 'test:v3833']],
  ['Regressões v38.34', ['run', 'test:v3834']],
  ['Regressões v38.35', ['run', 'test:v3835']],
  ['Regressões v38.36', ['run', 'test:v3836']],
  ['Regressões v38.37', ['run', 'test:v3837']],
  ['Regressões v38.38', ['run', 'test:v3838']],
  ['Regressões v38.39', ['run', 'test:v3839']],
  ['Regressões v38.40', ['run', 'test:v3840']],
  ['Regressões v38.50', ['run', 'test:v3850']],
  ['Regressões v38.60', ['run', 'test:v3860']],
  ['Regressões v38.70', ['run', 'test:v3870']],
  ['Regressões v38.80', ['run', 'test:v3880']],
  ['Regressões v38.90', ['run', 'test:v3890']],
  ['Regressões v39.00', ['run', 'test:v3900']],
  ['Regressões v39.10', ['run', 'test:v3910']],
  ['Regressões v39.20', ['run', 'test:v3920']],
  ['Regressões v39.30', ['run', 'test:v3930']],
  ['Regressões v39.40', ['run', 'test:v3940']],
  ['Regressões v39.50', ['run', 'test:v3950']],
  ['Regressões v40.00', ['run', 'test:v4000']],
];

const checks = full ? [...quickChecks, ...fullChecks] : quickChecks;
if (full && checks.length !== EXPECTED_FULL_GROUPS) {
  console.error(`Contrato interno do CI inválido: esperados ${EXPECTED_FULL_GROUPS} grupos, encontrados ${checks.length}.`);
  process.exit(2);
}

const failures = [];
const startedAt = Date.now();

console.log(`\nDIAGNÓSTICO CONSOLIDADO BUILMASTER ${full ? 'COMPLETO' : 'RÁPIDO'}`);
console.log(`Fonte do diagnóstico: ${CI_SOURCE_BUILD}`);
console.log(`Executando ${checks.length} grupos sem parar na primeira falha.\n`);

for (const [label, args] of checks) {
  console.log(`\n========== ${label} ==========`);
  const result = spawnSync(npmCommand, args, {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });
  if (result.error || result.status !== 0) {
    failures.push({ label, status: result.status ?? 'erro de execução', error: result.error?.message });
    console.error(`✗ ${label} falhou, mas o diagnóstico continuará para revelar os demais problemas.`);
  } else {
    console.log(`✓ ${label} aprovado.`);
  }
}

const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
console.log('\n========== RESUMO CONSOLIDADO ==========');
console.log(`Grupos executados: ${checks.length}`);
console.log(`Tempo aproximado: ${elapsedSeconds}s`);

if (failures.length > 0) {
  console.error(`Falhas encontradas: ${failures.length}`);
  for (const failure of failures) {
    console.error(`- ${failure.label} (código ${failure.status})${failure.error ? `: ${failure.error}` : ''}`);
  }
  process.exit(1);
}

console.log('Nenhuma falha encontrada nos grupos executados.');
