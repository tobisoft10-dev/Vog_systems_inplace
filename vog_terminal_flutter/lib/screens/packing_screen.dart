import 'dart:async';
import 'package:flutter/material.dart';
import '../config/api_config.dart';
import '../models/order_model.dart';
import '../models/box_model.dart';
import '../services/api_service.dart';
import '../services/hardware_scanner.dart';
import 'order_selection_dialog.dart';
import 'settings_screen.dart';

class PackingScreen extends StatefulWidget {
  const PackingScreen({super.key});

  @override
  State<PackingScreen> createState() => _PackingScreenState();
}

class _PackingScreenState extends State<PackingScreen> {
  OrderModel? _selectedOrder;
  int _activeBoxNo = 1;
  final int _totalBoxes = 1;
  final List<BoxItem> _currentBoxItems = [];
  List<OrderBox> _savedBoxes = [];
  Set<String> _allowedEpcs = {};
  Set<String> _allowedBarcodes = {};
  Set<String> _allowedSkus = {};
  Set<String> _scannedEpcs = {};

  // High-Performance O(1) Pre-normalized Lookup Sets (Zero Screen Freeze)
  Set<String> _normAllowedEpcs = {};
  Set<String> _normAllowedBarcodes = {};
  Set<String> _normAllowedSkus = {};
  Set<String> _normScannedEpcs = {};
  final Map<String, int> _normSealedBoxItems = {};
  final Set<String> _currentBoxEpcs = {};
  bool _showAllBoxItems = false;

  final TextEditingController _manualScanController = TextEditingController();
  final FocusNode _scanFocusNode = FocusNode();
  StreamSubscription<String>? _scanSubscription;

  bool _isSaving = false;
  bool _createLogoDespatch = true;
  final Map<String, int> _recentDuplicateTimestamps = {};

  String _lastScannedCode = '';
  String _lastScanStatus = 'Tetiğe basarak etiket okutun.';
  String _lastScanStatusType = 'idle'; // 'idle', 'success', 'duplicate', 'error'

  @override
  void initState() {
    super.initState();
    HardwareScanner.init(ApiConfig.scannerMode);
    _scanSubscription = HardwareScanner.scanStream.listen(_handleHardwareScan);
  }

  @override
  void dispose() {
    _scanSubscription?.cancel();
    _manualScanController.dispose();
    _scanFocusNode.dispose();
    super.dispose();
  }

  String _normalizeCode(String input) {
    var s = input.trim().toUpperCase();
    // 1. Önekleri temizle (EPC:, DATA:, TAG:, BARCODE:, ID:)
    s = s.replaceAll(RegExp(r'^(EPC|DATA|TAG|BARCODE|ID)\s*:\s*', caseSensitive: false), '');
    // 2. PC word (3000) önekini ve VOG SGTIN-96 gövdesini (303B50CC) ayıkla
    if (s.contains('303B50CC')) {
      final idx = s.indexOf('303B50CC');
      var candidate = s.substring(idx);
      // VOG EPC 22 karakterlik standart gövdedir (veya 24 karakter)
      if (candidate.length >= 22) {
        return candidate.substring(0, 22);
      }
      return candidate;
    }
    // 3. Standart Gen2 EPC'lerin başındaki 3000 PC word'ünü temizle
    if (s.length > 24 && s.startsWith('3000') && (s.contains('E280') || s.contains('E200'))) {
      s = s.substring(4);
    }
    return s;
  }

  void _syncFastLookupSets() {
    _normAllowedEpcs = _allowedEpcs.map(_normalizeCode).where((s) => s.isNotEmpty).toSet();
    _normAllowedBarcodes = <String>{};
    for (final b in _allowedBarcodes) {
      final norm = b.trim().toUpperCase();
      if (norm.isNotEmpty) {
        _normAllowedBarcodes.add(norm);
        final noZero = norm.replaceFirst(RegExp(r'^0+'), '');
        if (noZero.isNotEmpty) _normAllowedBarcodes.add(noZero);
      }
    }
    _normAllowedSkus = _allowedSkus.map((s) => s.trim().toUpperCase()).where((s) => s.isNotEmpty).toSet();
    _normScannedEpcs = _scannedEpcs.map(_normalizeCode).where((s) => s.isNotEmpty).toSet();

    _normSealedBoxItems.clear();
    for (final box in _savedBoxes) {
      if (box.boxNo == _activeBoxNo) continue;
      for (final it in box.items) {
        final epcNorm = _normalizeCode(it.epc);
        if (epcNorm.isNotEmpty) _normSealedBoxItems[epcNorm] = box.boxNo;
        final barNorm = _normalizeCode(it.barcode);
        if (barNorm.isNotEmpty) _normSealedBoxItems[barNorm] = box.boxNo;
      }
    }

    _currentBoxEpcs.clear();
    for (final it in _currentBoxItems) {
      final epcNorm = _normalizeCode(it.epc);
      if (epcNorm.isNotEmpty) _currentBoxEpcs.add(epcNorm);
      final barNorm = _normalizeCode(it.barcode);
      if (barNorm.isNotEmpty) _currentBoxEpcs.add(barNorm);
    }
  }

