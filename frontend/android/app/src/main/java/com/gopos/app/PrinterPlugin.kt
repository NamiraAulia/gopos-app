package com.gopos.app

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.telpo.tps550.api.printer.ThermalPrinter
import com.telpo.tps550.api.TelpoException

@CapacitorPlugin(name = "Printer")
class PrinterPlugin : Plugin() {

    @PluginMethod
    fun checkPrinterStatus(call: PluginCall) {
        val ret = JSObject()
        Thread {
            try {
                // Inisialisasi printer untuk mengecek status secara aman
                ThermalPrinter.init(context)
                
                ret.put("connected", true)
                ret.put("hasPermission", true)
                ret.put("message", "Printer Thermal Telpo Siap Gunakan")
                call.resolve(ret)
            } catch (e: Throwable) {
                e.printStackTrace()
                ret.put("connected", false)
                ret.put("hasPermission", false)
                ret.put("message", "Gagal inisialisasi Telpo Printer (Perangkat tidak mendukung): ${e.message ?: "Native Lib/Hardware error"}")
                call.resolve(ret)
            } finally {
                try {
                    ThermalPrinter.stop()
                } catch (e: Throwable) {
                    // Ignore
                }
            }
        }.start()
    }

    @PluginMethod
    fun checkRawBTInstalled(call: PluginCall) {
        val ret = JSObject()
        try {
            val pm = context.packageManager
            pm.getPackageInfo("ru.a402d.rawbtprinter", 0)
            ret.put("installed", true)
        } catch (e: Throwable) {
            ret.put("installed", false)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun printReceipt(call: PluginCall) {
        val receiptData = call.getString("receiptData")
        val textToPrint = call.getString("text") ?: receiptData

        if (textToPrint.isNullOrEmpty()) {
            call.reject("Data cetak tidak boleh kosong")
            return
        }

        Thread {
            try {
                // 1. Inisialisasi SDK Telpo
                ThermalPrinter.init(context)
                ThermalPrinter.clear()

                // 2. Formatting Teks & Tambahkan Data
                ThermalPrinter.setAligh(ThermalPrinter.ALIGH_MIDDLE)
                ThermalPrinter.setTextSize(25)
                ThermalPrinter.addString(textToPrint + "\n\n")

                // 3. Eksekusi Cetak & Feed Kertas
                ThermalPrinter.printString()
                ThermalPrinter.walkPaper(30)

                val ret = JSObject()
                ret.put("success", true)
                ret.put("message", "Berhasil mencetak struk!")
                call.resolve(ret)

            } catch (e: Throwable) {
                e.printStackTrace()
                call.reject("Gagal mencetak secara native: ${e.message ?: "Perangkat tidak mendukung Telpo Printer"}")
            } finally {
                // Selalu hentikan/close session printer setelah selesai
                try {
                    ThermalPrinter.stop()
                } catch (e: Throwable) {
                    // Ignore
                }
            }
        }.start()
    }

    @PluginMethod
    fun printText(call: PluginCall) {
        printReceipt(call)
    }
}