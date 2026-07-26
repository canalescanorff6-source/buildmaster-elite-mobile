import { safeStorageGetJson, safeStorageSetJson } from '@/lib/safeLocalStorage';

export const PLAY_STORE_PUBLICATION_VERSION = '30.40.0';
export const PLAY_STORE_TARGET_API = 36;
export const PLAY_STORE_PACKAGE_NAME = 'com.buildmaster.elitetatico';

export type PlayStoreTrack = 'internal' | 'closed' | 'open' | 'production';
export type PublicationCheckState = 'ready' | 'pending' | 'blocked';
export type PublicationSeverity = 'critical' | 'warning' | 'info';

export type PlayStorePublicationProfile = {
  schema: 1;
  targetTrack: PlayStoreTrack;
  rolloutPercentage: number;
  aabGenerated: boolean;
  uploadKeyConfigured: boolean;
  playAppSigningEnabled: boolean;
  playConsoleAppCreated: boolean;
  cloudProjectLinked: boolean;
  playIntegrityEnabled: boolean;
  integrityBackendVerified: boolean;
  privacyPolicyPublished: boolean;
  accountDeletionInApp: boolean;
  accountDeletionWebPublished: boolean;
  dataSafetyCompleted: boolean;
  contentRatingCompleted: boolean;
  appAccessCompleted: boolean;
  adsDeclarationCompleted: boolean;
  storeListingCompleted: boolean;
  featureGraphicReady: boolean;
  phoneScreenshotsReady: boolean;
  tabletScreenshotsReady: boolean;
  testersConfigured: boolean;
  crashMonitoringReady: boolean;
  supportContactPublished: boolean;
  releaseNotesReady: boolean;
  lastReviewedAt: string | null;
};

export type PublicationCheck = {
  id: keyof Omit<PlayStorePublicationProfile, 'schema' | 'targetTrack' | 'rolloutPercentage' | 'lastReviewedAt'> | 'target-api' | 'package-name' | 'play-update-channel';
  area: 'artefato' | 'assinatura' | 'políticas' | 'integridade' | 'loja' | 'testes' | 'distribuição';
  label: string;
  detail: string;
  severity: PublicationSeverity;
  passed: boolean;
  consoleOnly?: boolean;
};

export type PlayStorePublicationReport = {
  version: string;
  generatedAt: string;
  targetTrack: PlayStoreTrack;
  rolloutPercentage: number;
  score: number;
  state: PublicationCheckState;
  blockers: PublicationCheck[];
  warnings: PublicationCheck[];
  checks: PublicationCheck[];
  recommendation: string;
};

const STORAGE_KEY = 'buildmaster.play-store-publication.v3000';
const booleanKeys: Array<keyof Omit<PlayStorePublicationProfile, 'schema' | 'targetTrack' | 'rolloutPercentage' | 'lastReviewedAt'>> = [
  'aabGenerated', 'uploadKeyConfigured', 'playAppSigningEnabled', 'playConsoleAppCreated', 'cloudProjectLinked',
  'playIntegrityEnabled', 'integrityBackendVerified', 'privacyPolicyPublished', 'accountDeletionInApp',
  'accountDeletionWebPublished', 'dataSafetyCompleted', 'contentRatingCompleted', 'appAccessCompleted',
  'adsDeclarationCompleted', 'storeListingCompleted', 'featureGraphicReady', 'phoneScreenshotsReady',
  'tabletScreenshotsReady', 'testersConfigured', 'crashMonitoringReady', 'supportContactPublished', 'releaseNotesReady'
];

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : minimum));
}

export function createDefaultPlayStorePublicationProfile(): PlayStorePublicationProfile {
  return {
    schema: 1,
    targetTrack: 'internal',
    rolloutPercentage: 100,
    aabGenerated: false,
    uploadKeyConfigured: false,
    playAppSigningEnabled: false,
    playConsoleAppCreated: false,
    cloudProjectLinked: false,
    playIntegrityEnabled: false,
    integrityBackendVerified: false,
    privacyPolicyPublished: false,
    accountDeletionInApp: true,
    accountDeletionWebPublished: false,
    dataSafetyCompleted: false,
    contentRatingCompleted: false,
    appAccessCompleted: false,
    adsDeclarationCompleted: false,
    storeListingCompleted: false,
    featureGraphicReady: true,
    phoneScreenshotsReady: false,
    tabletScreenshotsReady: false,
    testersConfigured: false,
    crashMonitoringReady: false,
    supportContactPublished: false,
    releaseNotesReady: true,
    lastReviewedAt: null
  };
}

