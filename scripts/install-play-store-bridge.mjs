import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const android = path.join(root, 'android');
const javaDir = path.join(android, 'app/src/main/java/com/buildmaster/elitetatico');
const manifestPath = path.join(android, 'app/src/main/AndroidManifest.xml');
const gradlePath = path.join(android, 'app/build.gradle');
const mainActivityPath = path.join(javaDir, 'MainActivity.java');
if (!fs.existsSync(android)) throw new Error('Projeto Android não encontrado. Execute npx cap add android antes.');
fs.mkdirSync(javaDir, { recursive: true });

const plugin = `package com.buildmaster.elitetatico;

import android.app.Activity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.UpdateAvailability;
import com.google.android.play.core.integrity.StandardIntegrityManager;
import com.google.android.play.core.integrity.StandardIntegrityManagerFactory;

@CapacitorPlugin(name = "BuildMasterPlayDelivery")
public class BuildMasterPlayDeliveryPlugin extends Plugin {
    private static final int UPDATE_REQUEST_CODE = 3000;
    private StandardIntegrityManager.StandardIntegrityTokenProvider tokenProvider;

    @PluginMethod
    public void prepareIntegrityToken(PluginCall call) {
        String project = call.getString("cloudProjectNumber");
        if (project == null || !project.matches("[0-9]{6,20}")) { call.reject("Número do projeto Google Cloud inválido."); return; }
        try {
            long projectNumber = Long.parseLong(project);
            StandardIntegrityManager manager = StandardIntegrityManagerFactory.createStandard(getContext());
            manager.prepareIntegrityToken(StandardIntegrityManager.PrepareIntegrityTokenRequest.builder().setCloudProjectNumber(projectNumber).build())
                .addOnSuccessListener(provider -> { tokenProvider = provider; JSObject out = new JSObject(); out.put("prepared", true); call.resolve(out); })
                .addOnFailureListener(error -> call.reject("Não foi possível preparar o Play Integrity.", error));
        } catch (Exception error) { call.reject("Não foi possível preparar o Play Integrity.", error); }
    }

    @PluginMethod
    public void requestIntegrityToken(PluginCall call) {
        String requestHash = call.getString("requestHash");
        if (requestHash == null || !requestHash.matches("[A-Za-z0-9_-]{16,500}")) { call.reject("Hash da solicitação inválido."); return; }
        if (tokenProvider == null) { call.reject("Prepare o provedor de integridade antes de solicitar um token."); return; }
        tokenProvider.request(StandardIntegrityManager.StandardIntegrityTokenRequest.builder().setRequestHash(requestHash).build())
            .addOnSuccessListener(response -> { JSObject out = new JSObject(); out.put("token", response.token()); call.resolve(out); })
            .addOnFailureListener(error -> call.reject("Não foi possível obter o token de integridade.", error));
    }

    @PluginMethod
    public void checkForUpdate(PluginCall call) {
        AppUpdateManager manager = AppUpdateManagerFactory.create(getContext());
        manager.getAppUpdateInfo()
            .addOnSuccessListener(info -> {
                JSObject out = new JSObject();
                out.put("availability", info.updateAvailability());
                out.put("availableVersionCode", info.availableVersionCode());
                out.put("immediateAllowed", info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE));
                out.put("flexibleAllowed", info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE));
                out.put("available", info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE);
                out.put("updatePriority", info.updatePriority());
                out.put("stalenessDays", info.clientVersionStalenessDays());
                call.resolve(out);
            })
            .addOnFailureListener(error -> call.reject("Não foi possível consultar a atualização da Play Store.", error));
    }

    @PluginMethod
    public void startUpdate(PluginCall call) {
        String mode = call.getString("mode", "flexible");
        int type = "immediate".equals(mode) ? AppUpdateType.IMMEDIATE : AppUpdateType.FLEXIBLE;
        Activity activity = getActivity();
        if (activity == null) { call.reject("Activity Android indisponível."); return; }
        AppUpdateManager manager = AppUpdateManagerFactory.create(getContext());
        manager.getAppUpdateInfo()
            .addOnSuccessListener((AppUpdateInfo info) -> {
                if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE || !info.isUpdateTypeAllowed(type)) {
                    call.reject("Não existe atualização compatível com o modo solicitado."); return;
                }
                try {
                    boolean started = manager.startUpdateFlowForResult(info, activity, AppUpdateOptions.newBuilder(type).build(), UPDATE_REQUEST_CODE);
                    JSObject out = new JSObject(); out.put("started", started); call.resolve(out);
                } catch (Exception error) { call.reject("Não foi possível iniciar a atualização pela Play Store.", error); }
            })
            .addOnFailureListener(error -> call.reject("Não foi possível consultar a atualização da Play Store.", error));
    }

    @PluginMethod
    public void completeFlexibleUpdate(PluginCall call) {
        AppUpdateManagerFactory.create(getContext()).completeUpdate()
            .addOnSuccessListener(unused -> { JSObject out = new JSObject(); out.put("completed", true); call.resolve(out); })
            .addOnFailureListener(error -> call.reject("Não foi possível concluir a atualização flexível.", error));
    }
}
`;
fs.writeFileSync(path.join(javaDir, 'BuildMasterPlayDeliveryPlugin.java'), plugin);

let main = fs.existsSync(mainActivityPath) ? fs.readFileSync(mainActivityPath, 'utf8') : `package com.buildmaster.elitetatico;\n\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {}\n`;
if (!main.includes('registerPlugin(BuildMasterPlayDeliveryPlugin.class)')) {
  if (main.includes('registerPlugin(BuildMasterSecurityPlugin.class);')) main = main.replace('registerPlugin(BuildMasterSecurityPlugin.class);', 'registerPlugin(BuildMasterSecurityPlugin.class);\n        registerPlugin(BuildMasterPlayDeliveryPlugin.class);');
  else if (main.includes('super.onCreate(savedInstanceState);')) main = main.replace('super.onCreate(savedInstanceState);', 'registerPlugin(BuildMasterPlayDeliveryPlugin.class);\n        super.onCreate(savedInstanceState);');
  else throw new Error('MainActivity incompatível com o instalador do bridge Play.');
}
fs.writeFileSync(mainActivityPath, main);

let gradle = fs.readFileSync(gradlePath, 'utf8');
const dependencies = [
  "implementation 'com.google.android.play:integrity:1.6.0'",
  "implementation 'com.google.android.play:app-update:2.1.0'"
];
for (const dependency of dependencies) {
  if (!gradle.includes(dependency)) gradle = gradle.replace(/dependencies\s*\{/, (match) => `${match}\n    ${dependency}\n`);
}
fs.writeFileSync(gradlePath, gradle);

let manifest = fs.readFileSync(manifestPath, 'utf8');
manifest = manifest.replace(/\s*<uses-permission android:name="android\.permission\.REQUEST_INSTALL_PACKAGES"\s*\/>/g, '');
manifest = manifest.replace(/\s*<queries>[\s\S]*?<\/queries>/g, '');
manifest = manifest.replace(/\s*<provider[\s\S]*?androidx\.core\.content\.FileProvider[\s\S]*?<\/provider>/g, '');
fs.writeFileSync(manifestPath, manifest);
console.log('Bridge Play Store instalado: Integrity 1.6.0, In-App Updates 2.1.0 e auto-instalação APK removida do artefato Play.');
