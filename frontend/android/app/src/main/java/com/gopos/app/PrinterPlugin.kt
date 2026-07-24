package com.gopos.app

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
        val packageName = "ru.a43.rawbt"
        val pm = context.packageManager
        var installed = false
        try {
            pm.getPackageInfo(packageName, 0)
            installed = true
        } catch (e: android.content.pm.PackageManager.NameNotFoundException) {
            installed = false
        }

        val ret = JSObject()
        ret.put("installed", installed)
        call.resolve(ret)
    }
}