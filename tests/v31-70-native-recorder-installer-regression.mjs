import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-v3170-'));
const javaDir = path.join(temp, 'android/app/src/main/java/com/buildmaster/elitetatico');
fs.mkdirSync(javaDir, { recursive: true });
fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), `package com.buildmaster.elitetatico;\nimport android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity { @Override public void onCreate(Bundle savedInstanceState) { registerPlugin(BuildMasterSecurityPlugin.class); super.onCreate(savedInstanceState); } }\n`);
fs.mkdirSync(path.join(temp, 'android/app/src/main'), { recursive: true });
fs.writeFileSync(path.join(temp, 'android/app/src/main/AndroidManifest.xml'), `<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:theme="@style/AppTheme"><activity android:name=".MainActivity" /></application></manifest>`);

execFileSync(process.execPath, [path.join(root, 'scripts/install-match-recorder-plugin.mjs')], { cwd: temp, stdio: 'pipe' });

const plugin = fs.readFileSync(path.join(javaDir, 'BuildMasterMatchRecorderPlugin.java'), 'utf8');
const service = fs.readFileSync(path.join(javaDir, 'BuildMasterScreenRecordService.java'), 'utf8');
const main = fs.readFileSync(path.join(javaDir, 'MainActivity.java'), 'utf8');
const manifest = fs.readFileSync(path.join(temp, 'android/app/src/main/AndroidManifest.xml'), 'utf8');

assert.match(plugin, /@ActivityCallback/);
assert.match(plugin, /createScreenCaptureIntent/);
assert.match(plugin, /BuildMasterScreenRecordService\.ACTION_START/);
assert.match(service, /FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION/);
assert.match(service, /projection\.registerCallback/);
assert.match(service, /createVirtualDisplay/);
assert.match(service, /MediaRecorder\.VideoEncoder\.H264/);
assert.match(service, /BuildMasterMatches/);
assert.ok(service.includes('replaceFirst("\\\\.mp4$", "")'), 'O Java gerado deve escapar o ponto da extensão com duas barras.');
assert.ok(service.includes('name.matches("match-[0-9]{10,20}\\\\.mp4")'), 'O filtro de gravações deve gerar uma expressão Java válida.');
assert.ok(!service.includes('replaceFirst("\\.mp4$", "")'), 'O Java gerado não pode conter escape ilegal \\.');
assert.ok(!service.includes('name.matches("match-[0-9]{10,20}\\.mp4")'), 'O regex Java não pode conter escape ilegal \\.');
assert.match(main, /registerPlugin\(BuildMasterMatchRecorderPlugin\.class\)/);
assert.match(manifest, /android\.permission\.FOREGROUND_SERVICE_MEDIA_PROJECTION/);
assert.match(manifest, /android:foregroundServiceType="mediaProjection"/);
assert.match(manifest, /android:exported="false"/);

execFileSync(process.execPath, [path.join(root, 'scripts/install-match-recorder-plugin.mjs')], { cwd: temp, stdio: 'pipe' });
const mainAgain = fs.readFileSync(path.join(javaDir, 'MainActivity.java'), 'utf8');
const manifestAgain = fs.readFileSync(path.join(temp, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
assert.equal((mainAgain.match(/registerPlugin\(BuildMasterMatchRecorderPlugin\.class\)/g) || []).length, 1);
assert.equal((manifestAgain.match(/BuildMasterScreenRecordService/g) || []).length, 1);

fs.rmSync(temp, { recursive: true, force: true });
console.log('v31.70 instalador nativo MediaProjection idempotente aprovado.');
