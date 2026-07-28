import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const android = path.join(root, 'android');
const javaDir = path.join(android, 'app/src/main/java/com/buildmaster/elitetatico');
const manifestPath = path.join(android, 'app/src/main/AndroidManifest.xml');
const mainActivityPath = path.join(javaDir, 'MainActivity.java');
if (!fs.existsSync(android)) throw new Error('Projeto Android não encontrado. Execute npx cap add android antes.');
fs.mkdirSync(javaDir, { recursive: true });

const plugin = `package com.buildmaster.elitetatico;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.media.projection.MediaProjectionManager;
import android.os.Build;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.util.List;

@CapacitorPlugin(name = "BuildMasterMatchRecorder")
public class BuildMasterMatchRecorderPlugin extends Plugin {
    @PluginMethod
    public void getCapabilities(PluginCall call) {
        JSObject out = new JSObject();
        out.put("native", true);
        out.put("supported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP);
        out.put("sdkInt", Build.VERSION.SDK_INT);
        JSArray profiles = new JSArray();
        profiles.put("economy"); profiles.put("balanced"); profiles.put("detailed");
        out.put("profiles", profiles);
        out.put("microphoneSupported", false);
        out.put("appAudioSupported", false);
        out.put("maxRecommendedProfile", Build.VERSION.SDK_INT >= 29 ? "balanced" : "economy");
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) out.put("reason", "O Android precisa ser 5.0 ou superior.");
        call.resolve(out);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(BuildMasterScreenRecordService.readStatus(getContext()));
    }

    @PluginMethod
    public void startRecording(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) { call.reject("A gravação exige Android 5.0 ou superior."); return; }
        if (BuildMasterScreenRecordService.isActive(getContext())) { call.reject("Já existe uma gravação ativa."); return; }
        Activity activity = getActivity();
        if (activity == null) { call.reject("Activity Android indisponível."); return; }
        boolean landscape = call.getBoolean("landscape", true);
        if (landscape) activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        MediaProjectionManager manager = (MediaProjectionManager) getContext().getSystemService(Activity.MEDIA_PROJECTION_SERVICE);
        if (manager == null) { call.reject("O Android não disponibilizou o MediaProjection."); return; }
        startActivityForResult(call, manager.createScreenCaptureIntent(), "onScreenCaptureResult");
    }

    @ActivityCallback
    private void onScreenCaptureResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null) {
            Activity activity = getActivity();
            if (activity != null) activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
            call.reject("A autorização de captura foi cancelada.");
            return;
        }
        String quality = call.getString("quality", "balanced");
        if (!"economy".equals(quality) && !"balanced".equals(quality) && !"detailed".equals(quality)) quality = "balanced";
        String title = call.getString("title", "Partida eFootball");
        Intent service = new Intent(getContext(), BuildMasterScreenRecordService.class);
        service.setAction(BuildMasterScreenRecordService.ACTION_START);
        service.putExtra(BuildMasterScreenRecordService.EXTRA_RESULT_CODE, result.getResultCode());
        service.putExtra(BuildMasterScreenRecordService.EXTRA_RESULT_DATA, data);
        service.putExtra(BuildMasterScreenRecordService.EXTRA_QUALITY, quality);
        service.putExtra(BuildMasterScreenRecordService.EXTRA_TITLE, title == null ? "Partida eFootball" : title);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) getContext().startForegroundService(service); else getContext().startService(service);
        JSObject out = new JSObject();
        out.put("state", "requesting"); out.put("active", true); out.put("startedAt", System.currentTimeMillis()); out.put("elapsedMs", 0);
        out.put("message", "Autorização aceita. O serviço Android está preparando o gravador.");
        call.resolve(out);
    }

    @PluginMethod
    public void stopRecording(PluginCall call) {
        if (!BuildMasterScreenRecordService.isActive(getContext())) { call.reject("Nenhuma gravação ativa foi encontrada."); return; }
        Intent service = new Intent(getContext(), BuildMasterScreenRecordService.class);
        service.setAction(BuildMasterScreenRecordService.ACTION_STOP);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) getContext().startForegroundService(service); else getContext().startService(service);
        JSObject out = BuildMasterScreenRecordService.readStatus(getContext());
        out.put("state", "stopping"); out.put("active", true); out.put("message", "Finalizando e validando o arquivo de vídeo.");
        call.resolve(out);
    }

    @PluginMethod
    public void listRecordings(PluginCall call) {
        JSArray array = new JSArray();
        List<JSObject> items = BuildMasterScreenRecordService.listRecordings(getContext());
        for (JSObject item : items) array.put(item);
        JSObject out = new JSObject(); out.put("recordings", array); call.resolve(out);
    }

    @PluginMethod
    public void deleteRecording(PluginCall call) {
        String id = call.getString("id");
        if (id == null || !id.matches("match-[0-9]{10,20}")) { call.reject("Identificador de gravação inválido."); return; }
        boolean deleted = BuildMasterScreenRecordService.deleteRecording(getContext(), id);
        JSObject out = new JSObject(); out.put("deleted", deleted); call.resolve(out);
    }

    @PluginMethod
    public void restoreOrientation(PluginCall call) {
        Activity activity = getActivity();
        if (activity != null) activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        JSObject out = new JSObject(); out.put("restored", activity != null); call.resolve(out);
    }
}
`;

