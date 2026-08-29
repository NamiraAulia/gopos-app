package com.gopos.app

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import android.os.Build
import android.util.Base64
import android.util.Log
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.telpo.tps550.api.printer.ThermalPrinter

@CapacitorPlugin(name = "Printer")
class PrinterPlugin : Plugin() {

    private val TAG = "PrinterPlugin"
    private val ACTION_USB_PERMISSION = "com.gopos.app.USB_PERMISSION"
    private val PREFS_NAME = "PrinterPrefs"
    private val KEY_PREFERRED_PRINTER = "preferred_printer_vid_pid"

    private fun isUsbPrinter(device: UsbDevice): Boolean {
        for (i in 0 until device.interfaceCount) {
            val intf = device.getInterface(i)
            if (intf.interfaceClass == UsbConstants.USB_CLASS_PRINTER) {
                return true
            }
        }
        return false
    }

    private fun getCandidatePrinters(usbManager: UsbManager): List<UsbDevice> {
        val candidatePrinters = mutableListOf<UsbDevice>()
        for (device in usbManager.deviceList.values) {
            if (isUsbPrinter(device)) {
                candidatePrinters.add(device)
            }
        }
        return candidatePrinters
    }

    private fun selectPrinter(candidatePrinters: List<UsbDevice>, context: Context): UsbDevice? {
        if (candidatePrinters.isEmpty()) return null
        if (candidatePrinters.size == 1) {
            return candidatePrinters.first()
        }

        // Jika ada lebih dari 1 candidate printer USB:
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val preferredVidPid = prefs.getString(KEY_PREFERRED_PRINTER, null)

        if (!preferredVidPid.isNullOrEmpty()) {
            val matched = candidatePrinters.find { "${it.vendorId}:${it.productId}" == preferredVidPid }
            if (matched != null) {
                Log.d(TAG, "Menggunakan printer sesuai preferensi tersimpan ($preferredVidPid): ${matched.deviceName} (VID: ${matched.vendorId}, PID: ${matched.productId})")
                return matched
            }
        }

        Log.d(TAG, "Tidak ada preferensi tersimpan yang cocok. Menggunakan candidate printer PERTAMA (${candidatePrinters.first().deviceName}). Total candidate terdeteksi: ${candidatePrinters.size}")
        return candidatePrinters.first()
    }

    @PluginMethod
    fun listAvailablePrinters(call: PluginCall) {
        try {
            val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
            val candidatePrinters = getCandidatePrinters(usbManager)
            Log.d(TAG, "listAvailablePrinters: Menemukan ${candidatePrinters.size} device USB Printer Class")

            val printersArray = JSArray()
            for (device in candidatePrinters) {
                val obj = JSObject()
                obj.put("vendorId", device.vendorId)
                obj.put("productId", device.productId)
                obj.put("deviceName", device.deviceName)
                obj.put("productName", device.productName ?: device.deviceName ?: "Generic USB Printer")
                printersArray.put(obj)
            }

            val ret = JSObject()
            ret.put("printers", printersArray)
            ret.put("count", candidatePrinters.size)
            call.resolve(ret)
        } catch (e: Throwable) {
            Log.e(TAG, "Error pada listAvailablePrinters: ${e.message}", e)
            call.reject("Gagal mendaftar printer USB: ${e.message}")
        }
    }

