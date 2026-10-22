import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from copy import copy
import os
import sys

def normalize_key(val):
    if not val:
        return ""
    s = str(val).strip()
    s = s.replace('İ', 'I').replace('i', 'I').upper()
    return s

def generate_seat_report(input_file=None, output_file=None, template_file=None):
    workspace_dir = os.getcwd()
    
    if not input_file:
        input_file = os.path.join(workspace_dir, 'SEAT 2026 Yaz Kişi Listesi.xlsx')
    if not output_file:
        output_file = os.path.join(workspace_dir, 'SEAT_2026_Yaz_Rapor_Generated.xlsx')
    if not template_file:
        template_file = os.path.join(workspace_dir, 'SEAT 2026 Yaz Rapor.xlsx')

    print(f"📖 Girdi dosyası okunuyor: {input_file}")
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Girdi dosyası bulunamadı: {input_file}")

    if not os.path.exists(template_file):
        raise FileNotFoundError(f"Şablon dosyası bulunamadı: {template_file}")

    wb_input = openpyxl.load_workbook(input_file, data_only=True)
    wb_out = openpyxl.load_workbook(template_file)

    # 1. PARÇA NO DETAY sayfasından Model-Beden -> Stok SKU Haritasını Oluştur
    ws_parca = wb_input['PARÇA NO DETAY']
    sku_map = {}
    for row in ws_parca.iter_rows(values_only=True):
        if len(row) >= 2 and row[0] and row[1] and str(row[1]).startswith('PSEAT'):
            model_key = normalize_key(row[0])
            sku_map[model_key] = str(row[1]).strip()

    print(f"✅ {len(sku_map)} adet SKU eşleşme haritası oluşturuldu.")

    role_sheets = [
        ('Diğer Servis Danışmanı', 'Diğer Servis Danışman'),
        ('Formen', 'Formen'),
        ('GarantiDispozisyon', 'Garanti/Dispozisyon'),
        ('Kaporta Teknisyen', 'Kapota Teknisyen '),
        ('Master Teknisyen', 'Master Teknisyen'),
        ('Mekanik Teknisyen', 'Mekanik Teknisyen'),
        ('Servis Danışmanı', 'Servis Danışmanı')
    ]

    all_bolums = [
        'Diğer Servis Danışman',
        'Formen',
        'Garanti/Dispozisyon',
        'Kapota Teknisyen ',
        'Master Teknisyen',
        'Mekanik Teknisyen',
        'Servis Danışmanı'
    ]

    all_products = [
        'Formen Polo Yaka T_Shirt',
        'Master Teknisyen Polo Yaka T_Shirt',
        'Servis Danışman Pantolon Bay',
        'Servis Danışman Polo Yaka T_Shİrt Bay',
        'Servis Danışman Polo Yaka T_Shİrt Bay Kırmızı',
        'Teknisyen Bisiklet Yaka T_Shirt',
        'Teknisyen Pantolon',
        'Teknisyen Polo Yaka T_Shİrt'
    ]

    detay_records = []
    ozet_records = []
    koli_records = []

    bolum_totals = {b: 0 for b in all_bolums}
    bolum_urun_matrix = {b: {p: 0 for p in all_products} for b in all_bolums}
    dealer_adet_matrix = {}
    dealer_koli_matrix = {}
    dealer_sequence = {}
    grand_total_qty = 0

    for sheet_title, role_name in role_sheets:
        if sheet_title not in wb_input.sheetnames:
            continue
        ws_role = wb_input[sheet_title]
        headers = [cell.value for cell in ws_role[1]]

        for row in ws_role.iter_rows(min_row=2, values_only=True):
            if not row or not any(row):
                continue
            row_dict = {str(headers[i]).strip(): row[i] for i in range(min(len(headers), len(row))) if headers[i]}

            dealer = str(row_dict.get('Yetkili Satıcı Kısa Adı', '') or '').strip().replace(' - ', ' ')
            raw_name = str(row_dict.get('Personel Adı', '') or '')
            clean_name = raw_name.strip()
            gender = str(row_dict.get('Cinsiyet', '') or '').strip()

            top_size = str(row_dict.get('Üst \r\nBeden', row_dict.get('Üst Beden', '')) or '').strip()
            bottom_size = str(row_dict.get('Alt \r\nBeden', row_dict.get('Alt Beden', '')) or '').strip()

            if not clean_name or not dealer:
                continue

            person_key = f"{raw_name}-{role_name}"
            person_items = []

            if role_name == 'Servis Danışmanı':
                is_bayan = 'BAYAN' in gender.upper() or 'KADIN' in gender.upper()
                p1_text = f"Servis Danışman Pantolon {'Bayan' if is_bayan else 'Bay'} - {bottom_size}"
                p1_sku = sku_map.get(normalize_key(p1_text), '')
                person_items.append({'prod_name': 'Servis Danışman Pantolon Bay', 'label_desc': 'Pantolon 2 Adet', 'sku': p1_sku, 'qty': 2})

                p2_text = f"SERVİS DANIŞMAN POLO YAKA T-SHIRT {'BAYAN' if is_bayan else 'BAY'} - {top_size}"
                p2_sku = sku_map.get(normalize_key(p2_text), '')
                person_items.append({'prod_name': 'Servis Danışman Polo Yaka T_Shİrt Bay', 'label_desc': 'T_Shirt (1) 2 Adet', 'sku': p2_sku, 'qty': 2})

                p3_text = f"SERVİS DANIŞMAN POLO YAKA T-SHIRT {'BAYAN' if is_bayan else 'BAY'} KIRMIZI - {top_size}"
                p3_sku = sku_map.get(normalize_key(p3_text), '')
                person_items.append({'prod_name': 'Servis Danışman Polo Yaka T_Shİrt Bay Kırmızı', 'label_desc': 'T_Shirt (2) 2 Adet', 'sku': p3_sku, 'qty': 2})

            elif role_name == 'Diğer Servis Danışman':
                is_bayan = 'BAYAN' in gender.upper() or 'KADIN' in gender.upper()
                p1_text = f"SERVİS DANIŞMAN PANTOLON {'BAYAN' if is_bayan else 'BAY'} - {bottom_size}"
                p1_sku = sku_map.get(normalize_key(p1_text), '')
                person_items.append({'prod_name': 'Servis Danışman Pantolon Bay', 'label_desc': 'Pantolon 1 Adet', 'sku': p1_sku, 'qty': 1})

                p2_text = f"SERVİS DANIŞMAN POLO YAKA T-SHIRT {'BAYAN' if is_bayan else 'BAY'} - {top_size}"
                p2_sku = sku_map.get(normalize_key(p2_text), '')
                person_items.append({'prod_name': 'Servis Danışman Polo Yaka T_Shİrt Bay', 'label_desc': 'T_Shirt (1) 1 Adet', 'sku': p2_sku, 'qty': 1})

                p3_text = f"SERVİS DANIŞMAN POLO YAKA T-SHIRT {'BAYAN' if is_bayan else 'BAY'} KIRMIZI - {top_size}"
                p3_sku = sku_map.get(normalize_key(p3_text), '')
                person_items.append({'prod_name': 'Servis Danışman Polo Yaka T_Shİrt Bay Kırmızı', 'label_desc': 'T_Shirt (2) 2 Adet', 'sku': p3_sku, 'qty': 2})

            elif role_name == 'Formen':
                p1_text = f"FORMEN POLO YAKA T-SHIRT - {top_size}"
                p1_sku = sku_map.get(normalize_key(p1_text), '')
                person_items.append({'prod_name': 'Formen Polo Yaka T_Shirt', 'label_desc': 'T_Shirt (1) 4 Adet', 'sku': p1_sku, 'qty': 4})

                p2_text = f"TEKNİSYEN PANTOLON - {bottom_size}"
                p2_sku = sku_map.get(normalize_key(p2_text), '')
                person_items.append({'prod_name': 'Teknisyen Pantolon', 'label_desc': 'Pantolon 2 Adet', 'sku': p2_sku, 'qty': 2})

            elif role_name == 'Mekanik Teknisyen':
                p1_text = f"TEKNİSYEN PANTOLON - {bottom_size}"
                p1_sku = sku_map.get(normalize_key(p1_text), '')
                person_items.append({'prod_name': 'Teknisyen Pantolon', 'label_desc': 'Pantolon 2 Adet', 'sku': p1_sku, 'qty': 2})

                p2_text = f"TEKNİSYEN POLO YAKA T-SHIRT - {top_size}"
                p2_sku = sku_map.get(normalize_key(p2_text), '')
                person_items.append({'prod_name': 'Teknisyen Polo Yaka T_Shİrt', 'label_desc': 'T_Shirt (1) 4 Adet', 'sku': p2_sku, 'qty': 4})

            elif role_name == 'Kapota Teknisyen ':
                p1_text = f"TEKNİSYEN PANTOLON - {bottom_size}"
                p1_sku = sku_map.get(normalize_key(p1_text), '')
                person_items.append({'prod_name': 'Teknisyen Pantolon', 'label_desc': 'Pantolon 2 Adet', 'sku': p2_sku if 'p2_sku' in locals() else p1_sku, 'qty': 2})

                p2_text = f"TEKNİSYEN BİSİKLET YAKA T-SHIRT - {top_size}"
                p2_sku = sku_map.get(normalize_key(p2_text), '')
                person_items.append({'prod_name': 'Teknisyen Bisiklet Yaka T_Shirt', 'label_desc': 'T_Shirt (1) 4 Adet', 'sku': p2_sku, 'qty': 4})

            elif role_name == 'Master Teknisyen':
                p1_text = f"MASTER TEKNİSYEN POLO YAKA T-SHIRT - {top_size}"
                p1_sku = sku_map.get(normalize_key(p1_text), '')
                person_items.append({'prod_name': 'Master Teknisyen Polo Yaka T_Shirt', 'label_desc': 'T_Shirt (1) 4 Adet', 'sku': p1_sku, 'qty': 4})

                p2_text = f"TEKNİSYEN PANTOLON - {bottom_size}"
                p2_sku = sku_map.get(normalize_key(p2_text), '')
                person_items.append({'prod_name': 'Teknisyen Pantolon', 'label_desc': 'Pantolon 2 Adet', 'sku': p2_sku, 'qty': 2})

            elif role_name == 'Garanti/Dispozisyon':
                p1_text = f"TEKNİSYEN POLO YAKA T-SHIRT - {top_size}"
                p1_sku = sku_map.get(normalize_key(p1_text), '')
                person_items.append({'prod_name': 'Teknisyen Polo Yaka T_Shİrt', 'label_desc': 'T_Shirt (1) 3 Adet', 'sku': p1_sku, 'qty': 3})

            if dealer not in dealer_adet_matrix:
                dealer_adet_matrix[dealer] = {b: 0 for b in all_bolums}
                dealer_koli_matrix[dealer] = {b: 0 for b in all_bolums}

            dealer_koli_matrix[dealer][role_name] += 1
            total_person_items = 0

            for item in person_items:
                detay_records.append([dealer, role_name, person_key, item['sku'], item['prod_name'], item['qty']])
                total_person_items += item['qty']
                grand_total_qty += item['qty']
                bolum_totals[role_name] += item['qty']
                bolum_urun_matrix[role_name][item['prod_name']] += item['qty']
                dealer_adet_matrix[dealer][role_name] += item['qty']

            ozet_records.append([role_name, dealer, person_key, total_person_items])

            dealer_sequence[dealer] = dealer_sequence.get(dealer, 0) + 1
            seq = dealer_sequence[dealer]

            u1, u2, u3 = ' ', ' ', ' '
            p1, p2, p3 = '', '', ''

            if role_name == 'Garanti/Dispozisyon':
                u2 = person_items[0]['label_desc'] if len(person_items) > 0 else ' '
                p2 = person_items[0]['sku'] if len(person_items) > 0 else ''
            else:
                u1 = person_items[0]['label_desc'] if len(person_items) > 0 else ' '
                u2 = person_items[1]['label_desc'] if len(person_items) > 1 else ' '
                u3 = person_items[2]['label_desc'] if len(person_items) > 2 else ' '
                p1 = person_items[0]['sku'] if len(person_items) > 0 else ''
                p2 = person_items[1]['sku'] if len(person_items) > 1 else ''
                p3 = person_items[2]['sku'] if len(person_items) > 2 else ''

            koli_records.append([seq, dealer, clean_name, role_name, gender, u1, u2, u3, p1, p2, p3])

    # -------------------------------------------------------------
    # GÜNCELLEME: Biçimlendirmeleri (Style/Color/Border/Width) Koru
    # -------------------------------------------------------------

    # Koli Etiketi Sayfası
    ws_koli = wb_out['Koli Etiketi']
    template_row = [copy_cell_style(ws_koli.cell(row=2, column=col_idx)) for col_idx in range(1, 12)]
    
    # 2. satırdan sonrasını temizle
    ws_koli.delete_rows(2, ws_koli.max_row + 10)

    for row_idx, rdata in enumerate(koli_records, start=2):
        for col_idx, val in enumerate(rdata, start=1):
            cell = ws_koli.cell(row=row_idx, column=col_idx, value=val)
            apply_cell_style(cell, template_row[col_idx - 1])

    # Detay Sayfası
    ws_detay = wb_out['Detay']
    detay_style = [copy_cell_style(ws_detay.cell(row=3, column=col_idx)) for col_idx in range(1, 7)]
    ws_detay.delete_rows(3, ws_detay.max_row + 10)

    for row_idx, rdata in enumerate(detay_records, start=3):
        for col_idx, val in enumerate(rdata, start=1):
            cell = ws_detay.cell(row=row_idx, column=col_idx, value=val)
            apply_cell_style(cell, detay_style[col_idx - 1])

    tot_row_idx = len(detay_records) + 4
    c_label = ws_detay.cell(row=tot_row_idx, column=1, value='Genel Toplam')
    c_val = ws_detay.cell(row=tot_row_idx, column=6, value=grand_total_qty)
    c_label.font = Font(name='Arial', bold=True)
    c_val.font = Font(name='Arial', bold=True)

    # Özet Sayfası
    ws_ozet = wb_out['Özet']
    ozet_style = [copy_cell_style(ws_ozet.cell(row=3, column=col_idx)) for col_idx in range(1, 5)]
    ws_ozet.delete_rows(3, ws_ozet.max_row + 10)

    for row_idx, rdata in enumerate(ozet_records, start=3):
        for col_idx, val in enumerate(rdata, start=1):
            cell = ws_ozet.cell(row=row_idx, column=col_idx, value=val)
            apply_cell_style(cell, ozet_style[col_idx - 1])

    tot_ozet_idx = len(ozet_records) + 4
    c_o_label = ws_ozet.cell(row=tot_ozet_idx, column=1, value='Genel Toplam')
    c_o_val = ws_ozet.cell(row=tot_ozet_idx, column=4, value=grand_total_qty)
    c_o_label.font = Font(name='Arial', bold=True)
    c_o_val.font = Font(name='Arial', bold=True)

    # Bölüm İcmal
    ws_b_icmal = wb_out['Bölüm İcmal']
    ws_b_icmal.delete_rows(3, ws_b_icmal.max_row + 10)
    for idx, b in enumerate(all_bolums, start=3):
        ws_b_icmal.cell(row=idx, column=1, value=b)
        ws_b_icmal.cell(row=idx, column=2, value=bolum_totals[b])
    ws_b_icmal.cell(row=len(all_bolums) + 4, column=1, value='Genel Toplam')
    ws_b_icmal.cell(row=len(all_bolums) + 4, column=2, value=grand_total_qty)

    # Bölüm Ürün İcmal
    ws_b_urun = wb_out['Bölüm Ürün İcmal']
    ws_b_urun.delete_rows(3, ws_b_urun.max_row + 10)
    prod_column_totals = {p: 0 for p in all_products}

    for row_idx, b in enumerate(all_bolums, start=3):
        row_sum = 0
        ws_b_urun.cell(row=row_idx, column=1, value=b)
        for col_idx, p in enumerate(all_products, start=2):
            val = bolum_urun_matrix[b][p] or None
            ws_b_urun.cell(row=row_idx, column=col_idx, value=val)
            if val:
                row_sum += val
                prod_column_totals[p] += val
        ws_b_urun.cell(row=row_idx, column=len(all_products) + 2, value=row_sum)

    tot_b_urun_idx = len(all_bolums) + 4
    ws_b_urun.cell(row=tot_b_urun_idx, column=1, value='Genel Toplam')
    for col_idx, p in enumerate(all_products, start=2):
        ws_b_urun.cell(row=tot_b_urun_idx, column=col_idx, value=prod_column_totals[p])
    ws_b_urun.cell(row=tot_b_urun_idx, column=len(all_products) + 2, value=grand_total_qty)

    # Yetkili Servis Adet İcmal
    ws_dealer_adet = wb_out['Yetkili Servis Adet İcmal']
    ws_dealer_adet.delete_rows(3, ws_dealer_adet.max_row + 10)
    sorted_dealers = sorted(list(dealer_adet_matrix.keys()))
    bolum_adet_col_totals = {b: 0 for b in all_bolums}

    for row_idx, d in enumerate(sorted_dealers, start=3):
        d_sum = 0
        ws_dealer_adet.cell(row=row_idx, column=1, value=d)
        for col_idx, b in enumerate(all_bolums, start=2):
            val = dealer_adet_matrix[d][b] or None
            ws_dealer_adet.cell(row=row_idx, column=col_idx, value=val)
            if val:
                d_sum += val
                bolum_adet_col_totals[b] += val
        ws_dealer_adet.cell(row=row_idx, column=len(all_bolums) + 2, value=d_sum)

    tot_d_adet_idx = len(sorted_dealers) + 4
    ws_dealer_adet.cell(row=tot_d_adet_idx, column=1, value='Genel Toplam')
    for col_idx, b in enumerate(all_bolums, start=2):
        ws_dealer_adet.cell(row=tot_d_adet_idx, column=col_idx, value=bolum_adet_col_totals[b])
    ws_dealer_adet.cell(row=tot_d_adet_idx, column=len(all_bolums) + 2, value=grand_total_qty)

    # Yetkili Servis Koli İcmal
    ws_dealer_koli = wb_out['Yetkili Servis Koli İcmal']
    ws_dealer_koli.delete_rows(3, ws_dealer_koli.max_row + 10)
    bolum_koli_col_totals = {b: 0 for b in all_bolums}
    grand_total_boxes = 0

    for row_idx, d in enumerate(sorted_dealers, start=3):
        k_sum = 0
        ws_dealer_koli.cell(row=row_idx, column=1, value=d)
        for col_idx, b in enumerate(all_bolums, start=2):
            val = dealer_koli_matrix[d][b] or None
            ws_dealer_koli.cell(row=row_idx, column=col_idx, value=val)
            if val:
                k_sum += val
                bolum_koli_col_totals[b] += val
                grand_total_boxes += val
        ws_dealer_koli.cell(row=row_idx, column=len(all_bolums) + 2, value=k_sum)

    tot_d_koli_idx = len(sorted_dealers) + 4
    ws_dealer_koli.cell(row=tot_d_koli_idx, column=1, value='Genel Toplam')
    for col_idx, b in enumerate(all_bolums, start=2):
        ws_dealer_koli.cell(row=tot_d_koli_idx, column=col_idx, value=bolum_koli_col_totals[b])
    ws_dealer_koli.cell(row=tot_d_koli_idx, column=len(all_bolums) + 2, value=grand_total_boxes)

    wb_out.save(output_file)
    print(f"🎉 Biçimleri, Başlık Renkleri (#002060 Lacivert) ve Yazı Tipleri Birebir Korunan Rapor Üretildi: {output_file}")

def copy_cell_style(cell):
    return {
        'font': copy(cell.font) if cell.font else None,
        'fill': copy(cell.fill) if cell.fill else None,
        'border': copy(cell.border) if cell.border else None,
        'alignment': copy(cell.alignment) if cell.alignment else None,
        'number_format': cell.number_format
    }

def apply_cell_style(cell, style):
    if style['font']: cell.font = style['font']
    if style['fill']: cell.fill = style['fill']
    if style['border']: cell.border = style['border']
    if style['alignment']: cell.alignment = style['alignment']
    if style['number_format']: cell.number_format = style['number_format']

if __name__ == '__main__':
    generate_seat_report()
