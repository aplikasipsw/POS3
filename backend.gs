/**
 * ====================================================================
 *               PREMIUM NASI GORENG POS - BACKEND ENGINE
 * ====================================================================
 * File ini dipasang pada Editor Google Apps Script yang terhubung ke
 * sebuah Google Spreadsheet. Menyediakan REST API lengkap (CRUD) 
 * dengan penanganan CORS agar aman diakses dari Vercel/Frontend.
 */

const SHEETS = {
  MENU: 'Menu',
  TRANSACTIONS: 'Transactions',
  TABLES: 'Tables',
  STAFF: 'Staff',
  SETTINGS: 'Settings',
  INVENTORY: 'Inventory'
};

// --- MAIN ENTRY POINTS ---

function doGet(e) {
  if (!e || !e.parameter) {
    return jsonResponse({ status: 'error', message: 'Fungsi doGet tidak bisa dijalankan langsung dari editor. Silakan rilis sebagai Web App dan akses menggunakan URL API.' });
  }
  const action = e.parameter.action;
  let result;

  try {
    // Inisialisasi sheet jika belum ada
    initSheets();

    switch (action) {
      case 'getMenu':
        result = getSheetDataAsJson(SHEETS.MENU);
        break;
      case 'getTransactions':
        result = getSheetDataAsJson(SHEETS.TRANSACTIONS);
        break;
      case 'getTables':
        result = getSheetDataAsJson(SHEETS.TABLES);
        break;
      case 'getStaff':
        result = getSheetDataAsJson(SHEETS.STAFF);
        break;
      case 'getSettings':
        result = getSettingsAsObject();
        break;
      case 'getInventory':
        result = getSheetDataAsJson(SHEETS.INVENTORY);
        break;
      default:
        result = { status: 'success', message: 'API Sistem POS Nasi Goreng Berjalan Normal!' };
    }
    return jsonResponse({ status: 'success', data: result });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

function doPost(e) {
  if (!e || !e.postData) {
    return jsonResponse({ status: 'error', message: 'Fungsi doPost tidak bisa dijalankan langsung dari editor. Silakan rilis sebagai Web App dan akses menggunakan URL API.' });
  }
  try {
    initSheets();
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const payload = data.payload;

    let result;

    switch (action) {
      case 'addTransaction':
        result = handleAddTransaction(payload);
        break;
      case 'saveMenu':
        result = handleSaveRecord(SHEETS.MENU, payload, 'id');
        break;
      case 'deleteMenu':
        result = handleDeleteRecord(SHEETS.MENU, payload.id, 'id');
        break;
      case 'saveTable':
        result = handleSaveRecord(SHEETS.TABLES, payload, 'id');
        break;
      case 'updateTableStatus':
        result = handleUpdateTableStatus(payload);
        break;
      case 'updateTransactionStatus':
        result = handleUpdateTransactionStatus(payload);
        break;
      case 'saveStaff':
        result = handleSaveRecord(SHEETS.STAFF, payload, 'id');
        break;
      case 'deleteStaff':
        result = handleDeleteRecord(SHEETS.STAFF, payload.id, 'id');
        break;
      case 'saveSettings':
        result = handleSaveSettings(payload);
        break;
      case 'saveInventory':
        result = handleSaveRecord(SHEETS.INVENTORY, payload, 'id');
        break;
      default:
        return jsonResponse({ status: 'error', message: 'Action not recognized' });
    }

    return jsonResponse({ status: 'success', data: result });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

// --- CORE HANDLERS ---

function handleAddTransaction(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.TRANSACTIONS);

  let itemsText = '';
  let itemsArray = [];
  if (Array.isArray(payload.items)) {
    itemsArray = payload.items;
    itemsText = payload.items.map(item => {
      let opts = [];
      if (item.spicyLevel !== undefined) opts.push(`Lvl ${item.spicyLevel}`);
      if (item.toppings && item.toppings.length > 0) opts.push(`Top: ${item.toppings.join(',')}`);
      if (item.notes) opts.push(`Note: ${item.notes}`);
      
      return `${item.name} (${item.qty}x)${opts.length > 0 ? ' [' + opts.join(' | ') + ']' : ''}`;
    }).join('\n');
  } else if (typeof payload.items === 'string') {
    itemsText = payload.items;
    try {
      itemsArray = payload.rawItemsJson ? JSON.parse(payload.rawItemsJson) : [];
    } catch(e) {
      itemsArray = [];
    }
  }

  // Insert row baru
  const timestamp = new Date();
  sheet.appendRow([
    timestamp,
    payload.orderId,
    itemsText,
    payload.subtotal,
    payload.tax,
    payload.discount || 0,
    payload.total,
    payload.paymentMethod,
    payload.status || 'Selesai',
    payload.table || 'Take Away',
    payload.notes || '',
    payload.rawItemsJson || JSON.stringify(itemsArray) // data asli JSON untuk keperluan frontend jika diperlukan
  ]);

  // 1. Pengurangan Stok Menu otomatis
  try {
    const menuSheet = ss.getSheetByName(SHEETS.MENU);
    const menuData = menuSheet.getDataRange().getValues();
    itemsArray.forEach(orderedItem => {
      for (let i = 1; i < menuData.length; i++) {
        if (String(menuData[i][0]) === String(orderedItem.id)) {
          const currentStock = Number(menuData[i][5]) || 0;
          const newStock = Math.max(0, currentStock - orderedItem.qty);
          menuSheet.getRange(i + 1, 6).setValue(newStock); // update kolom stock (kolom ke-6)
          
          // Auto nonaktifkan jika habis
          if (newStock === 0) {
            menuSheet.getRange(i + 1, 8).setValue('Habis'); // status kolom ke-8
          }
          break;
        }
      }
    });
  } catch (err) {
    console.error("Gagal mengurangi stok menu: " + err.message);
  }

  // 2. Pengurangan Bahan Baku Otomatis (Inventory)
  // Contoh resep sederhana: Nasi Goreng mengurangi Beras 1 unit, Telur 1 unit, Ayam 0.5 unit
  try {
    const invSheet = ss.getSheetByName(SHEETS.INVENTORY);
    if (invSheet) {
      const invData = invSheet.getDataRange().getValues();
      itemsArray.forEach(orderedItem => {
        let isNasiGoreng = orderedItem.category === 'Nasi Goreng';
        let isMieGoreng = orderedItem.category === 'Mie Goreng';

        if (isNasiGoreng || isMieGoreng) {
          // Kurangi telur & beras/mie
          deductIngredient(invSheet, invData, 'Telur', orderedItem.qty);
          if (isNasiGoreng) deductIngredient(invSheet, invData, 'Beras', orderedItem.qty);
          if (isMieGoreng) deductIngredient(invSheet, invData, 'Mie', orderedItem.qty);
        }
      });
    }
  } catch (err) {
    console.error("Gagal mengurangi bahan baku: " + err.message);
  }

  // 3. Update status meja ke 'empty' jika sebelumnya 'used'
  if (payload.table && payload.table !== 'Take Away') {
    handleUpdateTableStatus({ name: payload.table, status: 'empty', totalBill: 0, duration: '', customerName: '', time: '' });
  }

  return { orderId: payload.orderId, status: 'success' };
}

function deductIngredient(sheet, data, name, qty) {
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toLowerCase() === name.toLowerCase()) {
      const current = Number(data[i][2]) || 0;
      sheet.getRange(i + 1, 3).setValue(Math.max(0, current - qty));
      break;
    }
  }
}

function handleUpdateTableStatus(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.TABLES);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    // cari berdasarkan ID atau Nama Meja
    if (String(data[i][0]) === String(payload.id) || data[i][1] === payload.name) {
      sheet.getRange(i + 1, 3).setValue(payload.status); // Kolom 3: status
      if (payload.pax !== undefined) sheet.getRange(i + 1, 4).setValue(payload.pax); // Kolom 4: pax
      sheet.getRange(i + 1, 5).setValue(payload.duration || ''); // Kolom 5: duration
      sheet.getRange(i + 1, 6).setValue(payload.totalBill || 0); // Kolom 6: totalBill
      sheet.getRange(i + 1, 7).setValue(payload.customerName || ''); // Kolom 7: customerName
      sheet.getRange(i + 1, 8).setValue(payload.time || ''); // Kolom 8: time
      return { id: data[i][0], name: data[i][1], status: payload.status };
    }
  }
  return { status: 'error', message: 'Table not found' };
}

