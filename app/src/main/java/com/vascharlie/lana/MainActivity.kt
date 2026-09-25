package com.vascharlie.lana

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private var speechRecognizer: SpeechRecognizer? = null
    private var listening = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.mediaPlaybackRequiresUserGesture = false

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (request.url.scheme == "lana" && request.url.host == "navigate") {
                    request.url.getQueryParameter("destination")?.takeIf { it.isNotBlank() }?.let(::launchGoogleNavigation)
                    return true
                }
                return false
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread { request.grant(request.resources) }
            }
        }
        webView.addJavascriptInterface(NativeBridge(), "AndroidLana")
        setContentView(webView)

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), 42)
        }
        webView.loadUrl("https://lana-taxi-assistent.vercel.app/")
    }

    private fun launchGoogleNavigation(destination: String) {
        val uri = Uri.parse("google.navigation:q=${Uri.encode(destination)}&mode=d")
        val intent = Intent(Intent.ACTION_VIEW, uri).apply {
            setPackage("com.google.android.apps.maps")
        }
        try {
            startActivity(intent)
        } catch (_: Exception) {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(
                "https://www.google.com/maps/dir/?api=1&destination=${Uri.encode(destination)}&travelmode=driving&dir_action=navigate"
            )))
        }
    }

    private fun startNativeListening() {
        if (listening || checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) return
        if (!SpeechRecognizer.isRecognitionAvailable(this)) return
        listening = true
        speechRecognizer?.destroy()
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
        speechRecognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(p: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(v: Float) {}
            override fun onBufferReceived(b: ByteArray?) {}
            override fun onEndOfSpeech() {}
            override fun onPartialResults(b: Bundle?) {}
            override fun onEvent(t: Int, p: Bundle?) {}
            override fun onError(e: Int) { if (listening && e != SpeechRecognizer.ERROR_CLIENT) startNativeListening() }
            override fun onResults(b: Bundle?) {
                val result = b?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
                if (result.isNotBlank()) {
                    val js = org.json.JSONObject.quote(result)
                    webView.evaluateJavascript("window.__lanaNativeSpeech && window.__lanaNativeSpeech($js)", null)
                }
                if (listening) startNativeListening()
            }
        })
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hr-HR")
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "hr-HR")
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
        }
        speechRecognizer?.startListening(intent)
    }

    private fun stopNativeListening() {
        listening = false
        speechRecognizer?.stopListening()
        speechRecognizer?.destroy()
        speechRecognizer = null
    }

    inner class NativeBridge {
        @JavascriptInterface fun navigate(destination: String) = runOnUiThread { launchGoogleNavigation(destination) }
        @JavascriptInterface fun startListening() = runOnUiThread { startNativeListening() }
        @JavascriptInterface fun stopListening() = runOnUiThread { stopNativeListening() }
    }

    override fun onDestroy() {
        stopNativeListening()
        webView.destroy()
        super.onDestroy()
    }
}
