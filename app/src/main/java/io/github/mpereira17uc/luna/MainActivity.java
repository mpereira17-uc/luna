package io.github.mpereira17uc.luna;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

import org.json.JSONObject;

import java.util.concurrent.atomic.AtomicBoolean;

/** Hosts the game (assets/index.html) in a full-screen WebView, plus the optional rewarded ads. */
public class MainActivity extends Activity {
    private WebView web;
    private OnBackInvokedCallback backCallback;

    private final Handler main = new Handler(Looper.getMainLooper());
    private final AtomicBoolean adsStarted = new AtomicBoolean(false);
    private ConsentInformation consent;
    private volatile RewardedAd rewarded;
    private volatile boolean privacyRequired;
    private boolean adLoading;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#070E20"));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setVerticalScrollBarEnabled(false);
        web.setHorizontalScrollBarEnabled(false);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setTextZoom(100);
        web.addJavascriptInterface(new ShareBridge(this), "LunaShare");
        // the game keeps the screen on while you play (and lets it sleep in the menus), and saves here too
        web.addJavascriptInterface(new HostBridge(this), "LunaHost");

        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // The game never navigates; keep everything inside the bundled page.
                return !request.getUrl().toString().startsWith("file:///android_asset/");
            }
        });

        web.addJavascriptInterface(new AdsBridge(), "LunaAds");

        setContentView(web);
        if (state != null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/index.html");

        if (Build.VERSION.SDK_INT >= 33) {
            backCallback = this::handleBack;
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, backCallback);
        }
        immersive();
        setupAds();
    }

    /** Asks for ad consent where the law needs it (Google's UMP form), then starts AdMob. */
    private void setupAds() {
        consent = UserMessagingPlatform.getConsentInformation(this);
        consent.requestConsentInfoUpdate(this, new ConsentRequestParameters.Builder().build(),
                () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(this, formError -> {
                    privacyRequired = consent.getPrivacyOptionsRequirementStatus()
                            == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;
                    if (consent.canRequestAds()) startAds();
                }),
                requestError -> {
                    if (consent.canRequestAds()) startAds();
                });
        // consent from an earlier launch is enough to start right away
        if (consent.canRequestAds()) startAds();
    }

    private void startAds() {
        if (!adsStarted.compareAndSet(false, true)) return;
        new Thread(() -> MobileAds.initialize(this, status -> main.post(this::loadAd))).start();
    }

    private void loadAd() {
        if (rewarded != null || adLoading || isDestroyed()) return;
        adLoading = true;
        RewardedAd.load(this, getString(R.string.admob_rewarded), new AdRequest.Builder().build(),
                new RewardedAdLoadCallback() {
                    @Override
                    public void onAdLoaded(RewardedAd ad) {
                        adLoading = false;
                        rewarded = ad;
                        js("window.lunaAdReady && window.lunaAdReady()");
                    }

                    @Override
                    public void onAdFailedToLoad(LoadAdError error) {
                        adLoading = false;
                        main.postDelayed(MainActivity.this::loadAd, 30_000);
                    }
                });
    }

    /** Shows the loaded ad and tells the game whether the player watched it to the end. */
    private void showAd(String tag) {
        RewardedAd ad = rewarded;
        if (ad == null) {
            adDone(tag, false);
            loadAd();
            return;
        }
        rewarded = null;
        final boolean[] earned = {false};
        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                adDone(tag, earned[0]);
                loadAd();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(AdError error) {
                adDone(tag, false);
                loadAd();
            }
        });
        ad.show(this, reward -> earned[0] = true);
    }

    private void adDone(String tag, boolean ok) {
        js("window.lunaAdDone && window.lunaAdDone(" + JSONObject.quote(tag) + "," + ok + ")");
    }

    private void js(String code) {
        main.post(() -> {
            if (!isDestroyed()) web.evaluateJavascript(code, null);
        });
    }

    /** What the game page can call as window.LunaAds. */
    private class AdsBridge {
        @JavascriptInterface
        public boolean ready() {
            return rewarded != null;
        }

        @JavascriptInterface
        public void show(String tag) {
            main.post(() -> showAd(tag));
        }

        @JavascriptInterface
        public boolean privacyRequired() {
            return privacyRequired;
        }

        @JavascriptInterface
        public void privacy() {
            main.post(() -> UserMessagingPlatform.showPrivacyOptionsForm(MainActivity.this, formError -> { }));
        }
    }

    /** Lets the game decide: pause, close a menu, or (on the title screen) leave the app. */
    private void handleBack() {
        web.evaluateJavascript("(window.lunaBack ? window.lunaBack() : false)", result -> {
            if (!"true".equals(result)) finish();
        });
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        handleBack();
    }

    @SuppressWarnings("deprecation")
    private void immersive() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // the notification shade, a call or a system dialog over the game pauses it
        if (hasFocus) {
            immersive();
            web.evaluateJavascript("window.lunaResume && window.lunaResume()", null);
        } else {
            web.evaluateJavascript("window.lunaPause && window.lunaPause()", null);
        }
    }

    @Override
    protected void onPause() {
        web.evaluateJavascript("window.lunaPause && window.lunaPause()", null);
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        web.evaluateJavascript("window.lunaResume && window.lunaResume()", null);
        immersive();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        if (Build.VERSION.SDK_INT >= 33 && backCallback != null) {
            getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(backCallback);
        }
        main.removeCallbacksAndMessages(null);
        web.destroy();
        super.onDestroy();
    }
}
