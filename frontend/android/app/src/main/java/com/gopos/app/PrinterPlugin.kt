package com.gopos.app

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager
import android.net.Uri
import android.os.Build
import android.util.Base64
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "Printer")
class PrinterPlugin : Plugin() {

    private val ACTION_USB_PERMISSION = "com.gopos.app.USB_PERMISSION"
    private var pendingCall: PluginCall? = null
    private var pendingBytes: ByteArray? = null

    private val usbReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val action = intent.action
            if (ACTION_USB_PERMISSION == action) {
                synchronized(this) {
                    val device: UsbDevice? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
                    } else {
                        @Suppress("DEPRECATION")
                        intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)
                    }
                    
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        device?.let {
                            if (pendingBytes != null && pendingCall != null) {
                                sendToUsbPrinter(it, pendingBytes!!, pendingCall!!)
                            }
                        }
                    } else {
                        pendingCall?.reject("Izin akses USB Printer ditolak oleh pengguna")
                    }
                    pendingCall = null
                    pendingBytes = null
                }
            }
        }
    }

    override fun load() {
        super.load()
        val filter = IntentFilter(ACTION_USB_PERMISSION)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(usbReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(usbReceiver, filter)
        }
    }

    @PluginMethod
    fun checkPrinterStatus(call: PluginCall) {
        val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
        val device = findUsbPrinter(usbManager)
        val ret = JSObject()
        if (device != null) {
            val hasPerm = usbManager.hasPermission(device)
            ret.put("connected", true)
            ret.put("hasPermission", hasPerm)
            
            val details = StringBuilder()
            details.append("Merek: SmartLogic POS (GD32 MCU)\n")
            details.append("ID: VID_${device.vendorId}_PID_${device.productId}\n")
            details.append("Jumlah Interface: ${device.interfaceCount}\n")
            for (i in 0 until device.interfaceCount) {
                val usbInterface = device.getInterface(i)
                details.append("Intf $i: Class=${usbInterface.interfaceClass}, Subclass=${usbInterface.interfaceSubclass}, Proto=${usbInterface.interfaceProtocol}\n")
                details.append("  Jml Endpoint: ${usbInterface.endpointCount}\n")
                for (j in 0 until usbInterface.endpointCount) {
                    val endpoint = usbInterface.getEndpoint(j)
                    val dir = if (endpoint.direction == UsbConstants.USB_DIR_OUT) "OUT" else "IN"
                    val type = when (endpoint.type) {
                        UsbConstants.USB_ENDPOINT_XFER_BULK -> "BULK"
                        UsbConstants.USB_ENDPOINT_XFER_INT -> "INT"
                        UsbConstants.USB_ENDPOINT_XFER_CONTROL -> "CTRL"
                        else -> "OTHER"
                    }
                    details.append("    EP $j: Addr=${endpoint.address} (0x${Integer.toHexString(endpoint.address)}), Type=$type, Dir=$dir, MaxPack=${endpoint.maxPacketSize}\n")
                }
            }
            ret.put("message", details.toString())
            call.resolve(ret)
        } else {
            val deviceList = usbManager.deviceList
            val devicesInfo = deviceList.values.map { "VID_${it.vendorId}_PID_${it.productId} (Class: ${it.deviceClass})" }.joinToString(", ")
            ret.put("connected", false)
            ret.put("hasPermission", false)
            ret.put("message", if (devicesInfo.isNotEmpty()) "Printer tidak terdeteksi. USB aktif: $devicesInfo" else "Printer tidak terdeteksi. Tidak ada perangkat USB yang terhubung.")
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun printReceipt(call: PluginCall) {
        val base64Data = call.getString("receiptData")
        if (base64Data.isNullOrEmpty()) {
            call.reject("receiptData tidak boleh kosong")
            return
        }

        val bytes = try {
            Base64.decode(base64Data, Base64.DEFAULT)
        } catch (e: Exception) {
            call.reject("Gagal mendekode data base64: ${e.message}")
            return
        }

        val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
        val device = findUsbPrinter(usbManager)
        if (device == null) {
            call.reject("Printer thermal internal tidak terdeteksi")
            return
        }

        if (usbManager.hasPermission(device)) {
            sendToUsbPrinter(device, bytes, call)
        } else {
            pendingCall = call
            pendingBytes = bytes
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_MUTABLE
            } else {
                0
            }
            val permissionIntent = PendingIntent.getBroadcast(
                context,
                0,
                Intent(ACTION_USB_PERMISSION),
                flags
            )
            usbManager.requestPermission(device, permissionIntent)
        }
    }

    @PluginMethod
    fun checkRawBTInstalled(call: PluginCall) {
        val packageName = "ru.a402d.rawbtprinter"
        val pm = context.packageManager
        var installed = false
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                pm.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                pm.getPackageInfo(packageName, 0)
            }
            installed = true
        } catch (e: PackageManager.NameNotFoundException) {
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

    private fun findUsbPrinter(usbManager: UsbManager): UsbDevice? {
        val deviceList = usbManager.deviceList
        for (device in deviceList.values) {
            // Check by specific VID/PID (10473/653)
            if (device.vendorId == 10473 && device.productId == 653) {
                return device
            }
            
            // Check if device class is printer
            if (device.deviceClass == UsbConstants.USB_CLASS_PRINTER) {
                return device
            }
            
            // Check interfaces
            for (i in 0 until device.interfaceCount) {
                val usbInterface = device.getInterface(i)
                if (usbInterface.interfaceClass == UsbConstants.USB_CLASS_PRINTER) {
                    return device
                }
            }
        }
        return null
    }

    private fun sendToUsbPrinter(device: UsbDevice, bytes: ByteArray, call: PluginCall) {
        val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
        
        var printerInterface: UsbInterface? = null
        var outEndpoint: UsbEndpoint? = null

        // Try to find printer class interface and its bulk out endpoint
        for (i in 0 until device.interfaceCount) {
            val usbInterface = device.getInterface(i)
            if (usbInterface.interfaceClass == UsbConstants.USB_CLASS_PRINTER) {
                for (j in 0 until usbInterface.endpointCount) {
                    val endpoint = usbInterface.getEndpoint(j)
                    if (endpoint.type == UsbConstants.USB_ENDPOINT_XFER_BULK && 
                        endpoint.direction == UsbConstants.USB_DIR_OUT) {
                        printerInterface = usbInterface
                        outEndpoint = endpoint
                        break
                    }
                }
            }
            if (printerInterface != null) break
        }

        // Fallback to first available interface and bulk-out endpoint if class-based search fails
        if (printerInterface == null || outEndpoint == null) {
            printerInterface = null
            outEndpoint = null
            for (i in 0 until device.interfaceCount) {
                val usbInterface = device.getInterface(i)
                for (j in 0 until usbInterface.endpointCount) {
                    val endpoint = usbInterface.getEndpoint(j)
                    if (endpoint.type == UsbConstants.USB_ENDPOINT_XFER_BULK && 
                        endpoint.direction == UsbConstants.USB_DIR_OUT) {
                        printerInterface = usbInterface
                        outEndpoint = endpoint
                        break
                    }
                }
                if (printerInterface != null) break
            }
        }

        if (printerInterface == null || outEndpoint == null) {
            call.reject("Tidak ditemukan endpoint bulk output pada printer")
            return
        }

        val connection: UsbDeviceConnection? = usbManager.openDevice(device)
        if (connection == null) {
            call.reject("Gagal membuka koneksi USB ke printer")
            return
        }

        try {
            val forceClaim = true
            if (!connection.claimInterface(printerInterface, forceClaim)) {
                call.reject("Gagal mengklaim interface printer")
                connection.close()
                return
            }

            // Transfer data in chunks matching maxPacketSize or 512 bytes to avoid buffer dropping
            val maxPacketSize = outEndpoint.maxPacketSize
            val chunkSize = if (maxPacketSize > 0) maxPacketSize else 512
            var totalWritten = 0
            var writeSuccess = true
            var errorCode = 0

            while (totalWritten < bytes.size) {
                val sizeToSend = Math.min(bytes.size - totalWritten, chunkSize)
                val chunk = ByteArray(sizeToSend)
                System.arraycopy(bytes, totalWritten, chunk, 0, sizeToSend)

                val result = connection.bulkTransfer(outEndpoint, chunk, sizeToSend, 5000)
                if (result < 0) {
                    writeSuccess = false
                    errorCode = result
                    break
                }
                totalWritten += result
            }
            
            if (writeSuccess) {
                // Berikan jeda waktu agar MCU menyelesaikan transmisi data ke print head via USART
                try {
                    Thread.sleep(1000)
                } catch (e: InterruptedException) {
                    // Ignore
                }
                val ret = JSObject()
                ret.put("success", true)
                ret.put("message", "Berhasil dikirim! Interface Class: ${printerInterface.interfaceClass}, Endpoint Address: ${outEndpoint.address}, Bytes: $totalWritten")
                call.resolve(ret)
            } else {
                call.reject("Gagal transfer data USB bulk (code: $errorCode, tertulis: $totalWritten dari ${bytes.size} byte)")
            }
        } catch (e: Exception) {
            call.reject("Error saat mencetak: ${e.message}")
        } finally {
            try {
                connection.releaseInterface(printerInterface)
            } catch (e: Exception) {
                // Ignore
            }
            try {
                connection.close()
            } catch (e: Exception) {
                // Ignore
            }
        }
    }
}