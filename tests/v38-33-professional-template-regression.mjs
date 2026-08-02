import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const tactical = require('../src/modules/tactical-studio/metaFormationStudioV3832.ts');
const poster = require('../src/modules/tactical-studio/professionalTacticalTemplateV3833.ts');
const read = (file) => fs.readFileSync(file, 'utf8');

assert.equal(poster.PROFESSIONAL_TACTICAL_TEMPLATE_VERSION, '38.33.0');
assert.equal(tactical.META_FORMATION_STUDIO_VERSION, '38.33.0');
assert.deepEqual(poster.professionalMetaFormationOutputSize('complete'), { width: 1080, height: 1920 });
assert.deepEqual(poster.professionalMetaFormationOutputSize('story'), { width: 1080, height: 1920 });
assert.deepEqual(poster.professionalMetaFormationOutputSize('square'), { width: 1080, height: 1080 });

const recommendation = tactical.recommendMetaFormations('Contra-ataque rápido', 'jogar pelo centro')[0];
assert.ok(recommendation?.formation, 'Uma formação precisa estar disponível para o template.');
const project = tactical.createMetaFormationProject(recommendation.formation, 'jogar pelo centro', 'rapido');
project.name = '4-1-2-1-2 Vácuo Fatal';
const svg = poster.renderProfessionalMetaFormationSvg(project, 'complete');

for (const marker of [
  'data-template-version="38.33.0"',
  'MODELO GERADO PELO APP',
  'eFOOTBALL 2026',
  'GUIA TÁTICO INTELIGENTE',
  'ESTILO DO TÉCNICO',
  'FORMAÇÃO PERSONALIZADA',
  'META',
  'LEGENDA',
  'CHAVES DO',
  'PRINCÍPIOS OFENSIVOS',
  'PRINCÍPIOS DEFENSIVOS',
  'POR QUE RENDE',
  'Marques Fichas'
]) assert.ok(svg.includes(marker), `Template profissional sem ${marker}`);

assert.equal((svg.match(/data-slot=/g) || []).length, 11, 'O template precisa renderizar exatamente 11 jogadores.');
assert.ok(!svg.includes('<foreignObject'), 'A exportação deve usar SVG nativo compatível com Android e PNG.');
assert.ok(svg.includes('markerUnits="userSpaceOnUse"'), 'As setas precisam manter tamanho controlado.');
assert.ok(svg.includes('buildmaster') === false, 'A arte não deve expor nomes técnicos internos no conteúdo visual.');
assert.ok(svg.length > 25000, 'O template detalhado não pode regredir para uma arte simplificada.');

const fieldOnly = poster.renderProfessionalMetaFormationSvg(project, 'field-only');
assert.equal((fieldOnly.match(/data-slot=/g) || []).length, 11);
assert.ok(fieldOnly.includes('GERADO AUTOMATICAMENTE PELO APP'));

const ui = read('src/modules/tactical-studio/MetaFormationStudioV3832.tsx');
assert.ok(ui.includes('renderProfessionalMetaFormationSvg'));
assert.ok(ui.includes('professionalMetaFormationOutputSize'));
assert.ok(ui.includes('v38.33'));
assert.ok(ui.includes('sem IA paga'));

const css = read('src/app/globals.css');
assert.ok(css.includes('aspect-ratio:9/16'));
const sw = read('public/sw.js');
assert.ok(sw.includes('buildmaster-v38-33-professional-template-1'));
const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.version, '38.33.0');
assert.ok(String(pkg.scripts?.['test:all']).includes('npm run test:v3833'));
assert.equal(read('capacitor.config.ts').includes("appId: 'com.buildmaster.elitetatico'"), true);
assert.equal(tactical.META_FORMATION_STORAGE_KEY, 'buildmaster_meta_formation_projects_v3832', 'A chave anterior deve ser preservada para não perder projetos salvos.');

console.log('v38.33 Gerador Tático Profissional aprovado: template determinístico, 11 jogadores, setas controladas, painéis completos, PNG/PDF e compatibilidade sem IA paga.');
