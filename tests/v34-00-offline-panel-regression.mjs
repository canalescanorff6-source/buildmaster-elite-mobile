import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const auth = read('src/components/AuthGate.tsx');
const runtime = read('src/components/AppRuntimeStatus.tsx');
const premium = read('src/components/PremiumExperienceLayer.tsx');
const css = read('src/app/v34-studio.css');
const cache = read('src/components/RegisterServiceWorker.tsx');

// O estado de licença offline continua existindo no contexto, mas não gera
// painel lateral persistente nem ocupa a área útil do aplicativo.
assert.doesNotMatch(auth, /offline-license-banner/);
assert.doesNotMatch(auth, /offlineBannerExpanded/);
assert.match(auth, /offline: validation\.offline/);
assert.match(auth, /window\.addEventListener\('online', onOnline\)/);

// O monitor global continua registrando erros e armazenamento, sem duplicar
// outro painel persistente de rede.
assert.doesNotMatch(runtime, /window\.addEventListener\('offline'/);
assert.doesNotMatch(runtime, /runtime-offline/);
assert.doesNotMatch(runtime, /Modo offline/);
assert.match(runtime, /runtime-storage/);

// A mudança de rede gera apenas toast temporário e deduplicado.
assert.match(premium, /const onlineRef = useRef/);
assert.match(premium, /if \(onlineRef\.current === next\) return/);
assert.match(premium, /Conexão indisponível/);
assert.doesNotMatch(premium, /className="bm-offline-banner"/);

// Proteção para marcação antiga que possa permanecer no cache do WebView.
assert.match(css, /\.offline-license-banner,[\s\S]*\.bm-offline-banner,[\s\S]*\.app-runtime-status\.runtime-offline[\s\S]*display: none !important/);
assert.match(css, /\.bm-toast-viewport/);
assert.match(cache, /34\.00\.0-clean-responsive-4/);

console.log('v34.00 offline UI aprovado: sem painel lateral persistente, sem avisos duplicados e com toast temporário de conexão.');
