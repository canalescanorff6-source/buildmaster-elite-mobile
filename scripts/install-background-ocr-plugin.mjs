import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const javaDir = path.join(root, 'android/app/src/main/java/com/buildmaster/elitetatico');
const manifestPath = path.join(root, 'android/app/src/main/AndroidManifest.xml');
const mainActivityPath = path.join(javaDir, 'MainActivity.java');
fs.mkdirSync(javaDir, { recursive: true });

const plugin = `package com.buildmaster.elitetatico;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BuildMasterBackgroundOcr")
public class BuildMasterBackgroundOcrPlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
        Intent intent = new Intent(getContext(), BuildMasterBackgroundOcrService.class);
        intent.putExtra("title", call.getString("title", "BuildMaster — leitura em andamento"));
        intent.putExtra("message", call.getString("message", "Processando a carta com segurança."));
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) getContext().startForegroundService(intent);
        else getContext().startService(intent);
        JSObject result = new JSObject(); result.put("active", true); call.resolve(result);
    }
    @PluginMethod
    public void update(PluginCall call) {
        Intent intent = new Intent(getContext(), BuildMasterBackgroundOcrService.class);
        intent.setAction("UPDATE");
        intent.putExtra("message", call.getString("message", "Leitura em andamento."));
        intent.putExtra("progress", call.getInt("progress", 0));
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) getContext().startForegroundService(intent);
        else getContext().startService(intent);
        call.resolve();
    }
    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), BuildMasterBackgroundOcrService.class));
        call.resolve();
    }
}
`;

const service = `package com.buildmaster.elitetatico;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class BuildMasterBackgroundOcrService extends Service {
    private static final String CHANNEL = "buildmaster_background_ocr";
    private static final int ID = 3840;
    private String message = "Leitura em andamento.";
    private int progress = 0;

    @Override public void onCreate() { super.onCreate(); createChannel(); }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String next = intent.getStringExtra("message");
            if (next != null && !next.trim().isEmpty()) message = next;
            progress = Math.max(0, Math.min(100, intent.getIntExtra("progress", progress)));
        }
        startForeground(ID, notification());
        return START_STICKY;
    }
    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL, "Leitura de cartas", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Mantém a leitura protegida ao alternar entre aplicativos.");
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }
    private Notification notification() {
        Intent open = new Intent(this, MainActivity.class);
        open.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pending = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_menu_search)
            .setContentTitle("BuildMaster — leitura protegida")
            .setContentText(message)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(pending)
            .setPriority(NotificationCompat.PRIORITY_LOW);
        if (progress > 0 && progress < 100) builder.setProgress(100, progress, false);
        return builder.build();
    }
    @Override public IBinder onBind(Intent intent) { return null; }
}
`;

fs.writeFileSync(path.join(javaDir, 'BuildMasterBackgroundOcrPlugin.java'), plugin);
fs.writeFileSync(path.join(javaDir, 'BuildMasterBackgroundOcrService.java'), service);

let main = fs.existsSync(mainActivityPath) ? fs.readFileSync(mainActivityPath, 'utf8') : `package com.buildmaster.elitetatico;\n\nimport android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {\n  @Override public void onCreate(Bundle savedInstanceState) { super.onCreate(savedInstanceState); }\n}\n`;
if (!main.includes('registerPlugin(BuildMasterBackgroundOcrPlugin.class);')) {
  main = main.replace('super.onCreate(savedInstanceState);', 'registerPlugin(BuildMasterBackgroundOcrPlugin.class);\n        super.onCreate(savedInstanceState);');
  fs.writeFileSync(mainActivityPath, main);
}

if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (!manifest.includes('android.permission.FOREGROUND_SERVICE')) {
    manifest = manifest.replace('<manifest', '<manifest').replace(/(<manifest[^>]*>)/, '$1\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />\n    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />');
  }
  if (!manifest.includes('BuildMasterBackgroundOcrService')) {
    manifest = manifest.replace('</application>', '        <service android:name=".BuildMasterBackgroundOcrService" android:exported="false" android:foregroundServiceType="dataSync" />\n    </application>');
  }
  fs.writeFileSync(manifestPath, manifest);
}
console.log('BuildMaster v38.40: proteção nativa de leitura em segundo plano instalada.');
