import assert from 'node:assert/strict';
import fs from 'node:fs';
import { adjustCardCropBox, cardCropAspect, clampCardCropBox, fitPortraitCardInsideZone } from '../src/modules/card-reader/cardArtCrop';

const detailedZone = { x: 0.055, y: 0.072, w: 0.18, h: 0.205 };
const fitted = fitPortraitCardInsideZone(detailedZone, 1400, 1600);
assert.ok(fitted.w < detailedZone.w);
assert.equal(Number(cardCropAspect(fitted, 1400, 1600).toFixed(2)), 0.70);
assert.ok(fitted.x >= 0 && fitted.y >= 0 && fitted.x + fitted.w <= 1 && fitted.y + fitted.h <= 1);

const left = adjustCardCropBox(fitted, 'left');
const right = adjustCardCropBox(fitted, 'right');
const closer = adjustCardCropBox(fitted, 'zoom-in');
const farther = adjustCardCropBox(fitted, 'zoom-out');
assert.ok(left.x <= fitted.x);
assert.ok(right.x >= fitted.x);
assert.ok(closer.w < fitted.w && closer.h < fitted.h);
assert.ok(farther.w > fitted.w && farther.h > fitted.h);
assert.deepEqual(clampCardCropBox({ x: -1, y: 2, w: 4, h: 0.01 }), { x: 0, y: 0.96, w: 1, h: 0.04 });

const app = fs.readFileSync('src/components/CardVisionApp.tsx', 'utf8');
assert.match(app, /createSmartCardPreview/);
const cropPanel = fs.readFileSync('src/components/SmartCardCropPanel.tsx', 'utf8');
assert.match(cropPanel, /Somente a carta aparecerá na ficha/);
assert.match(cropPanel, /Ajustar recorte/);
assert.match(cropPanel, /Redetectar/);
const result = fs.readFileSync('src/components/result/ResultWorkspace.tsx', 'utf8');
assert.match(result, /Carta recortada de/);
assert.match(result, /playerImage \? 'has-card-image'/);
assert.match(result, /!playerImage && <div className="result-player-rating"/);
const css = fs.readFileSync('src/app/globals.css', 'utf8');
assert.match(css, /BuildMaster v30\.40 — recorte inteligente/);
assert.match(css, /result-player-art\.has-card-image/);
assert.match(css, /object-fit: contain !important/);
assert.match(css, /grid-template-columns: 108px minmax\(0, 1fr\)/);

console.log('v30.40 recorte inteligente e carta compacta aprovados.');