  void _handleHardwareScan(String rawCode) {
    if (rawCode.trim().isEmpty) return;

    // Donanım okumasında klavyeyi anında kapat
    FocusManager.instance.primaryFocus?.unfocus();

    if (_selectedOrder == null) {
      setState(() {
        _lastScannedCode = rawCode.trim().toUpperCase();
        _lastScanStatus = '⚠️ Lütfen önce yukarıdan sipariş seçin!';
        _lastScanStatusType = 'error';
      });
      HardwareScanner.triggerErrorFeedback();
      return;
    }

    final parsedTags = HardwareScanner.parseScanData(rawCode);
    if (parsedTags.isEmpty) return;

    final now = DateTime.now().millisecondsSinceEpoch;
    final int? currentOrdId = int.tryParse(_selectedOrder!.orderNumber);
    final String currentOrdNo = _selectedOrder!.orderNumber.trim();
    final String orderBarcode = _selectedOrder!.barcode.trim().toUpperCase();
    final String orderSku = _selectedOrder!.sku.trim().toUpperCase();
    final bool hasAnyWhitelist = _normAllowedEpcs.isNotEmpty ||
        _normAllowedBarcodes.isNotEmpty ||
        _normAllowedSkus.isNotEmpty ||
        orderBarcode.isNotEmpty ||
        orderSku.isNotEmpty;

    final List<BoxItem> itemsToAdd = [];
    String newLastScannedCode = _lastScannedCode;
    String newLastScanStatus = _lastScanStatus;
    String newLastScanStatusType = _lastScanStatusType;
    bool hasNewItem = false;
    bool hasError = false;

    for (final raw in parsedTags) {
      final normCode = _normalizeCode(raw);
      if (normCode.isEmpty) continue;

      // 1. SGTIN-96 VOG EPC Format Kontrolü (303B50CC...) - Sipariş Doğrulaması
      bool isSgtinOrderMatch = false;
      if (normCode.startsWith('303B50CC') && normCode.length >= 14) {
        final int? embeddedOrderId = int.tryParse(normCode.substring(8, 14), radix: 16);
        if (embeddedOrderId != null && currentOrdId != null && embeddedOrderId != currentOrdId) {
          final lastWarn = _recentDuplicateTimestamps[normCode] ?? 0;
          if (now - lastWarn > 1500) {
            _recentDuplicateTimestamps[normCode] = now;
            newLastScannedCode = normCode;
            newLastScanStatus = '🚫 YABANCI SİPARİŞ! Bu etiket Sipariş #$embeddedOrderId\'ye ait! (Seçili: #${_selectedOrder!.orderNumber})';
            newLastScanStatusType = 'error';
            hasError = true;
          }
          continue;
        } else if (embeddedOrderId != null && currentOrdId != null && embeddedOrderId == currentOrdId) {
          isSgtinOrderMatch = true;
        }
      }

      // 2. Whitelist ve Sipariş Doğrulaması (Yabancı Etiket Engelleme - O(1) Hash Kontrolü)
      final String cleanNoZero = normCode.replaceFirst(RegExp(r'^0+'), '');
      final bool isKnownEpc = isSgtinOrderMatch || _normAllowedEpcs.contains(normCode);
      final bool isKnownBarcode = _normAllowedBarcodes.contains(normCode) || _normAllowedBarcodes.contains(cleanNoZero);
      final bool isKnownSku = _normAllowedSkus.contains(normCode);
      final bool isOrderBarcode = orderBarcode.isNotEmpty && orderBarcode == normCode;
      final bool isOrderSku = orderSku.isNotEmpty && (orderSku == normCode || normCode.contains(orderSku));
      final bool isOrderNo = currentOrdNo == normCode;

      if (hasAnyWhitelist && !isKnownEpc && !isKnownBarcode && !isKnownSku && !isOrderBarcode && !isOrderSku && !isOrderNo) {
        final lastWarn = _recentDuplicateTimestamps[normCode] ?? 0;
        if (now - lastWarn > 1500) {
          _recentDuplicateTimestamps[normCode] = now;
          newLastScannedCode = normCode;
          newLastScanStatus = '🚫 YABANCI ETİKET ENGELLENDİ! ($normCode) seçili siparişe ait değil!';
          newLastScanStatusType = 'error';
          hasError = true;
        }
        continue;
      }

      // 3. MÜKERRER KONTROLÜ (3 Kademe - O(1) Hızlı Arama):
      // A) Mevcut Açık Koli İçinde Mükerrer Kontrolü
      if (_currentBoxEpcs.contains(normCode)) {
        final lastWarn = _recentDuplicateTimestamps[normCode] ?? 0;
        if (now - lastWarn > 1500) {
          _recentDuplicateTimestamps[normCode] = now;
          newLastScannedCode = normCode;
          newLastScanStatus = '⚠️ MÜKERRER ETİKET! Bu kolide zaten var (Koli İçi: ${_currentBoxItems.length + itemsToAdd.length} Adet)';
          newLastScanStatusType = 'duplicate';
          hasError = true;
        }
        continue;
      }

      // B) Bu Siparişe Ait Daha Önce Mühürlenmiş Kolilerde Mükerrer Kontrolü
      final int? sealedBoxNo = _normSealedBoxItems[normCode];
      if (sealedBoxNo != null) {
        final lastWarn = _recentDuplicateTimestamps[normCode] ?? 0;
        if (now - lastWarn > 1500) {
          _recentDuplicateTimestamps[normCode] = now;
          newLastScannedCode = normCode;
          newLastScanStatus = '⚠️ MÜKERRER! $sealedBoxNo. Kolide zaten mühürlenmiş!';
          newLastScanStatusType = 'duplicate';
          hasError = true;
        }
        continue;
      }

      // C) Veritabanında Daha Önce Okutulmuş EPC Setinde Mükerrer Kontrolü
      if (_normScannedEpcs.contains(normCode)) {
        final lastWarn = _recentDuplicateTimestamps[normCode] ?? 0;
        if (now - lastWarn > 1500) {
          _recentDuplicateTimestamps[normCode] = now;
          newLastScannedCode = normCode;
          newLastScanStatus = '⚠️ MÜKERRER! Daha önce paketlenmiş etiket!';
          newLastScanStatusType = 'duplicate';
          hasError = true;
        }
        continue;
      }

      // 4. Benzersiz ve Siparişe Ait Etiket: Koliye Ekle & Sayacı Arttır
      _recentDuplicateTimestamps.remove(normCode);
      _currentBoxEpcs.add(normCode);
      if (orderBarcode.isNotEmpty) {
        _currentBoxEpcs.add(_normalizeCode(orderBarcode));
      }

      itemsToAdd.add(
        BoxItem(
          epc: normCode,
          barcode: _selectedOrder?.barcode.isNotEmpty == true ? _selectedOrder!.barcode : normCode,
          sku: _selectedOrder?.sku.isNotEmpty == true ? _selectedOrder!.sku : (_selectedOrder?.brand ?? ''),
          productName: _selectedOrder?.productName ?? 'Paketlenen Ürün',
        ),
      );
      hasNewItem = true;
      newLastScannedCode = normCode;
      newLastScanStatus = '✅ EKLENDİ (+1 Adet) - Koli İçi: ${_currentBoxItems.length + itemsToAdd.length} Adet';
      newLastScanStatusType = 'success';
    }

    // Toplu batch işlemi bittikten sonra TEK bir setState çağrısı yapılır:
    setState(() {
      if (itemsToAdd.isNotEmpty) {
        _currentBoxItems.insertAll(0, itemsToAdd);
      }
      _lastScannedCode = newLastScannedCode;
      _lastScanStatus = newLastScanStatus;
      _lastScanStatusType = newLastScanStatusType;
    });

    if (hasNewItem) {
      HardwareScanner.triggerScanFeedback();
    } else if (hasError) {
      HardwareScanner.triggerErrorFeedback();
    }
  }

