class PersonnelDepartment {
  final String department;
  final int totalCount;
  final int packedCount;
  final int remainingCount;

  PersonnelDepartment({
    required this.department,
    required this.totalCount,
    required this.packedCount,
    required this.remainingCount,
  });

  factory PersonnelDepartment.fromJson(Map<String, dynamic> json) {
    return PersonnelDepartment(
      department: json['department']?.toString() ?? '',
      totalCount: int.tryParse(json['total_count']?.toString() ?? '0') ?? 0,
      packedCount: int.tryParse(json['packed_count']?.toString() ?? '0') ?? 0,
      remainingCount: int.tryParse(json['remaining_count']?.toString() ?? '0') ?? 0,
    );
  }
}

class PersonnelBrand {
  final String brand;
  final String brandCode;
  final int totalPersonnel;
  final int packedCount;
  final int remainingCount;
  final int numberedCount;
  final int minBoxNo;
  final int maxBoxNo;
  final List<PersonnelDepartment> departments;

  PersonnelBrand({
    required this.brand,
    required this.brandCode,
    required this.totalPersonnel,
    required this.packedCount,
    required this.remainingCount,
    required this.numberedCount,
    required this.minBoxNo,
    required this.maxBoxNo,
    required this.departments,
  });

  factory PersonnelBrand.fromJson(Map<String, dynamic> json) {
    final deptsJson = json['departments'] as List? ?? [];
    return PersonnelBrand(
      brand: json['brand']?.toString() ?? '',
      brandCode: json['brand_code']?.toString() ?? '',
      totalPersonnel: int.tryParse(json['total_personnel']?.toString() ?? '0') ?? 0,
      packedCount: int.tryParse(json['packed_count']?.toString() ?? '0') ?? 0,
      remainingCount: int.tryParse(json['remaining_count']?.toString() ?? '0') ?? 0,
      numberedCount: int.tryParse(json['numbered_count']?.toString() ?? '0') ?? 0,
      minBoxNo: int.tryParse(json['min_box_no']?.toString() ?? '1') ?? 1,
      maxBoxNo: int.tryParse(json['max_box_no']?.toString() ?? '1') ?? 1,
      departments: deptsJson.map((d) => PersonnelDepartment.fromJson(Map<String, dynamic>.from(d))).toList(),
    );
  }
}

class PersonnelBoxSummary {
  final String id;
  final int boxNo;
  final String boxBarcode;
  final String name;
  final String serviceCenter;
  final String department;
  final String gender;
  final int itemCount;
  final int targetQuantity;
  final String packingStatus;
  final String lastStep;
  final String? sorterChute;
  final bool hasAssignedBoxNo;

  PersonnelBoxSummary({
    required this.id,
    required this.boxNo,
    required this.boxBarcode,
    required this.name,
    required this.serviceCenter,
    required this.department,
    required this.gender,
    required this.itemCount,
    required this.targetQuantity,
    required this.packingStatus,
    required this.lastStep,
    this.sorterChute,
    required this.hasAssignedBoxNo,
  });

  bool get isPacked => packingStatus == 'PACKED' || lastStep.contains('TAMAM');

  factory PersonnelBoxSummary.fromJson(Map<String, dynamic> json) {
    return PersonnelBoxSummary(
      id: json['id']?.toString() ?? '',
      boxNo: int.tryParse(json['box_no']?.toString() ?? '1') ?? 1,
      boxBarcode: json['box_barcode']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      serviceCenter: json['service_center']?.toString() ?? '',
      department: json['department']?.toString() ?? '',
      gender: json['gender']?.toString() ?? '',
      itemCount: int.tryParse(json['item_count']?.toString() ?? '0') ?? 0,
      targetQuantity: int.tryParse(json['target_quantity']?.toString() ?? '0') ?? 0,
      packingStatus: json['packing_status']?.toString() ?? 'PENDING',
      lastStep: json['last_step']?.toString() ?? '',
      sorterChute: json['sorter_chute']?.toString(),
      hasAssignedBoxNo: json['has_assigned_box_no'] == true,
    );
  }
}

