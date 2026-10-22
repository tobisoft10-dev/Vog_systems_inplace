import 'dart:async';
import 'package:flutter/material.dart';
import '../config/api_config.dart';
import '../models/order_model.dart';
import '../models/receiving_model.dart';
import '../services/api_service.dart';
import '../services/hardware_scanner.dart';
import 'order_selection_dialog.dart';
import 'settings_screen.dart';

class ReceivingScreen extends StatefulWidget {
  const ReceivingScreen({super.key});

  @override
  State<ReceivingScreen> createState() => _ReceivingScreenState();
}

class _ReceivingScreenState extends State<ReceivingScreen> {
  OrderModel? _selectedOrder;
  ReceivingContext? _receivingContext;
  final List<ReceivingItem> _currentBatchItems = [];
  Set<String> _allowedEpcs = {};
  Set<String> _allowedBarcodes = {};
  Set<String> _allowedSkus = {};
  Set<String> _receivedEpcs = {};

  // High-Performance O(1) Pre-normalized Lookup Sets (Zero Screen Freeze)
  Set<String> _normAllowedEpcs = {};
  Set<String> _normAllowedBarcodes = {};
  Set<String> _normAllowedSkus = {};
  Set<String> _normReceivedEpcs = {};
  final Set<String> _currentBatchEpcs = {};
  bool _showAllBatchItems = false;

  final TextEditingController _manualScanController = TextEditingController();
  final FocusNode _scanFocusNode = FocusNode();
  StreamSubscription<String>? _scanSubscription;

  bool _isLoading = false;
  bool _isSaving = false;
  final Map<String, int> _recentDuplicateTimestamps = {};

  String _lastScannedCode = '';
  String _lastScanStatus = 'Tetiğe basarak mal kabul etiketlerini okutun.';
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
    s = s.replaceAll(RegExp(r'^(EPC|DATA|TAG|BARCODE|ID)\s*:\s*', caseSensitive: false), '');
    if (s.contains('303B50CC')) {
      final idx = s.indexOf('303B50CC');
      var candidate = s.substring(idx);
      if (candidate.length >= 22) {
        return candidate.substring(0, 22);
      }
      return candidate;
    }
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
    _normReceivedEpcs = _receivedEpcs.map(_normalizeCode).where((s) => s.isNotEmpty).toSet();

