import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const bridge = read('src/modules/matches/matchRecorderBridge.ts');
const ui = read('src/modules/matches/MatchTrainerCenter.tsx');

assert.equal(pkg.version, '31.77.0');
assert.match(bridge, /saveMatchRecordingToGallery/);
assert.match(bridge, /shareMatchRecording/);
assert.match(bridge, /exportRecording\(options: \{ id: string \}\)/);
assert.match(bridge, /shareRecording\(options: \{ id: string \}\)/);
assert.match(ui, /Salvar vídeo/);
assert.match(ui, /Compartilhar vídeo/);
assert.match(ui, /autoSaveRecording/);
assert.match(ui, /Vídeo salvo na Galeria/);
assert.match(ui, /A cópia salva na Galeria foi preservada/);

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-v3176-export-'));
const javaDir = path.join(temp, 'android/app/src/main/java/com/buildmaster/elitetatico');
fs.mkdirSync(javaDir, { recursive: true });
fs.mkdirSync(path.join(temp, 'android/app/src/main'), { recursive: true });
fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), 'package com.buildmaster.elitetatico;\nimport android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity { @Override public void onCreate(Bundle savedInstanceState) { super.onCreate(savedInstanceState); } }\n');
fs.writeFileSync(path.join(temp, 'android/app/src/main/AndroidManifest.xml'), '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application><activity android:name=".MainActivity" /></application></manifest>');
execFileSync(process.execPath, [path.join(root, 'scripts/install-match-recorder-plugin.mjs')], { cwd: temp, stdio: 'pipe' });

const plugin = fs.readFileSync(path.join(javaDir, 'BuildMasterMatchRecorderPlugin.java'), 'utf8');
const service = fs.readFileSync(path.join(javaDir, 'BuildMasterScreenRecordService.java'), 'utf8');

assert.match(plugin, /new Thread\(\(\) ->/);
assert.match(plugin, /Intent\.ACTION_SEND/);
assert.match(plugin, /ClipData\.newRawUri/);
assert.match(plugin, /FLAG_GRANT_READ_URI_PERMISSION/);
assert.doesNotMatch(plugin, /file:\/\//);
assert.match(service, /MediaStore\.Video\.Media\.DISPLAY_NAME/);
assert.match(service, /MediaStore\.Video\.Media\.RELATIVE_PATH/);
assert.match(service, /MediaStore\.Video\.Media\.IS_PENDING/);
assert.match(service, /VOLUME_EXTERNAL_PRIMARY/);
assert.match(service, /Movies|DIRECTORY_MOVIES/);
assert.match(service, /BuildMaster\/Partidas/);
assert.match(service, /contentUriReadable/);
assert.match(service, /publicFileName/);
assert.match(service, /exportedAt/);
assert.match(service, /resolver\.delete\(destination/);

fs.rmSync(temp, { recursive: true, force: true });
console.log('v31.76 preservada na v31.77: Galeria e compartilhamento seguro aprovados.');
