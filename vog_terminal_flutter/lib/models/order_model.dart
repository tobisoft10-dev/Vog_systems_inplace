class OrderModel {
  final dynamic id;
  final String orderNumber;
  final String brand;
  final String productName;
  final String subCustomerName;
  final String staffName;
  final String status;
  final int totalQty;
  final int receivedQty;
  final int remainingQty;
  final int progressPercent;
  final bool isCompleted;
  final String barcode;
  final String sku;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.brand,
    required this.productName,
    required this.subCustomerName,
    required this.staffName,
    required this.status,
    required this.totalQty,
    required this.receivedQty,
    required this.remainingQty,
    required this.progressPercent,
    required this.isCompleted,
    this.barcode = '',
    this.sku = '',
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final total = (json['total_qty'] ?? json['quantity'] ?? json['total'] ?? 1) as int;
    final remaining = (json['remaining_qty'] ?? json['remaining_quantity'] ?? total) as int;
    final received = (json['received_qty'] ?? json['received'] ?? (total - remaining)) as int;
    final progress = (json['percentage'] ?? json['progress_percent'] ?? (total > 0 ? ((received / total) * 100).round() : 0)) as int;

    return OrderModel(
      id: json['id'] ?? json['order_number'] ?? '',
      orderNumber: (json['order_number'] ?? json['id'] ?? '').toString(),
      brand: (json['brand'] ?? 'VOG').toString(),
      productName: (json['product_name'] ?? 'Tekstil Ürünü').toString(),
      subCustomerName: (json['sub_customer_name'] ?? json['customer_name'] ?? '-').toString(),
      staffName: (json['staff_name'] ?? 'Operatör').toString(),
      status: (json['status'] ?? 'BEKLEMEDE').toString(),
      totalQty: total,
      receivedQty: received,
      remainingQty: remaining,
      progressPercent: progress,
      isCompleted: json['is_completed'] == true || remaining <= 0,
      barcode: (json['barcode'] ?? json['ean13'] ?? '').toString(),
      sku: (json['sku'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_number': orderNumber,
      'brand': brand,
      'product_name': productName,
      'sub_customer_name': subCustomerName,
      'staff_name': staffName,
      'status': status,
      'total_qty': totalQty,
      'received_qty': receivedQty,
      'remaining_qty': remainingQty,
      'progress_percent': progressPercent,
      'is_completed': isCompleted,
      'barcode': barcode,
      'sku': sku,
    };
  }
}
