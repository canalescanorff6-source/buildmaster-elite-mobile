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

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
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
import java.security.SecureRandom;
import java.security.Signature;
import java.util.Arrays;

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
    private static final int MAX_APK_BYTES = 250 * 1024 * 1024;

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
            Signature signer = Signature.getInstance("SHA256withECDSA");
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

    private static void validateTrustedApkUrl(URL url) throws Exception {
        if (!"https".equalsIgnoreCase(url.getProtocol())) throw new SecurityException("Atualização sem HTTPS bloqueada.");
        if (!"github.com".equalsIgnoreCase(url.getHost())) throw new SecurityException("Servidor de atualização não autorizado.");
        String path = url.getPath();
        if (!"/canalescanorff6-source/buildmaster-elite-mobile/releases/download/buildmaster-latest/BuildMaster-Elite-Tatico-latest.apk".equals(path)) {
            throw new SecurityException("Arquivo de atualização não autorizado.");
        }
    }

    @PluginMethod
    public void downloadAndInstallApk(PluginCall call) {
        String urlValue = call.getString("url");
        String expected = call.getString("checksum");
        if (urlValue == null || expected == null || !expected.matches("(?i)^[a-f0-9]{64}$")) {
            call.reject("URL ou SHA-256 inválido.");
            return;
        }
        call.setKeepAlive(true);
        new Thread(() -> {
            File apk = null;
            try {
                URL url = new URL(urlValue);
                validateTrustedApkUrl(url);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(20_000);
                connection.setReadTimeout(45_000);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("Accept", "application/vnd.android.package-archive");
                connection.connect();
                int status = connection.getResponseCode();
                if (status < 200 || status >= 300) throw new IllegalStateException("Download retornou HTTP " + status);
                int contentLength = connection.getContentLength();
                if (contentLength > MAX_APK_BYTES) throw new SecurityException("APK maior que o limite permitido.");
                apk = new File(getContext().getCacheDir(), "BuildMaster-Elite-Tatico-verificado.apk");
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                int total = 0;
                try (BufferedInputStream input = new BufferedInputStream(connection.getInputStream());
                     BufferedOutputStream output = new BufferedOutputStream(new FileOutputStream(apk))) {
                    byte[] buffer = new byte[16 * 1024];
                    int read;
                    while ((read = input.read(buffer)) != -1) {
                        total += read;
                        if (total > MAX_APK_BYTES) throw new SecurityException("APK maior que o limite permitido.");
                        digest.update(buffer, 0, read);
                        output.write(buffer, 0, read);
                    }
                } finally {
                    connection.disconnect();
                }
                String actual = hex(digest.digest());
                if (!actual.equalsIgnoreCase(expected)) {
                    apk.delete();
                    throw new SecurityException("SHA-256 do APK não confere. Instalação bloqueada.");
                }
                Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(uri, "application/vnd.android.package-archive");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                JSObject result = new JSObject();
                result.put("verified", true);
                result.put("checksum", actual);
                call.resolve(result);
            } catch (Exception error) {
                if (apk != null) apk.delete();
                call.reject("Atualização bloqueada: " + error.getMessage(), error);
            } finally {
                call.setKeepAlive(false);
            }
        }).start();
    }
}
`;

fs.writeFileSync(path.join(javaDir, 'MainActivity.java'), mainActivity);
fs.writeFileSync(path.join(javaDir, 'BuildMasterSecurityPlugin.java'), plugin);
fs.writeFileSync(path.join(resXmlDir, 'buildmaster_file_paths.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<paths xmlns:android="http://schemas.android.com/apk/res/android">\n  <cache-path name="verified_updates" path="." />\n</paths>\n`);

let manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('android.permission.REQUEST_INSTALL_PACKAGES')) {
  manifest = manifest.replace('<application', '    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />\n\n    <application');
}
if (!manifest.includes('.fileprovider')) {
  manifest = manifest.replace('</application>', `        <provider\n            android:name="androidx.core.content.FileProvider"\n            android:authorities="\\${applicationId}.fileprovider"\n            android:exported="false"\n            android:grantUriPermissions="true">\n            <meta-data\n                android:name="android.support.FILE_PROVIDER_PATHS"\n                android:resource="@xml/buildmaster_file_paths" />\n        </provider>\n    </application>`);
}
manifest = manifest.replace(/android:resource="@xml\/file_paths"/g, 'android:resource="@xml/buildmaster_file_paths"');
manifest = manifest.replace(/android:allowBackup="true"/g, 'android:allowBackup="false"');
manifest = manifest.replace(/android:usesCleartextTraffic="true"/g, 'android:usesCleartextTraffic="false"');
if (!manifest.includes('android:usesCleartextTraffic=')) {
  manifest = manifest.replace('<application', '<application\n        android:usesCleartextTraffic="false"');
}
fs.writeFileSync(manifestPath, manifest);
console.log('Plugin Android de segurança instalado: Keystore, identidade do aparelho e APK verificado.');
