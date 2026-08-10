import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-native-java-'));
const androidRoot = path.join(temp, 'android');
const javaDir = path.join(androidRoot, 'app/src/main/java/com/buildmaster/elitetatico');
const manifestDir = path.join(androidRoot, 'app/src/main');
const valuesDir = path.join(androidRoot, 'app/src/main/res/values');
const manifestPath = path.join(manifestDir, 'AndroidManifest.xml');
const mainPath = path.join(javaDir, 'MainActivity.java');
const gradlePath = path.join(androidRoot, 'app/build.gradle');

function fail(message) {
  throw new Error(message);
}

function runInstaller(fileName) {
  execFileSync(process.execPath, [path.join(root, 'scripts', fileName)], {
    cwd: temp,
    stdio: 'pipe',
  });
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

function countOccurrences(source, needle) {
  if (!needle) return 0;
  return source.split(needle).length - 1;
}

function listFilesRecursive(directory, suffix) {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...listFilesRecursive(absolute, suffix));
    else if (entry.isFile() && absolute.endsWith(suffix)) output.push(absolute);
  }
  return output;
}

try {
  fs.mkdirSync(javaDir, { recursive: true });
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.mkdirSync(valuesDir, { recursive: true });
  fs.mkdirSync(path.dirname(gradlePath), { recursive: true });

  fs.writeFileSync(
    mainPath,
    'package com.buildmaster.elitetatico;\nimport android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity { @Override public void onCreate(Bundle savedInstanceState) { super.onCreate(savedInstanceState); } }\n',
  );
  fs.writeFileSync(
    manifestPath,
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="android.permission.INTERNET"/><application android:theme="@style/AppTheme"><activity android:name=".MainActivity" /></application></manifest>',
  );
  fs.writeFileSync(
    path.join(valuesDir, 'styles.xml'),
    '<resources><style name="AppTheme" parent="android:style/Theme.Material.Light.NoActionBar"></style></resources>',
  );
  fs.writeFileSync(
    gradlePath,
    `plugins { id 'com.android.application' }\nandroid {\n    namespace 'com.buildmaster.elitetatico'\n    compileSdk 36\n    defaultConfig {\n        applicationId 'com.buildmaster.elitetatico'\n        minSdk 23\n        targetSdk 36\n        versionCode 1\n        versionName '1.0'\n    }\n}\ndependencies {\n    implementation project(':capacitor-android')\n}\n`,
  );

  const brandingSource = path.join(root, 'resources/android-branding');
  const brandingTarget = path.join(temp, 'resources/android-branding');
  if (!fs.existsSync(brandingSource)) fail('Recursos de identidade Android ausentes.');
  fs.cpSync(brandingSource, brandingTarget, { recursive: true });

  // Ordem idêntica ao APK direto: todos os plugins nativos usados em produção precisam
  // ser realmente gerados e registrados antes do Gradle chegar à compilação.
  const directInstallers = [
    'install-android-security-plugin.mjs',
    'install-match-recorder-plugin.mjs',
    'install-background-ocr-plugin.mjs',
    'install-native-vault-storage-plugin.mjs',
    'install-android-branding.mjs',
  ];
  for (const installer of directInstallers) runInstaller(installer);
  // A execução repetida não pode duplicar permissões, serviços ou registros. Isso
  // protege reruns do workflow e builds locais reaproveitados.
  for (const installer of directInstallers) runInstaller(installer);

  const directMain = fs.readFileSync(mainPath, 'utf8');
  const directManifest = fs.readFileSync(manifestPath, 'utf8');
  for (const pluginName of [
    'BuildMasterSecurityPlugin',
    'BuildMasterMatchRecorderPlugin',
    'BuildMasterBackgroundOcrPlugin',
    'BuildMasterVaultStoragePlugin',
  ]) {
    const registration = `registerPlugin(${pluginName}.class);`;
    if (!directMain.includes(registration)) fail(`Plugin nativo não registrado no MainActivity: ${pluginName}`);
    if (countOccurrences(directMain, registration) !== 1) fail(`Registro nativo duplicado após reinstalação: ${pluginName}`);
  }
  for (const permission of [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION',
    'android.permission.FOREGROUND_SERVICE_DATA_SYNC',
    'android.permission.POST_NOTIFICATIONS',
  ]) {
    if (!directManifest.includes(permission)) fail(`Permissão Android ausente após os instaladores diretos: ${permission}`);
    if (countOccurrences(directManifest, `android:name=\"${permission}\"`) !== 1) fail(`Permissão Android duplicada após reinstalação: ${permission}`);
  }
  if (!directManifest.includes('BuildMasterBackgroundOcrService')) fail('Serviço nativo de OCR em segundo plano não foi instalado.');
  if (countOccurrences(directManifest, 'BuildMasterBackgroundOcrService') !== 1) fail('Serviço nativo de OCR foi duplicado após reinstalação.');
  if (!directManifest.includes('android:foregroundServiceType="dataSync"')) fail('Serviço de OCR não declara foregroundServiceType=dataSync.');
  if (!directManifest.includes('BuildMasterScreenRecordService')) fail('Serviço nativo de gravação não foi instalado.');
  if (countOccurrences(directManifest, 'BuildMasterScreenRecordService') !== 1) fail('Serviço nativo de gravação foi duplicado após reinstalação.');
  if (!directManifest.includes('REQUEST_INSTALL_PACKAGES')) fail('APK direto perdeu a permissão controlada de atualização própria.');
  if (!directManifest.includes('androidx.core.content.FileProvider')) fail('APK direto perdeu o FileProvider seguro do atualizador.');

  // O build Play reaproveita os plugins comuns, acrescenta Play Integrity/In-App Update e
  // obrigatoriamente remove os componentes exclusivos da instalação direta de APK.
  runInstaller('install-play-store-bridge.mjs');
  const playMain = fs.readFileSync(mainPath, 'utf8');
  const playManifest = fs.readFileSync(manifestPath, 'utf8');
  const playGradle = fs.readFileSync(gradlePath, 'utf8');
  if (!playMain.includes('registerPlugin(BuildMasterPlayDeliveryPlugin.class);')) fail('Plugin Play Delivery não foi registrado.');
  if (playManifest.includes('REQUEST_INSTALL_PACKAGES')) fail('AAB Play manteve REQUEST_INSTALL_PACKAGES indevidamente.');
  if (playManifest.includes('androidx.core.content.FileProvider')) fail('AAB Play manteve FileProvider exclusivo do atualizador direto.');
  for (const dependency of [
    "implementation 'com.google.android.play:integrity:1.6.0'",
    "implementation 'com.google.android.play:app-update:2.1.0'",
  ]) {
    if (!playGradle.includes(dependency)) fail(`Dependência Play ausente no Gradle gerado: ${dependency}`);
  }
  if (playGradle.split(/\r?\n/).some((line) => line.includes("integrity:1.6.0") && line.includes('implementation project'))) fail('Inserção das dependências Play gerou instruções Gradle concatenadas.');

  const javaFiles = listFilesRecursive(javaDir, '.java');
  const issues = [];
  for (const filePath of javaFiles) {
    const source = fs.readFileSync(filePath, 'utf8');
    issues.push(...scanJavaStringEscapes(source, path.basename(filePath)));
  }

  const security = fs.readFileSync(path.join(javaDir, 'BuildMasterSecurityPlugin.java'), 'utf8');
  if (!security.includes('host.matches("^[a-z0-9-]+\\\\.supabase\\\\.co$")')) {
    fail('Filtro de host do Supabase não foi escapado corretamente no Java gerado.');
  }

  const service = fs.readFileSync(path.join(javaDir, 'BuildMasterScreenRecordService.java'), 'utf8');
  if (!service.includes('replaceFirst("\\\\.mp4$", "")')) fail('replaceFirst da extensão MP4 não foi escapado corretamente no Java gerado.');
  if (!service.includes('name.matches("match-[0-9]{10,20}\\\\.mp4")')) fail('Filtro de gravações MP4 não foi escapado corretamente no Java gerado.');
  if (issues.length) fail(`Java nativo gerado contém escapes ilegais:\n${issues.map((item) => `- ${item}`).join('\n')}`);

  console.log(`Java nativo completo validado: ${javaFiles.length} arquivos, plugins direto/Play, permissões, registros, Gradle e escapes aprovados.`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
