import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/order_model.dart';
import '../models/box_model.dart';
import '../models/receiving_model.dart';
import '../models/personnel_model.dart';

class ApiService {
  static Future<bool> testConnection() async {
    try {
      final uri = ApiConfig.uri('/api/wms/pending-orders', {'limit': '1'});
      final response = await http.get(uri).timeout(const Duration(seconds: 6));
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  static Future<List<OrderModel>> getPendingOrders({String? query, String? brand}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (query != null && query.trim().isNotEmpty) {
        queryParams['q'] = query.trim();
      }
      if (brand != null && brand != 'ALL') {
        queryParams['brand'] = brand;
      }

      final uri = ApiConfig.uri('/api/wms/pending-orders', queryParams);
      final response = await http.get(uri).timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['success'] == true && decoded['data'] is List) {
          final list = (decoded['data'] as List)
              .map((jsonItem) => OrderModel.fromJson(Map<String, dynamic>.from(jsonItem)))
              .toList();
          return list;
        }
      }
      return [];
    } catch (e) {
      // ignore: avoid_print
      print('Get pending orders error: $e');
      rethrow;
    }
  }

  static Future<List<OrderBox>> getOrderBoxes(String orderNumber) async {
    try {
      final uri = ApiConfig.uri('/api/terminal/order-boxes/$orderNumber');
      final response = await http.get(uri).timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['success'] == true && decoded['boxes'] is List) {
          final list = (decoded['boxes'] as List)
              .map((jsonItem) => OrderBox.fromJson(Map<String, dynamic>.from(jsonItem)))
              .toList();
          return list;
        }
      }
      return [];
    } catch (e) {
      // ignore: avoid_print
      print('Get order boxes error: $e');
      return [];
    }
  }

  static Future<OrderContext?> getOrderContext(String orderNumber) async {
    try {
      final uri = ApiConfig.uri('/api/terminal/order-boxes/$orderNumber');
      final response = await http.get(uri).timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['success'] == true) {
          final boxesList = (decoded['boxes'] as List? ?? [])
              .map((jsonItem) => OrderBox.fromJson(Map<String, dynamic>.from(jsonItem)))
              .toList();
          final allowedEpcs = Set<String>.from((decoded['allowed_epcs'] as List? ?? []).map((e) => e.toString().toUpperCase()));
          final allowedBarcodes = Set<String>.from((decoded['allowed_barcodes'] as List? ?? []).map((e) => e.toString()));
          final allowedSkus = Set<String>.from((decoded['allowed_skus'] as List? ?? []).map((e) => e.toString().toUpperCase()));
          final scannedEpcs = Set<String>.from((decoded['scanned_epcs'] as List? ?? []).map((e) => e.toString().toUpperCase()));

          return OrderContext(
            boxes: boxesList,
            allowedEpcs: allowedEpcs,
            allowedBarcodes: allowedBarcodes,
            allowedSkus: allowedSkus,
            scannedEpcs: scannedEpcs,
          );
        }
      }
      return null;
    } catch (e) {
      // ignore: avoid_print
      print('Get order context error: $e');
      return null;
    }
  }

  static Future<Map<String, dynamic>> saveBox({
    required String orderNumber,
    required int boxNo,
    required int totalBoxes,
    required List<BoxItem> items,
    String? staffName,
    String? brand,
    bool createLogoDespatch = true,
  }) async {
    try {
      final uri = ApiConfig.uri('/api/terminal/save-box');
      final body = {
        'order_number': orderNumber,
        'box_no': boxNo,
        'total_boxes': totalBoxes,
        'items': items.map((i) => i.toJson()).toList(),
        'staff_name': staffName ?? ApiConfig.operatorName,
        'brand': brand ?? 'VOG',
        'create_logo_despatch': createLogoDespatch,
      };

      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      ).timeout(const Duration(seconds: 15));

      final decoded = json.decode(response.body);
      if (response.statusCode == 200 && decoded['success'] == true) {
        return {
          'success': true,
          'message': decoded['message'] ?? 'Koli başarıyla kaydedildi.',
          'logo_sync': decoded['logo_sync']
        };
      } else {
        return {'success': false, 'error': decoded['error'] ?? 'Koli kaydedilemedi.'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Sunucu bağlantı hatası: $e'};
    }
  }

  static Future<bool> deleteBox(String orderNumber, int boxNo) async {
    try {
      final uri = ApiConfig.uri('/api/terminal/delete-box');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'order_number': orderNumber, 'box_no': boxNo}),
      ).timeout(const Duration(seconds: 10));

      final decoded = json.decode(response.body);
      return decoded['success'] == true;
    } catch (_) {
      return false;
    }
  }

  static Future<ReceivingContext?> getReceivingContext(String orderNumber) async {
    try {
      final uri = ApiConfig.uri('/api/terminal/receiving-context/$orderNumber');
      final response = await http.get(uri).timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['success'] == true) {
          return ReceivingContext.fromJson(Map<String, dynamic>.from(decoded));
        }
      }
      return null;
    } catch (e) {
      // ignore: avoid_print
      print('Get receiving context error: $e');
      return null;
    }
  }

  static Future<Map<String, dynamic>> saveReceivingItems({
    required String orderNumber,
    required List<ReceivingItem> items,
    String? location,
    String? staffName,
  }) async {
    try {
      final uri = ApiConfig.uri('/api/terminal/receive-items');
      final body = {
        'order_number': orderNumber,
        'items': items.map((i) => i.toJson()).toList(),
        'location': location ?? 'Ana Depo Tesellüm',
        'staff_name': staffName ?? ApiConfig.operatorName,
      };

      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      ).timeout(const Duration(seconds: 15));

      final decoded = json.decode(response.body);
      if (response.statusCode == 200 && decoded['success'] == true) {
        return {
          'success': true,
          'message': decoded['message'] ?? 'Tesellüm başarıyla kaydedildi.',
          'data': decoded,
        };
      } else {
        return {'success': false, 'error': decoded['error'] ?? 'Tesellüm kaydedilemedi.'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Sunucu bağlantı hatası: $e'};
    }
  }

  // ==========================================
  // PERSONEL BAZLI KOLİLEME SERVİSLERİ
  // ==========================================

  static Future<List<PersonnelBrand>> getPersonnelBrands() async {
    try {
      final uri = ApiConfig.uri('/api/terminal/personnel/brands');
      final response = await http.get(uri).timeout(const Duration(seconds: 12));
      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['success'] == true && decoded['brands'] is List) {
          return (decoded['brands'] as List)
              .map((b) => PersonnelBrand.fromJson(Map<String, dynamic>.from(b)))
              .toList();
        }
      }
      return [];
    } catch (e) {
      // ignore: avoid_print
      print('Get personnel brands error: $e');
      return [];
    }
  }

  static Future<List<PersonnelBoxSummary>> getPersonnelBoxes({
    required String brand,
    String? department,
  }) async {
    try {
      final params = <String, dynamic>{'brand': brand};
      if (department != null && department.isNotEmpty && department != 'ALL') {
        params['department'] = department;
      }
      final uri = ApiConfig.uri('/api/terminal/personnel/boxes', params);
      final response = await http.get(uri).timeout(const Duration(seconds: 15));
      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['success'] == true && decoded['boxes'] is List) {
          return (decoded['boxes'] as List)
              .map((b) => PersonnelBoxSummary.fromJson(Map<String, dynamic>.from(b)))
              .toList();
        }
      }
      return [];
    } catch (e) {
      // ignore: avoid_print
      print('Get personnel boxes error: $e');
      return [];
    }
  }

  static Future<PersonnelBoxDetail?> getPersonnelBoxDetails({
    required String brand,
    required int boxNo,
    String? department,
  }) async {
    try {
      final params = <String, dynamic>{
        'brand': brand,
        'box_no': boxNo.toString(),
      };
      if (department != null && department.isNotEmpty && department != 'ALL') {
        params['department'] = department;
      }
      final uri = ApiConfig.uri('/api/terminal/personnel/box-details', params);
      final response = await http.get(uri).timeout(const Duration(seconds: 12));
      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        if (decoded['success'] == true && decoded['box'] != null) {
          return PersonnelBoxDetail.fromJson(Map<String, dynamic>.from(decoded['box']));
        }
      }
      return null;
    } catch (e) {
      // ignore: avoid_print
      print('Get personnel box details error: $e');
      return null;
    }
  }

  static Future<Map<String, dynamic>> savePersonnelBox({
    required String brand,
    String? department,
    required int boxNo,
    required String boxBarcode,
    required List<PersonnelBundleItem> items,
    bool printLabel = true,
    String? staffName,
  }) async {
    try {
      final uri = ApiConfig.uri('/api/terminal/personnel/save-box');
      final body = {
        'brand': brand,
        'department': department,
        'box_no': boxNo,
        'box_barcode': boxBarcode,
        'items': items.map((i) => i.toJson()).toList(),
        'print_label': printLabel,
        'staff_name': staffName ?? ApiConfig.operatorName,
      };

      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      ).timeout(const Duration(seconds: 20));

      final decoded = json.decode(response.body);
      if (response.statusCode == 200 && decoded['success'] == true) {
        return {
          'success': true,
          'message': decoded['message'] ?? 'Personel kolisi başarıyla kaydedildi.',
          'next_box_no': decoded['next_box_no'],
          'next_box': decoded['next_box'],
          'print_status': decoded['print_status'],
        };
      } else {
        return {'success': false, 'error': decoded['error'] ?? 'Koli kaydedilemedi.'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Sunucu bağlantı hatası: $e'};
    }
  }
}

class OrderContext {
  final List<OrderBox> boxes;
  final Set<String> allowedEpcs;
  final Set<String> allowedBarcodes;
  final Set<String> allowedSkus;
  final Set<String> scannedEpcs;

  OrderContext({
    required this.boxes,
    required this.allowedEpcs,
    required this.allowedBarcodes,
    required this.allowedSkus,
    required this.scannedEpcs,
  });
}
