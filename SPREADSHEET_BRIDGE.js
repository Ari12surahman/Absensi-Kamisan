// =========================================================================
// SALAPP ASATIDZ - GOOGLE APPS SCRIPT API BRIDGE
// =========================================================================
// Panduan Pasang:
// 1. Buka spreadsheet Google Anda:
//    https://docs.google.com/spreadsheets/d/1YC8IBmPgw7bFtJ7GVCZSaunQuD62hUg677S8pcOZHMs/edit
// 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
// 3. Hapus seluruh isi file Kode.gs lama, lalu tempel (Paste) SELURUH KODE DI BAWAH INI.
// 4. Klik ikon Save (Disket).
// 5. Klik tombol biru "Terapkan" (Deploy) di kanan atas -> pilih "Kelola penerapan" (Manage deployments).
// 6. Klik ikon Pensil (Edit) di samping deployment yang ada:
//    - Versi: Pilih "Versi Baru" (New Version).
//    - Klik "Terapkan" (Deploy).
// Selesai! Web Next.js di Vercel akan langsung terhubung 100% ke Spreadsheet Anda secara real-time!
// =========================================================================

const SHEET_ID = '1YC8IBmPgw7bFtJ7GVCZSaunQuD62hUg677S8pcOZHMs';
const ADMIN_PASSWORD = 'admin123';

