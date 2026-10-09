import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {build} from 'esbuild';
import {chromium} from 'playwright';
const image='data:image/png;base64,'+fs.readFileSync('tests/fixtures/reader/cristiano-efhub-from-review.png').toString('base64');
const bundle=await build({stdin:{contents:`
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {EfhubVisualCalibrator} from './src/components/EfhubVisualCalibrator';
import {createDefaultEfhubCalibrationZones} from './src/modules/card-reader/efhubManualCalibration';
import {mapLegacyCalibrationToReaderV2} from './src/modules/card-reader-v2/readerV2ZoneProfile';
function Harness(){const [zones,setZones]=useState(createDefaultEfhubCalibrationZones());window.currentZones=zones;window.sourceZones=mapLegacyCalibrationToReaderV2(zones);return <EfhubVisualCalibrator imageSrc={window.fixtureImage} zones={zones} saved={false} onChange={setZones} onSave={()=>true} onReset={()=>setZones(createDefaultEfhubCalibrationZones())} onRead={()=>{}}/>;}
createRoot(document.getElementById('root')).render(<Harness/>);
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
const server=http.createServer((_req,res)=>{res.setHeader('Content-Type','text/html');res.end(`<html><head><style>
.efhub-calibration-viewport{width:400px;overflow:auto;height:600px}.efhub-calibration-canvas{position:relative}.efhub-calibration-canvas>img{width:100%;height:auto;display:block}.efhub-calibration-zones-layer{position:absolute;inset:0}.efhub-draggable-zone{position:absolute}.resize-handle{display:none}
</style></head><body><div id="root"></div><script>window.fixtureImage=${JSON.stringify(image)};</script><script>${bundle.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></body></html>`);});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
 for(const zoom of [100,200,500]){
  const page=await browser.newPage({viewport:{width:1200,height:1400}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator('.efhub-calibration-canvas img').waitFor();
  await page.waitForFunction(()=>window.currentZones?.length&&document.querySelector('img')?.naturalWidth);
  const before=await page.evaluate(()=>window.sourceZones);
  await page.getByRole('button',{name:`${zoom}%`,exact:true}).click();
  await page.waitForFunction(z=>document.querySelector('.efhub-calibration-canvas').getBoundingClientRect().width===4*z,zoom);
  assert.deepEqual(await page.evaluate(()=>window.sourceZones),before,'Zoom de exibição não pode alterar os quadrados na imagem original.');
  await page.locator('.efhub-calibration-viewport').evaluate(el=>{el.scrollLeft=0;el.scrollTop=0});
  const canvas=await page.locator('.efhub-calibration-canvas').boundingBox();
  const zone=await page.locator('.efhub-draggable-zone').first().boundingBox();
  await page.mouse.move(zone.x+zone.width*.5,zone.y+zone.height*.5);await page.mouse.down();
  await page.mouse.move(zone.x+zone.width*.5+canvas.width*.02,zone.y+zone.height*.5+canvas.height*.02);await page.mouse.up();
  const after=await page.evaluate(()=>window.sourceZones);
  assert.ok(Math.abs(after[0].x-before[0].x-.02)<.0001);assert.ok(Math.abs(after[0].y-before[0].y-.02)<.0001);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Quadrados:100%,200% e500% preservam coordenadas da fonte e deslocamento proporcional.');
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
