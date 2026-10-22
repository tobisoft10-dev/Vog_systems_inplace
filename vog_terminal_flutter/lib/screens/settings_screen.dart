import 'package:flutter/material.dart';
import '../config/api_config.dart';
import '../services/api_service.dart';
import '../services/hardware_scanner.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final TextEditingController _urlController = TextEditingController();
  final TextEditingController _operatorController = TextEditingController();
  String _selectedScannerMode = 'rfid';
  bool _isTesting = false;
  bool? _testResult;

  @override
  void initState() {
    super.initState();
    _urlController.text = ApiConfig.serverUrl;
    _operatorController.text = ApiConfig.operatorName;
    _selectedScannerMode = ApiConfig.scannerMode;
  }

  @override
  void dispose() {
    _urlController.dispose();
    _operatorController.dispose();
    super.dispose();
  }

  Future<void> _handleTestConnection() async {
    setState(() {
      _isTesting = true;
      _testResult = null;
    });

    await ApiConfig.setServerUrl(_urlController.text);
    final ok = await ApiService.testConnection();

    if (mounted) {
      setState(() {
        _isTesting = false;
        _testResult = ok;
      });
    }
  }

  Future<void> _handleSave() async {
    await ApiConfig.setServerUrl(_urlController.text);
    await ApiConfig.setOperatorName(_operatorController.text);
    await ApiConfig.setScannerMode(_selectedScannerMode);
    await HardwareScanner.syncScannerMode(_selectedScannerMode);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Ayarlar ve Tetik Modu başarıyla kaydedildi.'),
          backgroundColor: Color(0xFF065F46),
        ),
      );
      Navigator.of(context).pop(true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        title: const Text(
          '⚙️ El Terminali Ayarları',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Server Config Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF1F2937)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '🌐 VOG SUNUCU BAĞLANTISI',
                    style: TextStyle(
                      color: Color(0xFFE5A93C),
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Sunucu IP / Host Adresi & Port:',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _urlController,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'http://192.168.1.100:3001',
                      hintStyle: TextStyle(color: Colors.grey.shade600),
                      filled: true,
                      fillColor: const Color(0xFF1E293B),
                      prefixIcon: const Icon(Icons.lan_outlined, color: Color(0xFF38BDF8), size: 20),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFF334155)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFF334155)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFFE5A93C), width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'El terminalinin bağlı olduğu WiFi ağındaki bilgisayarın IP adresini girin (Örn: http://192.168.1.50:3001).',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _isTesting ? null : _handleTestConnection,
                          icon: _isTesting
                              ? const SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF38BDF8)),
                                )
                              : const Icon(Icons.sync, size: 16, color: Color(0xFF38BDF8)),
                          label: Text(
                            _isTesting ? 'Test Ediliyor...' : '🔌 Bağlantıyı Test Et',
                            style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFF38BDF8)),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_testResult != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: _testResult == true ? const Color(0xFF064E3B) : const Color(0xFF7F1D1D),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _testResult == true ? Icons.check_circle : Icons.error,
                            color: Colors.white,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _testResult == true
                                  ? '✅ VOG Sunucusuna Başarıyla Bağlanıldı!'
                                  : '❌ Sunucuya Ulaşılamadı. IP ve Portu Kontrol Edin.',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Scanner Mode Config Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF1F2937)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '🔫 DONANIM TETİK & OKUMA MODU',
                    style: TextStyle(
                      color: Color(0xFFE5A93C),
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'El terminalindeki donanımsal tetiğe basıldığında hangi okuyucu çalışsın:',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                  ),
                  const SizedBox(height: 12),

                  // Option 1: Barcode Scanner
                  InkWell(
                    onTap: () {
                      setState(() {
                        _selectedScannerMode = 'barcode';
                      });
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: _selectedScannerMode == 'barcode' ? const Color(0xFF1E293B) : const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _selectedScannerMode == 'barcode' ? const Color(0xFF38BDF8) : const Color(0xFF334155),
                          width: _selectedScannerMode == 'barcode' ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Radio<String>(
                            value: 'barcode',
                            groupValue: _selectedScannerMode,
                            activeColor: const Color(0xFF38BDF8),
                            onChanged: (val) {
                              if (val != null) setState(() => _selectedScannerMode = val);
                            },
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.qr_code_scanner, color: Color(0xFF38BDF8), size: 24),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '1. Normal Barkod Okuyucu',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  '1D / 2D Optik Barkod & Karekod Tarayıcı',
                                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 10),

                  // Option 2: RFID Label Reader
                  InkWell(
                    onTap: () {
                      setState(() {
                        _selectedScannerMode = 'rfid';
                      });
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: _selectedScannerMode == 'rfid' ? const Color(0xFF1E293B) : const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _selectedScannerMode == 'rfid' ? const Color(0xFF10B981) : const Color(0xFF334155),
                          width: _selectedScannerMode == 'rfid' ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Radio<String>(
                            value: 'rfid',
                            groupValue: _selectedScannerMode,
                            activeColor: const Color(0xFF10B981),
                            onChanged: (val) {
                              if (val != null) setState(() => _selectedScannerMode = val);
                            },
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.sensors, color: Color(0xFF10B981), size: 24),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '2. RFID Etiket Okuyucu',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'UHF RFID Çip & EPC Etiket Okuyucu',
                                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Operator Config Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF1F2937)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '👤 OPERATÖR BİLGİSİ',
                    style: TextStyle(
                      color: Color(0xFFE5A93C),
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Operatör Adı / Koli Paketleyen:',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _operatorController,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Operatör Adı',
                      filled: true,
                      fillColor: const Color(0xFF1E293B),
                      prefixIcon: const Icon(Icons.badge_outlined, color: Color(0xFFE5A93C), size: 20),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFF334155)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFF334155)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: Color(0xFFE5A93C), width: 2),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Save Button
            ElevatedButton.icon(
              onPressed: _handleSave,
              icon: const Icon(Icons.save, color: Colors.black, size: 20),
              label: const Text(
                'AYARLARI KAYDET',
                style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 15),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE5A93C),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 4,
              ),
            ),

            const SizedBox(height: 20),

            // App Version Info Footer Card
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1E293B)),
              ),
              child: const Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.terminal, color: Color(0xFFE5A93C), size: 16),
                      SizedBox(width: 6),
                      Text(
                        'VOG El Terminali ${ApiConfig.appVersion} (Build ${ApiConfig.appBuild})',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Text(
                    'LOGO LEM İrsaliye & Mükerrer Okuma Koruması',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10.5),
                  ),
                  Text(
                    'Sürüm Tarihi: ${ApiConfig.appReleaseDate}',
                    style: TextStyle(color: Color(0xFF64748B), fontSize: 10),
                  ),
                ],
              ),
            ),

          ],
        ),
      ),
    );
  }
}
