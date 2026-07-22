import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const installerPath = path.join(root, 'scripts/install-android-security-plugin.mjs');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'buildmaster-java-preflight-'));
const srcRoot = path.join(tempRoot, 'src');

function writeSource(relativePath, contents) {
  const target = path.join(srcRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, 'utf8');
}

function writeAndroidAndCapacitorStubs() {
  const sources = {
    'org/json/JSONObject.java': 'package org.json; public class JSONObject { public static final Object NULL=new Object(); public Object opt(String k){return null;} public JSONObject put(String k,Object v){return this;} }',
    'com/getcapacitor/JSObject.java': 'package com.getcapacitor; public class JSObject extends org.json.JSONObject { @Override public JSObject put(String k,Object v){super.put(k,v); return this;} }',
    'com/getcapacitor/Plugin.java': 'package com.getcapacitor; public class Plugin { protected android.content.Context getContext(){return null;} protected void notifyListeners(String e, JSObject o, boolean r){} }',
    'com/getcapacitor/PluginCall.java': 'package com.getcapacitor; public class PluginCall { public String getString(String k){return null;} public String getString(String k,String d){return d;} public Integer getInt(String k){return null;} public JSObject getData(){return new JSObject();} public void reject(String m){} public void reject(String m,String c){} public void reject(String m,Throwable t){} public void resolve(){} public void resolve(JSObject o){} public void setKeepAlive(boolean v){} }',
    'com/getcapacitor/PluginMethod.java': 'package com.getcapacitor; import java.lang.annotation.*; @Retention(RetentionPolicy.RUNTIME) @Target(ElementType.METHOD) public @interface PluginMethod {}',
    'com/getcapacitor/annotation/CapacitorPlugin.java': 'package com.getcapacitor.annotation; import java.lang.annotation.*; @Retention(RetentionPolicy.RUNTIME) @Target(ElementType.TYPE) public @interface CapacitorPlugin { String name(); }',
    'com/getcapacitor/BridgeActivity.java': 'package com.getcapacitor; public class BridgeActivity { public void onCreate(android.os.Bundle b){} protected void registerPlugin(Class<?> c){} }',
    'android/content/SharedPreferences.java': 'package android.content; public interface SharedPreferences { String getString(String k,String d); Editor edit(); interface Editor { Editor putString(String k,String v); Editor remove(String k); Editor clear(); void apply(); } }',
    'android/content/Context.java': 'package android.content; public class Context { public static final int MODE_PRIVATE=0; public static final String DOWNLOAD_SERVICE="download"; public SharedPreferences getSharedPreferences(String n,int m){return null;} public android.content.pm.PackageManager getPackageManager(){return null;} public String getPackageName(){return "";} public void startActivity(Intent i){} public Object getSystemService(String n){return null;} public java.io.File getExternalFilesDir(String t){return null;} public java.io.File getCacheDir(){return null;} public void grantUriPermission(String p, android.net.Uri u, int f){} }',
    'android/content/ActivityNotFoundException.java': 'package android.content; public class ActivityNotFoundException extends RuntimeException { public ActivityNotFoundException(){} }',
    'android/content/ClipData.java': 'package android.content; public class ClipData { public static ClipData newRawUri(CharSequence l, android.net.Uri u){return new ClipData();} }',
    'android/content/Intent.java': 'package android.content; public class Intent { public static final String ACTION_VIEW="v", ACTION_INSTALL_PACKAGE="i"; public static final String EXTRA_NOT_UNKNOWN_SOURCE="e"; public static final int FLAG_ACTIVITY_NEW_TASK=1, FLAG_GRANT_READ_URI_PERMISSION=2, FLAG_ACTIVITY_CLEAR_TOP=4; public Intent(){} public Intent(String a){} public Intent(String a, android.net.Uri u){} public Intent setDataAndType(android.net.Uri u,String t){return this;} public Intent setClipData(ClipData d){return this;} public Intent putExtra(String k, boolean v){return this;} public Intent addFlags(int f){return this;} public Object resolveActivity(android.content.pm.PackageManager m){return null;} }',
    'android/content/pm/Signature.java': 'package android.content.pm; public class Signature { public byte[] toByteArray(){return new byte[0];} }',
    'android/content/pm/SigningInfo.java': 'package android.content.pm; public class SigningInfo { public boolean hasMultipleSigners(){return false;} public Signature[] getApkContentsSigners(){return new Signature[0];} public Signature[] getSigningCertificateHistory(){return new Signature[0];} }',
    'android/content/pm/PackageInfo.java': 'package android.content.pm; public class PackageInfo { public String packageName; public String versionName; public int versionCode; public Signature[] signatures; public SigningInfo signingInfo; public long getLongVersionCode(){return versionCode;} }',
    'android/content/pm/ActivityInfo.java': 'package android.content.pm; public class ActivityInfo { public String packageName; }',
    'android/content/pm/ResolveInfo.java': 'package android.content.pm; public class ResolveInfo { public ActivityInfo activityInfo; }',
    'android/content/pm/PackageManager.java': 'package android.content.pm; import java.util.*; public class PackageManager { public static final int CERT_INPUT_SHA256=1, GET_SIGNATURES=2, GET_SIGNING_CERTIFICATES=4, MATCH_DEFAULT_ONLY=8; public boolean canRequestPackageInstalls(){return true;} public PackageInfo getPackageInfo(String p,int f){return null;} public boolean hasSigningCertificate(String p,byte[] d,int t){return true;} public PackageInfo getPackageArchiveInfo(String p,int f){return null;} public List<ResolveInfo> queryIntentActivities(android.content.Intent i,int f){return new ArrayList<>();} }',
    'android/database/Cursor.java': 'package android.database; public interface Cursor extends AutoCloseable { boolean moveToFirst(); int getInt(int i); long getLong(int i); int getColumnIndexOrThrow(String n); void close(); }',
    'android/net/Uri.java': 'package android.net; public class Uri { public static Uri parse(String s){return new Uri();} }',
    'android/os/Build.java': 'package android.os; public class Build { public static class VERSION { public static int SDK_INT=35; } public static class VERSION_CODES { public static final int O=26, P=28; } }',
    'android/os/Bundle.java': 'package android.os; public class Bundle {}',
    'android/os/Environment.java': 'package android.os; public class Environment { public static final String DIRECTORY_DOWNLOADS="Downloads"; }',
    'android/os/ParcelFileDescriptor.java': 'package android.os; public class ParcelFileDescriptor implements AutoCloseable { public java.io.FileDescriptor getFileDescriptor(){return new java.io.FileDescriptor();} public void close(){} }',
    'android/os/SystemClock.java': 'package android.os; public class SystemClock { public static long elapsedRealtime(){return 0;} public static void sleep(long m){} }',
    'android/provider/Settings.java': 'package android.provider; public class Settings { public static final String ACTION_MANAGE_UNKNOWN_APP_SOURCES="a", ACTION_SECURITY_SETTINGS="b"; }',
    'android/security/keystore/KeyProperties.java': 'package android.security.keystore; public class KeyProperties { public static final String KEY_ALGORITHM_AES="AES", KEY_ALGORITHM_EC="EC", BLOCK_MODE_GCM="GCM", ENCRYPTION_PADDING_NONE="NoPadding", DIGEST_SHA256="SHA-256"; public static final int PURPOSE_ENCRYPT=1, PURPOSE_DECRYPT=2, PURPOSE_SIGN=4, PURPOSE_VERIFY=8; }',
    'android/security/keystore/KeyGenParameterSpec.java': 'package android.security.keystore; public class KeyGenParameterSpec implements java.security.spec.AlgorithmParameterSpec { public static class Builder { public Builder(String a,int p){} public Builder setBlockModes(String... x){return this;} public Builder setEncryptionPaddings(String... x){return this;} public Builder setRandomizedEncryptionRequired(boolean b){return this;} public Builder setDigests(String... x){return this;} public Builder setAlgorithmParameterSpec(java.security.spec.AlgorithmParameterSpec s){return this;} public KeyGenParameterSpec build(){return new KeyGenParameterSpec();} } }',
    'android/util/Base64.java': 'package android.util; public class Base64 { public static final int NO_WRAP=2; public static String encodeToString(byte[] b,int f){return "";} public static byte[] decode(String s,int f){return new byte[0];} }',
    'androidx/core/content/FileProvider.java': 'package androidx.core.content; public class FileProvider { public static android.net.Uri getUriForFile(android.content.Context c,String a,java.io.File f){return new android.net.Uri();} }',
    'android/app/DownloadManager.java': 'package android.app; public class DownloadManager { public static final String COLUMN_STATUS="status", COLUMN_BYTES_DOWNLOADED_SO_FAR="bytes", COLUMN_TOTAL_SIZE_BYTES="total", COLUMN_REASON="reason"; public static final int STATUS_SUCCESSFUL=8, STATUS_FAILED=16; public long enqueue(Request r){return 1;} public android.database.Cursor query(Query q){return null;} public android.os.ParcelFileDescriptor openDownloadedFile(long id){return null;} public int remove(long... ids){return 0;} public static class Request { public static final int VISIBILITY_VISIBLE_NOTIFY_COMPLETED=1; public Request(android.net.Uri u){} public Request setTitle(CharSequence c){return this;} public Request setDescription(CharSequence c){return this;} public Request setMimeType(String s){return this;} public Request setAllowedOverMetered(boolean b){return this;} public Request setAllowedOverRoaming(boolean b){return this;} public Request setNotificationVisibility(int v){return this;} public Request addRequestHeader(String k,String v){return this;} public Request setDestinationInExternalFilesDir(android.content.Context c,String d,String p){return this;} } public static class Query { public Query setFilterById(long... ids){return this;} } }',
  };

  for (const [relativePath, source] of Object.entries(sources)) writeSource(relativePath, source);
}