  Future<void> _selectOrder() async {
    final OrderModel? order = await Navigator.of(context).push<OrderModel>(
      MaterialPageRoute(builder: (_) => const OrderSelectionDialog()),
    );

    if (order != null) {
      setState(() {
        _selectedOrder = order;
        _currentBoxItems.clear();
        _currentBoxEpcs.clear();
      });
      await _loadOrderBoxes(order.orderNumber);
    }
  }

  Future<void> _loadOrderBoxes(String orderNumber) async {
    final ctx = await ApiService.getOrderContext(orderNumber);
    if (mounted) {
      setState(() {
        if (ctx != null) {
          _savedBoxes = ctx.boxes;
          _allowedEpcs = ctx.allowedEpcs;
          _allowedBarcodes = ctx.allowedBarcodes;
          _allowedSkus = ctx.allowedSkus;
          _scannedEpcs = ctx.scannedEpcs;
          if (ctx.boxes.isNotEmpty) {
            final maxBoxNo = ctx.boxes.map((b) => b.boxNo).reduce((a, b) => a > b ? a : b);
            _activeBoxNo = maxBoxNo + 1;
          } else {
            _activeBoxNo = 1;
          }
        } else {
          _savedBoxes = [];
          _allowedEpcs = {};
          _allowedBarcodes = {};
          _allowedSkus = {};
          _scannedEpcs = {};
          _activeBoxNo = 1;
        }
        _syncFastLookupSets();
      });
    }
  }