    @PluginMethod
    fun setPreferredPrinter(call: PluginCall) {
        val vendorId = call.getInt("vendorId") ?: call.getString("vendorId")?.toIntOrNull()
        val productId = call.getInt("productId") ?: call.getString("productId")?.toIntOrNull()

        if (vendorId == null || productId == null) {
            call.reject("vendorId dan productId wajib diberikan")
            return
        }

        try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val value = "$vendorId:$productId"
            prefs.edit().putString(KEY_PREFERRED_PRINTER, value).apply()
            Log.d(TAG, "Preferensi printer berhasil disimpan: $value")

            val ret = JSObject()
            ret.put("success", true)
            ret.put("preferredPrinter", value)
            call.resolve(ret)
        } catch (e: Throwable) {
            Log.e(TAG, "Error menyimpan preferensi printer: ${e.message}", e)
            call.reject("Gagal menyimpan preferensi printer: ${e.message}")
        }
    }

    @PluginMethod
    fun checkPrinterStatus(call: PluginCall) {
        val ret = JSObject()
        Thread {
            // 1. Cek Hardware Telpo Internal terlebih dahulu (Telpo SDK / Reflection)
            try {
                val telpoWrapper = TelpoPrinterWrapper(context)
                if (telpoWrapper.isAvailable()) {
                    Log.d(TAG, "checkPrinterStatus: Telpo Internal Printer siap digunakan")
                    ret.put("connected", true)
                    ret.put("hasPermission", true)
                    ret.put("printerType", "telpo_internal")
                    ret.put("message", "Printer Internal Telpo Siap Gunakan")
                    call.resolve(ret)
                    return@Thread
                }
            } catch (e: Throwable) {
                Log.w(TAG, "checkPrinterStatus: Telpo Printer (Reflect/SDK) tidak tersedia (${e.message})")
            }

            // 2. Cek USB Host Manager untuk printer USB generic (USB_CLASS_PRINTER = 7)
            try {
                val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
                val candidatePrinters = getCandidatePrinters(usbManager)
                Log.d(TAG, "checkPrinterStatus: Candidate printer USB terdeteksi = ${candidatePrinters.size}")

                val selectedDevice = selectPrinter(candidatePrinters, context)

                if (selectedDevice != null) {
                    val hasPerm = usbManager.hasPermission(selectedDevice)
                    val prodName = selectedDevice.productName ?: selectedDevice.deviceName ?: "USB Printer"
                    Log.d(TAG, "checkPrinterStatus: Device terpilih (${selectedDevice.deviceName}, VID: ${selectedDevice.vendorId}, PID: ${selectedDevice.productId}, Permission: $hasPerm, Total Kandidat: ${candidatePrinters.size})")
                    ret.put("connected", true)
                    ret.put("hasPermission", hasPerm)
                    ret.put("vendorId", selectedDevice.vendorId)
                    ret.put("productId", selectedDevice.productId)
                    ret.put("candidateCount", candidatePrinters.size)
                    ret.put("printerType", "usb")
                    ret.put("message", "Printer USB terdeteksi: $prodName (VID=${selectedDevice.vendorId}, PID=${selectedDevice.productId})")
                    call.resolve(ret)
                    return@Thread
                } else {
                    Log.w(TAG, "checkPrinterStatus: Tidak ada USB Device dengan interface USB_CLASS_PRINTER (7) terdeteksi")
                }
            } catch (e: Throwable) {
                Log.e(TAG, "checkPrinterStatus Error USB: ${e.message}", e)
            }

            // 3. Status jika bukan USB & Telpo
            ret.put("connected", false)
            ret.put("hasPermission", false)
            ret.put("message", "Printer Telpo / USB tidak terdeteksi.")
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

    private fun doActualPrint(usbManager: UsbManager, device: UsbDevice, bytesToSend: ByteArray, call: PluginCall) {
        Log.d(TAG, "Mulai doActualPrint untuk device: ${device.deviceName} (VID: ${device.vendorId}, PID: ${device.productId})")

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

        if (targetInterface == null || targetEndpoint == null) {
            Log.e(TAG, "Gagal: Endpoint BULK OUT tidak ditemukan pada device ${device.deviceName}")
            call.reject("Endpoint BULK OUT tidak ditemukan pada printer USB ${device.deviceName}")
            return
        }

        Log.d(TAG, "Endpoint OUT ditemukan: address=0x${Integer.toHexString(targetEndpoint.address)}, maxPacketSize=${targetEndpoint.maxPacketSize}")

        val connection = usbManager.openDevice(device)
        if (connection == null) {
            Log.e(TAG, "openDevice() mengembalikan NULL (akses USB ditolak atau device terputus)")
            call.reject("openDevice() gagal (null). Pastikan izin USB diberikan.")
            return
        }

        Log.d(TAG, "openDevice() BERHASIL. Membuka koneksi ke printer...")

        try {
            val claimed = connection.claimInterface(targetInterface, true)
            Log.d(TAG, "claimInterface() hasil: $claimed")

            if (!claimed) {
                Log.e(TAG, "Gagal claimInterface() pada interface ${targetInterface.id}")
                call.reject("Gagal claim USB interface pada printer ${device.deviceName}")
                return
            }

            Log.d(TAG, "Mengirim data biner bulkTransfer (${bytesToSend.size} bytes)...")
            val bytesTransferred = connection.bulkTransfer(targetEndpoint, bytesToSend, bytesToSend.size, 5000)
            Log.d(TAG, "bulkTransfer() hasil: $bytesTransferred bytes")

            if (bytesTransferred >= 0) {
                val ret = JSObject()
                ret.put("success", true)
                ret.put("bytesTransferred", bytesTransferred)
                ret.put("message", "Berhasil mencetak ke printer USB ($bytesTransferred bytes terkirim)!")
                call.resolve(ret)
            } else {
                Log.e(TAG, "bulkTransfer() GAGAL dengan kode error: $bytesTransferred")
                call.reject("Gagal bulkTransfer USB (Error code: $bytesTransferred)")
            }
        } catch (e: Throwable) {
            Log.e(TAG, "Exception saat bulkTransfer: ${e.message}", e)
            call.reject("Exception cetak USB: ${e.message}")
        } finally {
            try {
                connection.releaseInterface(targetInterface)
                Log.d(TAG, "releaseInterface() dipanggil")
            } catch (e: Throwable) {
                Log.e(TAG, "Error releaseInterface: ${e.message}")
            }
            try {
                connection.close()
                Log.d(TAG, "connection.close() dipanggil")
            } catch (e: Throwable) {
                Log.e(TAG, "Error connection.close: ${e.message}")
            }
        }
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
            // STRATEGI 1: Telpo Internal Thermal Printer (SDK & Reflection)
            // -------------------------------------------------------------
            try {
                val telpoWrapper = TelpoPrinterWrapper(context)
                if (telpoWrapper.isAvailable()) {
                    Log.d(TAG, "printReceipt: Menemukan Telpo Internal Printer! Memulai cetak...")
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

                    telpoWrapper.printText(textToPrint ?: "")
                    val ret = JSObject()
                    ret.put("success", true)
                    ret.put("message", "Berhasil mencetak via Telpo Internal Printer!")
                    call.resolve(ret)
                    return@Thread
                }
            } catch (e: Throwable) {
                Log.w(TAG, "Gagal mencetak via Telpo Internal Printer: ${e.message}. Mencoba USB Host Generic...")
            }

            // -------------------------------------------------------------
            // STRATEGI 2: Direct Generic USB Host Bulk Transfer (Device Class USB_CLASS_PRINTER = 7)
            // -------------------------------------------------------------
            try {
                val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
                val candidatePrinters = getCandidatePrinters(usbManager)
                Log.d(TAG, "printReceipt: Jumlah kandidat printer USB terdeteksi = ${candidatePrinters.size}")

                for ((idx, cand) in candidatePrinters.withIndex()) {
                    Log.d(TAG, " Candidate [$idx]: ${cand.deviceName} (VID=${cand.vendorId}, PID=${cand.productId}, Name=${cand.productName})")
                }

                val device = selectPrinter(candidatePrinters, context)

                if (device != null) {
                    Log.d(TAG, "Printer terpilih untuk cetak: ${device.deviceName} (VID=${device.vendorId}, PID=${device.productId})")

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

                    if (bytesToSend == null || bytesToSend.isEmpty()) {
                        Log.e(TAG, "Payload byte cetak kosong atau invalid")
                        call.reject("Payload byte cetak tidak valid")
                        return@Thread
                    }

                    val hasPerm = usbManager.hasPermission(device)
                    Log.d(TAG, "Cek USB Permission untuk ${device.deviceName}: $hasPerm")

                    if (hasPerm) {
                        Log.d(TAG, "Permission SUDAH ada. Langsung memanggil doActualPrint...")
                        doActualPrint(usbManager, device, bytesToSend, call)
                        return@Thread
                    } else {
                        Log.d(TAG, "Permission BELUM ada. Memasang BroadcastReceiver dan meminta izin...")

                        val permissionReceiver = object : BroadcastReceiver() {
                            override fun onReceive(reqContext: Context?, intent: Intent?) {
                                if (intent?.action == ACTION_USB_PERMISSION) {
                                    try {
                                        context.unregisterReceiver(this)
                                        Log.d(TAG, "BroadcastReceiver berhasil di-unregister")
                                    } catch (e: Throwable) {
                                        Log.e(TAG, "Gagal unregister BroadcastReceiver: ${e.message}")
                                    }

                                    val granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)
                                    Log.d(TAG, "BroadcastReceiver menerima tanggapan permission: granted = $granted")

                                    if (granted) {
                                        Log.d(TAG, "Izin USB Diberikan oleh User! Melanjutkan ke doActualPrint (di Thread terpisah)...")
                                        Thread {
                                            doActualPrint(usbManager, device, bytesToSend, call)
                                        }.start()
                                    } else {
                                        Log.e(TAG, "Izin USB Ditolak oleh User")
                                        call.reject("Izin USB ditolak oleh user")
                                    }
                                }
                            }
                        }

                        val filter = IntentFilter(ACTION_USB_PERMISSION)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            context.registerReceiver(permissionReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
                        } else {
                            context.registerReceiver(permissionReceiver, filter)
                        }

                        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                        } else {
                            PendingIntent.FLAG_UPDATE_CURRENT
                        }
                        val permissionIntent = PendingIntent.getBroadcast(
                            context, 0, Intent(ACTION_USB_PERMISSION), flags
                        )

                        Log.d(TAG, "Memanggil usbManager.requestPermission()...")
                        usbManager.requestPermission(device, permissionIntent)
                        return@Thread
                    }
                } else {
                    Log.w(TAG, "Device printer USB TIDAK ditemukan di USB deviceList (Strategi 2)")
                }
            } catch (e: Throwable) {
                Log.e(TAG, "Exception pada USB Strategi: ${e.message}", e)
            }

            call.reject("Printer Telpo / USB tidak merespon atau tidak ditemukan")
        }.start()
    }

    @PluginMethod
    fun printText(call: PluginCall) {
        printReceipt(call)
    }
}