try {
  const manifestDir = path.join(tempRoot, 'android/app/src/main');
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(
    path.join(manifestDir, 'AndroidManifest.xml'),
    '<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:allowBackup="true" android:usesCleartextTraffic="true"></application></manifest>\n',
    'utf8',
  );

  execFileSync(process.execPath, [installerPath], { cwd: tempRoot, stdio: 'pipe' });

  const generatedJavaDir = path.join(tempRoot, 'android/app/src/main/java/com/buildmaster/elitetatico');
  writeSource('com/buildmaster/elitetatico/BuildMasterSecurityPlugin.java', fs.readFileSync(path.join(generatedJavaDir, 'BuildMasterSecurityPlugin.java'), 'utf8'));
  writeSource('com/buildmaster/elitetatico/MainActivity.java', fs.readFileSync(path.join(generatedJavaDir, 'MainActivity.java'), 'utf8'));
  writeAndroidAndCapacitorStubs();

  const javaFiles = [];
  const collect = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(full);
      else if (entry.isFile() && entry.name.endsWith('.java')) javaFiles.push(full);
    }
  };
  collect(srcRoot);

  const outputDir = path.join(tempRoot, 'classes');
  fs.mkdirSync(outputDir, { recursive: true });
  execFileSync('javac', ['-Xlint:none', '-d', outputDir, ...javaFiles], {
    cwd: tempRoot,
    stdio: 'pipe',
  });

  assert.ok(fs.existsSync(path.join(outputDir, 'com/buildmaster/elitetatico/BuildMasterSecurityPlugin.class')));
  assert.ok(fs.existsSync(path.join(outputDir, 'com/buildmaster/elitetatico/MainActivity.class')));
  console.log('✓ v27.36: Java gerado pelo workflow compila em checkout limpo, incluindo plugin e MainActivity.');
} catch (error) {
  const stdout = error?.stdout?.toString?.() ?? '';
  const stderr = error?.stderr?.toString?.() ?? '';
  throw new Error(`Pré-compilação Java do atualizador falhou.\n${stdout}\n${stderr}`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
