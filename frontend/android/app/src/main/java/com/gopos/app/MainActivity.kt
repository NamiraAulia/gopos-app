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
                try {
                    val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
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
