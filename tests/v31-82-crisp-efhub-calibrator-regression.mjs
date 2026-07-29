import assert from 'node:assert/strict';
import fs from 'node:fs';

const component = fs.readFileSync('src/components/EfhubVisualCalibrator.tsx', 'utf8');
const cropPanel = fs.readFileSync('src/components/SmartCardCropPanel.tsx', 'utf8');
const css = fs.readFileSync('src/app/globals.css', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const manifest = JSON.parse(fs.readFileSync('public/manifest.webmanifest', 'utf8'));

assert.equal(pkg.version, '31.82.0');
assert.equal(manifest.name, 'BuildMaster Elite Tático v31.82');
assert.match(component, /const \[zoom, setZoom\] = useState\(100\)/);
assert.match(component, /clamp\(current \+ delta, 100, 500\)/);
assert.match(component, /Tamanho real/);
assert.match(component, /Ajustar à tela/);
assert.match(component, /naturalWidth/);
assert.doesNotMatch(component, /import\s*\{[^}]*\bZoomOut\b[^}]*\}\s*from\s*['"]lucide-react['"]/s);
assert.doesNotMatch(cropPanel, /import\s*\{[^}]*\bZoomOut\b[^}]*\}\s*from\s*['"]lucide-react['"]/s);
assert.match(component, /function ZoomOutIcon/);
assert.match(cropPanel, /function ZoomOutIcon/);
assert.match(component, /efhub-calibration-viewport/);
assert.match(css, /\.efhub-calibration-canvas>img\{[^}]*opacity:1!important;[^}]*filter:none!important;/);
assert.match(css, /\.efhub-calibration-overlay\{[^}]*background:transparent!important;[^}]*backdrop-filter:none!important;/);
assert.match(css, /\.efhub-draggable-zone\{[^}]*background:transparent!important;[^}]*backdrop-filter:none!important;/);
assert.match(css, /\.efhub-calibration-viewport\{[^}]*overflow:auto;/);
assert.doesNotMatch(css, /\.efhub-calibration-canvas>img\{[^}]*blur\(/);

console.log('v31.82: calibrador eFHUB sem blur, com zoom até 500% e quadrados transparentes aprovado.');
