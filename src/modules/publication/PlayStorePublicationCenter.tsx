'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileText, RefreshCw, ShieldCheck, Trophy } from 'lucide-react';
import {
  buildPlayStorePublicationReport,
  formatPlayStorePublicationReport,
  markPlayStorePublicationReviewed,
  readPlayStorePublicationProfile,
  writePlayStorePublicationProfile,
  type PlayStorePublicationProfile,
  type PlayStoreTrack,
  type PublicationCheck
} from './playStorePublication';
import { checkGooglePlayUpdate, IS_PLAY_DISTRIBUTION, startGooglePlayUpdate } from './playIntegrity';

const TRACK_LABELS: Record<PlayStoreTrack, string> = {
  internal: 'Teste interno',
  closed: 'Teste fechado',
  open: 'Teste aberto',
  production: 'Produção'
};

const EDITABLE_LABELS: Partial<Record<keyof PlayStorePublicationProfile, string>> = {
  aabGenerated: 'AAB gerado e validado',
  uploadKeyConfigured: 'Chave de upload configurada',
  playAppSigningEnabled: 'Play App Signing ativado',
  playConsoleAppCreated: 'Aplicativo criado no Play Console',
  cloudProjectLinked: 'Projeto Google Cloud vinculado',
  playIntegrityEnabled: 'Play Integrity ativado',
  integrityBackendVerified: 'Backend verificando os tokens',
  privacyPolicyPublished: 'Política de privacidade publicada',
  accountDeletionInApp: 'Exclusão disponível no aplicativo',
  accountDeletionWebPublished: 'Página pública de exclusão publicada',
  dataSafetyCompleted: 'Formulário Segurança dos dados concluído',
  contentRatingCompleted: 'Classificação de conteúdo concluída',
  appAccessCompleted: 'Acesso da equipe de análise configurado',
  adsDeclarationCompleted: 'Declaração de anúncios concluída',
  storeListingCompleted: 'Ficha da loja preenchida',
  featureGraphicReady: 'Imagem de destaque pronta',
  phoneScreenshotsReady: 'Capturas reais de celular prontas',
  tabletScreenshotsReady: 'Capturas reais de tablet prontas',
  testersConfigured: 'Grupo de testadores configurado',
  crashMonitoringReady: 'Rotina de Android vitals definida',
  supportContactPublished: 'Contato de suporte publicado',
  releaseNotesReady: 'Notas da v30.20 revisadas'
};

