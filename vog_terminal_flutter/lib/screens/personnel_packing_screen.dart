import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../config/api_config.dart';
import '../models/personnel_model.dart';
import '../services/api_service.dart';
import '../services/hardware_scanner.dart';
import 'settings_screen.dart';

class PersonnelPackingScreen extends StatefulWidget {
  const PersonnelPackingScreen({super.key});

  @override
  State<PersonnelPackingScreen> createState() => _PersonnelPackingScreenState();
}

class _PersonnelPackingScreenState extends State<PersonnelPackingScreen> {
  // Brand & Department State
  List<PersonnelBrand> _brands = [];
  PersonnelBrand? _selectedBrand;
  PersonnelDepartment? _selectedDept;
  bool _isLoadingBrands = true;

  // Active Box State
  int _currentBoxNo = 1;
  int _totalBoxes = 1;
  PersonnelBoxDetail? _boxDetail;
  bool _isLoadingBox = false;
  bool _isSavingBox = false;

  // Scanned item tracking in current session
  final Set<String> _scannedCodes = {};
  String _lastScanStatus = 'Koliye ürün eklemek için tetiğe basarak okutun.';
  String _lastScanStatusType = 'idle'; // 'idle', 'success', 'duplicate', 'error'
  String _lastScannedCode = '';

  final TextEditingController _manualScanController = TextEditingController();
  final FocusNode _scanFocusNode = FocusNode();
  StreamSubscription<String>? _scanSubscription;

  @override
  void initState() {
    super.initState();
    _loadBrands();
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

  Future<void> _loadBrands() async {
    setState(() => _isLoadingBrands = true);
    try {
      final brands = await ApiService.getPersonnelBrands();
      if (!mounted) return;

      setState(() {
        _brands = brands;
        _isLoadingBrands = false;
        if (brands.isNotEmpty) {
          // Default to SKODA if available, else first brand
          _selectedBrand = brands.firstWhere(
            (b) => b.brand.toUpperCase() == 'SKODA',
            orElse: () => brands.first,
          );
          if (_selectedBrand!.departments.isNotEmpty) {
            _selectedDept = _selectedBrand!.departments.first;
          }
        }
      });

      if (_selectedBrand != null) {
        _loadBoxDetails(1);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingBrands = false);
        _showErrorSnackBar('Marka ve departmanlar yüklenemedi: $e');
      }
    }
  }

  Future<void> _loadBoxDetails(int boxNo) async {
    if (_selectedBrand == null) return;

    setState(() {
      _isLoadingBox = true;
      _currentBoxNo = boxNo;
      _scannedCodes.clear();
      _lastScanStatus = 'Koliye ürün eklemek için tetiğe basarak okutun.';
      _lastScanStatusType = 'idle';
      _lastScannedCode = '';
    });

    try {
      final detail = await ApiService.getPersonnelBoxDetails(
        brand: _selectedBrand!.brand,
        department: _selectedDept?.department,
        boxNo: boxNo,
      );

      if (!mounted) return;

      setState(() {
        _boxDetail = detail;
        _isLoadingBox = false;
        if (detail != null) {
          _totalBoxes = detail.totalBoxes;
        }
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingBox = false);
        _showErrorSnackBar('Koli detayları yüklenemedi: $e');
      }
    }
  }

  // Chainway Hardware Trigger Scan Handler
  void _handleHardwareScan(String rawData) {
    if (!mounted) return;
    _processScannedCode(rawData);
  }