const service = `package com.buildmaster.elitetatico;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.MediaMetadataRetriever;
import android.media.MediaRecorder;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Environment;
import android.os.IBinder;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import androidx.core.app.NotificationCompat;

import com.getcapacitor.JSObject;

import org.json.JSONObject;

import java.io.File;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class BuildMasterScreenRecordService extends Service {
    public static final String ACTION_START = "com.buildmaster.elitetatico.MATCH_RECORD_START";
    public static final String ACTION_STOP = "com.buildmaster.elitetatico.MATCH_RECORD_STOP";
    public static final String EXTRA_RESULT_CODE = "resultCode";
    public static final String EXTRA_RESULT_DATA = "resultData";
    public static final String EXTRA_QUALITY = "quality";
    public static final String EXTRA_TITLE = "title";
    private static final String CHANNEL_ID = "buildmaster_match_recorder";
    private static final int NOTIFICATION_ID = 3170;
    private static final String PREFS = "buildmaster_match_recorder_v3170";
    private static final String KEY_ACTIVE = "active";
    private static final String KEY_STATE = "state";
    private static final String KEY_STARTED = "startedAt";
    private static final String KEY_LAST_ID = "lastId";
    private static final String KEY_MESSAGE = "message";

    private MediaProjection projection;
    private VirtualDisplay virtualDisplay;
    private MediaRecorder recorder;
    private File outputFile;
    private String recordingId;
    private String quality = "balanced";
    private int width;
    private int height;
    private int fps;
    private int bitrate;
    private boolean stopping;

    @Override public IBinder onBind(Intent intent) { return null; }

    private SharedPreferences prefs() { return getSharedPreferences(PREFS, Context.MODE_PRIVATE); }

    public static boolean isActive(Context context) { return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_ACTIVE, false); }

    @Override public void onCreate() { super.onCreate(); createChannel(); }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_STOP.equals(action)) {
            startForegroundCompat(buildNotification("Finalizando gravação..."));
            boolean hadActiveCapture = isActive(this) || recorder != null || projection != null;
            stopCapture(hadActiveCapture ? "Gravação concluída." : "Nenhuma gravação ativa.", !hadActiveCapture);
            return START_NOT_STICKY;
        }
        if (ACTION_START.equals(action)) {
            startForegroundCompat(buildNotification("Preparando gravação..."));
            try { startCapture(intent); } catch (Exception error) { stopCapture("Falha ao iniciar: " + safeMessage(error), true); }
        }
        return START_NOT_STICKY;
    }

    private void startForegroundCompat(Notification notification) {
        if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
        else startForeground(NOTIFICATION_ID, notification);
    }

    @SuppressWarnings("deprecation")
    private void startCapture(Intent intent) throws Exception {
        if (isActive(this)) throw new IllegalStateException("Já existe gravação ativa.");
        int resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED);
        Intent resultData;
        if (Build.VERSION.SDK_INT >= 33) resultData = intent.getParcelableExtra(EXTRA_RESULT_DATA, Intent.class); else resultData = intent.getParcelableExtra(EXTRA_RESULT_DATA);
        if (resultCode != Activity.RESULT_OK || resultData == null) throw new IllegalArgumentException("Autorização de captura inválida.");
        quality = intent.getStringExtra(EXTRA_QUALITY);
        if (!"economy".equals(quality) && !"detailed".equals(quality)) quality = "balanced";
        int[] profile = resolveProfile(quality);
        fps = profile[0]; bitrate = profile[1];
        DisplayMetrics metrics = new DisplayMetrics();
        WindowManager windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        if (windowManager == null) throw new IllegalStateException("Gerenciador de tela indisponível.");
        windowManager.getDefaultDisplay().getRealMetrics(metrics);
        int sourceWidth = Math.max(metrics.widthPixels, metrics.heightPixels);
        int sourceHeight = Math.min(metrics.widthPixels, metrics.heightPixels);
        int maxWidth = profile[2], maxHeight = profile[3];
        double scale = Math.min(1d, Math.min((double) maxWidth / sourceWidth, (double) maxHeight / sourceHeight));
        width = even((int) Math.round(sourceWidth * scale));
        height = even((int) Math.round(sourceHeight * scale));
        File directory = recordingsDirectory(this);
        if (!directory.exists() && !directory.mkdirs()) throw new IllegalStateException("Não foi possível criar a pasta de gravações.");
        recordingId = "match-" + System.currentTimeMillis();
        outputFile = new File(directory, recordingId + ".mp4");
        recorder = Build.VERSION.SDK_INT >= 31 ? new MediaRecorder(this) : new MediaRecorder();
        recorder.setVideoSource(MediaRecorder.VideoSource.SURFACE);
        recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
        recorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264);
        recorder.setVideoEncodingBitRate(bitrate);
        recorder.setVideoFrameRate(fps);
        recorder.setVideoSize(width, height);
        recorder.setOutputFile(outputFile.getAbsolutePath());
        recorder.setOrientationHint(0);
        recorder.prepare();
        MediaProjectionManager manager = (MediaProjectionManager) getSystemService(MEDIA_PROJECTION_SERVICE);
        if (manager == null) throw new IllegalStateException("MediaProjectionManager indisponível.");
        projection = manager.getMediaProjection(resultCode, resultData);
        if (projection == null) throw new IllegalStateException("O Android não criou a sessão de captura.");
        projection.registerCallback(new MediaProjection.Callback() {
            @Override public void onStop() { stopCapture("A captura foi encerrada pelo Android.", false); }
        }, null);
        virtualDisplay = projection.createVirtualDisplay(
            "BuildMasterMatchRecording", width, height, metrics.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            recorder.getSurface(), null, null
        );
        recorder.start();
        long startedAt = System.currentTimeMillis();
        prefs().edit().putBoolean(KEY_ACTIVE, true).putString(KEY_STATE, "recording").putLong(KEY_STARTED, startedAt).putString(KEY_MESSAGE, "Gravação ativa.").apply();
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(NOTIFICATION_ID, buildNotification("Gravando partida • toque em Parar ao terminar"));
    }

    private int[] resolveProfile(String profile) {
        if ("economy".equals(profile)) return new int[]{24, 3_500_000, 960, 540};
        if ("detailed".equals(profile)) return new int[]{30, 10_000_000, 1920, 1080};
        return new int[]{30, 6_000_000, 1280, 720};
    }

    private int even(int value) { return Math.max(2, value - (value % 2)); }

    private synchronized void stopCapture(String message, boolean failed) {
        if (stopping) return;
        stopping = true;
        long startedAt = prefs().getLong(KEY_STARTED, 0L);
        prefs().edit().putBoolean(KEY_ACTIVE, false).putString(KEY_STATE, "stopping").putString(KEY_MESSAGE, message).apply();
        try { if (virtualDisplay != null) virtualDisplay.release(); } catch (Exception ignored) {}
        virtualDisplay = null;
        boolean valid = !failed;
        try { if (recorder != null) recorder.stop(); } catch (RuntimeException error) { valid = false; }
        try { if (recorder != null) recorder.reset(); } catch (Exception ignored) {}
        try { if (recorder != null) recorder.release(); } catch (Exception ignored) {}
        recorder = null;
        try { if (projection != null) projection.stop(); } catch (Exception ignored) {}
        projection = null;
        if (outputFile != null && (!outputFile.exists() || outputFile.length() < 4096)) valid = false;
        if (!valid && outputFile != null) outputFile.delete();
        if (valid && outputFile != null) writeMetadata(outputFile, startedAt);
        String finalState = valid ? "completed" : "error";
        String finalMessage = valid ? message : "A gravação não gerou um arquivo válido.";
        SharedPreferences.Editor editor = prefs().edit().putBoolean(KEY_ACTIVE, false).putString(KEY_STATE, finalState).putString(KEY_MESSAGE, finalMessage);
        if (valid && recordingId != null) editor.putString(KEY_LAST_ID, recordingId); else editor.remove(KEY_LAST_ID);
        editor.apply();
        outputFile = null;
        recordingId = null;
        stopForeground(true);
        stopSelf();
        stopping = false;
    }

    private void writeMetadata(File video, long startedAt) {
        try {
            long duration = readDuration(video);
            JSONObject json = new JSONObject();
            json.put("id", recordingId); json.put("fileName", video.getName()); json.put("path", video.getAbsolutePath());
            json.put("createdAt", isoTimestamp(startedAt > 0 ? startedAt : video.lastModified()));
            json.put("durationMs", duration); json.put("sizeBytes", video.length()); json.put("width", width); json.put("height", height);
            json.put("fps", fps); json.put("bitrate", bitrate); json.put("quality", quality); json.put("state", "completed");
            try (OutputStreamWriter writer = new OutputStreamWriter(new FileOutputStream(new File(video.getParentFile(), recordingId + ".json")), StandardCharsets.UTF_8)) { writer.write(json.toString()); }
        } catch (Exception ignored) {}
    }

    private long readDuration(File video) {
        MediaMetadataRetriever retriever = new MediaMetadataRetriever();
        try {
            retriever.setDataSource(video.getAbsolutePath());
            String value = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION);
            return value == null ? 0 : Long.parseLong(value);
        } catch (Exception ignored) { return 0; }
        finally { try { retriever.release(); } catch (Exception ignored) {} }
    }

    private Notification buildNotification(String text) {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPending = PendingIntent.getActivity(this, 3170, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent stop = new Intent(this, BuildMasterScreenRecordService.class); stop.setAction(ACTION_STOP);
        PendingIntent stopPending = PendingIntent.getService(this, 3171, stop, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.presence_video_online)
            .setContentTitle("BuildMaster • Treinador de Partidas")
            .setContentText(text)
            .setContentIntent(openPending)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .addAction(android.R.drawable.ic_media_pause, "Parar e salvar", stopPending)
            .build();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Gravação de partidas", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Mostra quando o BuildMaster está gravando uma partida autorizada pelo usuário.");
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) manager.createNotificationChannel(channel);
    }

    private static File recordingsDirectory(Context context) {
        File base = context.getExternalFilesDir(Environment.DIRECTORY_MOVIES);
        if (base == null) base = new File(context.getFilesDir(), "movies");
        return new File(base, "BuildMasterMatches");
    }

    private static String isoTimestamp(long timestamp) {
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
        return formatter.format(new java.util.Date(timestamp));
    }

    private static String readUtf8(File file) throws Exception {
        try (FileInputStream input = new FileInputStream(file); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int read;
            while ((read = input.read(buffer)) != -1) output.write(buffer, 0, read);
            return output.toString(StandardCharsets.UTF_8.name());
        }
    }

    private static JSObject descriptorFromFile(File video) {
        String id = video.getName().replaceFirst("\\.mp4$", "");
        File meta = new File(video.getParentFile(), id + ".json");
        try {
            if (meta.exists()) return new JSObject(readUtf8(meta));
        } catch (Exception ignored) {}
        JSObject out = new JSObject();
        out.put("id", id); out.put("path", video.getAbsolutePath()); out.put("fileName", video.getName());
        out.put("createdAt", isoTimestamp(video.lastModified())); out.put("durationMs", 0);
        out.put("sizeBytes", video.length()); out.put("width", 0); out.put("height", 0); out.put("fps", 0); out.put("bitrate", 0);
        out.put("quality", "balanced"); out.put("state", "completed");
        return out;
    }

    public static List<JSObject> listRecordings(Context context) {
        File directory = recordingsDirectory(context);
        File[] videos = directory.listFiles((dir, name) -> name.matches("match-[0-9]{10,20}\\.mp4"));
        if (videos == null) return Collections.emptyList();
        Arrays.sort(videos, Comparator.comparingLong(File::lastModified).reversed());
        List<JSObject> items = new ArrayList<>();
        for (File video : videos) items.add(descriptorFromFile(video));
        return items;
    }

    public static boolean deleteRecording(Context context, String id) {
        if (isActive(context)) return false;
        File directory = recordingsDirectory(context);
        File video = new File(directory, id + ".mp4");
        File meta = new File(directory, id + ".json");
        boolean deleted = !video.exists() || video.delete();
        if (meta.exists()) meta.delete();
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (id.equals(prefs.getString(KEY_LAST_ID, ""))) prefs.edit().remove(KEY_LAST_ID).apply();
        return deleted;
    }

    public static JSObject readStatus(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean active = prefs.getBoolean(KEY_ACTIVE, false);
        long started = prefs.getLong(KEY_STARTED, 0L);
        JSObject out = new JSObject();
        out.put("state", prefs.getString(KEY_STATE, "idle")); out.put("active", active);
        if (started > 0) out.put("startedAt", started); else out.put("startedAt", JSONObject.NULL);
        out.put("elapsedMs", active && started > 0 ? Math.max(0, System.currentTimeMillis() - started) : 0);
        out.put("message", prefs.getString(KEY_MESSAGE, ""));
        String lastId = prefs.getString(KEY_LAST_ID, "");
        if (!lastId.isEmpty()) {
            File video = new File(recordingsDirectory(context), lastId + ".mp4");
            if (video.exists()) out.put("last", descriptorFromFile(video));
        }
        return out;
    }

    private String safeMessage(Exception error) {
        String message = error.getMessage();
        return message == null || message.trim().isEmpty() ? error.getClass().getSimpleName() : message;
    }
}
`;

