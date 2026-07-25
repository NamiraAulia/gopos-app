package com.gopos.app

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "Printer")
class PrinterPlugin : Plugin() {

    @PluginMethod
    fun printReceipt(call: PluginCall) {
        val receiptData = call.getString("receiptData")
        if (receiptData.isNullOrEmpty()) {
            call.reject("receiptData tidak boleh kosong")
            return
        }

        // TODO: ganti dengan SDK SmartLogic setelah diterima dari vendor
        // Contoh integrasi SDK vendor SmartLogic POS M10:
        // SmartLogicPrinterSDK.print(receiptData)

        val ret = JSObject()
        ret.put("success", true)
        ret.put("message", "Struk berhasil dicetak (dummy response SmartLogic POS M10)")
        call.resolve(ret)
    }

    @PluginMethod
    fun checkPrinterStatus(call: PluginCall) {
        // TODO: ganti dengan SDK SmartLogic setelah diterima dari vendor
        // Contoh integrasi SDK vendor SmartLogic POS M10:
        // val isPrinterReady = SmartLogicPrinterSDK.checkStatus()

        val ret = JSObject()
        ret.put("connected", true)
        ret.put("message", "Printer thermal internal siap")
        call.resolve(ret)
    }

    @PluginMethod
    fun checkRawBTInstalled(call: PluginCall) {
        val packageName = "ru.a402d.rawbtprinter"
        val pm = context.packageManager
        var installed = false
        
        try {
            // Method 1: Direct package info query with API Tiramisu (Android 13+) compatibility
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                pm.getPackageInfo(packageName, 0)
            }
            installed = true
        } catch (e: PackageManager.NameNotFoundException) {
            // Method 2: Intent-resolution fallback if getPackageInfo is restricted
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("intent:#Intent;scheme=rawbt;package=$packageName;end"))
                val resolveInfo = pm.resolveActivity(intent, 0)
                if (resolveInfo != null) {
                    installed = true
                }
            } catch (ex: Exception) {
                installed = false
            }
        }

        val ret = JSObject()
        ret.put("installed", installed)
        call.resolve(ret)
    }
}