// =============================================================================
// CLASSES REFLECTION UNTUK MENYESUAIKAN DENGAN RITGROW (TELPO INTERNAL SERVICES)
// =============================================================================

class UsbThermalPrinterReflect(private val context: Context) {
    private var printerClass: Class<*>? = null
    private var printerInstance: Any? = null
    private val TAG = "UsbThermalPrinterRef"

    init {
        try {
            val serviceContext = context.createPackageContext("com.common.service", Context.CONTEXT_INCLUDE_CODE or Context.CONTEXT_IGNORE_SECURITY)
            printerClass = serviceContext.classLoader.loadClass("com.telpo.tps550.api.printer.UsbThermalPrinter")
            
            val constructors = printerClass?.declaredConstructors
            var constructor: java.lang.reflect.Constructor<*>? = null
            if (constructors != null) {
                for (c in constructors) {
                    if (c.genericParameterTypes.size == 1) {
                        constructor = c
                        break
                    }
                }
            }
            
            if (constructor != null) {
                printerInstance = constructor.newInstance(context)
                Log.d(TAG, "Inisialisasi UsbThermalPrinter via reflection BERHASIL!")
            } else {
                Log.e(TAG, "Constructor UsbThermalPrinter(Context) tidak ditemukan")
            }
        } catch (e: Throwable) {
            Log.w(TAG, "UsbThermalPrinter tidak didukung: ${e.message}")
        }
    }