    _currentBatchEpcs.clear();
    for (final it in _currentBatchItems) {
      final epcNorm = _normalizeCode(it.epc);
      if (epcNorm.isNotEmpty) _currentBatchEpcs.add(epcNorm);
      final barNorm = _normalizeCode(it.barcode);
      if (barNorm.isNotEmpty) _currentBatchEpcs.add(barNorm);
    }
  }

  void _handleHardwareScan(String rawCode) {
    if (rawCode.trim().isEmpty) return;

    FocusManager.instance.primaryFocus?.unfocus();

    if (_selectedOrder == null) {
      setState(() {
        _lastScannedCode = rawCode.trim().toUpperCase();
        _lastScanStatus = '⚠️ Lütfen önce mal kabul yapılacak siparişi seçin!';
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

    final List<ReceivingItem> itemsToAdd = [];
    String newLastScannedCode = _lastScannedCode;
    String newLastScanStatus = _lastScanStatus;
    String newLastScanStatusType = _lastScanStatusType;
    bool hasNewItem = false;
    bool hasError = false;

    for (final raw in parsedTags) {
      final normCode = _normalizeCode(raw);
      if (normCode.isEmpty) continue;

      // 1. SGTIN-96 VOG EPC Format Kontrolü (303B50CC...)
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

      // 3. MÜKERRER KONTROLÜ (Tesellüm - O(1) Hash Kontrolü):
      // A) Bu açık parti içinde var mı?
      if (_currentBatchEpcs.contains(normCode)) {
        final lastWarn = _recentDuplicateTimestamps[normCode] ?? 0;
        if (now - lastWarn > 1500) {
          _recentDuplicateTimestamps[normCode] = now;
          newLastScannedCode = normCode;
          newLastScanStatus = '⚠️ MÜKERRER! Bu etiket bu parti listesinde zaten var.';
          newLastScanStatusType = 'duplicate';
          hasError = true;
        }
        continue;
      }

      // B) Daha önce depoya tesellüm edilmiş mi?
      if (_normReceivedEpcs.contains(normCode)) {
        final lastWarn = _recentDuplicateTimestamps[normCode] ?? 0;
        if (now - lastWarn > 1500) {
          _recentDuplicateTimestamps[normCode] = now;
          newLastScannedCode = normCode;
          newLastScanStatus = '⚠️ MÜKERRER! Bu ürün daha önce depoya kabul edilmiş!';
          newLastScanStatusType = 'duplicate';
          hasError = true;
        }
        continue;
      }

      // 4. Benzersiz ve Siparişe Ait Ürün: Partiye Ekle & Sayacı Arttır
      _recentDuplicateTimestamps.remove(normCode);
      _currentBatchEpcs.add(normCode);
      if (orderBarcode.isNotEmpty) {
        _currentBatchEpcs.add(_normalizeCode(orderBarcode));
      }

      itemsToAdd.add(
        ReceivingItem(
          epc: normCode,
          barcode: _selectedOrder?.barcode.isNotEmpty == true ? _selectedOrder!.barcode : normCode,
          sku: _selectedOrder?.sku.isNotEmpty == true ? _selectedOrder!.sku : (_selectedOrder?.brand ?? ''),
          productName: _selectedOrder?.productName ?? 'Tesellüm Edilen Ürün',
        ),
      );
      hasNewItem = true;
      newLastScannedCode = normCode;
      final totalSoFar = (_receivingContext?.receivedQty ?? 0) + _currentBatchItems.length + itemsToAdd.length;
      final target = _selectedOrder?.totalQty ?? 1;
      newLastScanStatus = '✅ KABUL EDİLDİ (+1 Adet) - Toplam: $totalSoFar / $target Adet';
      newLastScanStatusType = 'success';
    }

    // Toplu batch işlemi bittikten sonra TEK bir setState çağrısı yapılır:
    setState(() {
      if (itemsToAdd.isNotEmpty) {
        _currentBatchItems.insertAll(0, itemsToAdd);
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
        _currentBatchItems.clear();
        _currentBatchEpcs.clear();
        _lastScannedCode = '';
        _lastScanStatus = 'Tetiğe basarak etiket okutun.';
        _lastScanStatusType = 'idle';
      });
      await _loadReceivingContext(order.orderNumber);
    }
  }

  Future<void> _loadReceivingContext(String orderNumber) async {
    setState(() => _isLoading = true);
    final ctx = await ApiService.getReceivingContext(orderNumber);
    if (mounted) {
      setState(() {
        _isLoading = false;
        _receivingContext = ctx;
        if (ctx != null) {
          _allowedEpcs = ctx.allowedEpcs;
          _allowedBarcodes = ctx.allowedBarcodes;
          _allowedSkus = ctx.allowedSkus;
          _receivedEpcs = ctx.receivedEpcs;
        } else {
          _allowedEpcs = {};
          _allowedBarcodes = {};
          _allowedSkus = {};
          _receivedEpcs = {};
        }
        _syncFastLookupSets();
      });
    }
  }

  Future<void> _handleSaveReceiving() async {
    if (_selectedOrder == null) {
      _showToast('Lütfen önce bir sipariş seçin.', isError: true);
      return;
    }
    if (_currentBatchItems.isEmpty) {
      _showToast('Depoya almak için en az 1 adet ürün okutun.', isError: true);
      return;
    }

    setState(() => _isSaving = true);

    final res = await ApiService.saveReceivingItems(
      orderNumber: _selectedOrder!.orderNumber,
      items: _currentBatchItems,
      staffName: ApiConfig.operatorName,
      location: 'Ana Depo Tesellüm',
    );

    if (mounted) {
      setState(() => _isSaving = false);

      if (res['success'] == true) {
        HardwareScanner.triggerSuccessFeedback();
        final count = _currentBatchItems.length;
        _showToast('🎉 $count Adet Ürün Başarıyla Depoya Tesellüm Edildi!');
        setState(() {
          _receivedEpcs.addAll(_currentBatchItems.map((i) => _normalizeCode(i.epc)));
          _currentBatchItems.clear();
        });
        await _loadReceivingContext(_selectedOrder!.orderNumber);
      } else {
        HardwareScanner.triggerErrorFeedback();
        _showToast(res['error'] ?? 'Tesellüm kaydedilemedi.', isError: true);
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
                color: Color(0xFF38BDF8),
                borderRadius: BorderRadius.all(Radius.circular(6)),
              ),
              child: const Text(
                'VOG PDA ${ApiConfig.appVersion}',
                style: TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 11),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Mal Kabul (Tesellüm)',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
            ),
          ],
        ),
        actions: [
          if (_selectedOrder != null)
            IconButton(
              icon: const Icon(Icons.refresh, color: Color(0xFF94A3B8)),
              onPressed: () => _loadReceivingContext(_selectedOrder!.orderNumber),
              tooltip: 'Yenile',
            ),
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Color(0xFF94A3B8)),
            onPressed: () async {
              await Navigator.of(context).push<bool>(
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
              if (mounted) setState(() {});
            },
            tooltip: 'Ayarlar',
          ),
        ],
      ),
      body: Column(
        children: [
          if (_isLoading)
            const LinearProgressIndicator(
              minHeight: 3,
              backgroundColor: Color(0xFF1E293B),
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF38BDF8)),
            ),
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
                    // 2. Live Receiving Dashboard Card (Target, Received, Current, Remaining, Progress)
                    _buildReceivingDashboardCard(),

                    const SizedBox(height: 12),

                    // 3. Scanner Mode Header
                    _buildScannerModeHeader(),

                    const SizedBox(height: 12),

                    // 4. Barcode / RFID Input Form & Trigger Button
                    _buildScanInputForm(),

                    const SizedBox(height: 12),

                    // 5. Save & Inward Button
                    _buildSaveReceivingButton(),

                    const SizedBox(height: 14),

                    // 6. Scanned Items in This Session
                    _buildCurrentBatchList(),

                    const SizedBox(height: 14),

                    // 7. Previously Received Items Summary
                    if (_receivingContext != null && _receivingContext!.recentVouchers.isNotEmpty)
                      _buildPreviousVouchersList(),
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
            border: Border.all(color: const Color(0xFF38BDF8), width: 2),
            boxShadow: const [
              BoxShadow(
                color: Color(0x3338BDF8),
                blurRadius: 16,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: const Column(
            children: [
              Icon(Icons.input, size: 36, color: Color(0xFF38BDF8)),
              SizedBox(height: 8),
              Text(
                '📥 TESELLÜM EDİLECEK SİPARİŞİ SEÇİN',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14),
              ),
              SizedBox(height: 4),
              Text(
                'Mal kabulü yapılacak siparişi seçmek için dokunun',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
              ),
            ],
          ),
        ),
      );
    }

    final o = _selectedOrder!;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF38BDF8), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF38BDF8),
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
                  'Hedef: ${o.totalQty} Adet',
                  style: const TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReceivingDashboardCard() {
    final totalTarget = _selectedOrder?.totalQty ?? 1;
    final previouslyReceived = _receivingContext?.receivedQty ?? 0;
    final currentBatchCount = _currentBatchItems.length;
    final totalSoFar = previouslyReceived + currentBatchCount;
    final remaining = (totalTarget - totalSoFar) > 0 ? (totalTarget - totalSoFar) : 0;
    final progress = totalTarget > 0 ? ((totalSoFar / totalTarget) * 100).clamp(0, 100).round() : 100;
    final isDone = totalSoFar >= totalTarget;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDone ? const Color(0xFF10B981) : const Color(0xFF38BDF8),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: isDone ? const Color(0x3310B981) : const Color(0x2238BDF8),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '📊 SİPARİŞ TESELLÜM DURUMU',
                style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.5),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isDone ? const Color(0xFF064E3B) : const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: isDone ? const Color(0xFF10B981) : const Color(0xFF38BDF8)),
                ),
                child: Text(
                  isDone ? '🎉 %100 TAMAMLANDI' : '%$progress Tamamlandı',
                  style: TextStyle(
                    color: isDone ? const Color(0xFF34D399) : const Color(0xFF38BDF8),
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Big Metric Grid
          Row(
            children: [
              _buildMetricBox('HEDEF', '$totalTarget', const Color(0xFF94A3B8)),
              const SizedBox(width: 8),
              _buildMetricBox('ÖNCEKİ', '$previouslyReceived', const Color(0xFF38BDF8)),
              const SizedBox(width: 8),
              _buildMetricBox('BU PARTİ', '+$currentBatchCount', const Color(0xFFFBBF24)),
              const SizedBox(width: 8),
              _buildMetricBox('KALAN', '$remaining', remaining == 0 ? const Color(0xFF10B981) : const Color(0xFFEF4444)),
            ],
          ),

          const SizedBox(height: 14),

          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: totalTarget > 0 ? (totalSoFar / totalTarget).clamp(0.0, 1.0) : 1.0,
              minHeight: 12,
              backgroundColor: const Color(0xFF1E293B),
              valueColor: AlwaysStoppedAnimation<Color>(
                isDone ? const Color(0xFF10B981) : const Color(0xFF38BDF8),
              ),
            ),
          ),

          _buildLiveScanFeedbackCard(),
        ],
      ),
    );
  }

  Widget _buildMetricBox(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFF1E2937)),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: const TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold, fontSize: 10),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 18, fontFamily: 'monospace'),
            ),
          ],
        ),
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
      margin: const EdgeInsets.only(top: 12),
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
                  isRfid ? '📡 TETİK: RFID TESELLÜM MODU' : '🏷️ TETİK: NORMAL BARKOD MODU',
                  style: TextStyle(
                    color: isRfid ? const Color(0xFF10B981) : const Color(0xFF38BDF8),
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isRfid ? 'Tetiğe basıldığında gelen ürünün RFID çipi taranır' : 'Tetiğe basıldığında ürün barkodu taranır',
                  style: TextStyle(color: Colors.grey.shade400, fontSize: 10.5),
                ),
              ],
            ),
          ),
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
                  hintText: isRfid ? 'Manuel RFID Kodu...' : 'Manuel Barkod No...',
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

  Widget _buildSaveReceivingButton() {
    final count = _currentBatchItems.length;
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton.icon(
        onPressed: (_isSaving || count == 0) ? null : _handleSaveReceiving,
        style: ElevatedButton.styleFrom(
          backgroundColor: count > 0 ? const Color(0xFF10B981) : const Color(0xFF1E293B),
          disabledBackgroundColor: const Color(0xFF1E293B),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: count > 0 ? 6 : 0,
        ),
        icon: _isSaving
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Icon(Icons.archive, color: Colors.white, size: 24),
        label: Text(
          _isSaving
              ? 'DEPOYA KAYDEDİLİYOR...'
              : (count > 0 ? '📥 $count ADET ÜRÜNÜ DEPOYA AL' : '📥 TESELLÜMÜ TAMAMLA (Önce Ürün Okutun)'),
          style: TextStyle(
            color: count > 0 ? Colors.white : const Color(0xFF64748B),
            fontWeight: FontWeight.w900,
            fontSize: 14,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentBatchList() {
    final totalCount = _currentBatchItems.length;
    final int displayCount = _showAllBatchItems ? totalCount : (totalCount > 25 ? 25 : totalCount);

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.playlist_add_check, color: Color(0xFFFBBF24), size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'Bu Partide Okutulanlar ($totalCount Adet)',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ],
                ),
                if (_currentBatchItems.isNotEmpty)
                  TextButton(
                    onPressed: () => setState(() {
                      _currentBatchItems.clear();
                      _currentBatchEpcs.clear();
                    }),
                    child: const Text('Temizle', style: TextStyle(color: Color(0xFFEF4444), fontSize: 11)),
                  ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFF1F2937)),
          if (_currentBatchItems.isEmpty)
            const Padding(
              padding: EdgeInsets.all(20),
              child: Center(
                child: Text(
                  'Bu partide henüz ürün okutulmadı.\nTetiğe basarak mal kabul ürünlerini okutun.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                ),
              ),
            )
          else ...[
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: displayCount,
              separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFF1E293B)),
              itemBuilder: (context, index) {
                final item = _currentBatchItems[index];
                return ListTile(
                  dense: true,
                  leading: CircleAvatar(
                    radius: 13,
                    backgroundColor: const Color(0xFF1E293B),
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(color: Color(0xFFFBBF24), fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                  title: Text(
                    item.epc,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12, fontFamily: 'monospace'),
                  ),
                  subtitle: Text(
                    '${item.productName} • ${item.sku}',
                    style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.close, size: 16, color: Color(0xFFEF4444)),
                    onPressed: () => setState(() {
                      final removed = _currentBatchItems.removeAt(index);
                      final epcNorm = _normalizeCode(removed.epc);
                      if (epcNorm.isNotEmpty) _currentBatchEpcs.remove(epcNorm);
                      final barNorm = _normalizeCode(removed.barcode);
                      if (barNorm.isNotEmpty) _currentBatchEpcs.remove(barNorm);
                    }),
                  ),
                );
              },
            ),
            if (totalCount > 25) ...[
              const Divider(height: 1, color: Color(0xFF1F2937)),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Center(
                  child: TextButton.icon(
                    onPressed: () => setState(() => _showAllBatchItems = !_showAllBatchItems),
                    icon: Icon(
                      _showAllBatchItems ? Icons.expand_less : Icons.expand_more,
                      size: 16,
                      color: const Color(0xFFFBBF24),
                    ),
                    label: Text(
                      _showAllBatchItems
                          ? '▲ Yalnızca Son 25 Ürünü Göster'
                          : '▼ Tümünü Göster ($totalCount Ürün - Akıcı ekran için son 25 gösteriliyor)',
                      style: const TextStyle(color: Color(0xFFFBBF24), fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildPreviousVouchersList() {
    final vouchers = _receivingContext?.recentVouchers ?? [];
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      child: ExpansionTile(
        initiallyExpanded: false,
        title: Text(
          'Daha Önce Depoya Alınanlar (${vouchers.length} Kayıt)',
          style: const TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold, fontSize: 12),
        ),
        leading: const Icon(Icons.warehouse, color: Color(0xFF38BDF8), size: 18),
        children: [
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: vouchers.length,
            separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFF1E293B)),
            itemBuilder: (context, index) {
              final v = vouchers[index];
              final tracking = v['tracking_number'] ?? v['barcode'] ?? '-';
              final qty = v['quantity'] ?? 1;
              final dateStr = v['created_at'] != null ? v['created_at'].toString().split('T')[0] : '';
              return ListTile(
                dense: true,
                title: Text(
                  '$tracking ($qty Adet)',
                  style: const TextStyle(color: Color(0xFF34D399), fontWeight: FontWeight.bold, fontSize: 12),
                ),
                subtitle: Text(
                  'Konum: ${v['location'] ?? 'Ana Depo'} • $dateStr',
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
