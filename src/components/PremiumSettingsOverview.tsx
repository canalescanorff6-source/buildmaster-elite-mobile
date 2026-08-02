'use client';

import {
  Activity,
  Bell,
  ChevronRight,
  Cloud,
  Crown,
  Download,
  Eye,
  Info,
  Palette,
  ShieldCheck,
  UserRound,
  Zap
} from 'lucide-react';

type SettingsTarget = 'contas' | 'aparencia' | 'desempenho' | 'seguranca' | 'backup' | 'atualizacoes' | 'suporte' | 'experiencia';

type Props = {
  username: string;
  version: string;
  playerCount: number;
  healthScore: number;
  cloudEnabled: boolean;
  themeLabel: string;
  onOpen: (target: SettingsTarget) => void;
};

export function PremiumSettingsOverview({ username, version, playerCount, healthScore, cloudEnabled, themeLabel, onOpen }: Props) {
  return (
    <section className="bm32-settings-overview" aria-label="Configurações">
      <header className="bm32-screen-heading">
        <div className="bm32-heading-icon"><ShieldCheck size={27}/></div>
        <div><h1>Configurações</h1><p>Personalize o visual, o desempenho e a segurança do seu app.</p></div>
      </header>

      <section className="bm32-premium-banner"><span><Crown size={31}/></span><div><h2>Premium Suite <em>ATIVO</em></h2><p>Visual avançado, recursos exclusivos e controle completo do BuildMaster.</p></div><button type="button" onClick={() => onOpen('contas')}>Gerenciar <ChevronRight size={19}/></button></section>

      <div className="bm32-settings-grid">
        <button type="button" onClick={() => onOpen('contas')}><span><UserRound size={25}/></span><div><strong>Conta e licença</strong><p>{username} • licença, sessão e dispositivos.</p></div><ChevronRight size={20}/></button>
        <button type="button" onClick={() => onOpen('aparencia')}><span><Palette size={25}/></span><div><strong>Tema visual</strong><p>Ajuste cores, contraste, densidade e animações.</p><em>{themeLabel}</em></div><ChevronRight size={20}/></button>
        <button type="button" onClick={() => onOpen('experiencia')}><span><Eye size={25}/></span><div><strong>Leitura de imagem/OCR</strong><p>Configure precisão, recorte e confirmação de dados.</p><em>Alta precisão</em></div><ChevronRight size={20}/></button>
        <button type="button" onClick={() => onOpen('backup')}><span><Cloud size={25}/></span><div><strong>Backup e sincronização</strong><p>{playerCount} ficha(s) disponíveis para proteção.</p><em>{cloudEnabled ? 'Nuvem conectada' : 'Modo local'}</em></div><ChevronRight size={20}/></button>
        <button type="button" onClick={() => onOpen('atualizacoes')}><span><Download size={25}/></span><div><strong>Atualizações</strong><p>Mantenha o aplicativo sempre atualizado.</p><em>Versão atual {version}</em></div><ChevronRight size={20}/></button>
        <button type="button" onClick={() => onOpen('suporte')}><span><Bell size={25}/></span><div><strong>Notificações e suporte</strong><p>Escolha alertas e abra o diagnóstico técnico.</p><em>Central ativa</em></div><ChevronRight size={20}/></button>
        <button type="button" onClick={() => onOpen('seguranca')}><span><ShieldCheck size={25}/></span><div><strong>Segurança</strong><p>Proteja seus dados, sessão e integridade.</p><em>Proteção ativa</em></div><ChevronRight size={20}/></button>
        <button type="button" onClick={() => onOpen('desempenho')}><span><Zap size={25}/></span><div><strong>Desempenho do app</strong><p>Otimização, estabilidade e resposta da interface.</p><em>{healthScore}% excelente</em></div><ChevronRight size={20}/></button>
      </div>

      <section className="bm32-performance-card"><div className="bm32-performance-ring"><strong>{healthScore}%</strong><span>Excelente</span></div><div><h2>Desempenho do aplicativo</h2><p>Acompanhe a saúde local e mantenha o fluxo rápido.</p><div><span><Activity size={17}/> Memória otimizada</span><span><Cloud size={17}/> Dados protegidos</span><span><Zap size={17}/> Velocidade ótima</span></div></div><button type="button" onClick={() => onOpen('desempenho')} aria-label="Abrir desempenho"><ChevronRight size={22}/></button></section>
      <div className="bm32-about-line"><Info size={17}/><span>BuildMaster Premium Suite • v{version}</span></div>
    </section>
  );
}
