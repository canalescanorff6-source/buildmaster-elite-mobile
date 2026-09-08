'use client';
import { Loader2 } from 'lucide-react';

export function VaultOperationStatusR154(props: {
  localBusy: boolean;
  localLabel: string;
  cloudLoading: boolean;
  cloudPendingCount: number;
}) {
  if (!props.localBusy && !props.cloudLoading) return null;
  const title = props.localBusy ? (props.localLabel || 'Confirmando alteração no Cofre') : 'Sincronizando nuvem';
  const detail = props.localBusy
    ? 'A versão confirmada anterior permanece oficial até o commit terminar.'
    : `${Math.max(1, props.cloudPendingCount)} operação(ões) cloud em andamento.`;
  return <div className="cloud-status-card" role="status" aria-live="polite" aria-busy="true"><Loader2 className="spin" size={17}/><div><strong>{title}</strong><span>{detail}</span></div></div>;
}