function downloadText(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function checkIcon(check: PublicationCheck) {
  if (check.passed) return <CheckCircle2 size={18} aria-hidden="true" />;
  return <AlertTriangle size={18} aria-hidden="true" />;
}

export function PlayStorePublicationCenter() {
  const [profile, setProfile] = useState<PlayStorePublicationProfile>(() => readPlayStorePublicationProfile());
  const [playUpdateStatus, setPlayUpdateStatus] = useState(IS_PLAY_DISTRIBUTION ? 'Pronto para consultar a Google Play.' : 'Este pacote usa o canal APK direto.');
  const report = useMemo(() => buildPlayStorePublicationReport(profile), [profile]);
  const editableKeys = useMemo(() => Object.keys(EDITABLE_LABELS) as Array<keyof PlayStorePublicationProfile>, []);

  function persist(next: PlayStorePublicationProfile): void {
    setProfile(writePlayStorePublicationProfile(next));
  }

  function toggle(key: keyof PlayStorePublicationProfile): void {
    if (typeof profile[key] !== 'boolean') return;
    persist({ ...profile, [key]: !profile[key] });
  }


  async function checkPlayUpdate(): Promise<void> {
    try {
      setPlayUpdateStatus('Consultando a Google Play...');
      const update = await checkGooglePlayUpdate();
      if (!update) { setPlayUpdateStatus('Consulta disponível somente no AAB instalado pela Google Play.'); return; }
      if (!update.available) { setPlayUpdateStatus('Nenhuma atualização da Google Play está disponível.'); return; }
      setPlayUpdateStatus(`Atualização ${update.availableVersionCode} disponível${update.flexibleAllowed ? ' em modo flexível' : ''}.`);
    } catch (cause) { setPlayUpdateStatus(cause instanceof Error ? cause.message : 'Falha ao consultar a Google Play.'); }
  }

  async function installPlayUpdate(): Promise<void> {
    try {
      const started = await startGooglePlayUpdate('flexible');
      setPlayUpdateStatus(started ? 'Atualização iniciada pela Google Play.' : 'A atualização não pôde ser iniciada.');
    } catch (cause) { setPlayUpdateStatus(cause instanceof Error ? cause.message : 'Falha ao iniciar a atualização.'); }
  }

  function review(): void {
    setProfile(markPlayStorePublicationReviewed(profile));
  }

  return <section className="bm3000-publication-center luxury-panel" aria-labelledby="bm3000-publication-title">
    <header className="bm3000-publication-hero">
      <div>
        <p className="kicker"><Trophy size={15} /> Bloco 28</p>
        <h3 id="bm3000-publication-title">Publicação profissional na Google Play</h3>
        <span>O painel separa o que o código já entrega do que ainda precisa ser confirmado dentro do Play Console.</span>
      </div>
      <strong className={`state-${report.state}`}>{report.score}/100 • {report.state === 'ready' ? 'Pronto' : report.state === 'pending' ? 'Revisar' : 'Bloqueado'}</strong>
    </header>

    <div className="bm3000-publication-controls">
      <label><span>Canal de destino</span><select value={profile.targetTrack} onChange={(event) => persist({ ...profile, targetTrack: event.target.value as PlayStoreTrack })}>{(Object.keys(TRACK_LABELS) as PlayStoreTrack[]).map((track) => <option key={track} value={track}>{TRACK_LABELS[track]}</option>)}</select></label>
      <label><span>Rollout inicial</span><input type="number" min={1} max={100} value={profile.rolloutPercentage} onChange={(event) => persist({ ...profile, rolloutPercentage: Number(event.target.value) })} /><small>Use 100% nos canais de teste. Em produção, comece de forma gradual.</small></label>
      <article><ShieldCheck size={20} /><div><strong>API 36 + AAB + Play App Signing</strong><span>O workflow da v30.20 gera o bundle Play separado do APK direto.</span></div></article>
    </div>

    <div className="bm3000-publication-metrics">
      <article><CheckCircle2 size={20} /><div><span>Aprovados</span><strong>{report.checks.filter((item) => item.passed).length}/{report.checks.length}</strong></div></article>
      <article><AlertTriangle size={20} /><div><span>Bloqueios</span><strong>{report.blockers.length}</strong></div></article>
      <article><FileText size={20} /><div><span>Avisos</span><strong>{report.warnings.length}</strong></div></article>
      <article><Trophy size={20} /><div><span>Canal</span><strong>{TRACK_LABELS[profile.targetTrack]}</strong></div></article>
    </div>

    <div className="bm3000-publication-checklist" aria-label="Confirmações externas da publicação">
      {editableKeys.map((key) => <label key={key} className={profile[key] ? 'is-checked' : ''}>
        <input type="checkbox" checked={Boolean(profile[key])} onChange={() => toggle(key)} />
        <span>{EDITABLE_LABELS[key]}</span>
      </label>)}
    </div>

    <div className="bm3000-publication-checks">
      {report.checks.map((item) => <article key={item.id} className={item.passed ? 'is-pass' : item.severity === 'critical' ? 'is-blocked' : 'is-warning'}>
        <span>{checkIcon(item)}</span>
        <div><small>{item.area}{item.consoleOnly ? ' • Play Console' : ' • código'}</small><strong>{item.label}</strong><p>{item.detail}</p></div>
      </article>)}
    </div>

    <div className={`bm3000-publication-recommendation state-${report.state}`} role="status"><strong>{report.recommendation}</strong><span>Marcar uma confirmação não executa ações externas. O item deve representar o estado real da conta e da publicação.</span></div>
    <div className="bm3000-play-update" role="status"><strong>{IS_PLAY_DISTRIBUTION ? 'Atualizações pela Google Play' : 'Canal direto preservado'}</strong><span>{playUpdateStatus}</span>{IS_PLAY_DISTRIBUTION && <div><button type="button" onClick={() => void checkPlayUpdate()}>Verificar na Play</button><button type="button" onClick={() => void installPlayUpdate()}>Iniciar atualização</button></div>}</div>
    <div className="bm3000-publication-actions">
      <button type="button" onClick={review}><RefreshCw size={16} /> Registrar revisão</button>
      <button type="button" onClick={() => downloadText(`buildmaster-publicacao-play-v30-${new Date().toISOString().slice(0, 10)}.txt`, formatPlayStorePublicationReport(report))}><Download size={16} /> Exportar checklist</button>
    </div>
    {profile.lastReviewedAt && <small className="bm3000-last-review">Última revisão registrada: {new Date(profile.lastReviewedAt).toLocaleString('pt-BR')}</small>}
  </section>;
}
