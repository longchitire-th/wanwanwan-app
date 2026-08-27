package th.wanwanwan.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final int SIGN_IN_REQUEST = 7102;
    private static final String GOOGLE_CLIENT_ID = "799188276706-purvn0f19ie56k58vjn3107gm9cb6thq.apps.googleusercontent.com";
    private WebView webView;
    private GoogleSignInClient googleClient;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        setContentView(webView);
        webView.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(0, 0, 0, insets.getSystemWindowInsetBottom());
            return insets;
        });
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        GoogleSignInOptions googleOptions = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(GOOGLE_CLIENT_ID).requestEmail().build();
        googleClient = GoogleSignIn.getClient(this, googleOptions);
        webView.addJavascriptInterface(new AndroidAuthBridge(), "AndroidAuth");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("longchitire-th.github.io".equals(uri.getHost())) return false;
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }
        });
        webView.loadUrl("https://longchitire-th.github.io/wanwanwan-app/");
    }

    public class AndroidAuthBridge {
        @JavascriptInterface public void signIn() {
            runOnUiThread(() -> startActivityForResult(googleClient.getSignInIntent(), SIGN_IN_REQUEST));
        }

        @JavascriptInterface public void signOut() {
            runOnUiThread(() -> googleClient.signOut());
        }
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != SIGN_IN_REQUEST) return;
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            String token = task.getResult(ApiException.class).getIdToken();
            if (token != null) webView.evaluateJavascript("window.receiveNativeGoogleToken(" + JSONObject.quote(token) + ")", null);
        } catch (ApiException error) {
            webView.evaluateJavascript("document.getElementById('loginError').textContent='เข้าสู่ระบบ Google ไม่สำเร็จ'", null);
        }
    }

    @Override public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }
}