  Future<void> _handleSealAndSaveBox() async {
    if (_selectedOrder == null) {
      _showToast('Lütfen önce bir sipariş seçin.', isError: true);
      return;
    }
    if (_currentBoxItems.isEmpty) {
      _showToast('Koliye en az 1 adet ürün okutun.', isError: true);
      return;
    }

    setState(() => _isSaving = true);

    final res = await ApiService.saveBox(
      orderNumber: _selectedOrder!.orderNumber,
      boxNo: _activeBoxNo,
      totalBoxes: _activeBoxNo > _totalBoxes ? _activeBoxNo : _totalBoxes,
      items: _currentBoxItems,
      brand: _selectedOrder!.brand,
      staffName: ApiConfig.operatorName,
      createLogoDespatch: _createLogoDespatch,
    );

    if (mounted) {
      setState(() => _isSaving = false);

      if (res['success'] == true) {
        HardwareScanner.triggerSuccessFeedback();
        final logoSuccess = res['logo_sync'] != null && res['logo_sync']['success'] == true;
        _showToast(
          logoSuccess
              ? '🎉 $_activeBoxNo. Koli Mühürlendi & LOGO İrsaliyesi Kaydedildi (${_currentBoxItems.length} Adet)!'
              : '🎉 $_activeBoxNo. Koli Başarıyla Mühürlendi (${_currentBoxItems.length} Adet)!',
        );
        setState(() {
          _scannedEpcs.addAll(_currentBoxItems.map((i) => i.epc.trim().toUpperCase()));
          _currentBoxItems.clear();
        });
        await _loadOrderBoxes(_selectedOrder!.orderNumber);
      } else {
        HardwareScanner.triggerErrorFeedback();
        _showToast(res['error'] ?? 'Koli kaydedilemedi.', isError: true);
      }
    }
  }