  void _processScannedCode(String rawInput) {
    var code = rawInput.trim().toUpperCase();
    // Strip prefixes like EPC:, DATA:, BARCODE:
    code = code.replaceAll(RegExp(r'^(EPC|DATA|TAG|BARCODE|ID)\s*:\s*', caseSensitive: false), '');

    if (code.isEmpty || _boxDetail == null) return;

    // Duplicate check in current session
    if (_scannedCodes.contains(code)) {
      _triggerHaptic(HapticFeedback.lightImpact);
      setState(() {
        _lastScanStatus = '⚠️ MÜKERRER OKUMA: Bu etiket bu koliye zaten okutuldu.';
        _lastScanStatusType = 'duplicate';
        _lastScannedCode = code;
      });
      return;
    }

    // Match code against bundle items
    PersonnelBundleItem? matchedItem;

    // 1. Direct Part No Match (e.g. PSKD100054M)
    for (final it in _boxDetail!.bundleItems) {
      if (it.partNo.isNotEmpty && code == it.partNo.toUpperCase()) {
        if (!it.isComplete) {
          matchedItem = it;
          break;
        }
      }
    }

    // 2. Direct Barcode Match (e.g. 8692456899721)
    if (matchedItem == null) {
      for (final it in _boxDetail!.bundleItems) {
        if (it.barcode.isNotEmpty && (code == it.barcode || code.endsWith(it.barcode))) {
          if (!it.isComplete) {
            matchedItem = it;
            break;
          }
        }
      }
    }

    // 3. SGTIN-96 EPC Matching (303B50CC...)
    if (matchedItem == null && code.startsWith('303B50CC')) {
      // Check Polar / SKU prefixes embedded in code
      for (final it in _boxDetail!.bundleItems) {
        final cleanSku = it.partNo.replaceAll(RegExp(r'[^A-Z0-9]'), '');
        final basePrefix = cleanSku.length >= 10 ? cleanSku.substring(0, 10) : cleanSku;
        if (basePrefix.isNotEmpty && code.contains(basePrefix)) {
          if (!it.isComplete) {
            matchedItem = it;
            break;
          }
        }
      }

      // If it's a polar tag (contains POLAR or order 16690 / PSKD100041)
      if (matchedItem == null) {
        for (final it in _boxDetail!.bundleItems) {
          final isPolar = it.name.toUpperCase().contains('POLAR') || it.partNo.contains('PSKD100041');
          if (isPolar && (code.contains('0041') || code.contains('4132') || code.contains('4134'))) {
            if (!it.isComplete) {
              matchedItem = it;
              break;
            }
          }
        }
      }
    }

    // 4. Fallback loose match (contains part number)
    if (matchedItem == null) {
      for (final it in _boxDetail!.bundleItems) {
        if (it.partNo.isNotEmpty && code.contains(it.partNo)) {
          if (!it.isComplete) {
            matchedItem = it;
            break;
          }
        }
      }
    }

    if (matchedItem != null) {
      // SUCCESSFUL MATCH
      _scannedCodes.add(code);
      matchedItem.scannedCount++;
      matchedItem.scannedEpcs.add(code);
      _triggerHaptic(HapticFeedback.mediumImpact);

      setState(() {
        _lastScanStatus = '✅ ${matchedItem!.shortName} (${matchedItem.size}) eklendi!';
        _lastScanStatusType = 'success';
        _lastScannedCode = code;
      });
    } else {
      // FOREIGN / UNMATCHED TAG
      _triggerHaptic(HapticFeedback.heavyImpact);
      setState(() {
        _lastScanStatus = '🚫 EŞLEŞMEYEN / YABANCI ÜRÜN: Bu personelin kolisinde yer almıyor!';
        _lastScanStatusType = 'error';
        _lastScannedCode = code;
      });
    }
  }

  void _triggerHaptic(Future<void> Function() feedbackFn) {
    try {
      feedbackFn();
    } catch (_) {}
  }

