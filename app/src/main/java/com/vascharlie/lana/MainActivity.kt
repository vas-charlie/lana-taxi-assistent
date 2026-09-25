package com.vascharlie.lana

import android.Manifest
import android.app.Activity
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
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
    private var pendingNavigation: String? = null
    private var locationManager: LocationManager? = null
    private var locationListener: LocationListener? = null

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
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            pendingNavigation = destination
            requestPermissions(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ),
                43
            )
            return
        }

        locationManager = getSystemService(LOCATION_SERVICE) as LocationManager
        val lm = locationManager ?: return launchGoogleMaps(destination)

        val last = try {
            listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
                .mapNotNull { provider ->
                    if (lm.isProviderEnabled(provider)) lm.getLastKnownLocation(provider) else null
                }
                .maxByOrNull { it.time }
        } catch (_: SecurityException) {
            null
        }

        if (last != null && System.currentTimeMillis() - last.time < 15_000L) {
            launchGoogleMaps(destination)
            return
        }

        pendingNavigation = destination
        val listener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                stopLocationWait()
                val target = pendingNavigation
                pendingNavigation = null
                if (target != null) launchGoogleMaps(target)
            }
        }
        locationListener = listener

        try {
            if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0L, 0f, listener, mainLooper)
            }
            if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                lm.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0L, 0f, listener, mainLooper)
            }
        } catch (_: SecurityException) {
            stopLocationWait()
            launchGoogleMaps(destination)
            return
        }

        webView.postDelayed({
            if (pendingNavigation != null) {
                val target = pendingNavigation
                pendingNavigation = null
                stopLocationWait()
                if (target != null) launchGoogleMaps(target)
            }
        }, 2500L)
    }

    private fun stopLocationWait() {
        val lm = locationManager
        val listener = locationListener
        if (lm != null && listener != null) {
            try { lm.removeUpdates(listener) } catch (_: SecurityException) {}
        }
        locationListener = null
    }

    private fun launchGoogleMaps(destination: String) {
        val mapsUrl = "https://www.google.com/maps/dir/?api=1" +
            "&destination=" + Uri.encode(destination) +
            "&travelmode=driving" +
            "&dir_action=navigate"

        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(mapsUrl)).apply {
            setPackage("com.google.android.apps.maps")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra(Intent.EXTRA_REFERRER_NAME, "android-app://$packageName")
        }

        try {
            startActivity(intent)
        } catch (_: Exception) {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(mapsUrl)))
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
            override fun onError(e: Int) { if (listening && e != SpeechRecognizer.ERROR_CLIENT) continueNativeListening() }
            override fun onResults(b: Bundle?) {
                val result = b?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
                if (result.isNotBlank()) {
                    val js = org.json.JSONObject.quote(result)
                    webView.evaluateJavascript("window.__lanaNativeSpeech && window.__lanaNativeSpeech($js)", null)
                }
                if (listening) continueNativeListening()
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

    private fun continueNativeListening() {
        if (!listening) return
        speechRecognizer?.destroy()
        speechRecognizer = null
        listening = false
        startNativeListening()
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

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 43) {
            val target = pendingNavigation
            pendingNavigation = null
            if (grantResults.any { it == PackageManager.PERMISSION_GRANTED } && target != null) {
                launchGoogleNavigation(target)
            } else if (target != null) {
                launchGoogleMaps(target)
            }
        }
    }

    override fun onDestroy() {
        stopLocationWait()
        stopNativeListening()
        webView.destroy()
        super.onDestroy()
    }
}
