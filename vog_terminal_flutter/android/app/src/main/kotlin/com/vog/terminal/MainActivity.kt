package com.vog.terminal

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.inputmethod.InputMethodManager
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    private val SCANNER_CHANNEL = "com.vog.terminal/scanner"
    private val CONTROL_CHANNEL = "com.vog.terminal/scanner_control"
    
    private var scanEventSink: EventChannel.EventSink? = null
    private var scanReceiver: BroadcastReceiver? = null
    private var currentScannerMode: String = "rfid" // "rfid" or "barcode"

    // Hardware Tone/Beep Generator for guaranteed acoustic feedback
    private var toneGenerator: ToneGenerator? = null

    private fun playBeep() {
        try {
            if (toneGenerator == null) {
                toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 100)
            }
            toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 80)
        } catch (_: Exception) {}
    }

    // Keystroke wedge buffer for scanners emulating physical keyboard (Chainway KeyboardEmulator)
    private val keyBuffer = StringBuilder()
    private var lastKeyTime: Long = 0
    private val mainHandler = Handler(Looper.getMainLooper())
    private val flushRunnable = Runnable {
        flushKeyBuffer()
    }
    private var autoStopRunnable: Runnable? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // 1. Data Stream Channel
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, SCANNER_CHANNEL).setStreamHandler(
            object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    scanEventSink = events
                    registerScanReceiver()
                }

                override fun onCancel(arguments: Any?) {
                    unregisterScanReceiver()
                    scanEventSink = null
                }
            }
        )

        // 2. Control Method Channel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CONTROL_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "setScannerMode" -> {
                    val mode = call.argument<String>("mode") ?: "rfid"
                    currentScannerMode = if (mode.lowercase() == "barcode") "barcode" else "rfid"
                    result.success(true)
                }
                "triggerScan" -> {
                    executeScanTrigger(true)
                    result.success(true)
                }
                "stopScan" -> {
                    executeScanTrigger(false)
                    result.success(true)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun isTriggerKey(keyCode: Int): Boolean {
        return when (keyCode) {
            // Standard Android button & function keys
            KeyEvent.KEYCODE_BUTTON_L1,
            KeyEvent.KEYCODE_BUTTON_R1,
            KeyEvent.KEYCODE_BUTTON_L2,
            KeyEvent.KEYCODE_BUTTON_R2,
            KeyEvent.KEYCODE_BUTTON_1,
            KeyEvent.KEYCODE_BUTTON_2,
            KeyEvent.KEYCODE_BUTTON_3,
            KeyEvent.KEYCODE_BUTTON_4,
            KeyEvent.KEYCODE_F1,
            KeyEvent.KEYCODE_F2,
            KeyEvent.KEYCODE_F3,
            KeyEvent.KEYCODE_F4,
            KeyEvent.KEYCODE_F5,
            KeyEvent.KEYCODE_F6,
            KeyEvent.KEYCODE_F7,
            KeyEvent.KEYCODE_F8,
            KeyEvent.KEYCODE_F9,
            KeyEvent.KEYCODE_F10,
            KeyEvent.KEYCODE_F11,
            KeyEvent.KEYCODE_F12,
            // Chainway C72 / C66 / C70 hardware pistol trigger & side buttons
            131, 132, 133, 134, 135,
            138, 139, 140, 141, 142,
            240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250,
            261, 262, 263, // Urovo side scan & trigger
            280,           // Chainway C72 Pistol Grip Trigger (KEY_TRIGGER_1)
            284, 285,
            291, 292, 293, 294, // Chainway C66 Pistol Grip Trigger & side buttons
            301, 302, 303, // Urovo / Seuic triggers
            520, 521, 522, // Urovo DT50 / DT40 trigger buttons
            10036, 10037,  // Zebra trigger keys
            102, 103, 104  // Zebra TC20 / MC3300 pistol grip
            -> true
            else -> false
        }
    }

    private fun hideSoftKeyboard() {
        try {
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
            currentFocus?.let { view ->
                imm?.hideSoftInputFromWindow(view.windowToken, 0)
            }
        } catch (_: Exception) {}
    }

    private fun flushKeyBuffer() {
        val scanned = keyBuffer.toString().trim()
        keyBuffer.setLength(0)
        if (scanned.length >= 4) { // Typical RFID EPC or Barcode is at least 4 chars
            playBeep()
            runOnUiThread {
                scanEventSink?.success(scanned)
            }
        }
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val keyCode = event.keyCode

        // A) Hardware Scan Trigger Key Interception
        if (isTriggerKey(keyCode)) {
            hideSoftKeyboard()
            if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) {
                executeScanTrigger(true)
            }
            // DO NOT call executeScanTrigger(false) on ACTION_UP!
            // Let autoStopRunnable (3500ms) safely stop.
            // Also pass event to super so Chainway KeyboardEmulator can process the trigger!
            return super.dispatchKeyEvent(event)
        }

        // B) Keyboard Wedge / KeyboardEmulator Rapid Keystroke Capture
        if (event.action == KeyEvent.ACTION_DOWN) {
            val now = System.currentTimeMillis()

            if (keyCode == KeyEvent.KEYCODE_ENTER || keyCode == KeyEvent.KEYCODE_NUMPAD_ENTER || keyCode == KeyEvent.KEYCODE_TAB) {
                mainHandler.removeCallbacks(flushRunnable)
                if (keyBuffer.isNotEmpty()) {
                    flushKeyBuffer()
                    hideSoftKeyboard()
                    return true // Consume terminator
                }
            } else {
                val unicodeChar = event.unicodeChar
                if (unicodeChar != 0 && Character.isDefined(unicodeChar) && !Character.isISOControl(unicodeChar)) {
                    val char = unicodeChar.toChar()

                    if (now - lastKeyTime > 300) {
                        keyBuffer.setLength(0)
                    }
                    keyBuffer.append(char)
                    lastKeyTime = now

                    mainHandler.removeCallbacks(flushRunnable)
                    mainHandler.postDelayed(flushRunnable, 120)

                    if (keyBuffer.length >= 8) {
                        hideSoftKeyboard()
                    }
                }
            }
        }

        return super.dispatchKeyEvent(event)
    }

    private fun executeScanTrigger(isStart: Boolean) {
        try {
            autoStopRunnable?.let { mainHandler.removeCallbacks(it) }

            if (isStart) {
                // Safety: Auto-stop after 3500ms if hardware trigger release isn't captured
                autoStopRunnable = Runnable {
                    executeScanTrigger(false)
                }
                mainHandler.postDelayed(autoStopRunnable!!, 3500)

                if (currentScannerMode == "rfid") {
                    // PURE UHF RFID TRIGGER (Never send barcode commands here!)
                    // 1. Chainway UHF Commands
                    sendBroadcast(Intent("com.rscja.android.action.UHF_START"))
                    sendBroadcast(Intent("com.rscja.android.uhf.START_READ"))
                    sendBroadcast(Intent("com.chainway.uhf.START"))
                    sendBroadcast(Intent("com.rscja.uhf.action.START"))
                    sendBroadcast(Intent("com.rfid.START_INVENTORY"))
                    sendBroadcast(Intent("com.rscja.android.action.START_INVENTORY"))
                    sendBroadcast(Intent("com.rscja.android.action.START_SCAN"))
                    sendBroadcast(Intent("com.rscja.android.KEY_DOWN").apply {
                        putExtra("keyCode", 139)
                    })
                    sendBroadcast(Intent("com.rscja.android.KEY_DOWN").apply {
                        putExtra("keyCode", 280)
                    })

                    // 2. Zebra DataWedge RFID
                    sendBroadcast(Intent("com.symbol.datawedge.api.ACTION").apply {
                        putExtra("com.symbol.datawedge.api.SWITCH_DATACAPTURE_MODE", "RFID")
                        putExtra("com.symbol.datawedge.api.SOFT_RFID_TRIGGER", "START_SCANNING")
                    })

                    // 3. Urovo RFID
                    sendBroadcast(Intent("com.ubx.datawedge.action.SCAN_START"))
                    sendBroadcast(Intent("urovo.rcv.action.START_SCAN"))
                } else {
                    // PURE 1D/2D BARCODE TRIGGER (Never send UHF commands here!)
                    sendBroadcast(Intent("com.rscja.android.action.BARCODE_START"))
                    sendBroadcast(Intent("com.rscja.android.action.START_SCAN"))
                    sendBroadcast(Intent("com.rscja.android.KEY_DOWN").apply {
                        putExtra("keyCode", 139)
                    })
                    sendBroadcast(Intent("com.rscja.android.KEY_DOWN").apply {
                        putExtra("keyCode", 280)
                    })
                    sendBroadcast(Intent("com.android.server.scannerservice.start"))
                    sendBroadcast(Intent("com.barcode.sendBroadcastScan"))
                    sendBroadcast(Intent("android.intent.action.SCANNER_BUTTON_DOWN"))
                    sendBroadcast(Intent("com.ubx.datawedge.action.SCAN_START"))
                    sendBroadcast(Intent("urovo.rcv.action.START_SCAN"))
                    sendBroadcast(Intent("android.intent.action.FUNCTION_KEY_DOWN"))
                    sendBroadcast(Intent("com.symbol.datawedge.api.ACTION").apply {
                        putExtra("com.symbol.datawedge.api.SWITCH_DATACAPTURE_MODE", "BARCODE")
                        putExtra("com.symbol.datawedge.api.SOFT_SCAN_TRIGGER", "START_SCANNING")
                    })
                    sendBroadcast(Intent("com.honeywell.decode.intent.action.SCAN_TRIGGER").apply {
                        putExtra("enable", true)
                    })
                    sendBroadcast(Intent("nlscan.action.SCANNER_TRIG"))
                    sendBroadcast(Intent("nlscan.action.START_SCAN"))
                }
            } else {
                // STOP Trigger Commands
                if (currentScannerMode == "rfid") {
                    sendBroadcast(Intent("com.rscja.android.action.UHF_STOP"))
                    sendBroadcast(Intent("com.rscja.android.uhf.STOP_READ"))
                    sendBroadcast(Intent("com.chainway.uhf.STOP"))
                    sendBroadcast(Intent("com.rscja.uhf.action.STOP"))
                    sendBroadcast(Intent("com.rfid.STOP_INVENTORY"))
                    sendBroadcast(Intent("com.rscja.android.action.STOP_INVENTORY"))
                    sendBroadcast(Intent("com.rscja.android.action.STOP_SCAN"))
                    sendBroadcast(Intent("com.rscja.android.KEY_UP").apply {
                        putExtra("keyCode", 139)
                    })
                    sendBroadcast(Intent("com.rscja.android.KEY_UP").apply {
                        putExtra("keyCode", 280)
                    })
                    sendBroadcast(Intent("com.symbol.datawedge.api.ACTION").apply {
                        putExtra("com.symbol.datawedge.api.SOFT_RFID_TRIGGER", "STOP_SCANNING")
                    })
                } else {
                    sendBroadcast(Intent("com.rscja.android.action.BARCODE_STOP"))
                    sendBroadcast(Intent("com.rscja.android.action.STOP_SCAN"))
                    sendBroadcast(Intent("com.rscja.android.KEY_UP").apply {
                        putExtra("keyCode", 139)
                    })
                    sendBroadcast(Intent("com.rscja.android.KEY_UP").apply {
                        putExtra("keyCode", 280)
                    })
                    sendBroadcast(Intent("com.android.server.scannerservice.stop"))
                    sendBroadcast(Intent("com.barcode.sendBroadcastScanStop"))
                    sendBroadcast(Intent("android.intent.action.SCANNER_BUTTON_UP"))
                    sendBroadcast(Intent("com.ubx.datawedge.action.SCAN_STOP"))
                    sendBroadcast(Intent("urovo.rcv.action.STOP_SCAN"))
                    sendBroadcast(Intent("com.symbol.datawedge.api.ACTION").apply {
                        putExtra("com.symbol.datawedge.api.SOFT_SCAN_TRIGGER", "STOP_SCANNING")
                    })
                    sendBroadcast(Intent("com.honeywell.decode.intent.action.SCAN_TRIGGER").apply {
                        putExtra("enable", false)
                    })
                    sendBroadcast(Intent("nlscan.action.STOP_SCAN"))
                }
            }
        } catch (_: Exception) {}
    }

    private fun registerScanReceiver() {
        if (scanReceiver != null) return

        scanReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent == null) return

                val extractedTags = mutableListOf<String>()

                fun processObject(obj: Any?) {
                    if (obj == null) return
                    when (obj) {
                        is String -> {
                            val s = obj.trim()
                            if (s.isNotEmpty() && !extractedTags.contains(s)) extractedTags.add(s)
                        }
                        is ByteArray -> {
                            // 1. ASCII string check
                            val s = String(obj).trim()
                            if (s.isNotEmpty() && s.all { it.code in 32..126 }) {
                                if (!extractedTags.contains(s)) extractedTags.add(s)
                            }
                            // 2. Binary Hex string (crucial for raw 96-bit RFID EPCs)
                            val hex = obj.joinToString("") { "%02X".format(it) }
                            if (hex.length >= 8 && !extractedTags.contains(hex)) {
                                extractedTags.add(hex)
                            }
                        }
                        is CharArray -> {
                            val s = String(obj).trim()
                            if (s.isNotEmpty() && !extractedTags.contains(s)) extractedTags.add(s)
                        }
                        is CharSequence -> {
                            val s = obj.toString().trim()
                            if (s.isNotEmpty() && !extractedTags.contains(s)) extractedTags.add(s)
                        }
                        is Collection<*> -> {
                            for (item in obj) processObject(item)
                        }
                        is Array<*> -> {
                            for (item in obj) processObject(item)
                        }
                        is Bundle -> {
                            for (k in obj.keySet()) processObject(obj.get(k))
                        }
                        else -> {
                            try {
                                val methods = obj.javaClass.methods
                                for (m in methods) {
                                    if (m.name.equals("getEPC", ignoreCase = true) ||
                                        m.name.equals("getEpc", ignoreCase = true) ||
                                        m.name.equals("getTag", ignoreCase = true) ||
                                        m.name.equals("getData", ignoreCase = true)) {
                                        if (m.parameterCount == 0) {
                                            val res = m.invoke(obj)
                                            processObject(res)
                                        }
                                    }
                                }
                            } catch (_: Exception) {}
                        }
                    }
                }

                // 1. Check intent.dataString / data URI
                intent.dataString?.let { processObject(it) }

                // 2. Check all Intent extras unconditionally
                val extras = intent.extras
                if (extras != null) {
                    val priorityKeys = arrayOf(
                        "data", "tag_epc", "epc", "epc_list", "epcList", "tag_list", "tagList",
                        "barcode_data", "scannerdata", "value", "barcode", "barocode", "barcode_string",
                        "scanner_data", "com.symbol.datawedge.data_string", "SCAN_BARCODE1", "SCAN_BARCODE2",
                        "EXTRA_BARCODE_DATA", "strBarcode", "result", "tag_id", "msg", "content",
                        "tag", "extra_epc", "EXTRA_UHF_EPC", "EXTRA_TAG_INFO", "read_data", "tags",
                        "epc_str", "epcString", "tagData", "tag_data", "scan_data", "se_data"
                    )

                    for (key in priorityKeys) {
                        if (extras.containsKey(key)) {
                            processObject(extras.get(key))
                        }
                    }

                    // Process all other extras in the bundle
                    for (key in extras.keySet()) {
                        if (!priorityKeys.contains(key)) {
                            processObject(extras.get(key))
                        }
                    }
                }

                if (extractedTags.isNotEmpty()) {
                    playBeep()
                    runOnUiThread {
                        for (tag in extractedTags) {
                            scanEventSink?.success(tag)
                        }
                    }
                }
            }
        }

        val filter = IntentFilter().apply {
            // 1. Chainway C72 / C66 KeyboardEmulator & UHF Broadcast Actions
            addAction("com.rscja.scanner.action.scanner.RFID")
            addAction("com.rscja.scanner.action.scanner.BARCODE")
            addAction("com.rscja.android.action.scanner.RFID")
            addAction("com.rscja.android.action.scanner.BARCODE")
            addAction("com.rscja.action.scanner.RFID")
            addAction("com.rscja.action.scanner.BARCODE")
            addAction("com.rscja.action.scanner.DATA")
            addAction("com.rscja.android.action.scanner.DATA")
            addAction("com.rscja.android.action.scanner.READER")
            addAction("com.rscja.android.RESULT_ACTION")
            addAction("android.intent.action.scanner.RFID")
            addAction("android.intent.action.RFID_DATA")
            addAction("android.intent.action.BARCODE_DATA")
            addAction("android.intent.action.UHF_DATA")
            addAction("android.intent.action.SCANNER_BARCODE_DATA")
            addAction("android.intent.action.SCANNER_DATA")
            addAction("com.rfid.KEY_DATA")
            addAction("com.rfid.SCAN")
            addAction("com.rfid.broadcast")
            addAction("com.rfid.action.TAG")
            addAction("com.rfid.action.EPC")
            addAction("com.scanner.broadcast")
            addAction("com.barcode.sendBroadcast")
            addAction("com.android.scanner.broadcast")
            addAction("com.android.server.scannerservice.broadcast")
            addAction("com.rscja.rfid.action.DATA")
            addAction("com.rscja.android.KEY_DOWN")
            addAction("com.rscja.android.uhf.tag")
            addAction("com.rscja.android.uhf.TAG_READ")
            addAction("com.rscja.android.uhf.TAG_INFO")
            addAction("com.rscja.android.uhf.TAG_EPC")
            addAction("com.rscja.android.uhf.EPC")
            addAction("com.rscja.android.uhf.TAG")
            addAction("com.rscja.android.extra.UHF_EPC")
            addAction("com.rscja.android.uhf.extra.UHF_EPC")
            addAction("com.chainway.uhf.TAG_READ")
            addAction("com.chainway.uhf.action")
            addAction("com.chainway.uhf.action.TAG")
            addAction("com.chainway.uhf.action.EPC")
            addAction("com.rscja.android.action.UHF_TAG")
            addAction("com.rscja.android.action.UHF_DATA")
            addAction("com.rscja.android.action.BARCODE_DATA")
            addAction("com.rscja.android.uhf.action.TAG")
            addAction("com.rscja.android.uhf.action.EPC")
            addAction("com.rscja.scanner.action.RFID")
            addAction("com.rscja.scanner.action.BARCODE")
            addAction("com.rscja.scanner.action.DATA")
            addAction("com.rscja.android.scanner.action.RFID")
            addAction("com.rscja.android.scanner.action.BARCODE")
            addAction("com.rscja.android.scanner.action.DATA")
            addAction("com.rscja.uhf.action.TAG")
            addAction("com.rscja.uhf.action.EPC")
            addAction("com.rscja.uhf.action.SCAN")
            addAction("com.rscja.uhf.TAG")
            addAction("com.rscja.uhf.EPC")
            addAction("com.rscja.uhf.DATA")
            addAction("com.rscja.uhf.RFID")
            addAction("com.chainway.action.RFID")
            addAction("com.chainway.action.BARCODE")
            addAction("com.chainway.action.SCAN")
            addAction("com.chainway.action.DATA")
            addAction("com.chainway.scanner.action.RFID")
            addAction("com.chainway.scanner.action.BARCODE")
            addAction("android.intent.action.SCAN")
            addAction("android.intent.action.DECODE")
            addAction("android.intent.action.SCANNER_RESULT")
            addAction("com.rscja.scanner.RFID")
            addAction("com.rscja.scanner.BARCODE")
            addAction("com.vog.terminal.SCAN")
            addAction("com.vog.terminal.RFID")
            addAction("com.vog.terminal.ACTION")

            // 2. Zebra DataWedge Actions
            addAction("com.symbol.datawedge.api.RESULT_ACTION")
            addAction("com.symbol.datawedge.data_string")
            addAction("com.zebra.datacapture1.ACTION")
            addAction("com.dwexample.ACTION")

            // 3. Honeywell Actions
            addAction("com.honeywell.decode.intent.action.SCAN_RESULT")

            // 4. Urovo Actions
            addAction("android.intent.ACTION_DECODE_DATA")
            addAction("urovo.rcv.action")
            addAction("com.ubx.datawedge.ACTION")

            // 5. Newland Actions
            addAction("nlscan.action.SCANNER_RESULT")

            // 6. iData & Point Mobile Actions
            addAction("android.intent.action.BARCODERESULT")
            addAction("device.common.ACTION_BARCODE_DECODED")
            addAction("scanner.reader.action")

            // 7. Seuic & CipherLab & Sunmi & General Actions
            addAction("com.android.scanner.service_result")
            addAction("com.cipherlab.barcode.GeneralString")
            addAction("com.sunmi.scanner.ACTION_DATA_CODE")
            addAction("ACTION_BARCODE_DATA")
            addAction("com.google.zxing.client.android.SCAN")
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(scanReceiver, filter, Context.RECEIVER_EXPORTED)
            } else {
                registerReceiver(scanReceiver, filter)
            }
        } catch (_: Exception) {
            try {
                registerReceiver(scanReceiver, filter)
            } catch (_: Exception) {}
        }
    }

    private fun unregisterScanReceiver() {
        scanReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (_: Exception) {}
            scanReceiver = null
        }
    }

    override fun onDestroy() {
        mainHandler.removeCallbacks(flushRunnable)
        autoStopRunnable?.let { mainHandler.removeCallbacks(it) }
        try {
            toneGenerator?.release()
        } catch (_: Exception) {}
        toneGenerator = null
        unregisterScanReceiver()
        super.onDestroy()
    }
}