class PersonnelBundleItem {
  final String id;
  final int index;
  final String name;
  final String shortName;
  final String size;
  final String partNo;
  final String barcode;
  final int quantity;
  final String? sorterChute;
  final String? targetPrinter;

  // Runtime scan tracking
  int scannedCount;
  final List<String> scannedEpcs;

  PersonnelBundleItem({
    required this.id,
    required this.index,
    required this.name,
    required this.shortName,
    required this.size,
    required this.partNo,
    required this.barcode,
    required this.quantity,
    this.sorterChute,
    this.targetPrinter,
    this.scannedCount = 0,
    List<String>? scannedEpcs,
  }) : scannedEpcs = scannedEpcs ?? [];

  bool get isComplete => scannedCount >= quantity;

  factory PersonnelBundleItem.fromJson(Map<String, dynamic> json) {
    return PersonnelBundleItem(
      id: json['id']?.toString() ?? '',
      index: int.tryParse(json['index']?.toString() ?? '0') ?? 0,
      name: json['name']?.toString() ?? '',
      shortName: json['short_name']?.toString() ?? '',
      size: json['size']?.toString() ?? 'STD',
      partNo: json['part_no']?.toString() ?? '',
      barcode: json['barcode']?.toString() ?? '',
      quantity: int.tryParse(json['quantity']?.toString() ?? '1') ?? 1,
      sorterChute: json['sorter_chute']?.toString(),
      targetPrinter: json['target_printer']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'index': index,
      'name': name,
      'short_name': shortName,
      'size': size,
      'part_no': partNo,
      'barcode': barcode,
      'quantity': quantity,
      'scanned_count': scannedCount,
      'scanned_epcs': scannedEpcs,
    };
  }
}

class PersonnelBoxDetail {
  final String id;
  final String name;
  final String serviceCenter;
  final String department;
  final String brand;
  final String brandCode;
  final String gender;
  final int boxNo;
  final int totalBoxes;
  final String boxBarcode;
  final int targetQuantity;
  final String packingStatus;
  final String lastStep;
  final List<PersonnelBundleItem> bundleItems;

  PersonnelBoxDetail({
    required this.id,
    required this.name,
    required this.serviceCenter,
    required this.department,
    required this.brand,
    required this.brandCode,
    required this.gender,
    required this.boxNo,
    required this.totalBoxes,
    required this.boxBarcode,
    required this.targetQuantity,
    required this.packingStatus,
    required this.lastStep,
    required this.bundleItems,
  });

  bool get isPacked => packingStatus == 'PACKED' || lastStep.contains('TAMAM');
  int get totalScanned => bundleItems.fold(0, (sum, it) => sum + it.scannedCount);
  bool get isBoxComplete => totalScanned >= targetQuantity && targetQuantity > 0;

  factory PersonnelBoxDetail.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['bundle_items'] as List? ?? [];
    return PersonnelBoxDetail(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      serviceCenter: json['service_center']?.toString() ?? '',
      department: json['department']?.toString() ?? '',
      brand: json['brand']?.toString() ?? '',
      brandCode: json['brand_code']?.toString() ?? '',
      gender: json['gender']?.toString() ?? '',
      boxNo: int.tryParse(json['box_no']?.toString() ?? '1') ?? 1,
      totalBoxes: int.tryParse(json['total_boxes']?.toString() ?? '1') ?? 1,
      boxBarcode: json['box_barcode']?.toString() ?? '',
      targetQuantity: int.tryParse(json['target_quantity']?.toString() ?? '0') ?? 0,
      packingStatus: json['packing_status']?.toString() ?? 'PENDING',
      lastStep: json['last_step']?.toString() ?? '',
      bundleItems: itemsJson.map((it) => PersonnelBundleItem.fromJson(Map<String, dynamic>.from(it))).toList(),
    );
  }
}
