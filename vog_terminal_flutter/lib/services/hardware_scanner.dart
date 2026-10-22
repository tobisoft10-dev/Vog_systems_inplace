import 'dart:async';
import 'package:flutter/services.dart';

class HardwareScanner {
  static const EventChannel _eventChannel = EventChannel('com.vog.terminal/scanner');
  static const MethodChannel _methodChannel = MethodChannel('com.vog.terminal/scanner_control');
  static final StreamController<String> _scanController = StreamController<String>.broadcast();

  static StreamSubscription? _subscription;
  static final StringBuffer _keyBuffer = StringBuffer();
  static Timer? _keyBufferTimer;

  static Stream<String> get scanStream => _scanController.stream;

  static Future<void> init([String? initialMode]) async {
    _subscription?.cancel();

    // 1. Android Native Broadcast Intent Stream
    try {
      _subscription = _eventChannel.receiveBroadcastStream().listen(
        (dynamic event) {
          if (event != null && event is String && event.trim().isNotEmpty) {
            _scanController.add(event.trim().toUpperCase());
          }
        },
        onError: (dynamic error) {
          // ignore: avoid_print
          print('Scanner EventChannel error: $error');
        },
      );
    } catch (e) {
      // ignore: avoid_print
      print('Scanner EventChannel init error: $e');
    }

    if (initialMode != null) {
      syncScannerMode(initialMode);
    }

    // 2. Global Hardware Keyboard Hook (for Keyboard Wedge / Virtual Keyboard scanners)
    HardwareKeyboard.instance.removeHandler(_handleGlobalKeyEvent);
    HardwareKeyboard.instance.addHandler(_handleGlobalKeyEvent);
  }

  static Future<void> syncScannerMode(String mode) async {
    try {
      await _methodChannel.invokeMethod('setScannerMode', {'mode': mode});
    } catch (_) {}
  }

  static Future<void> triggerHardwareScan() async {
    try {
      await _methodChannel.invokeMethod('triggerScan');
    } catch (_) {}
  }

  static Future<void> stopHardwareScan() async {
    try {
      await _methodChannel.invokeMethod('stopScan');
    } catch (_) {}
  }

  static List<String> parseScanData(String rawInput) {
    final List<String> results = [];
    var clean = rawInput.trim();
    if (clean.isEmpty) return results;

    // 1. Standart barkod/UHF etiket öneklerini ve RSSI değerlerini temizle
    // Örn: "EPC: 303B50CC...", "DATA: 303B...", "TAG: ...", ",RSSI:-65", ",-65"
    clean = clean.replaceAll(RegExp(r'(EPC|DATA|TAG|BARCODE|ID)\s*:\s*', caseSensitive: false), ' ');
    clean = clean.replaceAll(RegExp(r',\s*RSSI:\s*-?\d+(\.\d+)?', caseSensitive: false), ' ');
    clean = clean.replaceAll(RegExp(r',\s*(-?\d+(\.\d+)?)\s*$', caseSensitive: false), ' ');

    // 2. Satır sonları, boşluklar, virgül, noktalı virgül ve tab karakterlerine göre böl
    final tokens = clean.split(RegExp(r'[\r\n\s,;\t|]+')).map((s) => s.trim().toUpperCase()).where((s) => s.isNotEmpty);

    final hexRegex = RegExp(r'^[0-9A-F]+$');

    for (final token in tokens) {
      // 3. VOG SGTIN EPC Formatı (303B50CC...)
      // Eğer başında PC word (3000) veya başka karakterler varsa 303B50CC'den itibaren kes!
      if (token.contains('303B50CC')) {
        final idx = token.indexOf('303B50CC');
        final candidate = token.substring(idx);
        // VOG EPC 22 veya 24 karakterdir
        if (candidate.length >= 22) {
          final epc = candidate.length >= 24 ? candidate.substring(0, 24) : candidate.substring(0, 22);
          if (hexRegex.hasMatch(epc) && !results.contains(epc)) {
            results.add(epc);
            continue;
          }
        }
      }

      // 4. Impinj / Alien Standart EPC (E280... veya E200...)
      if (token.contains('E280') || token.contains('E200')) {
        final idx = token.contains('E280') ? token.indexOf('E280') : token.indexOf('E200');
        final candidate = token.substring(idx);
        if (candidate.length >= 24) {
          final epc = candidate.substring(0, 24);
          if (hexRegex.hasMatch(epc) && !results.contains(epc)) {
            results.add(epc);
            continue;
          }
        }
      }

      // 5. 22 veya 24 karakterlik saf Hex EPC
      if ((token.length == 22 || token.length == 24) && hexRegex.hasMatch(token)) {
        if (!results.contains(token)) results.add(token);
        continue;
      }

      // 6. Peş peşe bitişik okunan 24 karakterlik Hex EPC burst dizisi (48, 72, 96...)
      if (token.length > 24 && token.length % 24 == 0 && hexRegex.hasMatch(token)) {
        for (int i = 0; i < token.length; i += 24) {
          final subTag = token.substring(i, i + 24);
          if (!results.contains(subTag)) results.add(subTag);
        }
        continue;
      }

      // 7. Standart Barkod / SKU veya diğer veri
      if (!results.contains(token)) {
        results.add(token);
      }
    }

    return results;
  }

  static bool _handleGlobalKeyEvent(KeyEvent event) {
    if (event is KeyDownEvent) {
      final key = event.logicalKey;

      if (key == LogicalKeyboardKey.enter || 
          key == LogicalKeyboardKey.numpadEnter || 
          key == LogicalKeyboardKey.tab) {
        final buffered = _keyBuffer.toString().trim();
        _keyBuffer.clear();
        _keyBufferTimer?.cancel();

        if (buffered.isNotEmpty) {
          final tags = parseScanData(buffered);
          for (final t in tags) {
            _scanController.add(t);
          }
          return true; // handled
        }
      } else if (key == LogicalKeyboardKey.f9 ||
                 key == LogicalKeyboardKey.f10 ||
                 key == LogicalKeyboardKey.f11 ||
                 key == LogicalKeyboardKey.f12) {
        triggerHardwareScan();
      } else if (event.character != null && event.character!.isNotEmpty) {
        _keyBuffer.write(event.character);

        _keyBufferTimer?.cancel();
        _keyBufferTimer = Timer(const Duration(milliseconds: 150), () {
          final buffered = _keyBuffer.toString().trim();
          if (buffered.length >= 8) {
            _keyBuffer.clear();
            final tags = parseScanData(buffered);
            for (final t in tags) {
              _scanController.add(t);
            }
          }
        });
      }
    }
    return false;
  }

  static void injectScan(String rawCode) {
    final tags = parseScanData(rawCode);
    for (final tag in tags) {
      triggerScanFeedback();
      _scanController.add(tag);
    }
  }

  static void triggerScanFeedback() {
    try {
      HapticFeedback.lightImpact();
    } catch (_) {}
  }

  static void triggerSuccessFeedback() {
    try {
      HapticFeedback.mediumImpact();
    } catch (_) {}
  }

  static void triggerErrorFeedback() {
    try {
      HapticFeedback.heavyImpact();
      HapticFeedback.vibrate();
    } catch (_) {}
  }

  static void dispose() {
    _subscription?.cancel();
    _keyBufferTimer?.cancel();
    HardwareKeyboard.instance.removeHandler(_handleGlobalKeyEvent);
    _scanController.close();
  }
}