function doGet(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  var action = p.action;
  if (action) {
    var result = null;
    if (action === 'getAcara') result = getAcara();
    else if (action === 'getAbsensi') result = getAbsensi();
    else if (action === 'getDivisi') result = getDivisi();
    else if (action === 'getAsatidz') result = getAsatidz();
    else if (action === 'getLaporanDivisi') result = getLaporanDivisi();
    else if (action === 'toggleStatusAcara') {
      var hide = p.hideStatus === 'true' || p.hideStatus === true || p.hideStatus === '1';
      result = toggleStatusAcara(p.rowIndex, hide, p.id, p.nama);
    }
    else if (action === 'addAcara') {
      result = addAcara({
        namaAcara: p.namaAcara,
        tanggalAcara: p.tanggalAcara,
        mapLink: p.mapLink,
        lat: p.lat,
        lng: p.lng,
        radius: p.radius
      });
    }
    else if (action === 'deleteAcara') {
      result = deleteAcara(p.rowIndex, p.id, p.nama);
    }
    else if (action === 'submitKehadiran') {
      result = submitKehadiran({
        acara: p.acara,
        nama: p.nama,
        status: p.status,
        keterangan: p.keterangan
      });
    }

    if (result !== null) {
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "OK",
    name: "SalApp Asatidz API",
    message: "Google Apps Script Bridge is Online!"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = (e && e.postData) ? e.postData.contents : "{}";
    var data = JSON.parse(contents);
    var action = data.action;
    var result = { success: false, message: "Action tidak dikenal: " + action };

    if (action === 'submitKehadiran') {
      result = submitKehadiran(data.payload || data);
    } else if (action === 'updateAbsensi') {
      result = updateAbsensi(Number(data.rowIndex), data.payload || data);
    } else if (action === 'deleteAbsensi') {
      result = deleteAbsensi(Number(data.rowIndex));
    } else if (action === 'addAcara') {
      result = addAcara(data.payload || data);
    } else if (action === 'updateAcara') {
      result = updateAcara(Number(data.rowIndex), data.payload || data);
    } else if (action === 'deleteAcara') {
      result = deleteAcara(Number(data.rowIndex), data.id, data.nama);
    } else if (action === 'toggleStatusAcara') {
      result = toggleStatusAcara(data.rowIndex, data.hideStatus, data.id, data.namaAcara || data.nama);
    } else if (action === 'addDivisi') {
      result = addDivisi(data.payload || data);
    } else if (action === 'updateDivisi') {
      result = updateDivisi(Number(data.rowIndex), data.payload || data);
    } else if (action === 'deleteDivisi') {
      result = deleteDivisi(Number(data.rowIndex));
    } else if (action === 'addAsatidz') {
      result = addAsatidz(data.payload || data);
    } else if (action === 'updateAsatidz') {
      result = updateAsatidz(Number(data.rowIndex), data.payload || data);
    } else if (action === 'deleteAsatidz') {
      result = deleteAsatidz(Number(data.rowIndex), data.id, data.nama);
    } else if (action === 'submitLaporanDivisi') {
      result = submitLaporanDivisi(data.payload || data);
    } else if (action === 'updateLaporanDivisi') {
      result = updateLaporanDivisi(Number(data.rowIndex), data.payload || data);
    } else if (action === 'deleteLaporanDivisi') {
      result = deleteLaporanDivisi(Number(data.rowIndex));
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// FUNGSI INIT & SETUP SPREADSHEET
// ==========================================
function getDbSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === 'Data_Absensi') {
      sheet.appendRow(["ID", "Waktu", "Nama Acara", "Nama Lengkap", "Status", "Keterangan"]);
      sheet.setFrozenRows(1);
    } else if (sheetName === 'Data_Acara') {
      sheet.appendRow(["ID", "Nama Acara", "Tanggal Acara", "Hidden", "Link Maps", "Lat", "Lng", "Radius"]);
      sheet.setFrozenRows(1);
    } else if (sheetName === 'Data_Divisi') {
      sheet.appendRow(["ID", "Nama Divisi", "Keterangan", "Status"]);
      sheet.setFrozenRows(1);
      const baseId = new Date().getTime();
      sheet.appendRow([baseId.toString(), "Divisi Acara", "Mengelola teknis dan konsep kegiatan", "Aktif"]);
      sheet.appendRow([(baseId + 1).toString(), "Divisi Humas & Publikasi", "Mengelola komunikasi eksternal & publikasi", "Aktif"]);
      sheet.appendRow([(baseId + 2).toString(), "Divisi Keuangan & Usaha", "Mengelola keuangan, kas, dan usaha mandiri", "Aktif"]);
      sheet.appendRow([(baseId + 3).toString(), "Divisi Logistik & Perlengkapan", "Mengelola inventaris dan peralatan", "Aktif"]);
      sheet.appendRow([(baseId + 4).toString(), "Divisi Media & Dokumentasi", "Mengelola konten, medsos, dan arsip", "Aktif"]);
    } else if (sheetName === 'Data_Asatidz') {
      sheet.appendRow(["ID", "Nama Asatidz", "Jabatan", "Status"]);
      sheet.setFrozenRows(1);
    } else if (sheetName === 'Data_Laporan_Divisi') {
      sheet.appendRow(["ID", "Waktu", "Divisi", "Nama Pelapor", "Periode", "Hasil Usaha", "Program Kerja Pekan Depan", "Evaluasi", "Laporan Dana"]);
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

// ==========================================
// CRUD ACARA
// ==========================================
function getAcara() {
  const sheet = getDbSheet('Data_Acara');
  const displayData = sheet.getDataRange().getDisplayValues();
  const rawData = sheet.getDataRange().getValues();
  if (displayData.length <= 1) return [];
  
  return displayData.slice(1).map((row, index) => ({
    rowIndex: index + 2,
    id: row[0],
    namaAcara: row[1],
    tanggalAcara: row[2],
    isHidden: row[3] === 'TRUE' || row[3] === 'true',
    mapLink: row[4] || '',
    lat: rawData[index + 1][5] || '',
    lng: rawData[index + 1][6] || '',
    radius: rawData[index + 1][7] || 150
  })).filter(a => a.namaAcara && a.namaAcara.toString().trim() !== '').reverse();
}

function addAcara(data) {
  const sheet = getDbSheet('Data_Acara');
  const id = (data && data.id) ? String(data.id) : new Date().getTime().toString();
  const coords = extractCoordinates(data.mapLink);
  const latVal = (data.lat !== undefined && data.lat !== '') ? data.lat : coords.lat;
  const lngVal = (data.lng !== undefined && data.lng !== '') ? data.lng : coords.lng;
  
  sheet.getRange("F:G").setNumberFormat('@');
  sheet.appendRow([id, data.namaAcara, data.tanggalAcara, 'FALSE', data.mapLink || '', latVal, lngVal, Number(data.radius) || 150]);
  return { success: true, message: "Acara berhasil ditambahkan!", id: id };
}

function findAcaraRow(sheet, rowIndex, id, nama) {
  var targetRow = Number(rowIndex);
  var lastRow = sheet.getLastRow();
  var values = sheet.getDataRange().getValues();
  
  // Jika targetRow valid dan ID-nya sesuai
  if (targetRow >= 2 && targetRow <= lastRow) {
    if (!id && !nama) return targetRow;
    var rowData = values[targetRow - 1];
    if (id && String(rowData[0]) === String(id)) return targetRow;
    if (nama && String(rowData[1]).trim().toLowerCase() === String(nama).trim().toLowerCase()) return targetRow;
  }
  
  // Cari di seluruh baris berdasarkan ID atau Nama Acara
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (id && String(r[0]) === String(id)) return i + 1;
    if (nama && String(r[1]).trim().toLowerCase() === String(nama).trim().toLowerCase()) return i + 1;
  }
  
  return targetRow >= 2 && targetRow <= lastRow ? targetRow : -1;
}

function updateAcara(rowIndex, data) {
  const sheet = getDbSheet('Data_Acara');
  const targetRow = findAcaraRow(sheet, rowIndex, data.id, data.namaAcara);
  if (targetRow === -1) return { success: false, message: "Acara tidak ditemukan di sheet" };
  
  const coords = extractCoordinates(data.mapLink);
  sheet.getRange("F:G").setNumberFormat('@');
  sheet.getRange(targetRow, 2).setValue(data.namaAcara);
  sheet.getRange(targetRow, 3).setValue(data.tanggalAcara);
  sheet.getRange(targetRow, 5).setValue(data.mapLink || '');
  
  const latVal = (data.lat !== undefined && data.lat !== '') ? data.lat : coords.lat;
  const lngVal = (data.lng !== undefined && data.lng !== '') ? data.lng : coords.lng;
  if (latVal) sheet.getRange(targetRow, 6).setValue(latVal);
  if (lngVal) sheet.getRange(targetRow, 7).setValue(lngVal);
  sheet.getRange(targetRow, 8).setValue(Number(data.radius) || 150);
  return { success: true, message: "Acara berhasil diupdate!" };
}

function deleteAcara(rowIndex, id, nama) {
  const sheet = getDbSheet('Data_Acara');
  const targetRow = findAcaraRow(sheet, rowIndex, id, nama);
  if (targetRow === -1) return { success: false, message: "Acara tidak ditemukan" };
  sheet.deleteRow(targetRow);
  return { success: true, message: "Acara berhasil dihapus!" };
}

function toggleStatusAcara(rowIndex, hideStatus, id, nama) {
  try {
    const sheet = getDbSheet('Data_Acara');
    const targetRow = findAcaraRow(sheet, rowIndex, id, nama);
    if (targetRow === -1) return { success: false, message: "Baris acara tidak ditemukan" };
    sheet.getRange(targetRow, 4).setValue(hideStatus ? 'TRUE' : 'FALSE');
    return { success: true, message: hideStatus ? "Acara berhasil disembunyikan!" : "Acara kembali ditampilkan!" };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

function extractCoordinates(url) {
  if (!url) return { lat: "", lng: "" };
  try {
    let finalUrl = url;
    const response = UrlFetchApp.fetch(url, { followRedirects: false, muteHttpExceptions: true });
    if (response.getResponseCode() >= 300 && response.getResponseCode() < 400) {
      finalUrl = response.getHeaders()['Location'] || url;
    } else if (response.getResponseCode() === 200) {
      const content = response.getContentText();
      const metaMatch = content.match(/URL='([^']+)'/i) || content.match(/URL="([^"]+)"/i);
      if (metaMatch) finalUrl = metaMatch[1];
    }
    let match = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    match = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    match = finalUrl.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    match = finalUrl.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    return { lat: '', lng: '' };
  } catch (e) {
    return { lat: '', lng: '' };
  }
}

// ==========================================
// CRUD ABSENSI
// ==========================================
function getAbsensi() {
  const sheet = getDbSheet('Data_Absensi');
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) return [];
  
  return data.slice(1).map((row, index) => ({
    rowIndex: index + 2,
    id: row[0],
    waktu: row[1],
    acara: row[2],
    nama: row[3],
    status: row[4],
    keterangan: row[5] || '-'
  })).filter(a => a.nama && a.nama.toString().trim() !== '').reverse();
}

function submitKehadiran(data) {
  try {
    const sheet = getDbSheet('Data_Absensi');
    const timestamp = new Date();
    const formattedDate = Utilities.formatDate(timestamp, "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss");
    const id = timestamp.getTime().toString();
    const rowData = [id, formattedDate, data.acara, data.nama, data.status, data.keterangan || "-"];
    sheet.appendRow(rowData);
    return { success: true, message: "Absensi berhasil dikirim!" };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

function updateAbsensi(rowIndex, data) {
  const sheet = getDbSheet('Data_Absensi');
  sheet.getRange(rowIndex, 4).setValue(data.nama);
  sheet.getRange(rowIndex, 5).setValue(data.status);
  sheet.getRange(rowIndex, 6).setValue(data.keterangan || "-");
  return { success: true, message: "Data absensi diupdate!" };
}

function deleteAbsensi(rowIndex) {
  const sheet = getDbSheet('Data_Absensi');
  sheet.deleteRow(rowIndex);
  return { success: true, message: "Data absensi dihapus!" };
}

// ==========================================
// CRUD DIVISI
// ==========================================
function getDivisi() {
  const sheet = getDbSheet('Data_Divisi');
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) {
    const baseId = new Date().getTime();
    const defaultDivisi = [
      [baseId.toString(), "Divisi Acara", "Mengelola teknis dan konsep kegiatan", "Aktif"],
      [(baseId + 1).toString(), "Divisi Humas & Publikasi", "Mengelola komunikasi eksternal & publikasi", "Aktif"],
      [(baseId + 2).toString(), "Divisi Keuangan & Usaha", "Mengelola keuangan, kas, dan usaha mandiri", "Aktif"],
      [(baseId + 3).toString(), "Divisi Logistik & Perlengkapan", "Mengelola inventaris dan peralatan", "Aktif"],
      [(baseId + 4).toString(), "Divisi Media & Dokumentasi", "Mengelola konten, medsos, dan arsip", "Aktif"]
    ];
    defaultDivisi.forEach(row => sheet.appendRow(row));
    return defaultDivisi.map((row, index) => ({
      rowIndex: index + 2,
      id: row[0],
      namaDivisi: row[1],
      keterangan: row[2],
      status: row[3]
    }));
  }
  
  return data.slice(1).map((row, index) => ({
    rowIndex: index + 2,
    id: row[0],
    namaDivisi: row[1],
    keterangan: row[2] || "-",
    status: row[3] || "Aktif"
  })).filter(d => d.namaDivisi && d.namaDivisi.toString().trim() !== '');
}

function addDivisi(data) {
  try {
    const sheet = getDbSheet('Data_Divisi');
    const id = new Date().getTime().toString();
    sheet.appendRow([id, data.namaDivisi, data.keterangan || "-", data.status || "Aktif"]);
    return { success: true, message: "Divisi berhasil ditambahkan!" };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

function updateDivisi(rowIndex, data) {
  try {
    const sheet = getDbSheet('Data_Divisi');
    sheet.getRange(rowIndex, 2).setValue(data.namaDivisi);
    sheet.getRange(rowIndex, 3).setValue(data.keterangan || "-");
    sheet.getRange(rowIndex, 4).setValue(data.status || "Aktif");
    return { success: true, message: "Data divisi berhasil diupdate!" };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

function deleteDivisi(rowIndex) {
  try {
    const sheet = getDbSheet('Data_Divisi');
    sheet.deleteRow(rowIndex);
    return { success: true, message: "Divisi berhasil dihapus!" };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

// ==========================================
// CRUD LAPORAN DIVISI
// ==========================================
function getLaporanDivisi() {
  const sheet = getDbSheet('Data_Laporan_Divisi');
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) return [];
  
  return data.slice(1).map((row, index) => ({
    rowIndex: index + 2,
    id: row[0],
    waktu: row[1],
    divisi: row[2],
    namaPelapor: row[3],
    periode: row[4],
    hasilUsaha: row[5] || "-",
    programKerja: row[6] || "-",
    evaluasi: row[7] || "-",
    laporanDana: row[8] || "-"
  })).filter(r => r.divisi && r.divisi.toString().trim() !== '').reverse();
}

function submitLaporanDivisi(data) {
  try {
    const sheet = getDbSheet('Data_Laporan_Divisi');
    const timestamp = new Date();
    const formattedDate = Utilities.formatDate(timestamp, "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss");
    const id = timestamp.getTime().toString();
    
    sheet.appendRow([
      id,
      formattedDate,
      data.divisi,
      data.namaPelapor,
      data.periode || Utilities.formatDate(timestamp, "Asia/Jakarta", "dd/MM/yyyy"),
      data.hasilUsaha || "-",
      data.programKerja || "-",
      data.evaluasi || "-",
      data.laporanDana || "-"
    ]);
    return { success: true, message: "Laporan divisi berhasil dikirim!" };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

function updateLaporanDivisi(rowIndex, data) {
  try {
    const sheet = getDbSheet('Data_Laporan_Divisi');
    sheet.getRange(rowIndex, 3).setValue(data.divisi);
    sheet.getRange(rowIndex, 4).setValue(data.namaPelapor);
    sheet.getRange(rowIndex, 5).setValue(data.periode);
    sheet.getRange(rowIndex, 6).setValue(data.hasilUsaha || "-");
    sheet.getRange(rowIndex, 7).setValue(data.programKerja || "-");
    sheet.getRange(rowIndex, 8).setValue(data.evaluasi || "-");
    sheet.getRange(rowIndex, 9).setValue(data.laporanDana || "-");
    return { success: true, message: "Laporan divisi berhasil diupdate!" };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

function deleteLaporanDivisi(rowIndex) {
  try {
    const sheet = getDbSheet('Data_Laporan_Divisi');
    sheet.deleteRow(rowIndex);
    return { success: true, message: "Laporan divisi berhasil dihapus!" };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

// ==========================================
// CRUD ASATIDZ (MASTER NAMA)
// ==========================================
function getAsatidz() {
  const sheet = getDbSheet('Data_Asatidz');
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const list = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row[1]) {
      list.push({
        rowIndex: i + 1,
        id: String(row[0] || i),
        nama: String(row[1]).trim(),
        jabatan: String(row[2] || 'Asatidz Pengajar'),
        status: String(row[3] || 'Aktif')
      });
    }
  }
  return list;
}

function addAsatidz(data) {
  const sheet = getDbSheet('Data_Asatidz');
  const id = (data && data.id) ? String(data.id) : new Date().getTime().toString();
  sheet.appendRow([id, (data.nama || '').trim(), data.jabatan || 'Asatidz Pengajar', data.status || 'Aktif']);
  return { success: true, message: "Data asatidz berhasil ditambahkan!", id: id };
}

function updateAsatidz(rowIndex, data) {
  try {
    const sheet = getDbSheet('Data_Asatidz');
    if (data.nama) sheet.getRange(rowIndex, 2).setValue(data.nama.trim());
    if (data.jabatan) sheet.getRange(rowIndex, 3).setValue(data.jabatan);
    if (data.status) sheet.getRange(rowIndex, 4).setValue(data.status);
    return { success: true, message: "Data asatidz berhasil diperbarui!" };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}

function deleteAsatidz(rowIndex, id, nama) {
  try {
    const sheet = getDbSheet('Data_Asatidz');
    sheet.deleteRow(rowIndex);
    return { success: true, message: "Data asatidz berhasil dihapus!" };
  } catch (error) {
    return { success: false, message: "Error: " + error.toString() };
  }
}