fs.writeFileSync(path.join(javaDir, 'BuildMasterMatchRecorderPlugin.java'), plugin);
fs.writeFileSync(path.join(javaDir, 'BuildMasterScreenRecordService.java'), service);

let main = fs.existsSync(mainActivityPath) ? fs.readFileSync(mainActivityPath, 'utf8') : `package com.buildmaster.elitetatico;\n\nimport android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {\n    @Override public void onCreate(Bundle savedInstanceState) { super.onCreate(savedInstanceState); }\n}\n`;
if (!main.includes('registerPlugin(BuildMasterMatchRecorderPlugin.class);')) {
  if (main.includes('super.onCreate(savedInstanceState);')) main = main.replace('super.onCreate(savedInstanceState);', 'registerPlugin(BuildMasterMatchRecorderPlugin.class);\n        super.onCreate(savedInstanceState);');
  else throw new Error('MainActivity incompatível com o instalador do gravador de partidas.');
}
fs.writeFileSync(mainActivityPath, main);

let manifest = fs.readFileSync(manifestPath, 'utf8');
const permissions = [
  '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
  '<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />',
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />'
];
for (const permission of permissions) {
  if (!manifest.includes(permission)) manifest = manifest.replace(/<application\b/, `${permission}\n\n    <application`);
}
const serviceDeclaration = `        <service\n            android:name=".BuildMasterScreenRecordService"\n            android:exported="false"\n            android:stopWithTask="false"\n            android:foregroundServiceType="mediaProjection" />\n`;
if (!manifest.includes('android:name=".BuildMasterScreenRecordService"')) manifest = manifest.replace(/<\/application>/, `${serviceDeclaration}    </application>`);
fs.writeFileSync(manifestPath, manifest);
console.log('Treinador de Partidas v31.70 instalado: MediaProjection, serviço em primeiro plano e gravação privada local.');
