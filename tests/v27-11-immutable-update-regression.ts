import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/build-apk.yml', 'utf8');
const updates = fs.readFileSync('src/lib/appUpdates.ts', 'utf8');
const panel = fs.readFileSync('src/components/UpdateCenterPanel.tsx', 'utf8');

assert.match(workflow, /apkUrl': f'https:\/\/github\.com\/{repo}\/releases\/download\/buildmaster-latest\/{asset_name}\?build=/);
assert.doesNotMatch(workflow, /'apkUrl': f'.*BuildMaster-Elite-Tatico-latest\.apk/);
assert.match(workflow, /gh release upload buildmaster-latest "dist-apk\/\$APK_ASSET_NAME" --clobber/);
assert.match(workflow, /gh release upload buildmaster-latest dist-apk\/update-manifest\.json --clobber/);
assert.match(workflow, /\$APK_URL&verify=\$GITHUB_SHA/);
assert.match(updates, /BuildMaster-Elite-Tatico-v\\d\+\\.\\d\+\\.\\d\+-\\d\+-\[a-f0-9\]/i);
assert.match(panel, /buildmasterCache=\$\{Date\.now\(\)\}/);
console.log('✓ v27.11: manifesto aponta para APK versionado imutável; latest permanece apenas para download manual.');