function handleUpdateTransactionStatus(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.TRANSACTIONS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(payload.orderId)) {
      sheet.getRange(i + 1, 9).setValue(payload.status); // Update status in column 9
      return { status: 'success', orderId: payload.orderId, newStatus: payload.status };
    }
  }
  return { status: 'error', message: 'Transaction not found' };
}

function handleSaveRecord(sheetName, payload, keyColumnName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(keyColumnName);

  if (keyIndex === -1) throw new Error(`Key column '${keyColumnName}' not found in sheet ${sheetName}`);

  // Buat array data baru sesuai urutan header
  const rowValues = headers.map(header => {
    return payload[header] !== undefined ? payload[header] : '';
  });

  // Cari apakah record sudah ada untuk di-update, jika tidak, tambah baru
  let foundRowIndex = -1;
  const keyValue = String(payload[keyColumnName]);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyIndex]) === keyValue) {
      foundRowIndex = i + 1;
      break;
    }
  }

  if (foundRowIndex !== -1) {
    // Update
    sheet.getRange(foundRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    return { status: 'updated', id: keyValue };
  } else {
    // Insert
    // Auto generate ID jika kosong
    if (!payload[keyColumnName] || payload[keyColumnName] === '') {
      const generatedId = new Date().getTime();
      rowValues[keyIndex] = generatedId;
      payload[keyColumnName] = generatedId;
    }
    sheet.appendRow(rowValues);
    return { status: 'created', id: payload[keyColumnName] };
  }
}

