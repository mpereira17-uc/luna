package io.github.mpereira17uc.luna;

import android.app.Activity;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * What the game asks of the app (window.LunaHost): keep the screen on only while a run is going, and keep a
 * copy of the save in the app's own storage, written whole every time, so progress survives the app being
 * closed right after a change (and travels with Android's backup).
 */
final class HostBridge {
    private static final String SAVE = "luna-save.json";
    private final Activity activity;

    HostBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void keepAwake(boolean on) {
        activity.runOnUiThread(() -> {
            if (on) activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        });
    }

    @JavascriptInterface
    public synchronized void saveWrite(String json) {
        if (json == null || json.isEmpty()) return;
        File dir = activity.getFilesDir(), tmp = new File(dir, SAVE + ".tmp"), dst = new File(dir, SAVE);
        try (FileOutputStream out = new FileOutputStream(tmp)) {
            out.write(json.getBytes(StandardCharsets.UTF_8));
            out.getFD().sync();
        } catch (IOException e) {
            return;
        }
        // the old copy is replaced only once the new one is safely written
        if (!tmp.renameTo(dst)) tmp.delete();
    }

    @JavascriptInterface
    public synchronized String saveRead() {
        File f = new File(activity.getFilesDir(), SAVE);
        if (!f.isFile()) return "";
        try (FileInputStream in = new FileInputStream(f)) {
            byte[] buf = new byte[(int) f.length()];
            int n = 0;
            while (n < buf.length) {
                int r = in.read(buf, n, buf.length - n);
                if (r < 0) break;
                n += r;
            }
            return new String(buf, 0, n, StandardCharsets.UTF_8);
        } catch (IOException e) {
            return "";
        }
    }
}