    fun isAvailable(): Boolean {
        return printerInstance != null
    }

    fun addString(text: String) {
        try {
            printerClass?.getMethod("addString", String::class.java)?.invoke(printerInstance, text)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal addString: ${e.message}")
        }
    }

    fun printString() {
        try {
            printerClass?.getMethod("printString")?.invoke(printerInstance)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal printString: ${e.message}")
        }
    }

    fun walkPaper(lines: Int) {
        try {
            printerClass?.getMethod("walkPaper", Int::class.javaPrimitiveType)?.invoke(printerInstance, lines)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal walkPaper: ${e.message}")
        }
    }

    fun setAlgin(align: Int) {
        try {
            printerClass?.getMethod("setAlgin", Int::class.javaPrimitiveType)?.invoke(printerInstance, align)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal setAlgin: ${e.message}")
        }
    }

    fun setBold(bold: Boolean) {
        try {
            printerClass?.getMethod("setBold", Boolean::class.javaPrimitiveType)?.invoke(printerInstance, bold)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal setBold: ${e.message}")
        }
    }

    fun setTextSize(size: Int) {
        try {
            printerClass?.getMethod("setTextSize", Int::class.javaPrimitiveType)?.invoke(printerInstance, size)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal setTextSize: ${e.message}")
        }
    }

