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

        // 2. Intersept URL (Tetap dipertahankan jika masih butuh panggil Intent RawBT)
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
                try {
                    val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                    bridge.context.startActivity(intent)
                } catch (e: ActivityNotFoundException) {
                    Toast.makeText(bridge.context, "Aplikasi pendukung tidak ditemukan", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    e.printStackTrace()
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
        try {
            customerPresentation?.dismiss()
        } catch (e: Throwable) {
            e.printStackTrace()
        }
        customerPresentation = null
        super.onStop()
    }

    private fun updateCustomerDisplay() {
        try {
            val dm = displayManager ?: return
            val displays = dm.getDisplays(DisplayManager.DISPLAY_CATEGORY_PRESENTATION)
            
            if (displays.isNotEmpty()) {
                val targetDisplay = displays[0]
                
                if (customerPresentation != null && customerPresentation?.display != targetDisplay) {
                    try {
                        customerPresentation?.dismiss()
                    } catch (e: Throwable) {
                        e.printStackTrace()
                    }
                    customerPresentation = null
                }
                
                if (customerPresentation == null) {
                    val mainUrl = bridge?.webView?.url ?: "http://localhost"
                    val targetUrl = try {
                        val uri = Uri.parse(mainUrl)
                        val scheme = uri.scheme ?: "http"
                        val host = uri.host ?: "localhost"
                        val port = if (uri.port != -1) ":${uri.port}" else ""
                        "$scheme://$host$port/customer-display"
                    } catch (e: Throwable) {
                        "http://localhost/customer-display"
                    }
                    
                    customerPresentation = CustomerDisplayPresentation(this, targetDisplay, targetUrl)
                    try {
                        customerPresentation?.show()
                    } catch (e: Throwable) {
                        e.printStackTrace()
                    }
                }
            } else {
                try {
                    customerPresentation?.dismiss()
                } catch (e: Throwable) {
                    e.printStackTrace()
                }
                customerPresentation = null
            }
        } catch (e: Throwable) {
            e.printStackTrace()
        }
    }
}