function handleDeleteRecord(sheetName, id, keyColumnName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(keyColumnName);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { status: 'deleted', id: id };
    }
  }
  return { status: 'error', message: 'Record not found' };
}

function getSettingsAsObject() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const settings = {};
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      settings[data[i][0]] = data[i][1];
    }
  }
  return settings;
}

function handleSaveSettings(payload) {
  if (!payload) {
    console.warn("Payload is undefined. Do not run handleSaveSettings directly from the editor.");
    return { status: 'error', message: 'Payload is undefined' };
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.SETTINGS);
  
  // payload adalah object key-value
  Object.keys(payload).forEach(key => {
    const data = sheet.getDataRange().getValues();
    let foundRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        foundRowIndex = i + 1;
        break;
      }
    }
    if (foundRowIndex !== -1) {
      sheet.getRange(foundRowIndex, 2).setValue(payload[key]);
    } else {
      sheet.appendRow([key, payload[key]]);
    }
  });

  return { status: 'success' };
}

// --- HELPERS & INITIALIZATION ---

function getSheetDataAsJson(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const items = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const item = {};
    for (let j = 0; j < headers.length; j++) {
      let val = row[j];
      // Format tanggal ke string ISO
      if (val instanceof Date) {
        val = val.toISOString();
      }
      item[headers[j]] = val;
    }
    items.push(item);
  }
  return items;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const defaultHeaders = {
    [SHEETS.MENU]: ['id', 'name', 'category', 'price', 'image', 'stock', 'description', 'status'],
    [SHEETS.TRANSACTIONS]: ['timestamp', 'orderId', 'items', 'subtotal', 'tax', 'discount', 'total', 'paymentMethod', 'status', 'table', 'notes', 'rawItemsJson'],
    [SHEETS.TABLES]: ['id', 'name', 'status', 'pax', 'duration', 'totalBill', 'customerName', 'time'],
    [SHEETS.STAFF]: ['id', 'name', 'email', 'role', 'password', 'status'],
    [SHEETS.SETTINGS]: ['key', 'value'],
    [SHEETS.INVENTORY]: ['id', 'name', 'stock', 'minStock', 'unit']
  };

  Object.keys(defaultHeaders).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(defaultHeaders[name]);
      sheet.getRange(1, 1, 1, defaultHeaders[name].length)
        .setFontWeight('bold')
        .setBackground('#111827')
        .setFontColor('#D4AF37');
      sheet.setFrozenRows(1);
      
      // Isi data awal (seed data) jika masih baru dibuat
      seedData(name, sheet);
    }
  });
}