    fun setGray(level: Int) {
        try {
            printerClass?.getMethod("setGray", Int::class.javaPrimitiveType)?.invoke(printerInstance, level)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal setGray: ${e.message}")
        }
    }

    fun setMonoSpace(mono: Boolean) {
        try {
            printerClass?.getMethod("setMonoSpace", Boolean::class.javaPrimitiveType)?.invoke(printerInstance, mono)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal setMonoSpace: ${e.message}")
        }
    }
    
    fun reset() {
        try {
            printerClass?.getMethod("reset")?.invoke(printerInstance)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal reset: ${e.message}")
        }
    }
    
    fun paperCut() {
        try {
            printerClass?.getMethod("paperCut")?.invoke(printerInstance)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal paperCut: ${e.message}")
        }
    }
}

class ThermalPrinterServiceReflect(private val context: Context) {
    private var serviceClass: Class<*>? = null
    private var serviceInstance: Any? = null
    private val TAG = "ThermalPrinterSvcRef"

    init {
        try {
            serviceClass = Class.forName("com.common.sdk.thermalprinter.ThermalPrinterServiceManager")
            serviceInstance = context.getSystemService("ThermalPrinter")
            Log.d(TAG, "Inisialisasi ThermalPrinterServiceManager via reflection BERHASIL!")
        } catch (e: Throwable) {
            Log.w(TAG, "ThermalPrinterServiceManager tidak didukung: ${e.message}")
        }
    }

    fun isAvailable(): Boolean {
        return serviceInstance != null
    }

    fun addString(text: String) {
        try {
            serviceClass?.getMethod("addString", String::class.java)?.invoke(serviceInstance, text)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal addString: ${e.message}")
        }
    }

    fun printString() {
        try {
            serviceClass?.getMethod("printString")?.invoke(serviceInstance)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal printString: ${e.message}")
        }
    }

    fun walkPaper(lines: Int) {
        try {
            serviceClass?.getMethod("walkPaper", Int::class.javaPrimitiveType)?.invoke(serviceInstance, lines)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal walkPaper: ${e.message}")
        }
    }

