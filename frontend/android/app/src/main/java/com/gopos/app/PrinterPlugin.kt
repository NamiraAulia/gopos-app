package com.gopos.app

import android.content.Context
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import android.util.Base64
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
            // 1. Cek USB Host Manager untuk printer GD32-USB_Printer (VID: 10473, PID: 653)
            try {
                val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
                val deviceList = usbManager.deviceList
                
                val exactDevice = deviceList.values.find { it.vendorId == 10473 && it.productId == 653 }
                    ?: deviceList.values.find { it.vendorId == 10473 }
                    ?: deviceList.values.firstOrNull()

                if (exactDevice != null) {
                    val hasPerm = usbManager.hasPermission(exactDevice)
                    ret.put("connected", true)
                    ret.put("hasPermission", hasPerm)
                    ret.put("message", "Printer GD32-USB_Printer Terdeteksi (${exactDevice.deviceName}, VID: ${exactDevice.vendorId}, PID: ${exactDevice.productId}, Permission: $hasPerm)")
                    call.resolve(ret)
                    return@Thread
                }
            } catch (e: Throwable) {
                e.printStackTrace()
            }

            // 2. Fallback: Coba inisialisasi Hardware Telpo Internal
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
                // Ignore
            } finally {
                try {
                    ThermalPrinter.stop()
                } catch (e: Throwable) {
                    // Ignore
                }
            }

            // 3. Status jika bukan USB GD32 & Telpo
            ret.put("connected", false)
            ret.put("hasPermission", false)
            ret.put("message", "Printer GD32-USB_Printer / Telpo tidak terdeteksi.")
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

        if (textParam.isNullOrEmpty() && receiptData.isNullOrEmpty()) {
            call.reject("Data cetak tidak boleh kosong")
            return
        }

        Thread {
            // -------------------------------------------------------------
            // STRATEGI 1: Direct Android USB Host Bulk Transfer (Utama untuk GD32-USB_Printer VID 10473 PID 653)
            // -------------------------------------------------------------
            try {
                val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
                val deviceList = usbManager.deviceList

                if (deviceList.isNotEmpty()) {
                    // a. Cari device persis VID 10473 PID 653
                    val device = deviceList.values.find { it.vendorId == 10473 && it.productId == 653 }
                        ?: deviceList.values.find { it.vendorId == 10473 }
                        ?: deviceList.values.firstOrNull()

                    if (device != null) {
                        // d. Request permission via UsbManager bila belum ada
                        if (!usbManager.hasPermission(device)) {
                            try {
                                val flags = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                                    android.app.PendingIntent.FLAG_MUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT
                                } else {
                                    android.app.PendingIntent.FLAG_UPDATE_CURRENT
                                }
                                val permissionIntent = android.app.PendingIntent.getBroadcast(
                                    context, 0, android.content.Intent("com.gopos.app.USB_PERMISSION"), flags
                                )
                                usbManager.requestPermission(device, permissionIntent)
                            } catch (permErr: Throwable) {
                                permErr.printStackTrace()
                            }
                        }

                        // b. Cari endpoint OUT (USB_DIR_OUT & USB_ENDPOINT_XFER_BULK) - Address 0x01
                        var targetEndpoint: UsbEndpoint? = null
                        var targetInterface: UsbInterface? = null

                        for (i in 0 until device.interfaceCount) {
                            val intf = device.getInterface(i)
                            for (j in 0 until intf.endpointCount) {
                                val ep = intf.getEndpoint(j)
                                if (ep.direction == UsbConstants.USB_DIR_OUT && ep.type == UsbConstants.USB_ENDPOINT_XFER_BULK) {
                                    targetEndpoint = ep
                                    targetInterface = intf
                                    break
                                }
                            }
                            if (targetEndpoint != null) break
                        }

                        // Siapkan payload bytes ESC/POS
                        val bytesToSend: ByteArray? = when {
                            !receiptData.isNullOrEmpty() -> {
                                try { Base64.decode(receiptData, Base64.DEFAULT) } catch (e: Exception) { null }
                            }
                            !textParam.isNullOrEmpty() -> {
                                val builder = mutableListOf<Byte>()
                                builder.addAll(listOf(0x1B.toByte(), 0x40.toByte())) // ESC @ Init
                                builder.addAll(textParam.toByteArray(Charsets.UTF_8).toList())
                                builder.addAll(listOf(0x0A.toByte(), 0x0A.toByte(), 0x0A.toByte(), 0x1D.toByte(), 0x56.toByte(), 0x42.toByte(), 0x00.toByte())) // Cut/Feed
                                builder.toByteArray()
                            }
                            else -> null
                        }

                        // c. Claim interface, send bulkTransfer, lalu release & close di blok finally
                        if (targetInterface != null && targetEndpoint != null && bytesToSend != null && bytesToSend.isNotEmpty()) {
                            val connection = usbManager.openDevice(device)
                            if (connection != null) {
                                try {
                                    if (connection.claimInterface(targetInterface, true)) {
                                        val bytesTransferred = connection.bulkTransfer(targetEndpoint, bytesToSend, bytesToSend.size, 5000)
                                        if (bytesTransferred >= 0) {
                                            val ret = JSObject()
                                            ret.put("success", true)
                                            ret.put("message", "Berhasil mencetak ke GD32-USB_Printer (VID 10473, PID 653, Transferred: $bytesTransferred bytes)!")
                                            call.resolve(ret)
                                            return@Thread
                                        }
                                    }
                                } finally {
                                    try {
                                        connection.releaseInterface(targetInterface)
                                    } catch (e: Throwable) {
                                        e.printStackTrace()
                                    }
                                    try {
                                        connection.close()
                                    } catch (e: Throwable) {
                                        e.printStackTrace()
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e: Throwable) {
                e.printStackTrace()
            }

            // -------------------------------------------------------------
            // STRATEGI 2: Telpo SDK ThermalPrinter (Backup untuk Telpo)
            // -------------------------------------------------------------
            var textToPrint = textParam
            if (textToPrint.isNullOrEmpty() && !receiptData.isNullOrEmpty()) {
                textToPrint = try {
                    val bytes = Base64.decode(receiptData, Base64.DEFAULT)
                    val cleanedBytes = bytes.filter { it in 32..126 || it == 10.toByte() || it == 13.toByte() || it == 9.toByte() }.toByteArray()
                    val decoded = String(cleanedBytes, Charsets.UTF_8)
                    if (decoded.trim().isNotEmpty()) decoded else receiptData
                } catch (e: Exception) {
                    receiptData
                }
            }

            try {
                ThermalPrinter.start()
                ThermalPrinter.clearString()
                ThermalPrinter.setAlgin(ThermalPrinter.ALGIN_LEFT)
                ThermalPrinter.setFontSize(24)
                ThermalPrinter.addString((textToPrint ?: "") + "\n\n")
                ThermalPrinter.printString()
                ThermalPrinter.walkPaper(30)

                val ret = JSObject()
                ret.put("success", true)
                ret.put("message", "Berhasil mencetak struk via Telpo SDK!")
                call.resolve(ret)
                return@Thread
            } catch (e: Throwable) {
                e.printStackTrace()
                call.reject("Gagal mencetak secara native USB: ${e.message ?: "Printer USB/Telpo tidak merespon"}")
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
    fun printText(call: PluginCall) {
        printReceipt(call)
    }
}