  void _showToast(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
        ),
        backgroundColor: isError ? const Color(0xFF7F1D1D) : const Color(0xFF064E3B),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: const BoxDecoration(
                color: Color(0xFFE5A93C),
                borderRadius: BorderRadius.all(Radius.circular(6)),
              ),
              child: const Text(
                'VOG PDA ${ApiConfig.appVersion}',
                style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 11),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Koli Paketleme',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Color(0xFF94A3B8)),
            onPressed: () async {
              final updated = await Navigator.of(context).push<bool>(
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
              if (updated == true && mounted) {
                setState(() {});
              }
            },
            tooltip: 'Ayarlar',
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Selected Order Header Card
                  _buildOrderHeaderCard(),

                  const SizedBox(height: 12),

                  if (_selectedOrder != null) ...[
                    // 2. Active Box Number Selector & Sealed Count
                    _buildBoxSelector(),

                    const SizedBox(height: 12),

                    // 3. Giant Live Counter Card
                    _buildLiveCounterCard(),

                    const SizedBox(height: 12),

                    // 4. Active Scanner / RFID Mode Banner
                    _buildScannerModeHeader(),

                    const SizedBox(height: 12),

                    // 5. Barcode / RFID Input Form & Trigger Button
                    _buildScanInputForm(),

                    const SizedBox(height: 12),

                    // 6. LOGO LEM Despatch Toggle Switch Card
                    _buildLogoDespatchToggle(),

                    const SizedBox(height: 12),

                    // 7. Seal & Save Action Button
                    _buildSealBoxButton(),

                    const SizedBox(height: 14),

                    // 6. Scanned Items List in this Box
                    _buildScannedItemsList(),

                    const SizedBox(height: 14),

                    // 7. Previously Sealed Boxes
                    if (_savedBoxes.isNotEmpty) _buildSealedBoxesList(),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderHeaderCard() {
    if (_selectedOrder == null) {
      return InkWell(
        onTap: _selectOrder,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF111827),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE5A93C), width: 2),
            boxShadow: const [
              BoxShadow(
                color: Color(0x33E5A93C),
                blurRadius: 16,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              const Icon(Icons.touch_app, size: 36, color: Color(0xFFE5A93C)),
              const SizedBox(height: 8),
              const Text(
                '📦 PAKETLENECEK SİPARİŞİ SEÇİN',
                style: TextStyle(
                  color: Color(0xFFE5A93C),
                  fontWeight: FontWeight.w900,
                  fontSize: 15,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Sipariş listesinden seçim yapmak için dokunun ➔',
                style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }

    final o = _selectedOrder!;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFE5A93C),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  o.brand,
                  style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 11),
                ),
              ),
              Text(
                '#${o.orderNumber}',
                style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.w900, fontSize: 16),
              ),
              TextButton.icon(
                onPressed: _selectOrder,
                icon: const Icon(Icons.swap_horiz, size: 16, color: Color(0xFF38BDF8)),
                label: const Text('Değiştir', style: TextStyle(color: Color(0xFF38BDF8), fontSize: 12, fontWeight: FontWeight.bold)),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            o.productName,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Müşteri: ${o.subCustomerName}',
                style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Text(
                  'Toplam: ${o.totalQty} Adet',
                  style: const TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBoxSelector() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Text(
                'Aktif Koli: ',
                style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold, fontSize: 13),
              ),
              const SizedBox(width: 6),
              IconButton(
                onPressed: () {
                  if (_activeBoxNo > 1) setState(() => _activeBoxNo--);
                },
                icon: const Icon(Icons.remove_circle_outline, color: Color(0xFF94A3B8), size: 22),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFE5A93C)),
                ),
                child: Text(
                  'Koli $_activeBoxNo',
                  style: const TextStyle(color: Color(0xFFE5A93C), fontWeight: FontWeight.w900, fontSize: 14),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: () => setState(() => _activeBoxNo++),
                icon: const Icon(Icons.add_circle_outline, color: Color(0xFF38BDF8), size: 22),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: Text(
              '${_savedBoxes.length} Koli Mühürlendi',
              style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveCounterCard() {
    final count = _currentBoxItems.length;
    OrderBox? plannedBox;
    for (final b in _savedBoxes) {
      if (b.boxNo == _activeBoxNo) {
        plannedBox = b;
        break;
      }
    }
    final targetQty = plannedBox?.targetQuantity ?? 0;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: count > 0 ? const Color(0xFF10B981) : const Color(0xFF1F2937),
          width: count > 0 ? 2 : 1,
        ),
        boxShadow: [
          if (count > 0)
            const BoxShadow(
              color: Color(0x3310B981),
              blurRadius: 20,
              offset: Offset(0, 4),
            ),
        ],
      ),
      child: Column(
        children: [
          Text(
            '📦 $_activeBoxNo. KOLİ İÇİNDEKİ ÜRÜN ADEDİ',
            style: const TextStyle(
              color: Color(0xFF94A3B8),
              fontWeight: FontWeight.w900,
              fontSize: 12,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            targetQty > 0 ? '$count / $targetQty' : '$count',
            style: TextStyle(
              fontSize: targetQty > 0 ? 54 : 72,
              fontWeight: FontWeight.w900,
              fontFamily: 'monospace',
              color: count > 0 ? const Color(0xFF34D399) : const Color(0xFF64748B),
              height: 1,
            ),
          ),
          if (targetQty > 0) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(
                color: count == targetQty
                    ? const Color(0x3310B981)
                    : (count > targetQty ? const Color(0x33EF4444) : const Color(0x223B82F6)),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: count == targetQty
                      ? const Color(0xFF10B981)
                      : (count > targetQty ? const Color(0xFFEF4444) : const Color(0xFF3B82F6)),
                ),
              ),
              child: Text(
                count == targetQty
                    ? '✨ Koli Hedefi Tamamlandı ($targetQty Adet)'
                    : (count > targetQty
                        ? '⚠️ Hedef Aşıldı! (${count - targetQty} Fazla)'
                        : '🎯 Koli Hedefi: $targetQty Adet (${targetQty - count} Bekleniyor)'),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: count == targetQty
                      ? const Color(0xFF34D399)
                      : (count > targetQty ? const Color(0xFFFCA5A5) : const Color(0xFF93C5FD)),
                ),
              ),
            ),
          ],
          if (plannedBox?.itemsPlan != null && plannedBox!.itemsPlan.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              alignment: WrapAlignment.center,
              children: plannedBox.itemsPlan
                  .where((p) => p is Map && (((p['quantity'] ?? p['target_quantity'] ?? 0) as num).toInt()) > 0)
                  .map((p) {
                final sz = p['size']?.toString() ?? '';
                final tQty = ((p['quantity'] ?? p['target_quantity'] ?? 0) as num).toInt();
                final currentSizeCount = _currentBoxItems.where((it) => it.size == sz).length;
                final isMatch = currentSizeCount == tQty;
                final isOver = currentSizeCount > tQty;
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isOver
                        ? const Color(0x44EF4444)
                        : (isMatch ? const Color(0x4410B981) : const Color(0xFF1E293B)),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(
                      color: isOver
                          ? const Color(0xFFEF4444)
                          : (isMatch ? const Color(0xFF10B981) : const Color(0xFF334155)),
                    ),
                  ),
                  child: Text(
                    '$sz: $currentSizeCount/$tQty',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: isOver
                          ? const Color(0xFFFCA5A5)
                          : (isMatch ? const Color(0xFF34D399) : const Color(0xFFF8FAFC)),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
          const SizedBox(height: 6),
          const Text(
            'Tetiğe basarak RFID okutun, koli dolunca alttaki butona basın.',
            style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 11),
            textAlign: TextAlign.center,
          ),
          _buildLiveScanFeedbackCard(),
        ],
      ),
    );
  }

  Widget _buildLiveScanFeedbackCard() {
    Color borderColor;
    Color bgColor;
    Color iconColor;
    IconData iconData;

    switch (_lastScanStatusType) {
      case 'success':
        borderColor = const Color(0xFF10B981);
        bgColor = const Color(0x1F10B981);
        iconColor = const Color(0xFF34D399);
        iconData = Icons.check_circle;
        break;
      case 'duplicate':
        borderColor = const Color(0xFFF59E0B);
        bgColor = const Color(0x1FF59E0B);
        iconColor = const Color(0xFFFBBF24);
        iconData = Icons.warning_amber_rounded;
        break;
      case 'error':
        borderColor = const Color(0xFFEF4444);
        bgColor = const Color(0x1FEF4444);
        iconColor = const Color(0xFFF87171);
        iconData = Icons.cancel;
        break;
      default:
        borderColor = const Color(0xFF334155);
        bgColor = const Color(0xFF0F172A);
        iconColor = const Color(0xFF94A3B8);
        iconData = Icons.sensors;
    }

    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor, width: 1.5),
      ),
      child: Row(
        children: [
          Icon(iconData, color: iconColor, size: 22),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_lastScannedCode.isNotEmpty)
                  Text(
                    'Etiket: $_lastScannedCode',
                    style: TextStyle(
                      color: iconColor,
                      fontWeight: FontWeight.w900,
                      fontSize: 11,
                      fontFamily: 'monospace',
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                Text(
                  _lastScanStatus,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 11.5,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScannerModeHeader() {
    final isRfid = ApiConfig.isRfidMode;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isRfid ? const Color(0xFF10B981) : const Color(0xFF38BDF8),
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: isRfid ? const Color(0x2210B981) : const Color(0x2238BDF8),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              isRfid ? Icons.sensors : Icons.qr_code_scanner,
              color: isRfid ? const Color(0xFF10B981) : const Color(0xFF38BDF8),
              size: 22,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isRfid ? '📡 TETİK: RFID ETİKET OKUYUCU' : '🏷️ TETİK: NORMAL BARKOD OKUYUCU',
                  style: TextStyle(
                    color: isRfid ? const Color(0xFF10B981) : const Color(0xFF38BDF8),
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isRfid ? 'Tetiğe basıldığında UHF RFID çipi okunur' : 'Tetiğe basıldığında 1D/2D Barkod lazeri çalışır',
                  style: TextStyle(color: Colors.grey.shade400, fontSize: 10.5),
                ),
              ],
            ),
          ),
          // Fast Toggle Button
          OutlinedButton.icon(
            onPressed: () async {
              final newMode = isRfid ? 'barcode' : 'rfid';
              await ApiConfig.setScannerMode(newMode);
              await HardwareScanner.syncScannerMode(newMode);
              setState(() {});
              _showToast(
                newMode == 'rfid' ? '📡 RFID Etiket Okuyucu Modu Seçildi' : '🏷️ Normal Barkod Okuyucu Modu Seçildi',
              );
            },
            icon: const Icon(Icons.swap_horiz, size: 14, color: Color(0xFFE5A93C)),
            label: const Text(
              'Değiştir',
              style: TextStyle(color: Color(0xFFE5A93C), fontSize: 11, fontWeight: FontWeight.bold),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFE5A93C)),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              minimumSize: const Size(50, 32),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanInputForm() {
    final isRfid = ApiConfig.isRfidMode;
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _manualScanController,
                focusNode: _scanFocusNode,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                decoration: InputDecoration(
                  hintText: isRfid ? 'Manuel RFID EPC Kodu...' : 'Manuel Barkod No...',
                  hintStyle: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                  filled: true,
                  fillColor: const Color(0xFF111827),
                  prefixIcon: Icon(
                    isRfid ? Icons.sensors : Icons.qr_code_scanner,
                    color: isRfid ? const Color(0xFF10B981) : const Color(0xFF38BDF8),
                    size: 20,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF1F2937)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFF1F2937)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide(
                      color: isRfid ? const Color(0xFF10B981) : const Color(0xFF38BDF8),
                      width: 2,
                    ),
                  ),
                ),
                onSubmitted: (val) {
                  if (val.trim().isNotEmpty) {
                    _handleHardwareScan(val.trim());
                    _manualScanController.clear();
                  }
                },
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: () {
                final val = _manualScanController.text.trim();
                if (val.isNotEmpty) {
                  _handleHardwareScan(val);
                  _manualScanController.clear();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1E293B),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                side: const BorderSide(color: Color(0xFF334155)),
              ),
              child: const Icon(Icons.add, color: Color(0xFF38BDF8), size: 20),
            ),
          ],
        ),
        const SizedBox(height: 8),
        // Soft Hardware Trigger Button
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () async {
              HardwareScanner.triggerScanFeedback();
              await HardwareScanner.triggerHardwareScan();
            },
            icon: Icon(
              isRfid ? Icons.radar : Icons.barcode_reader,
              color: isRfid ? const Color(0xFF10B981) : const Color(0xFF38BDF8),
              size: 20,
            ),
            label: Text(
              isRfid ? '🔫 TETİKLE RFID OKUT (Ekrana Dokunarak Tara)' : '🔫 TETİKLE BARKOD OKUT (Ekrana Dokunarak Tara)',
              style: TextStyle(
                color: isRfid ? const Color(0xFF10B981) : const Color(0xFF38BDF8),
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: isRfid ? const Color(0xFF10B981) : const Color(0xFF38BDF8)),
              padding: const EdgeInsets.symmetric(vertical: 11),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              backgroundColor: const Color(0xFF111827),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLogoDespatchToggle() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _createLogoDespatch ? const Color(0xFF38BDF8) : const Color(0xFF1F2937),
          width: _createLogoDespatch ? 1.5 : 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: _createLogoDespatch ? const Color(0x2238BDF8) : const Color(0x2264748B),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.receipt_long,
              color: _createLogoDespatch ? const Color(0xFF38BDF8) : const Color(0xFF64748B),
              size: 22,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Text(
                      '📄 LOGO İrsaliyesi Oluştur',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 12.5,
                      ),
                    ),
                    SizedBox(width: 6),
                    Text(
                      'LEM',
                      style: TextStyle(
                        color: Color(0xFFE5A93C),
                        fontWeight: FontWeight.w900,
                        fontSize: 10.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  _createLogoDespatch
                      ? 'LEM ile LOGO Tiger ERP\'ye açık/düzenlenebilir satış irsaliyesi kaydeder'
                      : 'Koli sadece lokal sisteme kaydedilir, Logo irsaliyesi atlanır',
                  style: TextStyle(
                    color: _createLogoDespatch ? const Color(0xFF94A3B8) : Colors.grey.shade600,
                    fontSize: 10.5,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: _createLogoDespatch,
            onChanged: (val) {
              setState(() => _createLogoDespatch = val);
            },
            activeColor: const Color(0xFF38BDF8),
            activeTrackColor: const Color(0x6638BDF8),
            inactiveThumbColor: Colors.grey.shade500,
            inactiveTrackColor: const Color(0xFF1E293B),
          ),
        ],
      ),
    );
  }

  Widget _buildSealBoxButton() {
    final hasItems = _currentBoxItems.isNotEmpty;
    return ElevatedButton.icon(
      onPressed: (_isSaving || !hasItems) ? null : _handleSealAndSaveBox,
      icon: _isSaving
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            )
          : const Icon(Icons.inventory, color: Colors.white, size: 20),
      label: Text(
        _isSaving
            ? 'Mühürleniyor...'
            : '📦 $_activeBoxNo. KOLİYİ KAPAT & MÜHÜRLE (${_currentBoxItems.length} ADET)',
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: hasItems ? const Color(0xFF10B981) : const Color(0xFF334155),
        disabledBackgroundColor: const Color(0xFF1E293B),
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: hasItems ? 6 : 0,
      ),
    );
  }


  Widget _buildScannedItemsList() {
    final totalCount = _currentBoxItems.length;
    final int displayCount = _showAllBoxItems ? totalCount : (totalCount > 25 ? 25 : totalCount);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '📋 Bu Kolideki Ürünler ($totalCount Adet)',
                style: const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold, fontSize: 12),
              ),
              if (_currentBoxItems.isNotEmpty)
                TextButton(
                  onPressed: () => setState(() {
                    _currentBoxItems.clear();
                    _currentBoxEpcs.clear();
                  }),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Temizle', style: TextStyle(color: Color(0xFFEF4444), fontSize: 11)),
                ),
            ],
          ),
          const SizedBox(height: 8),
          if (_currentBoxItems.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text(
                  'Bu koliye henüz ürün okutulmadı.',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
              ),
            )
          else ...[
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: displayCount,
              separatorBuilder: (_, __) => const SizedBox(height: 6),
              itemBuilder: (context, index) {
                final item = _currentBoxItems[index];
                final itemNumber = totalCount - index;
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Text(
                        '#$itemNumber',
                        style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          item.epc,
                          style: const TextStyle(
                            color: Colors.white,
                            fontFamily: 'monospace',
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          setState(() {
                            final removed = _currentBoxItems.removeAt(index);
                            final epcNorm = _normalizeCode(removed.epc);
                            if (epcNorm.isNotEmpty) _currentBoxEpcs.remove(epcNorm);
                            final barNorm = _normalizeCode(removed.barcode);
                            if (barNorm.isNotEmpty) _currentBoxEpcs.remove(barNorm);
                          });
                        },
                        icon: const Icon(Icons.close, color: Color(0xFFEF4444), size: 16),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                );
              },
            ),
            if (totalCount > 25) ...[
              const SizedBox(height: 8),
              Center(
                child: TextButton.icon(
                  onPressed: () => setState(() => _showAllBoxItems = !_showAllBoxItems),
                  icon: Icon(
                    _showAllBoxItems ? Icons.expand_less : Icons.expand_more,
                    size: 16,
                    color: const Color(0xFF38BDF8),
                  ),
                  label: Text(
                    _showAllBoxItems
                        ? '▲ Yalnızca Son 25 Ürünü Göster'
                        : '▼ Tümünü Göster ($totalCount Ürün - Akıcı ekran için son 25 gösteriliyor)',
                    style: const TextStyle(color: Color(0xFF38BDF8), fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Future<void> _reopenBoxForRepacking(OrderBox box) async {
    if (_currentBoxItems.isNotEmpty) {
      final bool? proceed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          title: Text(
            '📦 Koli ${box.boxNo} Yeniden Paketlensin mi?',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
          ),
          content: Text(
            'Ekranda şu anda ${_currentBoxItems.length} adet kaydedilmemiş ürün var.\n\nKoli ${box.boxNo} açıldığında mevcut ekran temizlenip Koli ${box.boxNo} içerisindeki ${box.items.length} adet ürün yüklenecektir.',
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Vazgeç', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE5A93C)),
              child: const Text('Evet, Koliyi Aç', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );

      if (proceed != true) return;
    }

    setState(() {
      _activeBoxNo = box.boxNo;
      _currentBoxItems.clear();
      _currentBoxItems.addAll(box.items);
      _syncFastLookupSets();
    });

    _showToast('🔄 Koli ${box.boxNo} yeniden paketlemek için açıldı (${box.items.length} Adet Ürün Yüklendi)');
  }

  Future<void> _deleteBoxWithConfirm(OrderBox box) async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Text(
          '🗑️ Koli ${box.boxNo} İptal Edilsin mi?',
          style: const TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 16),
        ),
        content: Text(
          'Bu kolideki ${box.packedQuantity} adet ürün silinecektir ve koli iptal edilecektir.\n\nOnaylıyor musunuz?',
          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Vazgeç', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            child: const Text('Evet, Koliyi Sil', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm != true || _selectedOrder == null) return;

    final ok = await ApiService.deleteBox(_selectedOrder!.orderNumber, box.boxNo);
    if (ok) {
      if (_activeBoxNo == box.boxNo) {
        setState(() => _currentBoxItems.clear());
      }
      _showToast('🗑️ Koli ${box.boxNo} başarıyla silindi ve iptal edildi.');
      await _loadOrderBoxes(_selectedOrder!.orderNumber);
    } else {
      _showToast('Koli silinemedi.', isError: true);
    }
  }

  Future<void> _resetAllBoxesWithConfirm() async {
    if (_savedBoxes.isEmpty || _selectedOrder == null) return;

    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: const Text(
          '⚠️ TÜM PAKETLEMEYİ SIFIRLA',
          style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 16),
        ),
        content: Text(
          'Bu siparişe ait (${_savedBoxes.length} koli) tüm paketlenmiş koliler silinecek ve paketleme 1. Koliden baştan başlatılacaktır.\n\nEmin misiniz?',
          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Vazgeç', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            child: const Text('Evet, Tümünü Sıfırla', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    for (final box in _savedBoxes) {
      await ApiService.deleteBox(_selectedOrder!.orderNumber, box.boxNo);
    }

    setState(() {
      _currentBoxItems.clear();
      _activeBoxNo = 1;
    });

    _showToast('🔄 Tüm paketleme sıfırlandı. 1. Koliden baştan başlayabilirsiniz.');
    await _loadOrderBoxes(_selectedOrder!.orderNumber);
  }

  Widget _buildSealedBoxesList() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '📦 PAKETLENEN KOLİLER (${_savedBoxes.length})',
                style: const TextStyle(
                  color: Color(0xFFE5A93C),
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                  letterSpacing: 0.5,
                ),
              ),
              // Reset All Button
              InkWell(
                onTap: _resetAllBoxesWithConfirm,
                borderRadius: BorderRadius.circular(6),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0x22EF4444),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFFEF4444), width: 0.8),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.restart_alt, color: Color(0xFFEF4444), size: 13),
                      SizedBox(width: 4),
                      Text(
                        'Baştan Başlat',
                        style: TextStyle(color: Color(0xFFEF4444), fontSize: 10.5, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'Yeniden paketlemek veya iptal etmek istediğiniz koliyi seçin:',
            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
          ),
          const SizedBox(height: 8),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _savedBoxes.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final box = _savedBoxes[index];
              final isCurrentlyActive = _activeBoxNo == box.boxNo;

              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isCurrentlyActive ? const Color(0xFF1E293B) : const Color(0xFF111827),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isCurrentlyActive ? const Color(0xFFE5A93C) : const Color(0xFF1F2937),
                    width: isCurrentlyActive ? 1.5 : 1,
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF334155),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '📦 Koli ${box.boxNo}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (isCurrentlyActive)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0x33E5A93C),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: const Color(0xFFE5A93C), width: 0.8),
                                ),
                                child: const Text(
                                  'AÇIK / DÜZENLENİYOR',
                                  style: TextStyle(
                                    color: Color(0xFFE5A93C),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 9.5,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        Text(
                          '${box.packedQuantity} Adet Ürün',
                          style: const TextStyle(
                            color: Color(0xFF34D399),
                            fontWeight: FontWeight.w900,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    // Action Buttons Row
                    Row(
                      children: [
                        // Repack / Edit Button
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _reopenBoxForRepacking(box),
                            icon: const Icon(Icons.edit_note, size: 16, color: Colors.black),
                            label: const Text(
                              'Yeniden Paketle',
                              style: TextStyle(
                                color: Colors.black,
                                fontWeight: FontWeight.w900,
                                fontSize: 11.5,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFE5A93C),
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Cancel / Delete Box Button
                        OutlinedButton.icon(
                          onPressed: () => _deleteBoxWithConfirm(box),
                          icon: const Icon(Icons.delete_outline, size: 16, color: Color(0xFFEF4444)),
                          label: const Text(
                            'İptal Et / Sil',
                            style: TextStyle(
                              color: Color(0xFFEF4444),
                              fontWeight: FontWeight.bold,
                              fontSize: 11.5,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFEF4444)),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
