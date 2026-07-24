const fs = require('fs');
const path = require('path');
const Module = require('module');
let ts;
try { ts = require('typescript'); }
catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const root = path.resolve(__dirname, '..');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
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
module.exports = { root };
