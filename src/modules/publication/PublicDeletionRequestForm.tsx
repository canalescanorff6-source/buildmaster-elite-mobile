'use client';

import { useState } from 'react';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function PublicDeletionRequestForm() {
  const [username, setUsername] = useState('');
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(): Promise<void> {
    if (submitting) return;
    const normalized = username.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{1,18}[a-z0-9]$/.test(normalized)) { setStatus('Informe o mesmo nome de usuário utilizado no BuildMaster.'); return; }
    if (confirmation.trim().toUpperCase() !== 'EXCLUIR') { setStatus('Digite EXCLUIR no campo de confirmação.'); return; }
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { setStatus('O canal de solicitações ainda não foi publicado. Use a opção Planos e LGPD dentro do aplicativo.'); return; }
    setSubmitting(true);
    setStatus('Enviando solicitação...');
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/account-deletion-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ username: normalized, reason, confirmation: 'EXCLUIR', source: 'public_web' })
      });
      const payload = await response.json().catch(() => null) as { requestId?: string; message?: string } | null;
      if (!response.ok) throw new Error(payload?.message || 'Não foi possível registrar a solicitação.');
      setStatus(`Solicitação registrada${payload?.requestId ? ` com o código ${payload.requestId}` : ''}. Guarde este código.`);
      setUsername(''); setReason(''); setConfirmation('');
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Não foi possível registrar a solicitação.');
    } finally {
      setSubmitting(false);
    }
  }

  return <div className="public-policy-form">
    <label><span>Nome de usuário</span><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" maxLength={20} /></label>
    <label><span>Motivo ou observação opcional</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} /></label>
    <label><span>Confirmação</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Digite EXCLUIR" maxLength={10} /></label>
    <button type="button" onClick={() => void submit()} disabled={submitting}>{submitting ? 'Enviando...' : 'Solicitar exclusão da conta'}</button>
    {status && <p role="status">{status}</p>}
  </div>;
}
