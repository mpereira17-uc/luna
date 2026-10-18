package io.github.mpereira17uc.luna;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import android.webkit.JavascriptInterface;

import java.io.File;
import java.io.FileOutputStream;

/** Lets the game share a picture of a run (window.LunaShare.shareImage) through Android's share sheet. */
final class ShareBridge {
    private final Activity activity;

    ShareBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void shareImage(String base64Png, String text) {
        try {
            byte[] png = Base64.decode(base64Png, Base64.DEFAULT);
            File dir = new File(activity.getCacheDir(), ShareProvider.DIR);
            if (!dir.isDirectory() && !dir.mkdirs()) return;
            try (FileOutputStream out = new FileOutputStream(new File(dir, ShareProvider.NAME))) {
                out.write(png);
            }
            Uri uri = Uri.parse("content://" + activity.getPackageName() + ".share/" + ShareProvider.NAME);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("image/png");
            send.putExtra(Intent.EXTRA_STREAM, uri);
            if (text != null && !text.isEmpty()) send.putExtra(Intent.EXTRA_TEXT, text);
            send.setClipData(ClipData.newRawUri("", uri));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, "Compartir partida");
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.runOnUiThread(() -> activity.startActivity(chooser));
        } catch (Exception ignored) {
            // A failed share just does nothing; the game keeps running.
        }
    }
}
