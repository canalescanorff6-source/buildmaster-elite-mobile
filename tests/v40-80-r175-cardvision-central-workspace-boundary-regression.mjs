import fs from 'node:fs';

const shell = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const central = fs.readFileSync('src/hooks/useCardVisionCentralWorkspaceR175.ts', 'utf8');
const settings = fs.readFileSync('src/components/settings/CardVisionSettingsWorkspaceR190.tsx', 'utf8');

function expect(value, message) {
  if (!value) throw new Error(`R175: ${message}`);
}

const shellLines = shell.endsWith('\n') ? shell.split('\n').length - 1 : shell.split('\n').length;
expect(shellLines <= 2830, `CardVisionApp voltou a crescer: ${shellLines} linhas (limite R175: 2830).`);
expect(shell.includes("useCardVisionCentralWorkspaceR175"), 'shell não usa a boundary da Central R175.');
expect(shell.includes("} = useCardVisionCentralWorkspaceR175({"), 'resultados da Central não são consumidos pela boundary R175.');

for (const forbidden of [
  'useCentralMatchRecordsR135',
  'CENTRAL_MIGRATION_STORAGE_KEY',
  'createCentralMigrationReport',
  'buildMatchScenarioPlans',
  'safeIntegratedPlayersR130',
  'safeTeamDiagnosisR130',
  'safeCentralDashboardR130',
  'buildCentralEntityIndex',
  'CENTRAL_INDEX_STORAGE_KEY',
  'syncStructuredRepository',
  'resolveCommercialEntitlements',
]) {
  expect(!shell.includes(forbidden), `${forbidden} voltou ao CardVisionApp.`);
}

for (const required of [
  'useCentralMatchRecordsR135',
  'CENTRAL_MIGRATION_STORAGE_KEY',
  'createCentralMigrationReport',
  'safeIntegratedPlayersR130',
  'safeTeamDiagnosisR130',
  'safeCentralDashboardR130',
  'buildMatchScenarioPlans',
  'buildCentralEntityIndex',
  'CENTRAL_INDEX_STORAGE_KEY',
  'syncStructuredRepository',
  "performanceMode === 'economy' ? 1800 : 700",
  "performanceMode === 'economy' ? 2400 : 900",
  "performanceMode === 'economy' ? 3200 : 1200",
  "area: 'match-scenario-plans'",
  "area: 'central-entity-index'",
  "area: 'structured-repository'",
]) {
  expect(central.includes(required), `boundary Central perdeu contrato: ${required}.`);
}

for (const returned of [
  'centralMatchRecords,',
  'centralMigrationNote,',
  'integratedPlayers,',
  'integratedTeam,',
  'centralDashboard,',
  'centralMatchPlans,',
]) {
  expect(central.includes(returned), `boundary Central não retorna ${returned}`);
}

expect(!fs.existsSync('src/modules/community/CommunitySharingCenter.tsx'), 'R473: superfície aposentada de Comunidade voltou ao source.');
expect(!shell.includes('resolveCommercialEntitlements'), 'R175/R473: entitlement comercial não pode voltar ao shell.');
expect(!settings.includes('CommunitySharingCenter'), 'R175/R473: Ajustes não pode voltar a renderizar a superfície aposentada de Comunidade.');
expect(!settings.includes('commercialProfile={{ role: account?.profile.role'), 'R175/R473: contrato comercial aposentado não pode voltar ao workspace de Ajustes.');

console.log(`R175 aprovada: Central saiu do shell (${shellLines} linhas) e a superfície aposentada de Comunidade permanece ausente.`);
