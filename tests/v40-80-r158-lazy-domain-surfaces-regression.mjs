import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
const lazy = [
  fs.readFileSync('src/components/lazy/AppLazyPanels.tsx', 'utf8'),
  fs.readFileSync('src/components/lazy/CardVisionLazyPanelsR174.tsx', 'utf8'),
].join('\n');
const preload = fs.readFileSync('src/components/lazy/AppPanelPreloadR174.ts', 'utf8');
const settings = fs.readFileSync('src/components/settings/CardVisionSettingsWorkspaceR190.tsx', 'utf8');

for (const directImport of [
  "@/modules/squad-mapping/SquadMappingCenter",
  "@/modules/tactical-studio/MetaFormationStudioV3832",
  "@/modules/administration/AdministrationSecurityCenter",
]) {
  const escaped = directImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.doesNotMatch(app, new RegExp(`^import[^\\n]+from ['\"]${escaped}['\"]`, 'm'), `R158 não pode reintroduzir import estático de ${directImport}.`);
  assert.ok(lazy.includes(`import('${directImport}')`), `R158 deve carregar ${directImport} dinamicamente.`);
}

assert.match(preload, /time:\s*\[[\s\S]*SquadMappingCenter[\s\S]*MetaFormationStudioV3832/, 'Mapeamento e Meta Formation devem participar do preload adaptativo da área Time.');
assert.match(preload, /ajustes:\s*\[[\s\S]*AdministrationSecurityCenter/, 'Segurança deve participar do preload adaptativo de Ajustes.');
assert.match(app, /<SquadMappingCenter/, 'Mapeamento continua disponível na UI.');
assert.match(app, /<MetaFormationStudioV3832/, 'Meta Formation continua disponível na UI.');
assert.match(settings, /<AdministrationSecurityCenter/, 'Segurança continua disponível na UI pela fronteira de Ajustes R190.');

console.log('R158 aprovado: superfícies pesadas de time/admin estão lazy, continuam presentes e usam preload adaptativo.');