  Future<void> _handleSaveAndPrint() async {
    if (_boxDetail == null || _selectedBrand == null) return;

    final totalScanned = _boxDetail!.totalScanned;
    final targetQty = _boxDetail!.targetQuantity;

    if (totalScanned < targetQty) {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Color(0xFFF59E0B)),
              SizedBox(width: 8),
              Text('Koli Eksik!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Text(
            'Bu kolide $targetQty parça olması gerekirken şu an $totalScanned parça okutuldu.\n\nYine de mühürleyip koli etiketi basmak istiyor musunuz?',
            style: const TextStyle(color: Color(0xFFCBD5E1)),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Vazgeç', style: TextStyle(color: Color(0xFF94A3B8))),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B)),
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Eksik Bas & Mühürle', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );

      if (confirmed != true) return;
    }

    setState(() => _isSavingBox = true);

    try {
      final res = await ApiService.savePersonnelBox(
        brand: _selectedBrand!.brand,
        department: _selectedDept?.department,
        boxNo: _currentBoxNo,
        boxBarcode: _boxDetail!.boxBarcode,
        items: _boxDetail!.bundleItems,
        printLabel: true,
      );

      if (!mounted) return;

      if (res['success'] == true) {
        _triggerHaptic(HapticFeedback.heavyImpact);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Koli #$_currentBoxNo Mühürlendi! Koli Etiketi Yazdırıldı.'),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 3),
          ),
        );

        // Advance to next box
        final nextBoxNo = res['next_box_no'] ?? (_currentBoxNo + 1);
        if (nextBoxNo <= _totalBoxes) {
          _loadBoxDetails(nextBoxNo);
        } else {
          // Department complete!
          _showDepartmentCompleteDialog();
        }
      } else {
        _showErrorSnackBar(res['error'] ?? 'Koli kaydedilemedi.');
      }
    } catch (e) {
      if (mounted) {
        _showErrorSnackBar('Bağlantı hatası: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isSavingBox = false);
      }
    }
  }

  void _showDepartmentCompleteDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Color(0xFF10B981)),
            SizedBox(width: 8),
            Text('Tebrikler!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Text(
          '${_selectedDept?.department ?? "Bölüm"} için tanımlı tüm koliler ($_totalBoxes Koli) başarıyla paketlendi!',
          style: const TextStyle(color: Color(0xFFCBD5E1)),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Tamam', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFFEF4444),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  // Quick Personnel Box Selection Modal
  Future<void> _openBoxSelectionModal() async {
    if (_selectedBrand == null) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return _PersonnelBoxListModal(
          brand: _selectedBrand!.brand,
          department: _selectedDept?.department,
          currentBoxNo: _currentBoxNo,
          onBoxSelected: (boxNo) {
            Navigator.of(ctx).pop();
            _loadBoxDetails(boxNo);
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final detail = _boxDetail;
    final totalScanned = detail?.totalScanned ?? 0;
    final targetQty = detail?.targetQuantity ?? 0;
    final isComplete = detail?.isBoxComplete ?? false;

    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 2,
        title: Row(
          children: [
            const Icon(Icons.people_alt, color: Color(0xFFE5A93C), size: 22),
            const SizedBox(width: 8),
            const Text(
              'Personel Kolileme',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 17),
            ),
            const Spacer(),
            if (_selectedDept != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Text(
                  '${_selectedDept!.department} (${_selectedDept!.totalCount})',
                  style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 11),
                ),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Color(0xFF94A3B8)),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
            },
          ),
        ],
      ),
      body: _isLoadingBrands
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFE5A93C)))
          : Column(
              children: [
                // 1. Brand & Department Dropdown Filter Row
                _buildTopFilterHeader(),

                // 2. Koli Navigation Bar (Prev, Box Jump, Next)
                _buildBoxNavigationBar(),

                // 3. Main Content: Personnel Details & Garment Checklist
                Expanded(
                  child: _isLoadingBox
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFFE5A93C)))
                      : detail == null
                          ? const Center(
                              child: Text('Koli bulunamadı', style: TextStyle(color: Color(0xFF64748B))),
                            )
                          : SingleChildScrollView(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // Personnel Card
                                  _buildPersonnelInfoCard(detail),

                                  const SizedBox(height: 10),

                                  // Live Progress Bar Card
                                  _buildProgressCard(totalScanned, targetQty, isComplete),

                                  const SizedBox(height: 10),

                                  // Scan Status Feedback Bar
                                  _buildScanStatusBar(),

                                  const SizedBox(height: 10),

                                  // Garment List Header
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'KOLİ İÇERİĞİ (${detail.bundleItems.length} PARÇA)',
                                        style: const TextStyle(
                                          color: Color(0xFF94A3B8),
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                      Text(
                                        'Okunan: $totalScanned / $targetQty',
                                        style: TextStyle(
                                          color: isComplete ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ],
                                  ),

                                  const SizedBox(height: 6),

                                  // Garment Items Checklist
                                  ...detail.bundleItems.map((it) => _buildGarmentItemTile(it)),

                                  const SizedBox(height: 12),

                                  // Manual Input Box (if operator wants to type)
                                  _buildManualInputRow(),

                                  const SizedBox(height: 16),
                                ],
                              ),
                            ),
                ),

                // 4. Bottom Sticky Action Bar: Save & Print Button
                _buildBottomActionBar(detail, totalScanned, targetQty, isComplete),
              ],
            ),
    );
  }

  Widget _buildTopFilterHeader() {
    return Container(
      color: const Color(0xFF111827),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      child: Row(
        children: [
          // Brand Dropdown
          Expanded(
            flex: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<PersonnelBrand>(
                  value: _selectedBrand,
                  isExpanded: true,
                  dropdownColor: const Color(0xFF1E293B),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                  items: _brands.map((b) {
                    return DropdownMenuItem(
                      value: b,
                      child: Text('${b.brand} (${b.totalPersonnel})'),
                    );
                  }).toList(),
                  onChanged: (newBrand) {
                    if (newBrand != null && newBrand != _selectedBrand) {
                      setState(() {
                        _selectedBrand = newBrand;
                        _selectedDept = newBrand.departments.isNotEmpty ? newBrand.departments.first : null;
                      });
                      _loadBoxDetails(1);
                    }
                  },
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Department Dropdown
          Expanded(
            flex: 5,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<PersonnelDepartment>(
                  value: _selectedDept,
                  isExpanded: true,
                  dropdownColor: const Color(0xFF1E293B),
                  style: const TextStyle(color: Color(0xFF38BDF8), fontWeight: FontWeight.bold, fontSize: 13),
                  items: (_selectedBrand?.departments ?? []).map((d) {
                    return DropdownMenuItem(
                      value: d,
                      child: Text('${d.department} (${d.totalCount})'),
                    );
                  }).toList(),
                  onChanged: (newDept) {
                    if (newDept != null && newDept != _selectedDept) {
                      setState(() {
                        _selectedDept = newDept;
                      });
                      _loadBoxDetails(1);
                    }
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBoxNavigationBar() {
    return Container(
      color: const Color(0xFF0B132B),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Previous Box Button
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1E293B),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: _currentBoxNo > 1 ? () => _loadBoxDetails(_currentBoxNo - 1) : null,
            icon: const Icon(Icons.arrow_back_ios, size: 12),
            label: const Text('Önceki', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),

          // Box Number & Jump Modal Button
          InkWell(
            onTap: _openBoxSelectionModal,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFE5A93C).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE5A93C), width: 1.2),
              ),
              child: Row(
                children: [
                  const Icon(Icons.inventory_2, color: Color(0xFFE5A93C), size: 16),
                  const SizedBox(width: 6),
                  Text(
                    'KOLİ $_currentBoxNo / $_totalBoxes',
                    style: const TextStyle(
                      color: Color(0xFFE5A93C),
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_drop_down, color: Color(0xFFE5A93C), size: 18),
                ],
              ),
            ),
          ),

          // Next Box Button
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1E293B),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: _currentBoxNo < _totalBoxes ? () => _loadBoxDetails(_currentBoxNo + 1) : null,
            label: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Sonraki', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                SizedBox(width: 4),
                Icon(Icons.arrow_forward_ios, size: 12),
              ],
            ),
            icon: const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _buildPersonnelInfoCard(PersonnelBoxDetail detail) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF1E3A8A), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Department & Gender Tag
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF38BDF8).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFF38BDF8), width: 1),
                ),
                child: Text(
                  '${detail.department} (${detail.gender})',
                  style: const TextStyle(
                    color: Color(0xFF38BDF8),
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                  ),
                ),
              ),

              // Packing Status Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: detail.isPacked
                      ? const Color(0xFF10B981).withValues(alpha: 0.2)
                      : const Color(0xFFF59E0B).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: detail.isPacked ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      detail.isPacked ? Icons.check_circle : Icons.hourglass_top,
                      size: 11,
                      color: detail.isPacked ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      detail.isPacked ? 'PAKETLENDİ' : 'BEKLİYOR',
                      style: TextStyle(
                        color: detail.isPacked ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                        fontWeight: FontWeight.w900,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Personnel Name (Big & Bold)
          Text(
            detail.name,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 18,
              letterSpacing: 0.3,
            ),
          ),

          const SizedBox(height: 4),

          // Service Center / Bayi
          Row(
            children: [
              const Icon(Icons.business, color: Color(0xFF94A3B8), size: 14),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  detail.serviceCenter,
                  style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13, fontWeight: FontWeight.w600),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),

          const SizedBox(height: 6),

          // Barcode String
          Row(
            children: [
              const Icon(Icons.qr_code, color: Color(0xFFE5A93C), size: 14),
              const SizedBox(width: 5),
              Text(
                detail.boxBarcode,
                style: const TextStyle(
                  color: Color(0xFFE5A93C),
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProgressCard(int scanned, int target, bool isComplete) {
    final progress = target > 0 ? (scanned / target).clamp(0.0, 1.0) : 0.0;
    final percent = (progress * 100).toInt();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isComplete
            ? const Color(0xFF064E3B).withValues(alpha: 0.35)
            : const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isComplete ? const Color(0xFF10B981) : const Color(0xFF334155),
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    isComplete ? Icons.verified : Icons.inventory,
                    color: isComplete ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    isComplete ? 'KOLİ HAZIR!' : 'KOLİ SAYAÇ',
                    style: TextStyle(
                      color: isComplete ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: '$scanned ',
                      style: TextStyle(
                        color: isComplete ? const Color(0xFF10B981) : Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    TextSpan(
                      text: '/ $target ADET (%$percent)',
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: const Color(0xFF0F172A),
              valueColor: AlwaysStoppedAnimation<Color>(
                isComplete ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanStatusBar() {
    Color bg;
    Color border;
    Color textCol;
    IconData icon;

    switch (_lastScanStatusType) {
      case 'success':
        bg = const Color(0xFF064E3B).withValues(alpha: 0.4);
        border = const Color(0xFF10B981);
        textCol = const Color(0xFF34D399);
        icon = Icons.check_circle;
        break;
      case 'duplicate':
        bg = const Color(0xFF78350F).withValues(alpha: 0.35);
        border = const Color(0xFFF59E0B);
        textCol = const Color(0xFFFBBF24);
        icon = Icons.info_outline;
        break;
      case 'error':
        bg = const Color(0xFF7F1D1D).withValues(alpha: 0.35);
        border = const Color(0xFFEF4444);
        textCol = const Color(0xFFFCA5A5);
        icon = Icons.cancel;
        break;
      default:
        bg = const Color(0xFF1E293B);
        border = const Color(0xFF334155);
        textCol = const Color(0xFF94A3B8);
        icon = Icons.sensors;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: border, width: 1),
      ),
      child: Row(
        children: [
          Icon(icon, color: border, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _lastScanStatus,
              style: TextStyle(color: textCol, fontSize: 12, fontWeight: FontWeight.bold),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (_lastScannedCode.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black38,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                _lastScannedCode.length > 10 ? '..${_lastScannedCode.substring(_lastScannedCode.length - 8)}' : _lastScannedCode,
                style: const TextStyle(color: Colors.white70, fontSize: 10, fontFamily: 'monospace'),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildGarmentItemTile(PersonnelBundleItem it) {
    final isDone = it.isComplete;

    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isDone
            ? const Color(0xFF064E3B).withValues(alpha: 0.25)
            : const Color(0xFF111827),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isDone ? const Color(0xFF10B981) : const Color(0xFF1F2937),
          width: isDone ? 1.5 : 1,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Status Icon Checkbox
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: isDone ? const Color(0xFF10B981) : const Color(0xFF1E293B),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isDone ? Icons.check : Icons.radio_button_unchecked,
              color: isDone ? Colors.white : const Color(0xFF64748B),
              size: 18,
            ),
          ),

          const SizedBox(width: 10),

          // Item Info (Part No, Name, Barcode)
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Part No
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE5A93C).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: const Color(0xFFE5A93C).withValues(alpha: 0.5)),
                      ),
                      child: Text(
                        it.partNo.isNotEmpty ? it.partNo : 'PARÇA YOK',
                        style: const TextStyle(
                          color: Color(0xFFE5A93C),
                          fontWeight: FontWeight.w900,
                          fontSize: 11,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),

                    // Size Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF38BDF8).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'BEDEN: ${it.size}',
                        style: const TextStyle(
                          color: Color(0xFF38BDF8),
                          fontWeight: FontWeight.w900,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),

                // Product Name
                Text(
                  it.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

                const SizedBox(height: 2),

                // Barcode
                Text(
                  'Barkod: ${it.barcode.isNotEmpty ? it.barcode : "-"}',
                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontFamily: 'monospace'),
                ),
              ],
            ),
          ),

          // Quantity indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isDone ? const Color(0xFF10B981) : const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              '${it.scannedCount}/${it.quantity}',
              style: TextStyle(
                color: isDone ? Colors.white : const Color(0xFFF59E0B),
                fontWeight: FontWeight.w900,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildManualInputRow() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _manualScanController,
              focusNode: _scanFocusNode,
              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
              decoration: const InputDecoration(
                hintText: 'Manuel RFID / Barkod / Parça Kodu...',
                hintStyle: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                border: InputBorder.none,
                isDense: true,
              ),
              onSubmitted: (val) {
                if (val.trim().isNotEmpty) {
                  _processScannedCode(val.trim());
                  _manualScanController.clear();
                  _scanFocusNode.requestFocus();
                }
              },
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            onPressed: () {
              final val = _manualScanController.text.trim();
              if (val.isNotEmpty) {
                _processScannedCode(val);
                _manualScanController.clear();
                _scanFocusNode.requestFocus();
              }
            },
            child: const Text('OKUT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActionBar(
    PersonnelBoxDetail? detail,
    int scanned,
    int target,
    bool isComplete,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        color: Color(0xFF111827),
        border: Border(top: BorderSide(color: Color(0xFF1F2937), width: 1.5)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Reset Box Button
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF94A3B8),
                side: const BorderSide(color: Color(0xFF334155)),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () {
                if (_boxDetail != null) {
                  setState(() {
                    for (final it in _boxDetail!.bundleItems) {
                      it.scannedCount = 0;
                      it.scannedEpcs.clear();
                    }
                    _scannedCodes.clear();
                    _lastScanStatus = 'Koli sıfırlandı. Yeniden okutabilirsiniz.';
                    _lastScanStatusType = 'idle';
                  });
                }
              },
              child: const Icon(Icons.refresh, size: 20),
            ),

            const SizedBox(width: 8),

            // Seal & Print Carton Label Button
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: isComplete
                      ? const Color(0xFF10B981)
                      : const Color(0xFFE5A93C),
                  foregroundColor: isComplete ? Colors.white : Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 4,
                ),
                onPressed: _isSavingBox ? null : _handleSaveAndPrint,
                icon: _isSavingBox
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Icon(isComplete ? Icons.print : Icons.save, size: 20),
                label: Text(
                  _isSavingBox
                      ? 'KAYDEDİLİYOR...'
                      : isComplete
                          ? '📦 KOLİYİ MÜHÜRLE & ETİKET BAS'
                          : '📦 KOLİYİ KAYDET & ETİKET ($scanned/$target)',
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.3),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Quick Searchable Modal for All Personnel Boxes in Department
class _PersonnelBoxListModal extends StatefulWidget {
  final String brand;
  final String? department;
  final int currentBoxNo;
  final ValueChanged<int> onBoxSelected;

  const _PersonnelBoxListModal({
    required this.brand,
    required this.department,
    required this.currentBoxNo,
    required this.onBoxSelected,
  });

  @override
  State<_PersonnelBoxListModal> createState() => _PersonnelBoxListModalState();
}

class _PersonnelBoxListModalState extends State<_PersonnelBoxListModal> {
  final TextEditingController _searchCtrl = TextEditingController();
  List<PersonnelBoxSummary> _boxes = [];
  List<PersonnelBoxSummary> _filteredBoxes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBoxes();
    _searchCtrl.addListener(_filter);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadBoxes() async {
    setState(() => _isLoading = true);
    try {
      final list = await ApiService.getPersonnelBoxes(
        brand: widget.brand,
        department: widget.department,
      );
      if (mounted) {
        setState(() {
          _boxes = list;
          _filteredBoxes = list;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _filter() {
    final q = _searchCtrl.text.trim().toLowerCase();
    setState(() {
      if (q.isEmpty) {
        _filteredBoxes = _boxes;
      } else {
        _filteredBoxes = _boxes.where((b) {
          return b.name.toLowerCase().contains(q) ||
              b.serviceCenter.toLowerCase().contains(q) ||
              b.boxNo.toString().contains(q) ||
              b.boxBarcode.toLowerCase().contains(q);
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      expand: false,
      builder: (_, scrollController) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${widget.department ?? "Personel"} Koli Listesi (${_boxes.length})',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white70),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Search Bar
              TextField(
                controller: _searchCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Personel adı, bayi veya koli no ara...',
                  hintStyle: const TextStyle(color: Color(0xFF64748B)),
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B)),
                  filled: true,
                  fillColor: const Color(0xFF1E293B),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  isDense: true,
                ),
              ),

              const SizedBox(height: 12),

              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator(color: Color(0xFFE5A93C)))
                    : ListView.builder(
                        controller: scrollController,
                        itemCount: _filteredBoxes.length,
                        itemBuilder: (ctx, idx) {
                          final b = _filteredBoxes[idx];
                          final isCurrent = b.boxNo == widget.currentBoxNo;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 6),
                            decoration: BoxDecoration(
                              color: isCurrent
                                  ? const Color(0xFFE5A93C).withValues(alpha: 0.15)
                                  : const Color(0xFF1E293B),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isCurrent ? const Color(0xFFE5A93C) : const Color(0xFF334155),
                                width: isCurrent ? 1.5 : 1,
                              ),
                            ),
                            child: ListTile(
                              dense: true,
                              leading: CircleAvatar(
                                radius: 16,
                                backgroundColor: b.isPacked ? const Color(0xFF10B981) : const Color(0xFF334155),
                                child: Text(
                                  '#${b.boxNo}',
                                  style: TextStyle(
                                    color: b.isPacked ? Colors.white : const Color(0xFFE5A93C),
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              title: Text(
                                b.name,
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: isCurrent ? FontWeight.w900 : FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                              subtitle: Text(
                                '${b.serviceCenter} • ${b.targetQuantity} Parça',
                                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                              ),
                              trailing: b.isPacked
                                  ? const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 18)
                                  : const Icon(Icons.chevron_right, color: Color(0xFF64748B), size: 18),
                              onTap: () => widget.onBoxSelected(b.boxNo),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}
