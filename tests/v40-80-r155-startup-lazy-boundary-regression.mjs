import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const lazy = [
  fs.readFileSync('src/components/lazy/AppLazyPanels.tsx', 'utf8'),
  fs.readFileSync('src/components/lazy/CardVisionLazyPanelsR174.tsx', 'utf8'),
].join('\n');
const deferred = fs.readFileSync('src/hooks/useDeferredStartupReadyR155.ts', 'utf8');
const chrome = fs.readFileSync('src/components/CardVisionAppChromeR185.tsx', 'utf8');
const central = fs.existsSync('src/hooks/useCardVisionCentralWorkspaceR175.ts') ? fs.readFileSync('src/hooks/useCardVisionCentralWorkspaceR175.ts', 'utf8') : app;

for (const directImport of [
  "@/components/UpdateCenterPanel",
  "@/modules/core/IntegratedHomePanel",
  "@/modules/squad/TeamFullMapPanel",
  "@/modules/backup/CloudSyncCenter",
  "@/components/EfhubVisualCalibrator",
  "@/components/ArchitectureHealthPanel",
  "@/components/PremiumQualityCenter",
  "@/components/CleanVaultV3800",
]) {
  const directPattern = new RegExp(`^import[^\\n]+from ['\"]${directImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['\"]`, 'm');
  assert.doesNotMatch(app, directPattern, `CardVision não deve voltar a importar estaticamente ${directImport}.`);
}

for (const dynamicTarget of [
  "@/components/UpdateCenterPanel",
  "@/modules/core/IntegratedHomePanel",
  "@/modules/squad/TeamFullMapPanel",
  "@/modules/backup/CloudSyncCenter",
  "@/components/EfhubVisualCalibrator",
  "@/components/ArchitectureHealthPanel",
  "@/components/PremiumQualityCenter",
  "@/components/CleanVaultV3800",
]) {
  assert.ok(lazy.includes(`import('${dynamicTarget}')`), `R155 deve carregar ${dynamicTarget} por chunk dinâmico.`);
}

assert.match(app, /useDeferredStartupReadyR155\(startupGateReady && sessionHydrated && !startupSafeMode\)/,
  'Auto-check secundário deve esperar o gate e a hidratação crítica.');
assert.match(chrome, /deferredStartupReady && <DeferredUpdateAutoCheckerR155/,
  'Update checker só pode montar depois da janela de startup R155, na fronteira Chrome R185.');
assert.match(deferred, /quietDelayMs = profile\.tier === 'economy' \? 3200 : profile\.tier === 'balanced' \? 1800 : 900/,
  'Dispositivos econômicos precisam receber maior janela de respiro.');
assert.match(deferred, /scheduleIdleTask\(\(\) => setReady\(true\)/,
  'Liberação secundária deve acontecer em idle após a janela de respiro.');
assert.match(central, /useCentralMatchRecordsR135\(\{[\s\S]*?enabled: startupGateReady && sessionHydrated && !startupSafeMode/,
  'Repositório de partidas não deve competir com a hidratação da sessão.');
assert.match(app, /!deferredStartupReadyR155 && mainSection !== 'leitor'/,
  'Fila OCR deve ser adiada em background, mas carregar imediatamente quando o usuário abrir o Leitor.');

console.log('R155 aprovado: superfícies pesadas e tarefas secundárias saíram do caminho crítico sem alterar o motor de fichas.');