export function normalizePlayStorePublicationProfile(input: unknown): PlayStorePublicationProfile {
  const fallback = createDefaultPlayStorePublicationProfile();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fallback;
  const raw = input as Partial<PlayStorePublicationProfile>;
  const track: PlayStoreTrack = ['internal', 'closed', 'open', 'production'].includes(String(raw.targetTrack))
    ? raw.targetTrack as PlayStoreTrack
    : 'internal';
  const output: PlayStorePublicationProfile = {
    ...fallback,
    targetTrack: track,
    rolloutPercentage: Math.round(clamp(Number(raw.rolloutPercentage ?? 100), 1, 100)),
    lastReviewedAt: raw.lastReviewedAt && !Number.isNaN(Date.parse(raw.lastReviewedAt)) ? raw.lastReviewedAt : null
  };
  for (const key of booleanKeys) output[key] = Boolean(raw[key]);
  return output;
}

export function readPlayStorePublicationProfile(): PlayStorePublicationProfile {
  return normalizePlayStorePublicationProfile(safeStorageGetJson<unknown>(STORAGE_KEY, null));
}

export function writePlayStorePublicationProfile(input: unknown): PlayStorePublicationProfile {
  const profile = normalizePlayStorePublicationProfile(input);
  safeStorageSetJson(STORAGE_KEY, profile);
  return profile;
}

export function markPlayStorePublicationReviewed(input: PlayStorePublicationProfile): PlayStorePublicationProfile {
  return writePlayStorePublicationProfile({ ...input, lastReviewedAt: new Date().toISOString() });
}

function requiredForTrack(track: PlayStoreTrack, id: PublicationCheck['id']): boolean {
  if (track === 'internal') return !['dataSafetyCompleted', 'contentRatingCompleted', 'adsDeclarationCompleted', 'tabletScreenshotsReady'].includes(String(id));
  if (track === 'closed') return id !== 'tabletScreenshotsReady';
  return true;
}

