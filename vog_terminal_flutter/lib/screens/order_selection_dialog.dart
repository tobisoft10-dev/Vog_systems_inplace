import 'package:flutter/material.dart';
import '../models/order_model.dart';
import '../services/api_service.dart';
import 'settings_screen.dart';

class OrderSelectionDialog extends StatefulWidget {
  const OrderSelectionDialog({super.key});

  @override
  State<OrderSelectionDialog> createState() => _OrderSelectionDialogState();
}

class _OrderSelectionDialogState extends State<OrderSelectionDialog> {
  final TextEditingController _searchController = TextEditingController();
  List<OrderModel> _allOrders = [];
  List<OrderModel> _filteredOrders = [];
  bool _isLoading = true;
  String _selectedBrand = 'ALL';
  List<String> _brands = ['ALL'];

  @override
  void initState() {
    super.initState();
    _loadOrders();
    _searchController.addListener(_applyFilter);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final orders = await ApiService.getPendingOrders();
      final brandSet = <String>{'ALL'};
      for (final o in orders) {
        if (o.brand.isNotEmpty) brandSet.add(o.brand.toUpperCase());
      }

      if (mounted) {
        setState(() {
          _allOrders = orders;
          _brands = brandSet.toList();
          _isLoading = false;
        });
        _applyFilter();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Siparişler yüklenemedi: $e'),
            backgroundColor: Colors.red.shade800,
            duration: const Duration(seconds: 6),
            action: SnackBarAction(
              label: 'Ayarlar',
              textColor: const Color(0xFFE5A93C),
              onPressed: () async {
                final updated = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(builder: (_) => const SettingsScreen()),
                );
                if (updated == true && mounted) {
                  _loadOrders();
                }
              },
            ),
          ),
        );
      }
    }
  }

  void _applyFilter() {
    final query = _searchController.text.trim().toLowerCase();
    setState(() {
      _filteredOrders = _allOrders.filter((order) {
        final matchesBrand = _selectedBrand == 'ALL' || order.brand.toUpperCase() == _selectedBrand;
        if (!matchesBrand) return false;

        if (query.isEmpty) return true;
        return order.orderNumber.toLowerCase().contains(query) ||
            order.productName.toLowerCase().contains(query) ||
            order.subCustomerName.toLowerCase().contains(query) ||
            order.brand.toLowerCase().contains(query);
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFF090D16),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        title: const Text(
          '📦 Paketlenecek Siparişi Seçin',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Color(0xFF38BDF8)),
            onPressed: _loadOrders,
            tooltip: 'Yenile',
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Color(0xFFE5A93C)),
            onPressed: () async {
              final updated = await Navigator.of(context).push<bool>(
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              );
              if (updated == true && mounted) {
                _loadOrders();
              }
            },
            tooltip: 'Sunucu Ayarları',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Box
          Container(
            padding: const EdgeInsets.all(12),
            color: const Color(0xFF111827),
            child: TextField(
              controller: _searchController,
              autofocus: false,
              style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
              decoration: InputDecoration(
                hintText: '🔍 Sipariş No, Marka veya Ürün Ara...',
                hintStyle: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                prefixIcon: const Icon(Icons.search, color: Color(0xFFE5A93C), size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.grey, size: 18),
                        onPressed: () => _searchController.clear(),
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
          ),

          // Brand Filter Chips
          if (_brands.length > 2)
            Container(
              height: 44,
              color: const Color(0xFF111827),
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: _brands.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final b = _brands[index];
                  final isSelected = b == _selectedBrand;
                  return ChoiceChip(
                    label: Text(b == 'ALL' ? 'TÜMÜ (${_allOrders.length})' : b),
                    selected: isSelected,
                    selectedColor: const Color(0xFFE5A93C),
                    backgroundColor: const Color(0xFF1E293B),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.black : Colors.white70,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                    onSelected: (selected) {
                      if (selected) {
                        setState(() => _selectedBrand = b);
                        _applyFilter();
                      }
                    },
                  );
                },
              ),
            ),

          // Orders List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFFE5A93C)),
                  )
                : _filteredOrders.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inventory_2_outlined, size: 54, color: Colors.grey.shade700),
                            const SizedBox(height: 12),
                            Text(
                              'Aranan kriterlere uygun sipariş bulunamadı.',
                              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        color: const Color(0xFFE5A93C),
                        backgroundColor: const Color(0xFF1E293B),
                        onRefresh: _loadOrders,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(12),
                          itemCount: _filteredOrders.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final order = _filteredOrders[index];
                            return _buildOrderCard(order, theme);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(OrderModel order, ThemeData theme) {
    return InkWell(
      onTap: () => Navigator.of(context).pop(order),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF111827),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF1F2937)),
          boxShadow: const [
            BoxStyle.cardShadow,
          ],
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
                    order.brand,
                    style: const TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.w900,
                      fontSize: 11,
                    ),
                  ),
                ),
                Text(
                  '#${order.orderNumber}',
                  style: const TextStyle(
                    color: Color(0xFF38BDF8),
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Text(
                    '${order.totalQty} Adet',
                    style: const TextStyle(
                      color: Color(0xFF34D399),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              order.productName,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 13,
                height: 1.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(Icons.business_outlined, size: 13, color: Colors.grey.shade400),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    order.subCustomerName,
                    style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class BoxStyle {
  static const BoxShadow cardShadow = BoxShadow(
    color: Color(0x66000000),
    blurRadius: 6,
    offset: Offset(0, 2),
  );
}

extension IterableExtension<T> on Iterable<T> {
  List<T> filter(bool Function(T) test) {
    final list = <T>[];
    for (final element in this) {
      if (test(element)) list.add(element);
    }
    return list;
  }
}
