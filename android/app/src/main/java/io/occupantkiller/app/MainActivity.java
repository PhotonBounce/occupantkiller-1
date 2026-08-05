package io.occupantkiller.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

/**
 * Full-screen immersive WebView shell for Occupant Killer.
 *
 * Loads the deployed browser build (real https origin, so WebGL / DOM storage /
 * fetch all behave exactly as in Chrome). Keeps the screen on, hides the system
 * bars, and routes the hardware Back button to in-page history so a player can
 * back out of menus without leaving the app.
 */
public class MainActivity extends Activity {

    // Offline, self-contained build: the whole game is bundled under
    // app/src/main/assets/www/ and served over a real https origin by
    // WebViewAssetLoader (NOT file://, which would break fetch/localStorage/WebGL).
    private static final String GAME_URL =
            "https://appassets.androidplatform.net/assets/www/index.html";
    // Online fallback if this is ever reverted to a thin wrapper:
    // "https://photonbounce.github.io/occupantkiller-1/"
    private static final String ONLINE_FALLBACK_URL =
            "https://photonbounce.github.io/occupantkiller-1/";

    private WebView web;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // WebGL / heavy canvas games need hardware acceleration (set in manifest)
        // and a plain WebView filling the whole window.
        FrameLayout root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false); // let the game start audio
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            web.getSettings().setSafeBrowsingEnabled(false);
        }

        // Serves app/src/main/assets/** under https://appassets.androidplatform.net/assets/**
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                // Route bundled-asset requests (appassets host) to the local assets.
                return assetLoader.shouldInterceptRequest(req.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                String host = u.getHost();
                // Keep game navigation inside the WebView; hand external links to the OS.
                if (host != null && (host.equals("appassets.androidplatform.net")
                        || host.endsWith("github.io") || host.endsWith("occupantkiller.io"))) {
                    return false;
                }
                try {
                    startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, u));
                } catch (Exception ignored) { }
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest req,
                                        android.webkit.WebResourceError err) {
                // Offline build: only warn if the MAIN document fails to load. Missing
                // sub-resources (e.g. optional CDN fonts with no network) are expected
                // and must not trigger a false "failed to load" toast.
                if (req.isForMainFrame()) {
                    Toast.makeText(MainActivity.this,
                            "Game failed to load.", Toast.LENGTH_LONG).show();
                }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int p) { /* could drive a splash */ }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                // Game may request nothing; grant same-origin media if it ever does.
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(GAME_URL);
        }
    }

    private void hideSystemBars() {
        View d = getWindow().getDecorView();
        d.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
        hideSystemBars();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