    fun setAlgin(align: Int) {
        try {
            serviceClass?.getMethod("setAlgin", Int::class.javaPrimitiveType)?.invoke(serviceInstance, align)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal setAlgin: ${e.message}")
        }
    }

    fun setBold(bold: Boolean) {
        try {
            serviceClass?.getMethod("setBold", Boolean::class.javaPrimitiveType)?.invoke(serviceInstance, bold)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal setBold: ${e.message}")
        }
    }

    fun setTextSize(size: Int) {
        try {
            serviceClass?.getMethod("setTextSize", Int::class.javaPrimitiveType)?.invoke(serviceInstance, size)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal setTextSize: ${e.message}")
        }
    }

    fun setGray(level: Int) {
        try {
            serviceClass?.getMethod("setGray", Int::class.javaPrimitiveType)?.invoke(serviceInstance, level)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal setGray: ${e.message}")
        }
    }

    fun setMonoSpace(mono: Boolean) {
        try {
            serviceClass?.getMethod("setMonoSpace", Boolean::class.javaPrimitiveType)?.invoke(serviceInstance, mono)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal setMonoSpace: ${e.message}")
        }
    }
    
    fun reset() {
        try {
            serviceClass?.getMethod("reset")?.invoke(serviceInstance)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal reset: ${e.message}")
        }
    }
    
    fun paperCut() {
        try {
            serviceClass?.getMethod("paperCut")?.invoke(serviceInstance)
        } catch (e: Throwable) {
            Log.e(TAG, "Gagal paperCut: ${e.message}")
        }
    }
}

class TelpoPrinterWrapper(private val context: Context) {
    private var usbPrinter: UsbThermalPrinterReflect? = null
    private var servicePrinter: ThermalPrinterServiceReflect? = null
    private val TAG = "TelpoPrinterWrapper"

    init {
        usbPrinter = UsbThermalPrinterReflect(context)
        if (usbPrinter?.isAvailable() != true) {
            Log.w(TAG, "UsbThermalPrinter tidak tersedia, mencoba ThermalPrinterService...")
            servicePrinter = ThermalPrinterServiceReflect(context)
        }
    }

    fun isAvailable(): Boolean {
        return usbPrinter?.isAvailable() == true || servicePrinter?.isAvailable() == true
    }

    fun printText(text: String) {
        if (usbPrinter?.isAvailable() == true) {
            Log.d(TAG, "Printing via UsbThermalPrinter...")
            usbPrinter?.reset()
            usbPrinter?.setAlgin(0) // Left align (0) to eliminate left/right spacing issues
            usbPrinter?.setGray(7)  // Set max contrast to match Ritgrow!
            usbPrinter?.setMonoSpace(true) // Enable monospace font for perfect column alignment
            usbPrinter?.setBold(true) // Bold / Thicker font to match Ritgrow!
            usbPrinter?.setTextSize(24)
            usbPrinter?.addString(text)
            usbPrinter?.printString()
            usbPrinter?.walkPaper(20)
            usbPrinter?.paperCut()
        } else if (servicePrinter?.isAvailable() == true) {
            Log.d(TAG, "Printing via ThermalPrinterService...")
            servicePrinter?.reset()
            servicePrinter?.setAlgin(0) // Left align (0) to eliminate left/right spacing issues
            servicePrinter?.setGray(7)  // Set max contrast to match Ritgrow!
            servicePrinter?.setMonoSpace(true) // Enable monospace font for perfect column alignment
            servicePrinter?.setBold(true) // Bold / Thicker font to match Ritgrow!
            servicePrinter?.setTextSize(24)
            servicePrinter?.addString(text)
            servicePrinter?.printString()
            servicePrinter?.walkPaper(20)
            servicePrinter?.paperCut()
        } else {
            Log.e(TAG, "Tidak ada printer internal Telpo yang terhubung atau tersedia!")
        }
    }
}