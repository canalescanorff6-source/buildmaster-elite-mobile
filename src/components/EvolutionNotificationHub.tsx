'use client';

import { useMemo, useState } from 'react';
import { Bell, CheckCircle2, Rocket, X } from 'lucide-react';
import { buildEvolutionNotifications, dismissEvolutionNotification, type EvolutionInput, type EvolutionTarget } from '@/lib/appEvolutionV2740';

export function EvolutionNotificationHub({ input, onOpenTarget, onOpenCenter }: { input: EvolutionInput; onOpenTarget: (target: EvolutionTarget) => void; onOpenCenter: () => void }) {
  const [open, setOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const notifications = useMemo(() => buildEvolutionNotifications(input), [input, revision]);
  const urgent = notifications.filter((item) => item.severity === 'critical' || item.severity === 'attention').length;

  return <div className="evolution-notification-hub">
    <button type="button" className="evolution-bell-button" aria-label={`Abrir pendências${notifications.length ? `, ${notifications.length} aviso(s)` : ''}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}><Bell size={17}/>{notifications.length > 0 && <b>{notifications.length > 9 ? '9+' : notifications.length}</b>}</button>
    {open && <section className="evolution-hub-popover" role="dialog" aria-label="Pendências do aplicativo">
      <header><div><strong>Pendências inteligentes</strong><span>{urgent ? `${urgent} item(ns) prioritário(s)` : 'Tudo sob controle'}</span></div><button type="button" aria-label="Fechar pendências" onClick={() => setOpen(false)}><X size={18}/></button></header>
      <div>{notifications.slice(0, 5).map((item) => <article key={item.id} className={`severity-${item.severity}`}><span>{item.severity === 'success' ? <CheckCircle2 size={18}/> : <Bell size={18}/>}</span><button type="button" onClick={() => { if (item.target) onOpenTarget(item.target); setOpen(false); }}><strong>{item.title}</strong><small>{item.message}</small></button><button type="button" className="hub-dismiss" aria-label={`Ocultar ${item.title}`} onClick={() => { dismissEvolutionNotification(item.id); setRevision((value) => value + 1); }}>×</button></article>)}{!notifications.length && <p><CheckCircle2 size={22}/> Nenhuma pendência ativa.</p>}</div>
      <button type="button" className="evolution-hub-center-button" onClick={() => { onOpenCenter(); setOpen(false); }}><Rocket size={17}/> Abrir Evolução 360</button>
    </section>}
  </div>;
}
