package com.gopos.app

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.hardware.display.DisplayManager
import android.net.Uri
import android.os.Bundle
import android.view.Display
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import android.app.Presentation
import com.getcapacitor.BridgeActivity
import com.getcapacitor.BridgeWebViewClient

class CustomerDisplayPresentation(context: Context, display: Display, private val targetUrl: String) : Presentation(context, display) {
    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        webView = WebView(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    return false
                }
            }
        }
        
        setContentView(webView!!)
        webView?.loadUrl(targetUrl)
    }

    override fun onStop() {
        webView?.destroy()
        webView = null
        super.onStop()
    }
}

class MainActivity : BridgeActivity() {
    private var displayManager: DisplayManager? = null
    private var customerPresentation: CustomerDisplayPresentation? = null

    private val displayListener = object : DisplayManager.DisplayListener {
        override fun onDisplayAdded(displayId: Int) {
            updateCustomerDisplay()
        }
        override fun onDisplayRemoved(displayId: Int) {
            updateCustomerDisplay()
        }
        override fun onDisplayChanged(displayId: Int) {
            // No action needed
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(PrinterPlugin::class.java)
        super.onCreate(savedInstanceState)

        bridge.webView.webViewClient = object : BridgeWebViewClient(bridge) {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return super.shouldOverrideUrlLoading(view, request)
                if (url.startsWith("intent:")) {
                    return handleIntent(url)
                }
                return super.shouldOverrideUrlLoading(view, request)
            }

            @Deprecated("Deprecated in Java")
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                if (url != null && url.startsWith("intent:")) {
                    return handleIntent(url)
                }
                return super.shouldOverrideUrlLoading(view, url)
            }

            private fun handleIntent(url: String): Boolean {
                // DEBUG - hapus setelah masalah print ditemukan
                val urlLength = url.length
                val first50 = if (url.length > 50) url.substring(0, 50) else url
                Toast.makeText(bridge.context, "URL Length: $urlLength\nPrefix: $first50", Toast.LENGTH_LONG).show()
                // DEBUG - hapus setelah masalah print ditemukan

                try {
                    val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)

                    // DEBUG - hapus setelah masalah print ditemukan
                    val dataStr = intent.dataString ?: intent.data?.toString() ?: "null"
                    android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                        Toast.makeText(bridge.context, "Intent Data:\n$dataStr", Toast.LENGTH_LONG).show()
                    }, 3500)
                    // DEBUG - hapus setelah masalah print ditemukan

                    bridge.context.startActivity(intent)
                } catch (e: ActivityNotFoundException) {
                    Toast.makeText(bridge.context, "RawBT tidak terinstall", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    e.printStackTrace()
                    Toast.makeText(bridge.context, "Gagal memproses print command", Toast.LENGTH_SHORT).show()
                }
                return true
            }
        }
    }

    override fun onStart() {
        super.onStart()
        displayManager = getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
        displayManager?.registerDisplayListener(displayListener, null)
        updateCustomerDisplay()
    }

    override fun onStop() {
        displayManager?.unregisterDisplayListener(displayListener)
        customerPresentation?.dismiss()
        customerPresentation = null
        super.onStop()
    }

    private fun updateCustomerDisplay() {
        val dm = displayManager ?: return
        val displays = dm.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION)
        
        if (displays.isNotEmpty()) {
            val targetDisplay = displays[0]
            
            // If already showing on a different display, dismiss it
            if (customerPresentation != null && customerPresentation?.display != targetDisplay) {
                customerPresentation?.dismiss()
                customerPresentation = null
            }
            
            if (customerPresentation == null) {
                // Determine origin of main webview to maintain same-origin for BroadcastChannel
                val mainUrl = bridge.webView.url ?: "http://localhost"
                val targetUrl = try {
                    val uri = Uri.parse(mainUrl)
                    val scheme = uri.scheme ?: "http"
                    val host = uri.host ?: "localhost"
                    val port = if (uri.port != -1) ":${uri.port}" else ""
                    "$scheme://$host$port/customer-display"
                } catch (e: Exception) {
                    "http://localhost/customer-display"
                }
                
                customerPresentation = CustomerDisplayPresentation(this, targetDisplay, targetUrl)
                try {
                    customerPresentation?.show()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        } else {
            // Dismiss if no presentation display is connected anymore
            customerPresentation?.dismiss()
            customerPresentation = null
        }
    }
}
