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

import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Context;
import android.database.Cursor;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.os.SystemClock;
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
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
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
import java.util.concurrent.atomic.AtomicBoolean;

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
    private static final int MAX_REDIRECTS = 10;
    private static final int MAX_DOWNLOAD_ATTEMPTS = 4;
    private static final AtomicBoolean UPDATE_IN_PROGRESS = new AtomicBoolean(false);
    private static final long DOWNLOAD_TIMEOUT_MS = 6 * 60 * 1000L;

    private static class TransportResult {
        String transport = "unknown";
        String finalUrl = "";
        String responseHost = "";
        String contentType = "";
        String contentEncoding = "";
        String responseEtag = "";
        long responseContentLength = -1;
        long bytes = 0;
        String checksum = "";
    }

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
        String prefix = "/canalescanorff6-source/buildmaster-elite-mobile/releases/download/";
        String path = url.getPath();
        if (!path.startsWith(prefix)) throw new SecurityException("Caminho de atualização não autorizado.");
        String remainder = path.substring(prefix.length());
        int separator = remainder.indexOf('/');
        if (separator <= 0 || separator >= remainder.length() - 1) throw new SecurityException("Caminho de atualização incompleto.");
        String tag = remainder.substring(0, separator);
        String file = remainder.substring(separator + 1);
        boolean trustedTag = "buildmaster-latest".equals(tag)
                || tag.matches("(?i)^buildmaster-v\\\\d+\\\\.\\\\d+\\\\.\\\\d+-\\\\d+(?:-\\\\d{2})?$");
        if (!trustedTag) throw new SecurityException("Release de atualização não autorizada.");
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

    private static boolean isMutableLatestUrl(URL source) {
        return source.getPath() != null && source.getPath().endsWith("/BuildMaster-Elite-Tatico-latest.apk");
    }

    private static URL withDownloadNonce(URL source, int attempt) throws Exception {
        // Ativos versionados são imutáveis e devem ser baixados pela URL exata.
        // O nonce só é necessário para o nome latest, que pode ser substituído.
        if (!isMutableLatestUrl(source)) return source;
        String raw = source.toString();
        String separator = raw.contains("?") ? "&" : "?";
        return new URL(raw + separator + "bmDownloadAttempt=" + attempt + "-" + System.currentTimeMillis());
    }

    private static void applyDownloadHeaders(HttpURLConnection connection, boolean strictIdentity) {
        connection.setConnectTimeout(30_000);
        connection.setReadTimeout(150_000);
        connection.setUseCaches(false);
        connection.setDefaultUseCaches(false);
        connection.setRequestProperty("Accept", "application/vnd.android.package-archive,application/octet-stream,*/*;q=0.8");
        connection.setRequestProperty("Accept-Encoding", "identity");
        connection.setRequestProperty("Connection", "close");
        connection.setRequestProperty("Cache-Control", "no-cache, no-store, max-age=0");
        connection.setRequestProperty("Pragma", "no-cache");
        connection.setRequestProperty("User-Agent", "BuildMaster-Elite-Tatico-Updater/27.34 Android");
    }

    private static void validateDownloadResponse(HttpURLConnection connection, int status) throws Exception {
        if (status < 200 || status >= 300) throw new IllegalStateException("Download retornou HTTP " + status);
        String contentType = connection.getContentType();
        if (contentType != null) {
            String normalizedType = contentType.toLowerCase();
            if (normalizedType.contains("text/html") || normalizedType.contains("application/json")) {
                throw new IllegalStateException("O servidor retornou " + contentType + " no lugar do APK.");
            }
        }
    }

    private static HttpURLConnection openAutomaticDownloadConnection(URL initial) throws Exception {
        validateInitialApkUrl(initial);
        HttpURLConnection connection = (HttpURLConnection) initial.openConnection();
        connection.setInstanceFollowRedirects(true);
        applyDownloadHeaders(connection, false);
        int status = connection.getResponseCode();
        URL finalUrl = connection.getURL();
        if (!finalUrl.equals(initial)) validateRedirectUrl(finalUrl);
        try {
            validateDownloadResponse(connection, status);
            return connection;
        } catch (Exception error) {
            connection.disconnect();
            throw error;
        }
    }

    private static HttpURLConnection openManualDownloadConnection(URL initial) throws Exception {
        URL current = initial;
        for (int redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
            if (redirect == 0) validateInitialApkUrl(current); else validateRedirectUrl(current);
            HttpURLConnection connection = (HttpURLConnection) current.openConnection();
            connection.setInstanceFollowRedirects(false);
            applyDownloadHeaders(connection, true);
            int status = connection.getResponseCode();
            if (status >= 300 && status < 400) {
                String location = connection.getHeaderField("Location");
                connection.disconnect();
                if (location == null || location.trim().isEmpty()) throw new IllegalStateException("Redirecionamento de download sem destino.");
                current = new URL(current, location);
                continue;
            }
            try {
                validateDownloadResponse(connection, status);
                return connection;
            } catch (Exception error) {
                connection.disconnect();
                throw error;
            }
        }
        throw new IllegalStateException("O download excedeu o limite de redirecionamentos.");
    }

    private static HttpURLConnection openDownloadConnection(URL initial, int attempt) throws Exception {
        // Alterna entre o redirecionamento manual estrito e o mecanismo nativo do Android.
        // Isso contorna diferenças de ROM/WebView sem enfraquecer a validação final por SHA-256.
        return attempt % 2 == 0
                ? openAutomaticDownloadConnection(initial)
                : openManualDownloadConnection(initial);
    }

    private static String downloadTrace(HttpURLConnection connection) {
        if (connection == null) return "sem resposta HTTP";
        try {
            URL finalUrl = connection.getURL();
            return "host=" + (finalUrl == null ? "desconhecido" : finalUrl.getHost())
                    + ", caminho=" + (finalUrl == null ? "desconhecido" : finalUrl.getPath())
                    + ", HTTP=" + connection.getResponseCode()
                    + ", tipo=" + String.valueOf(connection.getContentType())
                    + ", encoding=" + String.valueOf(connection.getContentEncoding())
                    + ", contentLength=" + connection.getContentLengthLong()
                    + ", etag=" + String.valueOf(connection.getHeaderField("ETag"));
        } catch (Exception ignored) {
            return "resposta HTTP sem metadados completos";
        }
    }

    private static boolean isRetryableDownloadError(Exception error) {
        if (error instanceof java.io.IOException) return true;
        String message = error.getMessage() == null ? "" : error.getMessage().toLowerCase();
        return message.contains("tamanho do apk")
                || message.contains("sha-256")
                || message.contains("http 403")
                || message.contains("http 408")
                || message.contains("http 429")
                || message.contains("http 5")
                || message.contains("timeout")
                || message.contains("temporar")
                || message.contains("no lugar do apk");
    }

    private static void verifyExpectedDownload(File file, Long expectedSize, String expectedChecksum, String trace) throws Exception {
        if (!file.exists() || !file.isFile() || file.length() <= 0) {
            throw new SecurityException("O arquivo baixado está vazio ou não foi criado. " + trace);
        }
        long total = file.length();
        if (expectedSize != null && expectedSize > 0 && total != expectedSize) {
            throw new SecurityException("Tamanho do APK não confere com o manifesto: esperado=" + expectedSize + ", recebido=" + total + ". " + trace);
        }
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (BufferedInputStream input = new BufferedInputStream(new FileInputStream(file))) {
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) digest.update(buffer, 0, read);
        }
        String actual = hex(digest.digest());
        if (!actual.equalsIgnoreCase(expectedChecksum)) {
            throw new SecurityException("SHA-256 do APK não confere com o manifesto: esperado=" + expectedChecksum.substring(0, 12) + ", recebido=" + actual.substring(0, 12) + ", bytes=" + total + ". " + trace);
        }
    }

    private static void copyVerifiedFile(File source, File destination) throws Exception {
        if (destination.exists() && !destination.delete()) throw new IOException("Não foi possível limpar o download parcial anterior.");
        try (BufferedInputStream input = new BufferedInputStream(new FileInputStream(source));
             FileOutputStream fileOutput = new FileOutputStream(destination);
             BufferedOutputStream output = new BufferedOutputStream(fileOutput)) {
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
            output.flush();
            fileOutput.getFD().sync();
        }
    }

    private TransportResult downloadWithSystemManager(URL initial, File partial, Long expectedSize, String expectedChecksum) throws Exception {
        validateInitialApkUrl(initial);
        DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        if (manager == null) throw new IllegalStateException("O gerenciador de downloads do Android não está disponível.");
        File externalRoot = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (externalRoot == null) throw new IllegalStateException("O Android não liberou a pasta privada de downloads.");
        File directory = new File(externalRoot, "buildmaster_updates");
        if (!directory.exists() && !directory.mkdirs()) throw new IllegalStateException("Não foi possível preparar a pasta privada de download.");
        String fileName = "BuildMaster-system-" + System.currentTimeMillis() + ".apk.part";
        File systemFile = new File(directory, fileName);
        if (systemFile.exists()) systemFile.delete();

        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(initial.toString()));
        request.setTitle("Atualização do BuildMaster");
        request.setDescription("Baixando e conferindo o APK oficial");
        request.setMimeType("application/vnd.android.package-archive");
        request.setAllowedOverMetered(true);
        request.setAllowedOverRoaming(true);
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.addRequestHeader("Accept", "application/vnd.android.package-archive,application/octet-stream,*/*;q=0.8");
        request.addRequestHeader("Accept-Encoding", "identity");
        request.addRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
        request.addRequestHeader("Pragma", "no-cache");
        request.addRequestHeader("User-Agent", "BuildMaster-Elite-Tatico-Updater/27.34 Android-System");
        request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, "buildmaster_updates/" + fileName);

        long downloadId = manager.enqueue(request);
        long deadline = SystemClock.elapsedRealtime() + DOWNLOAD_TIMEOUT_MS;
        long total = expectedSize == null ? 0 : expectedSize;
        String reasonText = "";
        try {
            while (SystemClock.elapsedRealtime() < deadline) {
                DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
                try (Cursor cursor = manager.query(query)) {
                    if (cursor == null || !cursor.moveToFirst()) throw new IOException("O Android perdeu o registro do download.");
                    int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                    long downloaded = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                    long reportedTotal = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                    if (reportedTotal > 0) total = reportedTotal;
                    int percent = total > 0 ? (int) Math.min(99, (downloaded * 100L) / total) : 0;
                    emitProgress("downloading-system", percent, downloaded, total);
                    if (status == DownloadManager.STATUS_SUCCESSFUL) break;
                    if (status == DownloadManager.STATUS_FAILED) {
                        int reason = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON));
                        reasonText = String.valueOf(reason);
                        throw new IOException("O gerenciador de downloads falhou (motivo Android " + reason + ").");
                    }
                }
                SystemClock.sleep(450L);
            }
            if (SystemClock.elapsedRealtime() >= deadline) throw new IOException("Timeout no gerenciador de downloads do Android.");
            // Lê o arquivo pelo próprio DownloadManager. Essa é a origem oficial do
            // download concluído e evita diferenças de caminho em ROMs modificadas.
            if (partial.exists() && !partial.delete()) throw new IOException("Não foi possível limpar o download parcial anterior.");
            try (ParcelFileDescriptor descriptor = manager.openDownloadedFile(downloadId);
                 FileInputStream input = new FileInputStream(descriptor.getFileDescriptor());
                 FileOutputStream fileOutput = new FileOutputStream(partial);
                 BufferedOutputStream output = new BufferedOutputStream(fileOutput)) {
                byte[] buffer = new byte[64 * 1024];
                long copied = 0;
                int read;
                while ((read = input.read(buffer)) != -1) {
                    copied += read;
                    if (copied > MAX_APK_BYTES) throw new SecurityException("APK maior que o limite permitido.");
                    output.write(buffer, 0, read);
                }
                output.flush();
                fileOutput.getFD().sync();
            }
            verifyExpectedDownload(partial, expectedSize, expectedChecksum, "transporte=DownloadManager, motivo=" + reasonText);
            TransportResult result = new TransportResult();
            result.transport = "android-download-manager";
            result.finalUrl = initial.toString();
            result.responseHost = initial.getHost();
            result.contentType = "application/vnd.android.package-archive";
            result.contentEncoding = "identity";
            result.responseContentLength = partial.length();
            result.bytes = partial.length();
            result.checksum = expectedChecksum.toLowerCase();
            return result;
        } finally {
            try { manager.remove(downloadId); } catch (Exception ignored) { }
            if (systemFile.exists()) systemFile.delete();
        }
    }

    private TransportResult downloadWithHttpStream(URL initial, File partial, Long expectedSize, String expectedChecksum, int attempt) throws Exception {
        HttpURLConnection connection = null;
        try {
            connection = openDownloadConnection(initial, attempt);
            long contentLength = connection.getContentLengthLong();
            long expectedTotal = expectedSize != null && expectedSize > 0 ? expectedSize : contentLength;
            if (contentLength > MAX_APK_BYTES || expectedTotal > MAX_APK_BYTES) throw new SecurityException("APK maior que o limite permitido.");
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            long total = 0;
            int lastPercent = -1;
            try (BufferedInputStream input = new BufferedInputStream(connection.getInputStream());
                 FileOutputStream fileOutput = new FileOutputStream(partial);
                 BufferedOutputStream output = new BufferedOutputStream(fileOutput)) {
                byte[] buffer = new byte[64 * 1024];
                int read;
                while ((read = input.read(buffer)) != -1) {
                    total += read;
                    if (total > MAX_APK_BYTES) throw new SecurityException("APK maior que o limite permitido.");
                    digest.update(buffer, 0, read);
                    output.write(buffer, 0, read);
                    int percent = expectedTotal > 0 ? (int) Math.min(99, (total * 100L) / expectedTotal) : 0;
                    if (percent != lastPercent && (percent == 0 || percent >= lastPercent + 2)) {
                        lastPercent = percent;
                        emitProgress("downloading-http", percent, total, expectedTotal);
                    }
                }
                output.flush();
                fileOutput.getFD().sync();
            }
            if (expectedSize != null && expectedSize > 0 && total != expectedSize) {
                throw new SecurityException("Tamanho do APK não confere com o manifesto: esperado=" + expectedSize + ", recebido=" + total + ". " + downloadTrace(connection));
            }
            String actualChecksum = hex(digest.digest());
            if (!actualChecksum.equalsIgnoreCase(expectedChecksum)) {
                throw new SecurityException("SHA-256 do APK não confere com o manifesto: esperado=" + expectedChecksum.substring(0, 12) + ", recebido=" + actualChecksum.substring(0, 12) + ", bytes=" + total + ". " + downloadTrace(connection));
            }
            URL verifiedUrl = connection.getURL();
            TransportResult result = new TransportResult();
            result.transport = attempt % 2 == 0 ? "http-automatic-redirect" : "http-manual-redirect";
            result.finalUrl = verifiedUrl == null ? "" : verifiedUrl.toString();
            result.responseHost = verifiedUrl == null ? "" : verifiedUrl.getHost();
            result.contentType = String.valueOf(connection.getContentType());
            result.contentEncoding = String.valueOf(connection.getContentEncoding());
            result.responseContentLength = connection.getContentLengthLong();
            result.responseEtag = String.valueOf(connection.getHeaderField("ETag"));
            result.bytes = total;
            result.checksum = actualChecksum;
            return result;
        } finally {
            if (connection != null) connection.disconnect();
        }
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

    private static void assertApkZipHeader(File apk) throws Exception {
        byte[] header = new byte[4];
        try (FileInputStream input = new FileInputStream(apk)) {
            if (input.read(header) != header.length) throw new SecurityException("O arquivo baixado está vazio ou incompleto.");
        }
        boolean validZip = header[0] == 0x50 && header[1] == 0x4b
                && ((header[2] == 0x03 && header[3] == 0x04)
                || (header[2] == 0x05 && header[3] == 0x06)
                || (header[2] == 0x07 && header[3] == 0x08));
        if (!validZip) throw new SecurityException("O arquivo baixado não é um APK/ZIP válido.");
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
        intent.putExtra(Intent.EXTRA_NOT_UNKNOWN_SOURCE, true);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PackageManager manager = getContext().getPackageManager();
        List<ResolveInfo> handlers = manager.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
        for (ResolveInfo handler : handlers) {
            if (handler.activityInfo != null && handler.activityInfo.packageName != null) {
                getContext().grantUriPermission(handler.activityInfo.packageName, uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }
        }
        if (handlers.isEmpty() && intent.resolveActivity(manager) == null) {
            throw new IllegalStateException("O instalador de pacotes do Android não está disponível.");
        }
        try {
            getContext().startActivity(intent);
        } catch (ActivityNotFoundException firstError) {
            Intent fallback = new Intent(Intent.ACTION_INSTALL_PACKAGE, uri);
            fallback.setClipData(ClipData.newRawUri("BuildMaster update", uri));
            fallback.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(fallback);
        }
    }

    @PluginMethod
    public void downloadAndInstallApk(PluginCall call) {
        String urlValue = call.getString("url");
        String expectedChecksum = call.getString("checksum");
        String expectedPackage = call.getString("expectedPackageName", EXPECTED_PACKAGE);
        String expectedVersionName = call.getString("expectedVersionName");
        Long expectedVersionCode = call.getLong("expectedVersionCode");
        Long expectedSize = call.getLong("expectedSizeBytes");
        Integer requestedAttempts = call.getInt("maxAttempts");
        final int maxAttempts = requestedAttempts == null ? MAX_DOWNLOAD_ATTEMPTS : Math.max(1, Math.min(MAX_DOWNLOAD_ATTEMPTS, requestedAttempts));

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
        if (!UPDATE_IN_PROGRESS.compareAndSet(false, true)) {
            call.reject("Já existe uma atualização em andamento. Aguarde a tentativa atual terminar.");
            return;
        }

        call.setKeepAlive(true);
        new Thread(() -> {
            File partial = null;
            File apk = null;
            try {
                File updatesDir = new File(getContext().getCacheDir(), "verified_updates");
                if (!updatesDir.exists() && !updatesDir.mkdirs()) throw new IllegalStateException("Não foi possível preparar a pasta de atualização.");
                partial = new File(updatesDir, "BuildMaster-update-" + expectedVersionCode + ".part");
                apk = new File(updatesDir, "BuildMaster-Elite-Tatico-" + expectedVersionCode + "-verificado.apk");
                if (partial.exists()) partial.delete();
                if (apk.exists()) apk.delete();

                TransportResult transportResult = null;
                Exception finalDownloadError = null;

                for (int downloadAttempt = 1; downloadAttempt <= maxAttempts; downloadAttempt++) {
                    try {
                        if (partial.exists()) partial.delete();
                        emitProgress("connecting", 0, 0, expectedSize == null ? 0 : expectedSize);
                        URL initial = withDownloadNonce(new URL(urlValue), downloadAttempt);
                        // O transporte do sistema é o principal porque usa a mesma infraestrutura
                        // que consegue baixar o APK manualmente no Android. O fluxo HTTP próprio
                        // permanece como reserva independente para ROMs sem DownloadManager funcional.
                        transportResult = downloadAttempt % 2 == 1
                                ? downloadWithSystemManager(initial, partial, expectedSize, expectedChecksum)
                                : downloadWithHttpStream(initial, partial, expectedSize, expectedChecksum, downloadAttempt);
                        emitProgress("verifying", 99, transportResult.bytes, expectedSize == null ? transportResult.bytes : expectedSize);
                        finalDownloadError = null;
                        break;
                    } catch (Exception downloadError) {
                        finalDownloadError = downloadError;
                        if (partial.exists()) partial.delete();
                        if (downloadAttempt >= maxAttempts || !isRetryableDownloadError(downloadError)) throw downloadError;
                        try { Thread.sleep(downloadAttempt * 1400L); } catch (InterruptedException interrupted) {
                            Thread.currentThread().interrupt();
                            throw interrupted;
                        }
                    }
                }

                if (finalDownloadError != null) throw finalDownloadError;
                if (transportResult == null) throw new IllegalStateException("Nenhum transporte conseguiu concluir o download.");
                long total = transportResult.bytes;
                long expectedTotal = expectedSize == null ? total : expectedSize;
                String actualChecksum = transportResult.checksum;
                String finalUrl = transportResult.finalUrl;
                String responseHost = transportResult.responseHost;
                String responseContentType = transportResult.contentType;
                String responseContentEncoding = transportResult.contentEncoding;
                String responseEtag = transportResult.responseEtag;
                long responseContentLength = transportResult.responseContentLength;
                if (!partial.renameTo(apk)) throw new IllegalStateException("Não foi possível concluir o arquivo de atualização.");
                assertApkZipHeader(apk);

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
                    throw new SignatureException("A assinatura do APK é diferente da versão instalada. A atualização foi bloqueada para preservar o aplicativo e os dados.");
                }

                emitProgress("ready", 100, total, expectedTotal);
                launchInstaller(apk);
                JSObject result = new JSObject();
                result.put("verified", true);
                result.put("checksum", actualChecksum);
                result.put("needsPermission", false);
                result.put("versionCode", downloadedCode);
                result.put("versionName", downloadedName);
                result.put("finalUrl", finalUrl);
                result.put("responseHost", responseHost);
                result.put("contentType", responseContentType);
                result.put("contentEncoding", responseContentEncoding);
                result.put("contentLength", responseContentLength);
                result.put("etag", responseEtag);
                result.put("transport", transportResult.transport);
                call.resolve(result);
            } catch (Exception error) {
                if (partial != null) partial.delete();
                if (apk != null) apk.delete();
                call.reject("Atualização bloqueada: " + (error.getMessage() == null ? error.getClass().getSimpleName() : error.getMessage()), error);
            } finally {
                UPDATE_IN_PROGRESS.set(false);
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
console.log('Plugin Android v27.34 instalado: DownloadManager lido pela API oficial + HTTP reserva, progresso, SHA-256, pacote/versionCode e assinatura verificados.');
