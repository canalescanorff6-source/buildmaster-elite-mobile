import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pluginPath = path.join(root, 'android/app/src/main/java/com/buildmaster/elitetatico/BuildMasterSecurityPlugin.java');
if (!fs.existsSync(pluginPath)) throw new Error('R520: BuildMasterSecurityPlugin.java ainda não foi gerado.');
let source = fs.readFileSync(pluginPath, 'utf8');

function replaceOnce(pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`R520: ponto de patch não encontrado (${label}).`);
  source = source.replace(pattern, replacement);
}

replaceOnce(
  /private static void verifyExpectedDownload\(File file, Long expectedSize, String expectedChecksum, String trace\) throws Exception \{/,
  'private void verifyExpectedDownload(File file, Long expectedSize, String expectedChecksum, String trace) throws Exception {',
  'verificador SHA-256 como método de instância'
);

replaceOnce(
  /MessageDigest digest = MessageDigest\.getInstance\("SHA-256"\);\s*try \(BufferedInputStream input = new BufferedInputStream\(new FileInputStream\(file\)\)\) \{\s*byte\[\] buffer = new byte\[64 \* 1024\];\s*int read;\s*while \(\(read = input\.read\(buffer\)\) != -1\) digest\.update\(buffer, 0, read\);\s*\}/,
  `MessageDigest digest = MessageDigest.getInstance("SHA-256");
        long verifiedBytes = 0;
        int lastVerifyPercent = -1;
        emitProgress("verifying-checksum", 0, 0, total);
        try (BufferedInputStream input = new BufferedInputStream(new FileInputStream(file))) {
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
                verifiedBytes += read;
                int verifyPercent = total > 0 ? (int) Math.min(100, (verifiedBytes * 100L) / total) : 0;
                if (verifyPercent == 100 || verifyPercent >= lastVerifyPercent + 2) {
                    lastVerifyPercent = verifyPercent;
                    emitProgress("verifying-checksum", verifyPercent, verifiedBytes, total);
                }
            }
        }`,
  'progresso incremental do SHA-256'
);

replaceOnce(
  /int percent = total > 0 \? \(int\) Math\.min\(99, \(downloaded \* 100L\) \/ total\) : 0;\s*emitProgress\("downloading-system", percent, downloaded, total\);/,
  `int percent = total > 0 ? (int) Math.min(99, (downloaded * 100L) / total) : 0;
                    if (status == DownloadManager.STATUS_PENDING) {
                        emitProgress("waiting-download", 0, downloaded, total);
                    } else if (status == DownloadManager.STATUS_PAUSED) {
                        emitProgress("download-paused", percent, downloaded, total);
                    } else {
                        emitProgress("downloading-system", percent, downloaded, total);
                    }`,
  'estado real do DownloadManager'
);

replaceOnce(
  /emitProgress\("verifying", 100, transportResult\.bytes, manifestSizeBytes == null \? transportResult\.bytes : manifestSizeBytes\);/,
  'emitProgress("finalizing-file", 100, transportResult.bytes, manifestSizeBytes == null ? transportResult.bytes : manifestSizeBytes);',
  'finalização do arquivo'
);

replaceOnce(
  /assertApkZipHeader\(apk\);\s*\n\s*PackageInfo current =/,
  `assertApkZipHeader(apk);
                emitProgress("verifying-package", 100, total, expectedTotal);

                PackageInfo current =`,
  'validação do pacote'
);

replaceOnce(
  /if \(manifestVersionName != null && !manifestVersionName\.equals\(downloadedName\)\) throw new SecurityException\("A versão do APK não confere com o manifesto\."\);\s*\n\s*if \(!signaturesCompatible/,
  `if (manifestVersionName != null && !manifestVersionName.equals(downloadedName)) throw new SecurityException("A versão do APK não confere com o manifesto.");
                emitProgress("verifying-signature", 100, total, expectedTotal);
                if (!signaturesCompatible`,
  'validação da assinatura'
);

fs.writeFileSync(pluginPath, source, 'utf8');
console.log('R520 aplicado: fila do Android, cópia, SHA-256, pacote e assinatura agora publicam progresso explícito.');