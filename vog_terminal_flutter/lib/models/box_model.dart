class BoxItem {
  final String epc;
  final String barcode;
  final String sku;
  final String size;
  final String productName;
  final DateTime timestamp;

  BoxItem({
    required this.epc,
    required this.barcode,
    this.sku = '',
    this.size = 'STD',
    this.productName = 'Paketlenen Ürün',
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  factory BoxItem.fromJson(Map<String, dynamic> json) {
    return BoxItem(
      epc: (json['epc'] ?? '').toString().trim().toUpperCase(),
      barcode: (json['barcode'] ?? json['epc'] ?? '').toString(),
      sku: (json['sku'] ?? '').toString(),
      size: (json['size'] ?? 'STD').toString(),
      productName: (json['product_name'] ?? 'Paketlenen Ürün').toString(),
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'epc': epc,
      'barcode': barcode,
      'sku': sku,
      'size': size,
      'product_name': productName,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class OrderBox {
  final dynamic id;
  final String orderNumber;
  final int boxNo;
  final int totalBoxes;
  final int packedQuantity;
  final int verifiedQuantity;
  final int targetQuantity;
  final String status;
  final String staffName;
  final List<BoxItem> items;
  final List<dynamic> itemsPlan;

  OrderBox({
    required this.id,
    required this.orderNumber,
    required this.boxNo,
    required this.totalBoxes,
    required this.packedQuantity,
    this.verifiedQuantity = 0,
    this.targetQuantity = 0,
    required this.status,
    required this.staffName,
    required this.items,
    this.itemsPlan = const [],
  });

  factory OrderBox.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    List<BoxItem> itemList = [];
    if (rawItems is List) {
      itemList = rawItems.map((i) => BoxItem.fromJson(Map<String, dynamic>.from(i))).toList();
    }

    final rawPlan = json['items_plan'];
    List<dynamic> planList = [];
    if (rawPlan is List) {
      planList = rawPlan;
    }

    return OrderBox(
      id: json['id'] ?? '',
      orderNumber: (json['order_number'] ?? '').toString(),
      boxNo: (json['box_no'] ?? 1) as int,
      totalBoxes: (json['total_boxes'] ?? 1) as int,
      packedQuantity: (json['packed_quantity'] ?? json['item_count'] ?? itemList.length) as int,
      verifiedQuantity: (json['verified_quantity'] ?? 0) as int,
      targetQuantity: (json['target_quantity'] ?? 0) as int,
      status: (json['status'] ?? 'PACKED').toString(),
      staffName: (json['staff_name'] ?? 'Operatör').toString(),
      items: itemList,
      itemsPlan: planList,
    );
  }
}
