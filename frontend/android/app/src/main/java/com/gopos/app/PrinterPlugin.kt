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
                // Inisialisasi printer untuk mengecek status
                ThermalPrinter.init(context)
                
                ret.put("connected", true)
                ret.put("hasPermission", true)
                ret.put("message", "Printer Thermal Telpo Siap Gunakan")
                call.resolve(ret)
            } catch (e: TelpoException) {
                e.printStackTrace()
                ret.put("connected", false)
                ret.put("hasPermission", false)
                ret.put("message", "Gagal inisialisasi Telpo Printer: ${e.message}")
                call.resolve(ret)
            } catch (e: Exception) {
                e.printStackTrace()
                ret.put("connected", false)
                ret.put("hasPermission", false)
                ret.put("message", "Error: ${e.message}")
                call.resolve(ret)
            } finally {
                try {
                    ThermalPrinter.stop()
                } catch (e: Exception) {
                    // Ignore
                }
            }
        }.start()
    }

    @PluginMethod
    fun printText(call: PluginCall) {
        val textToPrint = call.getString("text")
        if (textToPrint.isNullOrEmpty()) {
            call.reject("Teks tidak boleh kosong")
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

            } catch (e: TelpoException) {
                e.printStackTrace()
                call.reject("Telpo Printer Error: ${e.message}")
            } catch (e: Exception) {
                e.printStackTrace()
                call.reject("Error saat mencetak: ${e.message}")
            } finally {
                // Selalu hentikan/close session printer setelah selesai
                try {
                    ThermalPrinter.stop()
                } catch (e: Exception) {
                    // Ignore
                }
            }
        }.start()
    }
}