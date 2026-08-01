package com.gopos.app

import android.content.Context
import android.hardware.usb.UsbManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.telpo.tps550.api.printer.ThermalPrinter

@CapacitorPlugin(name = "Printer")
class PrinterPlugin : Plugin() {

    @PluginMethod
    fun checkPrinterStatus(call: PluginCall) {
        val ret = JSObject()
        Thread {
            // 1. Coba inisialisasi Hardware Telpo Internal
            try {
                ThermalPrinter.start()
                val status = ThermalPrinter.checkStatus()
                
                ret.put("connected", true)
                ret.put("hasPermission", true)
                ret.put("status", status)
                ret.put("message", "Printer Internal Telpo Siap Gunakan (Status: $status)")
                call.resolve(ret)
                return@Thread
            } catch (e: Throwable) {
                // Ignore & lanjut ke fallback USB
            } finally {
                try {
                    ThermalPrinter.stop()
                } catch (e: Throwable) {
                    // Ignore
                }
            }

            // 2. Fallback: Cek USB Host Manager untuk printer USB OTG / Eksternal
            try {
                val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
                val deviceList = usbManager.deviceList
                if (deviceList.isNotEmpty()) {
                    val usbNames = deviceList.values.joinToString { it.deviceName }
                    ret.put("connected", true)
                    ret.put("hasPermission", true)
                    ret.put("message", "Printer USB Terhubung ($usbNames)")
                    call.resolve(ret)
                    return@Thread
                }
            } catch (e: Throwable) {
                e.printStackTrace()
            }

            // 3. Status jika bukan Telpo & USB tidak terdeteksi
            ret.put("connected", false)
            ret.put("hasPermission", false)
            ret.put("message", "Printer Internal Telpo / USB Host tidak terdeteksi. Gunakan koneksi RawBT untuk Bluetooth / USB Printer.")
            call.resolve(ret)
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
        val textParam = call.getString("text")
        val receiptData = call.getString("receiptData")

        var textToPrint = textParam
        if (textToPrint.isNullOrEmpty() && !receiptData.isNullOrEmpty()) {
            textToPrint = try {
                val bytes = android.util.Base64.decode(receiptData, android.util.Base64.DEFAULT)
                val cleanedBytes = bytes.filter { it in 32..126 || it == 10.toByte() || it == 13.toByte() || it == 9.toByte() }.toByteArray()
                val decoded = String(cleanedBytes, Charsets.UTF_8)
                if (decoded.trim().isNotEmpty()) decoded else receiptData
            } catch (e: Exception) {
                receiptData
            }
        }

        if (textToPrint.isNullOrEmpty()) {
            call.reject("Data cetak tidak boleh kosong")
            return
        }

        Thread {
            try {
                // 1. Inisialisasi SDK Telpo
                ThermalPrinter.start()
                ThermalPrinter.clearString()

                // 2. Formatting Teks & Tambahkan Data
                ThermalPrinter.setAlgin(ThermalPrinter.ALGIN_LEFT)
                ThermalPrinter.setFontSize(24)
                ThermalPrinter.addString(textToPrint + "\n\n")

                // 3. Eksekusi Cetak & Feed Kertas
                ThermalPrinter.printString()
                ThermalPrinter.walkPaper(30)

                val ret = JSObject()
                ret.put("success", true)
                ret.put("message", "Berhasil mencetak struk via Telpo Thermal Printer!")
                call.resolve(ret)

            } catch (e: Throwable) {
                e.printStackTrace()
                call.reject("Telpo Printer Error: ${e.message ?: "Perangkat tidak mendukung Telpo Printer"}")
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


