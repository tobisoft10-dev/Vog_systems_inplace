class ReceivingContext {
  final String orderNumber;
  final int totalQty;
  final int receivedQty;
  final int remainingQty;
  final int progressPercent;
  final bool isCompleted;
  final Set<String> allowedEpcs;
  final Set<String> allowedBarcodes;
  final Set<String> allowedSkus;
  final Set<String> receivedEpcs;
  final List<dynamic> recentVouchers;

  ReceivingContext({
    required this.orderNumber,
    required this.totalQty,
    required this.receivedQty,
    required this.remainingQty,
    required this.progressPercent,
    required this.isCompleted,
    required this.allowedEpcs,
    required this.allowedBarcodes,
    required this.allowedSkus,
    required this.receivedEpcs,
    required this.recentVouchers,
  });

  factory ReceivingContext.fromJson(Map<String, dynamic> json) {
    return ReceivingContext(
      orderNumber: (json['order_number'] ?? '').toString(),
      totalQty: (json['total_qty'] ?? 1) as int,
      receivedQty: (json['received_qty'] ?? 0) as int,
      remainingQty: (json['remaining_qty'] ?? 0) as int,
      progressPercent: (json['progress_percent'] ?? 0) as int,
      isCompleted: json['is_completed'] == true,
      allowedEpcs: Set<String>.from((json['allowed_epcs'] as List? ?? []).map((e) => e.toString().toUpperCase())),
      allowedBarcodes: Set<String>.from((json['allowed_barcodes'] as List? ?? []).map((e) => e.toString())),
      allowedSkus: Set<String>.from((json['allowed_skus'] as List? ?? []).map((e) => e.toString().toUpperCase())),
      receivedEpcs: Set<String>.from((json['received_epcs'] as List? ?? []).map((e) => e.toString().toUpperCase())),
      recentVouchers: (json['recent_vouchers'] as List? ?? []),
    );
  }
}

class ReceivingItem {
  final String epc;
  final String barcode;
  final String sku;
  final String productName;
  final DateTime scannedAt;

  ReceivingItem({
    required this.epc,
    required this.barcode,
    required this.sku,
    required this.productName,
    DateTime? scannedAt,
  }) : scannedAt = scannedAt ?? DateTime.now();

  Map<String, dynamic> toJson() {
    return {
      'epc': epc,
      'barcode': barcode,
      'sku': sku,
      'product_name': productName,
      'scanned_at': scannedAt.toIso8601String(),
    };
  }
}
