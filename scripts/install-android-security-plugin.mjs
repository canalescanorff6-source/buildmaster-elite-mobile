import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const javaDir = path.join(root, 'android/app/src/main/java/com/buildmaster/elitetatico');
const resXmlDir = path.join(root, 'android/app/src/main/res/xml');
const manifestPath = path.join(root, 'android/app/src/main/AndroidManifest.xml');
fs.mkdirSync(javaDir, { recursive: true });
fs.mkdirSync(resXmlDir, { recursive: true });

const mainActivity = `package com.buildmaster.elitetatico;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BuildMasterSecurityPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`;

const plugin = `package com.buildmaster.elitetatico;

import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SignatureException;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "BuildMasterSecurity")
public class BuildMasterSecurityPlugin extends Plugin {
    private static final String PREFS = "buildmaster_secure_storage_v1";
    private static final String AES_ALIAS = "buildmaster_secure_storage_aes_v1";
    private static final String EC_ALIAS = "buildmaster_device_signing_ec_v1";
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";
    private static final String EXPECTED_PACKAGE = "com.buildmaster.elitetatico";
    private static final int MAX_APK_BYTES = 300 * 1024 * 1024;
    private static final int MAX_REDIRECTS = 6;

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private SecretKey getOrCreateAesKey() throws Exception {
        KeyStore store = KeyStore.getInstance(ANDROID_KEYSTORE);
        store.load(null);
        if (store.containsAlias(AES_ALIAS)) {
            return ((KeyStore.SecretKeyEntry) store.getEntry(AES_ALIAS, null)).getSecretKey();
        }
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE);
        generator.init(new KeyGenParameterSpec.Builder(
                AES_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build());
        return generator.generateKey();
    }

    private KeyPair getOrCreateDeviceKeyPair() throws Exception {
        KeyStore store = KeyStore.getInstance(ANDROID_KEYSTORE);
        store.load(null);
        if (store.containsAlias(EC_ALIAS)) {
            PrivateKey privateKey = (PrivateKey) store.getKey(EC_ALIAS, null);
            PublicKey publicKey = store.getCertificate(EC_ALIAS).getPublicKey();
            return new KeyPair(publicKey, privateKey);
        }
        KeyPairGenerator generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, ANDROID_KEYSTORE);
        generator.initialize(new KeyGenParameterSpec.Builder(
                EC_ALIAS,
                KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY)
                .setDigests(KeyProperties.DIGEST_SHA256)
                .setAlgorithmParameterSpec(new java.security.spec.ECGenParameterSpec("secp256r1"))
                .build());
        return generator.generateKeyPair();
    }

    private String encrypt(String value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateAesKey());
        byte[] iv = cipher.getIV();
        byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        output.write(iv.length);
        output.write(iv);
        output.write(encrypted);
        return Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP);
    }

    private String decrypt(String encoded) throws Exception {
        byte[] packed = Base64.decode(encoded, Base64.NO_WRAP);
        int ivLength = packed[0] & 0xff;
        if (ivLength < 12 || ivLength > 16 || packed.length <= ivLength + 1) throw new IllegalArgumentException("Registro seguro inválido.");
        byte[] iv = Arrays.copyOfRange(packed, 1, 1 + ivLength);
        byte[] encrypted = Arrays.copyOfRange(packed, 1 + ivLength, packed.length);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateAesKey(), new GCMParameterSpec(128, iv));
        return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    }

    private static String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte item : bytes) result.append(String.format("%02x", item));
        return result.toString();
    }

    private static long versionCode(PackageInfo info) {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? info.getLongVersionCode() : info.versionCode;
    }

    private boolean canInstallPackages() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getContext().getPackageManager().canRequestPackageInstalls();
    }

    private void emitProgress(String phase, int percent, long downloaded, long total) {
        JSObject event = new JSObject();
        event.put("phase", phase);
        event.put("percent", Math.max(0, Math.min(100, percent)));
        event.put("downloadedBytes", downloaded);
        event.put("totalBytes", total);
        notifyListeners("apkDownloadProgress", event, true);
    }

    @PluginMethod
    public void set(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null || value == null) { call.reject("Chave ou valor ausente."); return; }
        try {
            prefs().edit().putString(key, encrypt(value)).apply();
            call.resolve();
        } catch (Exception error) {
            call.reject("Não foi possível proteger o dado.", error);
        }
    }

    @PluginMethod
    public void get(PluginCall call) {
        String key = call.getString("key");
        if (key == null) { call.reject("Chave ausente."); return; }
        try {
            String encoded = prefs().getString(key, null);
            JSObject result = new JSObject();
            result.put("value", encoded == null ? null : decrypt(encoded));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Não foi possível ler o dado protegido.", error);
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (key != null) prefs().edit().remove(key).apply();
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) {
        prefs().edit().clear().apply();
        call.resolve();
    }

    @PluginMethod
    public void getDeviceIdentity(PluginCall call) {
        try {
            PublicKey publicKey = getOrCreateDeviceKeyPair().getPublic();
            byte[] encoded = publicKey.getEncoded();
            JSObject result = new JSObject();
            result.put("deviceId", "bm2-" + hex(MessageDigest.getInstance("SHA-256").digest(encoded)));
            result.put("publicKey", Base64.encodeToString(encoded, Base64.NO_WRAP));
            result.put("algorithm", "ECDSA_P256_SHA256");
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Não foi possível criar a identidade segura do aparelho.", error);
        }
    }

    @PluginMethod
    public void signDeviceMessage(PluginCall call) {
        String message = call.getString("message");
        if (message == null || message.length() > 2048) { call.reject("Mensagem de segurança inválida."); return; }
        try {
            java.security.Signature signer = java.security.Signature.getInstance("SHA256withECDSA");
            signer.initSign(getOrCreateDeviceKeyPair().getPrivate());
            signer.update(message.getBytes(StandardCharsets.UTF_8));
            JSObject result = new JSObject();
            result.put("signature", Base64.encodeToString(signer.sign(), Base64.NO_WRAP));
            result.put("algorithm", "ECDSA_P256_SHA256");
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Não foi possível assinar a validação do aparelho.", error);
        }
    }

    @PluginMethod
    public void getAppInstallInfo(PluginCall call) {
        try {
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            JSObject result = new JSObject();
            result.put("packageName", info.packageName);
            result.put("versionName", info.versionName == null ? "0.0.0" : info.versionName);
            result.put("versionCode", versionCode(info));
            result.put("canInstallPackages", canInstallPackages());
            result.put("platform", "android");
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Não foi possível identificar a versão instalada.", error);
        }
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
            } else {
                intent = new Intent(Settings.ACTION_SECURITY_SETTINGS);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception error) {
            call.reject("Não foi possível abrir a permissão de instalação.", error);
        }
    }

    private static void validateInitialApkUrl(URL url) throws Exception {
        if (!"https".equalsIgnoreCase(url.getProtocol())) throw new SecurityException("Atualização sem HTTPS bloqueada.");
        if (!"github.com".equalsIgnoreCase(url.getHost())) throw new SecurityException("Servidor de atualização não autorizado.");
        String prefix = "/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/";
        String path = url.getPath();
        if (!path.startsWith(prefix)) throw new SecurityException("Caminho de atualização não autorizado.");
        String file = path.substring(prefix.length());
        if (!(file.matches("(?i)^BuildMaster-Elite-Tatico-v\\\\d+\\\\.\\\\d+\\\\.\\\\d+-\\\\d+-[a-f0-9]{7,12}\\\\.apk$") || "BuildMaster-Elite-Tatico-latest.apk".equals(file))) {
            throw new SecurityException("Arquivo de atualização não autorizado.");
        }
    }

    private static void validateRedirectUrl(URL url) throws Exception {
        if (!"https".equalsIgnoreCase(url.getProtocol())) throw new SecurityException("Redirecionamento sem HTTPS bloqueado.");
        String host = url.getHost().toLowerCase();
        if (!(host.equals("github.com") || host.equals("release-assets.githubusercontent.com") || host.equals("objects.githubusercontent.com") || host.equals("github-releases.githubusercontent.com"))) {
            throw new SecurityException("Redirecionamento de atualização não autorizado.");
        }
    }

    private static HttpURLConnection openDownloadConnection(URL initial) throws Exception {
        URL current = initial;
        for (int redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
            if (redirect == 0) validateInitialApkUrl(current); else validateRedirectUrl(current);
            HttpURLConnection connection = (HttpURLConnection) current.openConnection();
            connection.setConnectTimeout(30_000);
            connection.setReadTimeout(120_000);
            connection.setInstanceFollowRedirects(false);
            connection.setRequestProperty("Accept", "application/vnd.android.package-archive,application/octet-stream;q=0.9,*/*;q=0.8");
            connection.setRequestProperty("Cache-Control", "no-cache");
            connection.setRequestProperty("Pragma", "no-cache");
            connection.setRequestProperty("User-Agent", "BuildMaster-Elite-Tatico-Updater/27.0 Android");
            int status = connection.getResponseCode();
            if (status >= 300 && status < 400) {
                String location = connection.getHeaderField("Location");
                connection.disconnect();
                if (location == null || location.trim().isEmpty()) throw new IllegalStateException("Redirecionamento de download sem destino.");
                current = new URL(current, location);
                continue;
            }
            if (status < 200 || status >= 300) {
                connection.disconnect();
                throw new IllegalStateException("Download retornou HTTP " + status);
            }
            return connection;
        }
        throw new IllegalStateException("O download excedeu o limite de redirecionamentos.");
    }

    private static Signature[] archiveSignatures(PackageInfo info) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && info.signingInfo != null) {
            return info.signingInfo.hasMultipleSigners() ? info.signingInfo.getApkContentsSigners() : info.signingInfo.getSigningCertificateHistory();
        }
        return info.signatures == null ? new Signature[0] : info.signatures;
    }

    private static boolean signaturesCompatible(PackageManager manager, String installedPackage, PackageInfo archive) throws Exception {
        Signature[] downloaded = archiveSignatures(archive);
        if (downloaded.length == 0) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            for (Signature signature : downloaded) {
                byte[] digest = MessageDigest.getInstance("SHA-256").digest(signature.toByteArray());
                if (!manager.hasSigningCertificate(installedPackage, digest, PackageManager.CERT_INPUT_SHA256)) return false;
            }
            return true;
        }
        PackageInfo installed = manager.getPackageInfo(installedPackage, PackageManager.GET_SIGNATURES);
        List<String> installedDigests = new ArrayList<>();
        for (Signature signature : archiveSignatures(installed)) installedDigests.add(hex(MessageDigest.getInstance("SHA-256").digest(signature.toByteArray())));
        List<String> downloadedDigests = new ArrayList<>();
        for (Signature signature : downloaded) downloadedDigests.add(hex(MessageDigest.getInstance("SHA-256").digest(signature.toByteArray())));
        Collections.sort(installedDigests);
        Collections.sort(downloadedDigests);
        return installedDigests.equals(downloadedDigests);
    }

    private PackageInfo inspectDownloadedApk(File apk) throws Exception {
        PackageManager manager = getContext().getPackageManager();
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        PackageInfo archive = manager.getPackageArchiveInfo(apk.getAbsolutePath(), flags);
        if (archive == null) throw new SecurityException("O arquivo baixado não é um APK Android válido.");
        return archive;
    }

    private void launchInstaller(File apk) throws Exception {
        Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.setClipData(ClipData.newRawUri("BuildMaster update", uri));
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        if (intent.resolveActivity(getContext().getPackageManager()) == null) throw new IllegalStateException("O instalador de pacotes do Android não está disponível.");
        getContext().startActivity(intent);
    }

    @PluginMethod
    public void downloadAndInstallApk(PluginCall call) {
        String urlValue = call.getString("url");
        String expectedChecksum = call.getString("checksum");
        String expectedPackage = call.getString("expectedPackageName", EXPECTED_PACKAGE);
        String expectedVersionName = call.getString("expectedVersionName");
        Long expectedVersionCode = call.getLong("expectedVersionCode");
        Long expectedSize = call.getLong("expectedSizeBytes");

        if (urlValue == null || expectedChecksum == null || !expectedChecksum.matches("(?i)^[a-f0-9]{64}$") || expectedVersionCode == null || expectedVersionCode <= 0) {
            call.reject("URL, versão ou SHA-256 inválido.");
            return;
        }
        if (!EXPECTED_PACKAGE.equals(expectedPackage)) {
            call.reject("Pacote de atualização não autorizado.");
            return;
        }
        if (!canInstallPackages()) {
            JSObject result = new JSObject();
            result.put("verified", false);
            result.put("needsPermission", true);
            call.resolve(result);
            return;
        }

        call.setKeepAlive(true);
        new Thread(() -> {
            File partial = null;
            File apk = null;
            try {
                emitProgress("connecting", 0, 0, expectedSize == null ? 0 : expectedSize);
                URL initial = new URL(urlValue);
                HttpURLConnection connection = openDownloadConnection(initial);
                long contentLength = connection.getContentLength();
                long expectedTotal = expectedSize != null && expectedSize > 0 ? expectedSize : contentLength;
                if (contentLength > MAX_APK_BYTES || expectedTotal > MAX_APK_BYTES) throw new SecurityException("APK maior que o limite permitido.");

                File updatesDir = new File(getContext().getCacheDir(), "verified_updates");
                if (!updatesDir.exists() && !updatesDir.mkdirs()) throw new IllegalStateException("Não foi possível preparar a pasta de atualização.");
                partial = new File(updatesDir, "BuildMaster-update.part");
                apk = new File(updatesDir, "BuildMaster-Elite-Tatico-verificado.apk");
                if (partial.exists()) partial.delete();
                if (apk.exists()) apk.delete();

                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                long total = 0;
                int lastPercent = -1;
                try (BufferedInputStream input = new BufferedInputStream(connection.getInputStream());
                     FileOutputStream fileOutput = new FileOutputStream(partial);
                     BufferedOutputStream output = new BufferedOutputStream(fileOutput)) {
                    byte[] buffer = new byte[32 * 1024];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        total += read;
                        if (total > MAX_APK_BYTES) throw new SecurityException("APK maior que o limite permitido.");
                        digest.update(buffer, 0, read);
                        output.write(buffer, 0, read);
                        int percent = expectedTotal > 0 ? (int) Math.min(99, (total * 100L) / expectedTotal) : 0;
                        if (percent != lastPercent && (percent == 0 || percent >= lastPercent + 2)) {
                            lastPercent = percent;
                            emitProgress("downloading", percent, total, expectedTotal);
                        }
                    }
                    output.flush();
                    fileOutput.getFD().sync();
                } finally {
                    connection.disconnect();
                }

                if (expectedSize != null && expectedSize > 0 && total != expectedSize) {
                    throw new SecurityException("Tamanho do APK não confere com o manifesto.");
                }
                emitProgress("verifying", 99, total, expectedTotal);
                String actualChecksum = hex(digest.digest());
                if (!actualChecksum.equalsIgnoreCase(expectedChecksum)) throw new SecurityException("SHA-256 do APK não confere. Instalação bloqueada.");
                if (!partial.renameTo(apk)) throw new IllegalStateException("Não foi possível concluir o arquivo de atualização.");

                PackageInfo current = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
                PackageInfo archive = inspectDownloadedApk(apk);
                if (!EXPECTED_PACKAGE.equals(archive.packageName)) throw new SecurityException("O APK pertence a outro aplicativo.");
                long downloadedCode = versionCode(archive);
                long currentCode = versionCode(current);
                if (downloadedCode != expectedVersionCode) throw new SecurityException("O versionCode do APK não confere com o manifesto.");
                if (downloadedCode <= currentCode) throw new SecurityException("A atualização não é mais nova que o aplicativo instalado.");
                String downloadedName = archive.versionName == null ? "" : archive.versionName;
                if (expectedVersionName != null && !expectedVersionName.equals(downloadedName)) throw new SecurityException("A versão do APK não confere com o manifesto.");
                if (!signaturesCompatible(getContext().getPackageManager(), getContext().getPackageName(), archive)) {
                    throw new SignatureException("A assinatura do APK é diferente da versão instalada. Faça uma instalação manual única da versão oficial.");
                }

                emitProgress("ready", 100, total, expectedTotal);
                launchInstaller(apk);
                JSObject result = new JSObject();
                result.put("verified", true);
                result.put("checksum", actualChecksum);
                result.put("needsPermission", false);
                result.put("versionCode", downloadedCode);
                result.put("versionName", downloadedName);
                call.resolve(result);
            } catch (Exception error) {
                if (partial != null) partial.delete();
                if (apk != null && !(error instanceof SignatureException)) apk.delete();
                call.reject("Atualização bloqueada: " + (error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage()), error);
            } finally {
                call.setKeepAlive(false);
            }
        }).start();
    }
}
`;

fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), mainActivity);
fs.writeFileSync(path.join(javaDir, 'BuildMasterSecurityPlugin.java'), plugin);
fs.writeFileSync(path.join(resXmlDir, 'buildmaster_file_paths.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<paths xmlns:android="http://schemas.android.com/apk/res/android">\n  <cache-path name="verified_updates" path="verified_updates/" />\n</paths>\n`);

let manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('android.permission.REQUEST_INSTALL_PACKAGES')) {
  manifest = manifest.replace('<application', '    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />\n\n    <application');
}
if (!manifest.includes('application/vnd.android.package-archive')) {
  const query = `    <queries>\n        <intent>\n            <action android:name="android.intent.action.VIEW" />\n            <data android:mimeType="application/vnd.android.package-archive" />\n        </intent>\n    </queries>\n\n`;
  manifest = manifest.replace('<application', query + '    <application');
}
if (!manifest.includes('.fileprovider')) {
  manifest = manifest.replace('</application>', `        <provider\n            android:name="androidx.core.content.FileProvider"\n            android:authorities="\${applicationId}.fileprovider"\n            android:exported="false"\n            android:grantUriPermissions="true">\n            <meta-data\n                android:name="android.support.FILE_PROVIDER_PATHS"\n                android:resource="@xml/buildmaster_file_paths" />\n        </provider>\n    </application>`);
}
manifest = manifest.replace(/android:resource="@xml\/file_paths"/g, 'android:resource="@xml/buildmaster_file_paths"');
manifest = manifest.replace(/android:allowBackup="true"/g, 'android:allowBackup="false"');
manifest = manifest.replace(/android:usesCleartextTraffic="true"/g, 'android:usesCleartextTraffic="false"');
if (!manifest.includes('android:usesCleartextTraffic=')) {
  manifest = manifest.replace('<application', '<application\n        android:usesCleartextTraffic="false"');
}
fs.writeFileSync(manifestPath, manifest);
console.log('Plugin Android instalado: Keystore, diagnóstico da versão, permissão guiada, download com progresso, SHA-256, package/versionCode e assinatura verificados.');
