# The game runs entirely in the WebView; keep the activity and the JS bridge.
-keep class io.github.mpereira17uc.luna.** { *; }
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
