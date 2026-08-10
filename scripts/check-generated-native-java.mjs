import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-native-java-'));

function fail(message) {
  throw new Error(message);
}

function scanJavaStringEscapes(source, fileName) {
  const allowed = new Set(['b', 't', 'n', 'f', 'r', 's', '"', "'", '\\']);
  const issues = [];
  let line = 1;
  let state = 'code';

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (char === '\n') line += 1;

    if (state === 'line-comment') {
      if (char === '\n') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        state = 'code';
        index += 1;
      }
      continue;
    }
    if (state === 'code') {
      if (char === '/' && next === '/') {
        state = 'line-comment';
        index += 1;
        continue;
      }
      if (char === '/' && next === '*') {
        state = 'block-comment';
        index += 1;
        continue;
      }
      if (char === '"') {
        state = 'string';
        continue;
      }
      if (char === "'") {
        state = 'char';
        continue;
      }
      continue;
    }

    if (state === 'string' || state === 'char') {
      const closing = state === 'string' ? '"' : "'";
      if (char === closing) {
        state = 'code';
        continue;
      }
      if (char !== '\\') continue;
      if (next == null) {
        issues.push(`${fileName}:${line}: barra invertida no fim do arquivo`);
        continue;
      }
      if (allowed.has(next)) {
        index += 1;
        continue;
      }
      if (next === 'u') {
        let cursor = index + 2;
        while (source[cursor] === 'u') cursor += 1;
        const code = source.slice(cursor, cursor + 4);
        if (!/^[0-9a-fA-F]{4}$/.test(code)) issues.push(`${fileName}:${line}: escape Unicode inválido`);
        index = cursor + 3;
        continue;
      }
      if (/[0-7]/.test(next)) {
        index += 1;
        let count = 1;
        while (count < 3 && /[0-7]/.test(source[index + 1] ?? '')) {
          index += 1;
          count += 1;
        }
        continue;
      }
      issues.push(`${fileName}:${line}: escape Java ilegal \\${next}`);
      index += 1;
    }
  }

  if (state === 'string' || state === 'char') issues.push(`${fileName}:${line}: literal não encerrado`);
  return issues;
}

try {
  const javaDir = path.join(temp, 'android/app/src/main/java/com/buildmaster/elitetatico');
  const manifestDir = path.join(temp, 'android/app/src/main');
  fs.mkdirSync(javaDir, { recursive: true });
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(
    path.join(javaDir, 'MainActivity.java'),
    'package com.buildmaster.elitetatico;\nimport android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity { @Override public void onCreate(Bundle savedInstanceState) { super.onCreate(savedInstanceState); } }\n',
  );
  fs.writeFileSync(
    path.join(manifestDir, 'AndroidManifest.xml'),
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application><activity android:name=".MainActivity" /></application></manifest>',
  );

  execFileSync(process.execPath, [path.join(root, 'scripts/install-android-security-plugin.mjs')], {
    cwd: temp,
    stdio: 'pipe',
  });

  execFileSync(process.execPath, [path.join(root, 'scripts/install-match-recorder-plugin.mjs')], {
    cwd: temp,
    stdio: 'pipe',
  });

  const generated = [
    'BuildMasterSecurityPlugin.java',
    'BuildMasterMatchRecorderPlugin.java',
    'BuildMasterScreenRecordService.java',
  ];
  const issues = [];
  for (const fileName of generated) {
    const filePath = path.join(javaDir, fileName);
    if (!fs.existsSync(filePath)) fail(`Arquivo Java nativo não foi gerado: ${fileName}`);
    const source = fs.readFileSync(filePath, 'utf8');
    issues.push(...scanJavaStringEscapes(source, fileName));
  }

  const security = fs.readFileSync(path.join(javaDir, 'BuildMasterSecurityPlugin.java'), 'utf8');
  if (!security.includes('host.matches("^[a-z0-9-]+\\\\.supabase\\\\.co$")')) {
    fail('Filtro de host do Supabase não foi escapado corretamente no Java gerado.');
  }

  const service = fs.readFileSync(path.join(javaDir, 'BuildMasterScreenRecordService.java'), 'utf8');
  if (!service.includes('replaceFirst("\\\\.mp4$", "")')) fail('replaceFirst da extensão MP4 não foi escapado corretamente no Java gerado.');
  if (!service.includes('name.matches("match-[0-9]{10,20}\\\\.mp4")')) fail('Filtro de gravações MP4 não foi escapado corretamente no Java gerado.');
  if (issues.length) fail(`Java nativo gerado contém escapes ilegais:\n${issues.map((item) => `- ${item}`).join('\n')}`);

  console.log('Java nativo gerado validado: nenhum escape ilegal e regex de segurança/MP4 correta.');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
