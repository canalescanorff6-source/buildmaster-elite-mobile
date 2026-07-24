'use client';

import { Cloud, CloudDownload, CloudUpload, GitMerge, History, Loader2, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import type { BackupSnapshot, SectionConflict } from './syncBackupEngine';

export function CloudSyncCenter(props: {
  cloudEnabled: boolean;
  loading: boolean;
  status: string;
  healthScore: number;
  healthStatus: string;
  recommendation: string;
  snapshots: BackupSnapshot[];
  conflicts: SectionConflict[];
  lastSyncAt: string | null;
  onCreateSnapshot: () => Promise<void> | void;
  onSyncFull: () => Promise<void> | void;
  onPullMerge: () => Promise<void> | void;
  onRestoreSnapshot: (id: string) => Promise<void> | void;
  onDeleteSnapshot: (id: string) => Promise<void> | void;
}) {
  const different = props.conflicts.filter((item) => item.state !== 'equal');
  return <section className="bm2900-sync-center">
    <div className="bm2900-sync-hero">
      <div className="bm2900-sync-score"><ShieldCheck size={25}/><strong>{props.healthScore}</strong><span>{props.healthStatus}</span></div>
      <div><p className="kicker"><Cloud size={15}/> Bloco 11</p><h3>Nuvem, versões e recuperação segura</h3><span>{props.recommendation}</span></div>
      <small>{props.lastSyncAt ? `Última sincronização: ${new Date(props.lastSyncAt).toLocaleString('pt-BR')}` : 'Nenhuma sincronização completa registrada'}</small>
    </div>

    <div className="bm2900-sync-actions">
      <button onClick={() => void props.onCreateSnapshot()} disabled={props.loading}><History size={19}/><strong>Criar ponto de restauração</strong><span>Salva a versão atual antes de mudanças importantes.</span><small>Local e separado por conta</small></button>
      <button onClick={() => void props.onSyncFull()} disabled={props.loading || !props.cloudEnabled}>{props.loading ? <Loader2 className="spin" size={19}/> : <CloudUpload size={19}/>}<strong>Sincronizar tudo</strong><span>Envia Cofre, partidas, treinos, formações, imagens e preferências.</span><small>{props.cloudEnabled ? 'Mescla antes de enviar' : 'Supabase necessário'}</small></button>
      <button onClick={() => void props.onPullMerge()} disabled={props.loading || !props.cloudEnabled}>{props.loading ? <Loader2 className="spin" size={19}/> : <CloudDownload size={19}/>}<strong>Baixar e mesclar</strong><span>Cria uma cópia de segurança e resolve conflitos sem apagar silenciosamente.</span><small>Restauração não destrutiva</small></button>
    </div>

    <div className="bm2900-sync-status" role="status"><Cloud size={16}/><div><strong>Status atual</strong><span>{props.status}</span></div></div>

    {different.length > 0 && <details className="settings-details-card" open>
      <summary>Conflitos e diferenças por área ({different.length})</summary>
      <div className="bm2900-conflicts">{different.map((item) => <article key={item.section}><GitMerge size={16}/><div><strong>{item.section}</strong><span>{item.state === 'different' ? 'A versão local e a versão da nuvem são diferentes.' : item.state === 'local-only' ? 'Existe somente neste aparelho.' : 'Existe somente na nuvem.'}</span></div><b>{item.recommendation === 'merge' ? 'Mesclar' : item.recommendation === 'keep-local' ? 'Manter local' : 'Trazer nuvem'}</b></article>)}</div>
    </details>}

    <div className="bm2900-snapshot-heading"><div><History size={18}/><span><strong>Histórico de versões</strong><small>Até oito cópias locais completas, sem substituir os dados atuais.</small></span></div><b>{props.snapshots.length}</b></div>
    <div className="bm2900-snapshot-list">{props.snapshots.map((snapshot) => <article key={snapshot.id}><div><strong>{snapshot.label}</strong><span>{new Date(snapshot.createdAt).toLocaleString('pt-BR')} • {snapshot.deviceLabel}</span><small>{snapshot.recordCount} registros • {snapshot.sections} áreas • {(snapshot.sizeBytes / 1024 / 1024).toFixed(1)} MB • v{snapshot.appVersion}</small></div><div><button onClick={() => void props.onRestoreSnapshot(snapshot.id)}><RotateCcw size={15}/> Restaurar</button><button className="danger" aria-label={`Apagar versão ${snapshot.label}`} onClick={() => void props.onDeleteSnapshot(snapshot.id)}><Trash2 size={15}/></button></div></article>)}{!props.snapshots.length && <p className="panel-note">Crie um ponto de restauração antes de testar grandes mudanças.</p>}</div>
  </section>;
}
