package com.eviltower.two;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Обёртка вокруг веб-игры: один WebView на весь экран, игра лежит в assets/www.
 *
 * Файлы отдаются не по file://, а с виртуального https-адреса {@link #ORIGIN}: под file://
 * в современном WebView недоступны localStorage и модули ES, а в localStorage хранится весь
 * прогресс игрока. Перехват запросов ({@link AssetClient}) подменяет сеть чтением из APK,
 * поэтому разрешение на интернет приложению не нужно.
 */
public class MainActivity extends Activity {

  /** Виртуальный источник: домен .localhost считается безопасным, но наружу не ходит. */
  private static final String ORIGIN = "https://eviltower.localhost";
  /** Папка внутри assets, куда `npm run apk:assets` кладёт содержимое dist/. */
  private static final String ASSETS_ROOT = "www";

  private static final Map<String, String> MIME = new HashMap<>();

  static {
    MIME.put("html", "text/html");
    MIME.put("js", "text/javascript");
    MIME.put("mjs", "text/javascript");
    MIME.put("css", "text/css");
    MIME.put("json", "application/json");
    MIME.put("png", "image/png");
    MIME.put("jpg", "image/jpeg");
    MIME.put("jpeg", "image/jpeg");
    MIME.put("webp", "image/webp");
    MIME.put("gif", "image/gif");
    MIME.put("svg", "image/svg+xml");
    MIME.put("ico", "image/x-icon");
    MIME.put("woff", "font/woff");
    MIME.put("woff2", "font/woff2");
    MIME.put("ttf", "font/ttf");
    MIME.put("txt", "text/plain");
    MIME.put("map", "application/json");
  }

  private WebView web;

  @SuppressLint("SetJavaScriptEnabled")
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

    web = new WebView(this);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    // Процедурный звук игры должен запускаться без отдельного «разрешающего» касания.
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setTextZoom(100);
    s.setSupportZoom(false);
    s.setBuiltInZoomControls(false);
    s.setDisplayZoomControls(false);
    s.setCacheMode(WebSettings.LOAD_NO_CACHE);
    // Всё уже внутри APK — доступ к файловой системе и внешним ресурсам не нужен.
    s.setAllowFileAccess(false);
    s.setAllowContentAccess(false);

    web.setOverScrollMode(View.OVER_SCROLL_NEVER);
    web.setVerticalScrollBarEnabled(false);
    web.setHorizontalScrollBarEnabled(false);
    web.setBackgroundColor(0xFF0D0F14);
    web.setWebViewClient(new AssetClient());

    if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
      WebView.setWebContentsDebuggingEnabled(true);
    }

    setContentView(web);
    hideSystemBars();
    web.loadUrl(ORIGIN + "/index.html");
  }

  // ---------------------------------------------------------------- отдача файлов из APK

  private final class AssetClient extends WebViewClient {
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
      Uri uri = request.getUrl();
      String origin = uri.getScheme() + "://" + uri.getAuthority();
      if (!ORIGIN.equals(origin)) return null;
      return serve(uri.getPath());
    }

    /** Наружу игра не ходит; если что-то попробует — просто не открываем. */
    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
      return !ORIGIN.equals(request.getUrl().getScheme() + "://" + request.getUrl().getAuthority());
    }
  }

  private WebResourceResponse serve(String path) {
    String clean = (path == null || path.isEmpty() || "/".equals(path)) ? "index.html" : path;
    if (clean.startsWith("/")) clean = clean.substring(1);
    if (clean.contains("..")) return notFound();

    try {
      InputStream in = getAssets().open(ASSETS_ROOT + "/" + clean);
      WebResourceResponse response = new WebResourceResponse(mimeOf(clean), "UTF-8", in);
      Map<String, String> headers = new HashMap<>();
      headers.put("Cache-Control", "no-store");
      response.setResponseHeaders(headers);
      return response;
    } catch (IOException e) {
      return notFound();
    }
  }

  private WebResourceResponse notFound() {
    WebResourceResponse response = new WebResourceResponse("text/plain", "UTF-8", null);
    response.setStatusCodeAndReasonPhrase(404, "Not Found");
    return response;
  }

  private static String mimeOf(String name) {
    int dot = name.lastIndexOf('.');
    if (dot < 0) return "application/octet-stream";
    String ext = name.substring(dot + 1).toLowerCase(Locale.ROOT);
    String mime = MIME.get(ext);
    return mime != null ? mime : "application/octet-stream";
  }

  // ---------------------------------------------------------------- полноэкранный режим и жизненный цикл

  @SuppressWarnings("deprecation")
  private void hideSystemBars() {
    getWindow().getDecorView().setSystemUiVisibility(
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

  /** Сворачивание должно глушить звук и останавливать анимации — как того требует и сама игра. */
  @Override
  protected void onPause() {
    super.onPause();
    if (web != null) web.onPause();
  }

  @Override
  protected void onResume() {
    super.onResume();
    if (web != null) web.onResume();
  }

  @Override
  protected void onDestroy() {
    if (web != null) {
      web.destroy();
      web = null;
    }
    super.onDestroy();
  }

  @SuppressWarnings("deprecation")
  @Override
  public void onBackPressed() {
    // Игра — одна страница: «назад» закрывает приложение, а не выкидывает на пустой экран.
    if (web != null && web.canGoBack()) web.goBack();
    else super.onBackPressed();
  }
}