function seedData(name, sheet) {
  if (name === SHEETS.MENU) {
    const defaultMenu = [
      [1, 'Nasi Goreng Spesial', 'Nasi Goreng', 25000, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&q=80', 50, 'Nasi goreng dengan telur mata sapi, ayam suwir, dan kerupuk.', 'Aktif'],
      [2, 'Nasi Goreng Seafood', 'Nasi Goreng', 35000, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80', 30, 'Nasi goreng seafood dengan udang segar, cumi-cumi, dan bakso ikan.', 'Aktif'],
      [3, 'Nasi Goreng Gila', 'Nasi Goreng', 30000, 'https://images.unsplash.com/photo-1629853966597-4001bfaad01c?auto=format&fit=crop&w=400&q=80', 25, 'Nasi goreng super pedas dengan topping sosis, bakso, dan potongan ayam melimpah.', 'Aktif'],
      [4, 'Mie Goreng Jawa', 'Mie Goreng', 22000, 'https://images.unsplash.com/photo-1612929633738-8fe01f7c8136?auto=format&fit=crop&w=400&q=80', 40, 'Mie goreng tradisional khas Jawa dengan sayuran segar dan telur.', 'Aktif'],
      [5, 'Es Teh Manis', 'Minuman', 5000, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80', 100, 'Es teh manis segar pelepas dahaga.', 'Aktif'],
      [6, 'Es Jeruk Peras', 'Minuman', 8000, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', 80, 'Jeruk peras asli dengan es batu kristal.', 'Aktif'],
      [7, 'Kerupuk Udang Kaleng', 'Snack', 5000, 'https://images.unsplash.com/photo-1599598425947-3300262b77fc?auto=format&fit=crop&w=400&q=80', 200, 'Kerupuk udang renyah porsi kaleng.', 'Aktif'],
      [8, 'Paket Hemat Kenyang', 'Paket Hemat', 32000, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80', 20, 'Nasi Goreng Spesial + Es Teh Manis + Kerupuk.', 'Aktif']
    ];
    defaultMenu.forEach(row => sheet.appendRow(row));
  } else if (name === SHEETS.TABLES) {
    for (let i = 1; i <= 12; i++) {
      // id, name, status, pax, duration, totalBill, customerName, time
      let status = 'empty';
      let pax = i % 2 === 0 ? 4 : 2;
      let totalBill = 0;
      let duration = '';
      let customerName = '';
      let time = '';
      
      if (i === 3) {
        status = 'used';
        totalBill = 125000;
        duration = '45 Menit';
        customerName = 'Meja 3 Active';
      } else if (i === 9) {
        status = 'reserved';
        customerName = 'Bpk. Budi';
        time = '19:00';
      }

      sheet.appendRow([i, `Meja ${i}`, status, pax, duration, totalBill, customerName, time]);
    }
  } else if (name === SHEETS.STAFF) {
    sheet.appendRow(['STF-001', 'Admin Utama', 'admin@nasigoreng.com', 'Admin', '123456', 'Aktif']);
    sheet.appendRow(['STF-002', 'Budi Kasir', 'kasir@nasigoreng.com', 'Kasir', '123456', 'Aktif']);
    sheet.appendRow(['STF-003', 'Koki Rahmat', 'koki@nasigoreng.com', 'Kitchen', '123456', 'Aktif']);
    sheet.appendRow(['STF-004', 'Pak Bambang', 'owner@nasigoreng.com', 'Owner', '123456', 'Aktif']);
  } else if (name === SHEETS.SETTINGS) {
    sheet.appendRow(['restaurant_name', 'Nasi Goreng Premium']);
    sheet.appendRow(['address', 'Jl. Sultan Agung No. 45, Jakarta Selatan']);
    sheet.appendRow(['phone', '0812-3456-7890']);
    sheet.appendRow(['tax_rate', '11']); // 11% PPN
    sheet.appendRow(['service_rate', '5']); // 5% Service Charge
    sheet.appendRow(['qris_url', 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021126570014ID.CO.QRIS.WWW0215ID10200857398570303UME51445204581253033605802ID5920Nasi%20Goreng%20Premium6007Jakarta61051216062070703A016304CA1F']);
    sheet.appendRow(['logo_url', '']);
    sheet.appendRow(['theme', 'dark']);
    sheet.appendRow(['language', 'id']);
  } else if (name === SHEETS.INVENTORY) {
    sheet.appendRow(['INV-001', 'Beras', 150, 15, 'kg']);
    sheet.appendRow(['INV-002', 'Telur', 300, 30, 'butir']);
    sheet.appendRow(['INV-003', 'Ayam', 45, 5, 'kg']);
    sheet.appendRow(['INV-004', 'Cabai Rawit', 20, 2, 'kg']);
    sheet.appendRow(['INV-005', 'Minyak Goreng', 80, 10, 'liter']);
    sheet.appendRow(['INV-006', 'Mie Basah', 50, 5, 'kg']);
  }
}
