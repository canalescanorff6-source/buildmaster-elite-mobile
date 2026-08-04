import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidRoot = path.join(root, 'android');
if (!fs.existsSync(androidRoot)) throw new Error('Projeto Android não encontrado. Execute npx cap add android antes.');

const javaDir = path.join(root, 'android/app/src/main/java/com/buildmaster/elitetatico');
const mainPath = path.join(javaDir, 'MainActivity.java');
const pluginPath = path.join(javaDir, 'BuildMasterVaultStoragePlugin.java');
fs.mkdirSync(javaDir, { recursive: true });

const plugin = `package com.buildmaster.elitetatico;

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
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@CapacitorPlugin(name = "BuildMasterVaultStorage")
public class BuildMasterVaultStoragePlugin extends Plugin {
    private static final String DIRECTORY = "buildmaster-vault";
    private static final long MAX_VALUE_BYTES = 160L * 1024L * 1024L;
    private static final long RESERVED_FREE_BYTES = 4L * 1024L * 1024L;

    private File rootDirectory() throws Exception {
        File root = new File(getContext().getFilesDir(), DIRECTORY);
        if (!root.exists() && !root.mkdirs()) throw new Exception("Não foi possível preparar a memória interna do app.");
        return root;
    }

    private static String hashKey(String value) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
        StringBuilder output = new StringBuilder(bytes.length * 2);
        for (byte item : bytes) output.append(String.format("%02x", item));
        return output.toString();
    }

    private File fileFor(String key) throws Exception {
        if (key == null || key.trim().isEmpty()) throw new IllegalArgumentException("Chave de armazenamento ausente.");
        return new File(rootDirectory(), hashKey(key.trim()) + ".json");
    }

    @PluginMethod
    public void write(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null || value == null) { call.reject("Chave ou conteúdo ausente."); return; }
        byte[] data = value.getBytes(StandardCharsets.UTF_8);
        if (data.length > MAX_VALUE_BYTES) { call.reject("O Cofre ultrapassou o limite interno de 160 MB."); return; }
        try {
            File target = fileFor(key);
            File root = target.getParentFile();
            long previousSize = target.exists() ? target.length() : 0L;
            long extraNeeded = Math.max(0L, data.length - previousSize);
            if (root != null && root.getUsableSpace() < extraNeeded + RESERVED_FREE_BYTES) {
                call.reject("O aparelho realmente está sem espaço livre para concluir o salvamento.");
                return;
            }
            File temporary = new File(target.getAbsolutePath() + ".tmp");
            try (FileOutputStream stream = new FileOutputStream(temporary, false);
                 BufferedOutputStream output = new BufferedOutputStream(stream)) {
                output.write(data);
                output.flush();
                stream.getFD().sync();
            }
            if (target.exists() && !target.delete()) throw new Exception("Não foi possível substituir o Cofre anterior.");
            if (!temporary.renameTo(target)) {
                try (FileInputStream input = new FileInputStream(temporary);
                     FileOutputStream stream = new FileOutputStream(target, false);
                     BufferedOutputStream output = new BufferedOutputStream(stream)) {
                    byte[] buffer = new byte[64 * 1024];
                    int read;
                    while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
                    output.flush();
                    stream.getFD().sync();
                }
                if (!temporary.delete()) temporary.deleteOnExit();
            }
            JSObject result = new JSObject();
            result.put("bytes", data.length);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Não foi possível salvar o Cofre na memória interna do app.", error);
        }
    }

    @PluginMethod
    public void read(PluginCall call) {
        String key = call.getString("key");
        if (key == null) { call.reject("Chave de armazenamento ausente."); return; }
        try {
            File target = fileFor(key);
            JSObject result = new JSObject();
            if (!target.exists()) {
                result.put("value", null);
                result.put("bytes", 0);
                call.resolve(result);
                return;
            }
            if (target.length() > MAX_VALUE_BYTES) throw new Exception("Arquivo interno acima do limite seguro.");
            try (BufferedInputStream input = new BufferedInputStream(new FileInputStream(target));
                 ByteArrayOutputStream output = new ByteArrayOutputStream((int)Math.min(target.length(), 4L * 1024L * 1024L))) {
                byte[] buffer = new byte[64 * 1024];
                int read;
                while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
                byte[] data = output.toByteArray();
                result.put("value", new String(data, StandardCharsets.UTF_8));
                result.put("bytes", data.length);
            }
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Não foi possível ler o Cofre da memória interna do app.", error);
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (key == null) { call.reject("Chave de armazenamento ausente."); return; }
        try {
            File target = fileFor(key);
            if (target.exists() && !target.delete()) throw new Exception("Não foi possível apagar o arquivo interno.");
            call.resolve();
        } catch (Exception error) {
            call.reject("Não foi possível remover o Cofre interno.", error);
        }
    }

    @PluginMethod
    public void info(PluginCall call) {
        try {
            File root = rootDirectory();
            long used = 0L;
            File[] files = root.listFiles();
            if (files != null) for (File file : files) if (file.isFile()) used += file.length();
            JSObject result = new JSObject();
            result.put("available", true);
            result.put("usedBytes", used);
            result.put("freeBytes", root.getUsableSpace());
            result.put("path", "memoria-interna-do-app/" + DIRECTORY);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Não foi possível consultar a memória interna do app.", error);
        }
    }
}
`;

fs.writeFileSync(pluginPath, plugin, 'utf8');

if (!fs.existsSync(mainPath)) {
  fs.writeFileSync(mainPath, `package com.buildmaster.elitetatico;\n\nimport android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {\n    @Override\n    public void onCreate(Bundle savedInstanceState) {\n        registerPlugin(BuildMasterVaultStoragePlugin.class);\n        super.onCreate(savedInstanceState);\n    }\n}\n`, 'utf8');
} else {
  let main = fs.readFileSync(mainPath, 'utf8');
  if (!main.includes('registerPlugin(BuildMasterVaultStoragePlugin.class);')) {
    const anchor = 'super.onCreate(savedInstanceState);';
    if (!main.includes(anchor)) throw new Error('MainActivity sem ponto de registro do plugin.');
    main = main.replace(anchor, `registerPlugin(BuildMasterVaultStoragePlugin.class);\n        ${anchor}`);
    fs.writeFileSync(mainPath, main, 'utf8');
  }
}

console.log('BuildMaster: Cofre nativo instalado na memória interna privada do APK.');
