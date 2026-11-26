package com.naatlabs.kukin;

import android.graphics.Color;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

import java.util.Locale;

/**
 * Pantalla completa (edge-to-edge) y teclado.
 *
 * - La WebView ocupa toda la pantalla, también detrás de la barra de estado y la de gestos.
 * - El tamaño real de esas barras se pasa a CSS como --safe-top / --safe-bottom / --safe-left / --safe-right
 *   (en px de CSS), para que la app deje el espacio justo.
 * - Cuando aparece el teclado, la WebView se encoge hasta el borde del teclado (lo que hacía adjustResize
 *   antes de Android 15), así el campo enfocado queda visible. Además se agrega la clase "keyboard-open"
 *   al <html> para ocultar la barra inferior mientras se escribe.
 */
public class MainActivity extends BridgeActivity {

    private volatile String insetsJson = "{\"top\":0,\"bottom\":0,\"left\":0,\"right\":0,\"keyboard\":false}";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        WebView webView = getBridge().getWebView();
        webView.addJavascriptInterface(new InsetsBridge(), "KukinNative");

        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            boolean keyboardOpen = windowInsets.isVisible(WindowInsetsCompat.Type.ime()) && ime.bottom > 0;

            // El teclado tapa la barra de gestos: la WebView termina donde empieza el teclado
            ViewGroup.MarginLayoutParams lp = (ViewGroup.MarginLayoutParams) v.getLayoutParams();
            int bottomMargin = keyboardOpen ? ime.bottom : 0;
            if (lp.bottomMargin != bottomMargin || lp.topMargin != 0 || lp.leftMargin != 0 || lp.rightMargin != 0) {
                lp.setMargins(0, 0, 0, bottomMargin);
                v.setLayoutParams(lp);
            }

            float density = getResources().getDisplayMetrics().density;
            float top = bars.top / density;
            float bottom = keyboardOpen ? 0 : bars.bottom / density;
            float left = bars.left / density;
            float right = bars.right / density;

            insetsJson = String.format(Locale.US,
                "{\"top\":%.1f,\"bottom\":%.1f,\"left\":%.1f,\"right\":%.1f,\"keyboard\":%b}",
                top, bottom, left, right, keyboardOpen);
            pushInsets((WebView) v);

            return WindowInsetsCompat.CONSUMED;
        });
    }

    private void pushInsets(WebView webView) {
        String js = "window.__kukinApplyInsets && window.__kukinApplyInsets(" + insetsJson + ");";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    /** La app lee los valores al arrancar (por si la página carga después del primer cálculo). */
    private class InsetsBridge {
        @JavascriptInterface
        public String getInsets() {
            return insetsJson;
        }
    }
}
