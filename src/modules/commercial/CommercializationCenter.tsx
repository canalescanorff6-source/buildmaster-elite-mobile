'use client';

import { useMemo, useState } from 'react';
import { BadgeCheck, Download, FileText, Gift, KeyRound, Scale, ShieldCheck } from 'lucide-react';
import { acceptCommercialTerms, beginCommercialTrial, COMMERCIAL_PLANS, createCommercialDataExport, createLgpdRequest, readCommercialState, registerCouponCode, resolveCommercialEntitlements, type LgpdRequest } from './commercialization';

function downloadJson(filename: string, payload: unknown): void { const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }
const REQUEST_LABELS: Record<LgpdRequest['type'], string> = { access: 'Acesso aos dados', correction: 'Correção', export: 'Exportação', deletion: 'Exclusão da conta' };

export function CommercializationCenter({ profile }: { profile?: { role?: string; plan?: string; licenseExpiresAt?: string | null; active?: boolean } | null }) {
  const [state, setState] = useState(() => readCommercialState()); const [coupon, setCoupon] = useState(''); const [reason, setReason] = useState(''); const [message, setMessage] = useState('');
  const rights = useMemo(() => resolveCommercialEntitlements(profile, state), [profile, state]);
  function request(type: LgpdRequest['type']): void { setState(createLgpdRequest(type, reason)); setReason(''); setMessage('Solicitação registrada localmente. O envio ao administrador depende da conexão com o backend.'); }
  return <section className="bm2980-center commercial-center" aria-label="Planos, licenças e LGPD">
    <header className="bm2980-hero"><div><span className="bm2980-eyebrow">Bloco 27</span><h2>Planos, licenças e LGPD</h2><p>Direitos claros por plano, histórico comercial e solicitações de privacidade sem inventar preços ou cobranças.</p></div><BadgeCheck aria-hidden="true" /></header>
    {message && <div className="bm2980-notice" role="status">{message}</div>}
    <div className="bm2980-grid three">
      <article className="bm2980-card bm2980-highlight"><small>Plano atual</small><h3>{rights.planName}</h3><p>{rights.active ? 'Acesso ativo' : 'Acesso inativo'}{rights.trial ? ' · período de teste' : ''}</p><dl><div><dt>Aparelhos</dt><dd>{rights.limits.devices}</dd></div><div><dt>Publicações</dt><dd>{rights.limits.communityPublications}</dd></div><div><dt>Versões na nuvem</dt><dd>{rights.limits.cloudVersions}</dd></div></dl></article>
      <article className="bm2980-card"><h3><KeyRound size={18} /> Direitos</h3><ul>{Object.entries(rights.features).map(([feature, enabled]) => <li key={feature} className={enabled ? 'enabled' : 'disabled'}>{enabled ? '✓' : '—'} {feature.replaceAll('_', ' ')}</li>)}</ul></article>
      <article className="bm2980-card"><h3><ShieldCheck size={18} /> Política comercial</h3><p>Este módulo <strong>não processa pagamentos</strong>. Preços, confirmação de cobrança e renovação financeira dependem do administrador e de provedor externo.</p>{!profile && <button type="button" onClick={() => { setState(beginCommercialTrial('pro', 7)); setMessage('Teste local iniciado por sete dias. A licença de produção deve ser validada pelo servidor.'); }}><Gift size={17} />Iniciar teste local</button>}</article>
    </div>
    <div className="bm2980-plan-grid">{Object.values(COMMERCIAL_PLANS).map((plan) => <article className={`bm2980-card ${plan.id === rights.plan ? 'selected' : ''}`} key={plan.id}><small>{plan.id === rights.plan ? 'Plano atual' : 'Disponível por licença'}</small><h3>{plan.name}</h3><strong>{plan.priceLabel}</strong><p>{plan.description}</p><ul>{plan.features.map((feature) => <li key={feature}>{feature.replaceAll('_', ' ')}</li>)}</ul></article>)}</div>
    <div className="bm2980-grid two">
      <article className="bm2980-card"><h3><Gift size={18} /> Cupom e histórico</h3><div className="bm2980-inline"><input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Código do cupom" maxLength={30} /><button type="button" onClick={() => { try { setState(registerCouponCode(coupon)); setCoupon(''); setMessage('Cupom guardado para validação pelo servidor.'); } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Cupom inválido.'); } }}>Registrar</button></div><div className="bm2980-mini-list">{state.ledger.slice(0, 8).map((entry) => <p key={entry.id}><strong>{entry.description}</strong><small>{new Date(entry.createdAt).toLocaleString('pt-BR')}</small></p>)}</div></article>
      <article className="bm2980-card"><h3><Scale size={18} /> Privacidade e LGPD</h3><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo ou observação opcional" maxLength={500} /><div className="bm2980-actions">{(Object.keys(REQUEST_LABELS) as LgpdRequest['type'][]).map((type) => <button type="button" key={type} onClick={() => request(type)}>{REQUEST_LABELS[type]}</button>)}</div><button type="button" onClick={() => { setState(acceptCommercialTerms()); setMessage('Aceite dos termos registrado localmente.'); }}><FileText size={17} />Aceitar termos atuais</button><button type="button" onClick={() => downloadJson('buildmaster-dados-comerciais-lgpd.json', createCommercialDataExport())}><Download size={17} />Exportar meus dados comerciais</button></article>
    </div>
    <div className="bm2980-list">{state.lgpdRequests.map((item) => <article className="bm2980-card" key={item.id}><strong>{REQUEST_LABELS[item.type]}</strong><span>{item.status}</span><small>{new Date(item.createdAt).toLocaleString('pt-BR')}</small></article>)}</div>
  </section>;
}
