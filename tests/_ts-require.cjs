const fs = require('fs');
const path = require('path');
const Module = require('module');
let ts;
try { ts = require('typescript'); }
catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === '@capacitor/core') {
    try { return originalResolve.call(this, request, parent, isMain, options); }
    catch { return path.join(root, 'tests', 'capacitor-core.stub.cjs'); }
  }
  if (request.startsWith('@/')) request = path.join(root, 'src', request.slice(2));
  return originalResolve.call(this, request, parent, isMain, options);
};
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = function(module, filename) {
    const source = fs.readFileSync(filename, 'utf8');
    const result = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true
      }
    });
    module._compile(result.outputText, filename);
  };
}

// R184: motores históricos v38.50-v38.90 ficam fora de src/runtime e são carregados
// somente quando uma regressão Node executa a cadeia legada completa.
if (!global.__BUILDMASTER_LEGACY_PERFORMANCE_DIAGNOSTICS_R184__) {
  let cachedLegacyDiagnosticsR184;
  global.__BUILDMASTER_LEGACY_PERFORMANCE_DIAGNOSTICS_R184__ = function(input) {
    if (!cachedLegacyDiagnosticsR184) {
      cachedLegacyDiagnosticsR184 = require(path.join(root, 'legacy-src', 'lib', 'legacyPerformanceDiagnosticsR184.ts')).applyLegacyPerformanceDiagnosticsR184;
    }
    return cachedLegacyDiagnosticsR184(input);
  };
}

module.exports = { root };