export function buildPlayStorePublicationReport(profileInput: unknown, now = new Date()): PlayStorePublicationReport {
  const profile = normalizePlayStorePublicationProfile(profileInput);
  const check = (
    id: PublicationCheck['id'], area: PublicationCheck['area'], label: string, detail: string,
    passed: boolean, severity: PublicationSeverity = 'critical', consoleOnly = false
  ): PublicationCheck => ({ id, area, label, detail, passed: requiredForTrack(profile.targetTrack, id) ? passed : true, severity, consoleOnly });

  const checks: PublicationCheck[] = [
    check('target-api', 'artefato', 'Android 16 / API 36', 'O workflow Play fixa compileSdk e targetSdk em API 36.', true),
    check('package-name', 'artefato', 'Identidade permanente', `Pacote oficial ${PLAY_STORE_PACKAGE_NAME}.`, true),
    check('aabGenerated', 'artefato', 'Android App Bundle validado', 'O AAB deve ser criado, assinado pela chave de upload e validado pelo bundletool.', profile.aabGenerated),
    check('uploadKeyConfigured', 'assinatura', 'Chave de upload separada', 'O Secret GOOGLE_PLAY_UPLOAD_KEY_BUNDLE precisa conter a chave de upload permanente.', profile.uploadKeyConfigured),
    check('playAppSigningEnabled', 'assinatura', 'Play App Signing', 'A chave de assinatura de distribuição deve estar protegida pelo Google Play.', profile.playAppSigningEnabled, 'critical', true),
    check('playConsoleAppCreated', 'loja', 'Aplicativo criado no Play Console', 'O appId deve existir na conta correta do Play Console.', profile.playConsoleAppCreated, 'critical', true),
    check('cloudProjectLinked', 'integridade', 'Projeto Google Cloud vinculado', 'Vincule o projeto na área “Protegido pelo Google Play”.', profile.cloudProjectLinked, 'critical', true),
    check('playIntegrityEnabled', 'integridade', 'Play Integrity ativado', 'A biblioteca nativa e a configuração do Play Console precisam estar ativas.', profile.playIntegrityEnabled),
    check('integrityBackendVerified', 'integridade', 'Verificação no servidor', 'Tokens devem ser decodificados no backend e vinculados à ação solicitada.', profile.integrityBackendVerified),
    check('privacyPolicyPublished', 'políticas', 'Política de privacidade pública', 'A URL precisa estar publicada e acessível sem login.', profile.privacyPolicyPublished, 'critical', true),
    check('accountDeletionInApp', 'políticas', 'Exclusão dentro do aplicativo', 'O usuário pode registrar solicitação de exclusão em Planos e LGPD.', profile.accountDeletionInApp),
    check('accountDeletionWebPublished', 'políticas', 'Exclusão por página web', 'A rota /excluir-conta precisa estar publicada fora do APK.', profile.accountDeletionWebPublished, 'critical', true),
    check('dataSafetyCompleted', 'políticas', 'Segurança dos dados', 'O formulário deve refletir app, Supabase e bibliotecas Google Play.', profile.dataSafetyCompleted, 'critical', true),
    check('contentRatingCompleted', 'políticas', 'Classificação de conteúdo', 'Questionário de classificação concluído no Play Console.', profile.contentRatingCompleted, 'critical', true),
    check('appAccessCompleted', 'políticas', 'Acesso para revisão', 'Forneça credenciais ou instruções para a equipe de análise acessar o app.', profile.appAccessCompleted, 'critical', true),
    check('adsDeclarationCompleted', 'políticas', 'Declaração de anúncios', 'Declare corretamente se o aplicativo contém anúncios.', profile.adsDeclarationCompleted, 'critical', true),
    check('storeListingCompleted', 'loja', 'Ficha da loja completa', 'Título, descrições, categoria e contato precisam estar preenchidos.', profile.storeListingCompleted),
    check('featureGraphicReady', 'loja', 'Imagem de destaque', 'Arte 1024 × 500 presente no pacote play-store/assets.', profile.featureGraphicReady),
    check('phoneScreenshotsReady', 'loja', 'Capturas de celular', 'Inclua capturas reais da versão final, sem telas simuladas.', profile.phoneScreenshotsReady),
    check('tabletScreenshotsReady', 'loja', 'Capturas de tablet', 'Adicione capturas reais caso o app seja distribuído para tablets.', profile.tabletScreenshotsReady, 'warning'),
    check('testersConfigured', 'testes', 'Grupo de testadores', 'Configure o grupo correspondente ao canal escolhido.', profile.testersConfigured, 'critical', true),
    check('crashMonitoringReady', 'testes', 'Falhas e ANRs acompanhados', 'Defina a rotina de revisão do Android vitals antes de ampliar o rollout.', profile.crashMonitoringReady, 'warning', true),
    check('supportContactPublished', 'loja', 'Contato de suporte', 'Informe e-mail ou site real controlado pelo responsável pelo aplicativo.', profile.supportContactPublished, 'critical', true),
    check('releaseNotesReady', 'distribuição', 'Notas da versão', 'Notas pt-BR da v30.40 incluídas no pacote da loja.', profile.releaseNotesReady),
    check('play-update-channel', 'distribuição', 'Atualização pela Play Store', 'O build Play remove REQUEST_INSTALL_PACKAGES e usa Play In-App Updates.', true)
  ];

  const required = checks.filter((item) => requiredForTrack(profile.targetTrack, item.id));
  const passed = required.filter((item) => item.passed).length;
  const score = Math.round((passed / Math.max(1, required.length)) * 100);
  const blockers = required.filter((item) => !item.passed && item.severity === 'critical');
  const warnings = required.filter((item) => !item.passed && item.severity !== 'critical');
  const state: PublicationCheckState = blockers.length ? 'blocked' : warnings.length || score < 100 ? 'pending' : 'ready';
  const recommendation = blockers.length
    ? `Não publicar no canal ${profile.targetTrack}: faltam ${blockers.length} requisito(s) crítico(s).`
    : state === 'pending'
      ? `Canal ${profile.targetTrack} tecnicamente liberado, mas ${warnings.length} aviso(s) devem ser revisados antes de ampliar o rollout.`
      : `Canal ${profile.targetTrack} pronto para publicação controlada em ${profile.rolloutPercentage}%.`;

  return {
    version: PLAY_STORE_PUBLICATION_VERSION,
    generatedAt: now.toISOString(),
    targetTrack: profile.targetTrack,
    rolloutPercentage: profile.rolloutPercentage,
    score,
    state,
    blockers,
    warnings,
    checks,
    recommendation
  };
}

export function exportPlayStorePublicationState(): PlayStorePublicationProfile {
  return readPlayStorePublicationProfile();
}

export function importPlayStorePublicationState(input: unknown): PlayStorePublicationProfile {
  return writePlayStorePublicationProfile(input);
}

export function formatPlayStorePublicationReport(report: PlayStorePublicationReport): string {
  const status = report.state === 'ready' ? 'PRONTO' : report.state === 'pending' ? 'REVISAR' : 'BLOQUEADO';
  return [
    'BUILDMASTER — PUBLICAÇÃO GOOGLE PLAY',
    `Motor: ${report.version}`,
    `Gerado em: ${new Date(report.generatedAt).toLocaleString('pt-BR')}`,
    `Canal: ${report.targetTrack}`,
    `Rollout: ${report.rolloutPercentage}%`,
    `Pontuação: ${report.score}/100`,
    `Estado: ${status}`,
    `Recomendação: ${report.recommendation}`,
    '',
    ...report.checks.map((item) => `${item.passed ? 'OK' : item.severity === 'critical' ? 'BLOQUEIO' : 'AVISO'} • ${item.area} • ${item.label} • ${item.detail}`),
    '',
    'As confirmações do Play Console devem refletir o estado real da conta. Marcar um item no app não executa a configuração externa.'
  ].join('\n');
}
