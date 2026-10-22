import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  static const String _keyServerUrl = 'vog_server_url';
  static const String _keyOperatorName = 'vog_operator_name';
  static const String _keyScannerMode = 'vog_scanner_mode'; // 'barcode' or 'rfid'

  static const String defaultUrl = 'http://192.168.1.251:3001';
  static const String defaultOperator = 'El Terminali Operatörü';
  static const String defaultScannerMode = 'rfid';
  static const String appVersion = 'v1.5.2';
  static const String appBuild = '13';
  static const String appReleaseDate = '06.10.2026';

  static String _serverUrl = defaultUrl;
  static String _operatorName = defaultOperator;
  static String _scannerMode = defaultScannerMode;

  static String get serverUrl => _serverUrl;
  static String get operatorName => _operatorName;
  static String get scannerMode => _scannerMode;
  static bool get isRfidMode => _scannerMode == 'rfid';

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _serverUrl = prefs.getString(_keyServerUrl) ?? defaultUrl;
    _operatorName = prefs.getString(_keyOperatorName) ?? defaultOperator;
    _scannerMode = prefs.getString(_keyScannerMode) ?? defaultScannerMode;
  }

  static Future<void> setScannerMode(String mode) async {
    _scannerMode = (mode == 'barcode') ? 'barcode' : 'rfid';
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyScannerMode, _scannerMode);
  }

  static Future<void> setServerUrl(String url) async {
    var cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.substring(0, cleanUrl.length - 1);
    }
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'http://$cleanUrl';
    }
    _serverUrl = cleanUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyServerUrl, _serverUrl);
  }

  static Future<void> setOperatorName(String name) async {
    _operatorName = name.trim().isEmpty ? defaultOperator : name.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyOperatorName, _operatorName);
  }

  static Uri uri(String path, [Map<String, dynamic>? queryParams]) {
    final base = _serverUrl;
    final fullUrl = '$base$path';
    return Uri.parse(fullUrl).replace(queryParameters: queryParams);
  }
}
