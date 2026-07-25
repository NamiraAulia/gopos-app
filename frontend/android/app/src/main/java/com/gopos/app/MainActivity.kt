package com.gopos.app

import android.content.ActivityNotFoundException
import android.content.Intent
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.widget.Toast
import com.getcapacitor.BridgeActivity
import com.getcapacitor.BridgeWebViewClient

class MainActivity : BridgeActivity() {
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
}
