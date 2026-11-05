import { google } from 'googleapis';
import * as XLSX from 'xlsx';
import { mockDb } from './mock-db';
import { AbsensiRecord, AcaraItem, DivisiItem, LaporanItem } from '@/types';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1YC8IBmPgw7bFtJ7GVCZSaunQuD62hUg677S8pcOZHMs';
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GAS_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  process.env.GAS_API_URL ||
  'https://script.google.com/macros/s/AKfycbzkyvUrvSsi5qbffdAzkdfi0BfW3XBTFD1glky1bOrUOgzDSq58AEuiVtAPo-y3E4ye/exec';

// Check if live Google Sheets API is configured
export const isGoogleSheetsConfigured = Boolean(CLIENT_EMAIL && PRIVATE_KEY);

function getGoogleSheetsClient() {
  if (!isGoogleSheetsConfigured) return null;

  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Universal Bridge to call Google Apps Script Web App
 */
async function callGasApi<T>(action: string, payload?: any, method: 'GET' | 'POST' = 'GET'): Promise<T | null> {
  if (!GAS_URL) return null;

  try {
    let url = GAS_URL;
    const options: RequestInit = {
      redirect: 'follow',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    };

    if (method === 'GET') {
      url += (url.includes('?') ? '&' : '?') + `action=${encodeURIComponent(action)}`;
      if (payload) {
        for (const k of Object.keys(payload)) {
          url += `&${encodeURIComponent(k)}=${encodeURIComponent(payload[k])}`;
        }
      }
    } else {
      options.method = 'POST';
      options.body = JSON.stringify({ action, ...payload });
    }

    const res = await fetch(url, options);
    const text = await res.text();

    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      return JSON.parse(text) as T;
    }
    return null;
  } catch (err) {
    console.warn(`GAS Bridge error for ${action}:`, err);
    return null;
  }
}

/**
 * Direct Public Google Sheets CSV reader (active if spreadsheet has 'Anyone with the link can view')
 */
async function fetchCsvSheet(sheetName: string): Promise<any[][] | null> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url, { cache: 'no-store' });
    const text = await res.text();
    if (text.trim().startsWith('<!DOCTYPE') || text.includes('<html')) {
      return null;
    }
    const wb = XLSX.read(text, { type: 'string', raw: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
    return rows;
  } catch (e) {
    console.warn(`Error fetching CSV for ${sheetName}:`, e);
    return null;
  }
}

// ==========================================
// DIVISI
// ==========================================
const deletedDivisiKeys = new Set<string>();
const editedDivisiMap = new Map<string, Partial<DivisiItem>>();
const addedDivisiList: DivisiItem[] = [];

export async function fetchDivisi(): Promise<DivisiItem[]> {
  const isDeleted = (d: DivisiItem) =>
    deletedDivisiKeys.has(String(d.id)) ||
    deletedDivisiKeys.has(String(d.rowIndex));

  const applyEdit = (d: DivisiItem): DivisiItem => {
    const edit =
      editedDivisiMap.get(String(d.id)) ||
      editedDivisiMap.get(String(d.rowIndex)) ||
      editedDivisiMap.get((d.namaDivisi || '').trim().toLowerCase());
    return edit ? { ...d, ...edit } : d;
  };

  const mergeResults = (baseList: DivisiItem[]) => {
    const filtered = baseList.filter(d => !isDeleted(d)).map(applyEdit);
    const added = addedDivisiList.filter(d => !isDeleted(d)).map(applyEdit);
    const combined = [...added, ...filtered];

    const seen = new Set<string>();
    const result: DivisiItem[] = [];
    for (const item of combined) {
      const keyId = String(item.id || item.rowIndex);
      const keyName = (item.namaDivisi || '').trim().toLowerCase();
      if (!seen.has(keyId) && (!keyName || !seen.has('name_' + keyName))) {
        seen.add(keyId);
        if (keyName) seen.add('name_' + keyName);
        result.push(item);
      }
    }
    return result;
  };

  // 1. Try Google Apps Script API Bridge
  const gasData = await callGasApi<DivisiItem[]>('getDivisi');
  if (gasData && Array.isArray(gasData) && gasData.length > 0) {
    return mergeResults(gasData);
  }

  // 2. Try Public Google Sheets CSV export
  const csvRows = await fetchCsvSheet('Data_Divisi');
  if (csvRows && csvRows.length > 1) {
    const list = csvRows.slice(1).map((row, index) => ({
      rowIndex: index + 2,
      id: String(row[0] || index + 1),
      namaDivisi: String(row[1] || '').trim(),
      keterangan: String(row[2] || '-'),
      status: String(row[3] || 'Aktif'),
    })).filter(d => d.namaDivisi !== '');
    if (list.length > 0) return mergeResults(list);
  }

  // 3. Try Google Sheets API v4 (Service Account)
  const sheets = getGoogleSheetsClient();
  if (sheets) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Data_Divisi!A2:D',
      });
      const rows = res.data.values;
      if (rows && rows.length > 0) {
        const list = rows
          .map((row, index) => ({
            rowIndex: index + 2,
            id: row[0] || String(index + 1),
            namaDivisi: row[1] || '',
            keterangan: row[2] || '-',
            status: row[3] || 'Aktif',
          }))
          .filter(d => d.namaDivisi.trim() !== '');
        return mergeResults(list);
      }
    } catch (e) {
      console.warn('Sheets API Divisi error:', e);
    }
  }

  // 4. Fallback to mockDb
  return mergeResults(mockDb.getDivisi());
}

export async function insertDivisi(data: Partial<DivisiItem>) {
  const newId = String(data.id || Date.now());
  const newRow = Number(data.rowIndex) || Date.now();
  deletedDivisiKeys.delete(String(newId));
  deletedDivisiKeys.delete(String(newRow));
  const newItem: DivisiItem = {
    rowIndex: newRow,
    id: newId,
    namaDivisi: data.namaDivisi || '',
    keterangan: data.keterangan || '-',
    status: data.status || 'Aktif',
  };

  const existingIdx = addedDivisiList.findIndex(
    d => String(d.id) === newId || (d.namaDivisi && d.namaDivisi.trim().toLowerCase() === (data.namaDivisi || '').trim().toLowerCase())
  );
  if (existingIdx !== -1) {
    addedDivisiList[existingIdx] = newItem;
  } else {
    addedDivisiList.unshift(newItem);
  }
  mockDb.addDivisi({ ...data, id: newId, rowIndex: newRow });

  const gasRes = await callGasApi<any>('addDivisi', { payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;

  const sheets = getGoogleSheetsClient();
  if (sheets) {
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Data_Divisi!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[newId, data.namaDivisi, data.keterangan || '-', data.status || 'Aktif']],
        },
      });
      return { success: true, message: 'Divisi berhasil disimpan ke Google Sheets!', data: newItem };
    } catch (e) {
      console.warn('Sheets API append Divisi error:', e);
    }
  }

  return { success: true, message: 'Divisi berhasil disimpan!', data: newItem };
}

export async function updateDivisi(rowIndex: number | string, data: Partial<DivisiItem>) {
  if (rowIndex) editedDivisiMap.set(String(rowIndex), { ...editedDivisiMap.get(String(rowIndex)), ...data });
  if (data.id) editedDivisiMap.set(String(data.id), { ...editedDivisiMap.get(String(data.id)), ...data });
  if (data.namaDivisi) editedDivisiMap.set(data.namaDivisi.trim().toLowerCase(), { ...editedDivisiMap.get(data.namaDivisi.trim().toLowerCase()), ...data });

  const idx = addedDivisiList.findIndex(d => String(d.id) === String(rowIndex) || String(d.rowIndex) === String(rowIndex));
  if (idx !== -1) {
    addedDivisiList[idx] = { ...addedDivisiList[idx], ...data };
  }
  mockDb.updateDivisi(rowIndex, data);

  const gasRes = await callGasApi<any>('updateDivisi', { rowIndex, payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return { success: true, message: 'Divisi berhasil diperbarui!' };
}

export async function deleteDivisi(rowIndex: number | string, id?: string, nama?: string) {
  if (rowIndex) deletedDivisiKeys.add(String(rowIndex));
  if (id) deletedDivisiKeys.add(String(id));

  const idx = addedDivisiList.findIndex(d =>
    String(d.id) === String(rowIndex) ||
    String(d.rowIndex) === String(rowIndex) ||
    (id && String(d.id) === String(id)) ||
    (nama && d.namaDivisi.toLowerCase() === nama.toLowerCase())
  );
  if (idx !== -1) {
    addedDivisiList.splice(idx, 1);
  }
  mockDb.deleteDivisi(rowIndex, nama);

  const gasRes = await callGasApi<any>('deleteDivisi', { rowIndex, id, nama }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return { success: true, message: 'Divisi berhasil dihapus!' };
}

// ==========================================
// ACARA
// ==========================================
const deletedAcaraKeys = new Set<string>();
const editedAcaraMap = new Map<string, Partial<AcaraItem>>();
const addedAcaraList: AcaraItem[] = [];

export async function fetchAcara(): Promise<AcaraItem[]> {
  const isDeleted = (a: AcaraItem) =>
    deletedAcaraKeys.has(String(a.id)) ||
    deletedAcaraKeys.has(String(a.rowIndex));

  const applyEdit = (a: AcaraItem): AcaraItem => {
    const edit =
      editedAcaraMap.get(String(a.id)) ||
      editedAcaraMap.get(String(a.rowIndex)) ||
      editedAcaraMap.get((a.namaAcara || '').trim().toLowerCase());
    return edit ? { ...a, ...edit } : a;
  };

  const mergeResults = (baseList: AcaraItem[]) => {
    const filtered = baseList.filter(a => !isDeleted(a)).map(applyEdit);
    const added = addedAcaraList.filter(a => !isDeleted(a)).map(applyEdit);
    const combined = [...added, ...filtered];

    const seen = new Set<string>();
    const result: AcaraItem[] = [];
    for (const item of combined) {
      const keyId = String(item.id || item.rowIndex);
      const keyName = (item.namaAcara || '').trim().toLowerCase();
      if (!seen.has(keyId) && (!keyName || !seen.has('name_' + keyName))) {
        seen.add(keyId);
        if (keyName) seen.add('name_' + keyName);
        result.push(item);
      }
    }
    return result;
  };

  // 1. Try Google Apps Script API Bridge
  const gasData = await callGasApi<AcaraItem[]>('getAcara');
  if (gasData && Array.isArray(gasData) && gasData.length > 0) {
    const formatted = gasData.map(a => ({
      ...a,
      lat: a.lat ? String(a.lat).replace(/['"]/g, '').replace(',', '.').trim() : '',
      lng: a.lng ? String(a.lng).replace(/['"]/g, '').replace(',', '.').trim() : '',
    }));
    return mergeResults(formatted);
  }

  // 2. Try Public Google Sheets CSV export
  const csvRows = await fetchCsvSheet('Data_Acara');
  if (csvRows && csvRows.length > 1) {
    const list = csvRows.slice(1).map((row, index) => ({
      rowIndex: index + 2,
      id: String(row[0] || index + 1),
      namaAcara: String(row[1] || '').trim(),
      tanggalAcara: String(row[2] || ''),
      isHidden: String(row[3]).toLowerCase() === 'true',
      mapLink: String(row[4] || ''),
      lat: row[5] ? String(row[5]).replace(/['"]/g, '').replace(',', '.').trim() : '',
      lng: row[6] ? String(row[6]).replace(/['"]/g, '').replace(',', '.').trim() : '',
      radius: parseInt(String(row[7])) || 150,
    })).filter(a => a.namaAcara !== '').reverse();
    if (list.length > 0) return mergeResults(list);
  }

  // 3. Try Google Sheets API v4
  const sheets = getGoogleSheetsClient();
  if (sheets) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Data_Acara!A2:H',
      });
      const rows = res.data.values;
      if (rows && rows.length > 0) {
        const list = rows
          .map((row, index) => ({
            rowIndex: index + 2,
            id: row[0] || String(index + 1),
            namaAcara: row[1] || '',
            tanggalAcara: row[2] || '',
            isHidden: String(row[3]).toLowerCase() === 'true',
            mapLink: row[4] || '',
            lat: row[5] ? String(row[5]).replace(/['"]/g, '').replace(',', '.').trim() : '',
            lng: row[6] ? String(row[6]).replace(/['"]/g, '').replace(',', '.').trim() : '',
            radius: parseInt(row[7]) || 150,
          }))
          .filter(a => a.namaAcara.trim() !== '')
          .reverse();
        return mergeResults(list);
      }
    } catch (e) {
      console.warn('Sheets API Acara error:', e);
    }
  }

  return mergeResults(mockDb.getAcara());
}

export async function insertAcara(data: Partial<AcaraItem>) {
  const newId = String(data.id || Date.now());
  const newRow = Number(data.rowIndex) || Date.now();
  deletedAcaraKeys.delete(String(newId));
  deletedAcaraKeys.delete(String(newRow));
  const newItem: AcaraItem = {
    rowIndex: newRow,
    id: newId,
    namaAcara: data.namaAcara || '',
    tanggalAcara: data.tanggalAcara || new Date().toISOString().split('T')[0],
    isHidden: false,
    mapLink: data.mapLink || '',
    lat: data.lat || '',
    lng: data.lng || '',
    radius: Number(data.radius) || 150,
  };

  const existingIdx = addedAcaraList.findIndex(
    a => String(a.id) === newId || (a.namaAcara && a.namaAcara.trim().toLowerCase() === (data.namaAcara || '').trim().toLowerCase())
  );
  if (existingIdx !== -1) {
    addedAcaraList[existingIdx] = newItem;
  } else {
    addedAcaraList.unshift(newItem);
  }
  mockDb.addAcara({ ...data, id: newId, rowIndex: newRow });

  const gasRes = await callGasApi<any>('addAcara', { payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;

  const sheets = getGoogleSheetsClient();
  if (sheets) {
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Data_Acara!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              newId,
              data.namaAcara,
              data.tanggalAcara,
              'FALSE',
              data.mapLink || '',
              data.lat || '',
              data.lng || '',
              data.radius || 150,
            ],
          ],
        },
      });
      return { success: true, message: 'Acara berhasil ditambahkan ke Google Sheets!', data: newItem };
    } catch (e) {
      console.warn('Sheets API append Acara error:', e);
    }
  }

  return { success: true, message: 'Acara berhasil disimpan!', data: newItem };
}

export async function updateAcara(rowIndex: number | string, data: Partial<AcaraItem>) {
  if (rowIndex) editedAcaraMap.set(String(rowIndex), { ...editedAcaraMap.get(String(rowIndex)), ...data });
  if (data.id) editedAcaraMap.set(String(data.id), { ...editedAcaraMap.get(String(data.id)), ...data });
  if (data.namaAcara) editedAcaraMap.set(data.namaAcara.trim().toLowerCase(), { ...editedAcaraMap.get(data.namaAcara.trim().toLowerCase()), ...data });

  const idx = addedAcaraList.findIndex(a => String(a.id) === String(rowIndex) || String(a.rowIndex) === String(rowIndex));
  if (idx !== -1) {
    addedAcaraList[idx] = { ...addedAcaraList[idx], ...data };
  }
  mockDb.updateAcara(rowIndex, data);

  const gasRes = await callGasApi<any>('updateAcara', { rowIndex, payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return { success: true, message: 'Data acara berhasil diperbarui!' };
}

export async function toggleStatusAcara(rowIndex: number | string, hideStatus: boolean) {
  const existing = editedAcaraMap.get(String(rowIndex)) || {};
  editedAcaraMap.set(String(rowIndex), { ...existing, isHidden: hideStatus });

  const idx = addedAcaraList.findIndex(a => String(a.id) === String(rowIndex) || String(a.rowIndex) === String(rowIndex));
  if (idx !== -1) {
    addedAcaraList[idx] = { ...addedAcaraList[idx], isHidden: hideStatus };
  }
  mockDb.toggleStatusAcara(rowIndex, hideStatus);

  const gasRes = await callGasApi<any>('toggleStatusAcara', { rowIndex, hideStatus }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return { success: true, message: hideStatus ? 'Acara disembunyikan!' : 'Acara kembali aktif!' };
}

export async function deleteAcara(rowIndex: number | string, id?: string, nama?: string) {
  if (rowIndex) deletedAcaraKeys.add(String(rowIndex));
  if (id) deletedAcaraKeys.add(String(id));

  const idx = addedAcaraList.findIndex(a =>
    String(a.id) === String(rowIndex) ||
    String(a.rowIndex) === String(rowIndex) ||
    (id && String(a.id) === String(id)) ||
    (nama && a.namaAcara.toLowerCase() === nama.toLowerCase())
  );
  if (idx !== -1) {
    addedAcaraList.splice(idx, 1);
  }
  mockDb.deleteAcara(rowIndex);

  const gasRes = await callGasApi<any>('deleteAcara', { rowIndex, id, nama }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return { success: true, message: 'Acara berhasil dihapus!' };
}

// ==========================================
// ABSENSI
// ==========================================
const deletedAbsensiKeys = new Set<string>();
const editedAbsensiMap = new Map<string, Partial<AbsensiRecord>>();
const addedAbsensiList: AbsensiRecord[] = [];

export async function fetchAbsensi(): Promise<AbsensiRecord[]> {
  const isDeleted = (r: AbsensiRecord) =>
    deletedAbsensiKeys.has(String(r.id)) ||
    deletedAbsensiKeys.has(String(r.rowIndex));

  const applyEdit = (r: AbsensiRecord): AbsensiRecord => {
    const edit =
      editedAbsensiMap.get(String(r.id)) ||
      editedAbsensiMap.get(String(r.rowIndex));
    return edit ? { ...r, ...edit } : r;
  };

  const mergeResults = (baseList: AbsensiRecord[]) => {
    const filtered = baseList.filter(r => !isDeleted(r)).map(applyEdit);
    const added = addedAbsensiList.filter(r => !isDeleted(r)).map(applyEdit);
    const combined = [...added, ...filtered];

    const seen = new Set<string>();
    const result: AbsensiRecord[] = [];
    for (const item of combined) {
      const keyId = String(item.id || item.rowIndex);
      const contentKey = `${item.acara}_${item.nama}_${item.waktu}`.toLowerCase();
      if (!seen.has(keyId) && !seen.has(contentKey)) {
        seen.add(keyId);
        seen.add(contentKey);
        result.push(item);
      }
    }
    return result;
  };

  // 1. Try Google Apps Script API Bridge
  const gasData = await callGasApi<AbsensiRecord[]>('getAbsensi');
  if (gasData && Array.isArray(gasData) && gasData.length > 0) {
    return mergeResults(gasData);
  }

  // 2. Try Public Google Sheets CSV export
  const csvRows = await fetchCsvSheet('Data_Absensi');
  if (csvRows && csvRows.length > 1) {
    const list = csvRows.slice(1).map((row, index) => ({
      rowIndex: index + 2,
      id: String(row[0] || index + 1),
      waktu: String(row[1] || '-'),
      acara: String(row[2] || '-'),
      nama: String(row[3] || '').trim(),
      status: (row[4] || 'Hadir') as 'Hadir' | 'Izin' | 'Sakit',
      keterangan: String(row[5] || '-'),
    })).filter(r => r.nama !== '').reverse();
    if (list.length > 0) return mergeResults(list);
  }

  // 3. Try Google Sheets API v4
  const sheets = getGoogleSheetsClient();
  if (sheets) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Data_Absensi!A2:F',
      });
      const rows = res.data.values;
      if (rows && rows.length > 0) {
        const list = rows
          .map((row, index) => ({
            rowIndex: index + 2,
            id: row[0] || String(index + 1),
            waktu: row[1] || '-',
            acara: row[2] || '-',
            nama: row[3] || '-',
            status: row[4] || 'Hadir',
            keterangan: row[5] || '-',
          }))
          .filter(r => r.nama.trim() !== '')
          .reverse();
        return mergeResults(list);
      }
    } catch (e) {
      console.warn('Sheets API Absensi error:', e);
    }
  }

  return mergeResults(mockDb.getAbsensi());
}

export async function insertAbsensi(data: Partial<AbsensiRecord>) {
  const now = new Date();
  const formattedDate =
    now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    now.toLocaleTimeString('id-ID');
  const newId = String(data.id || now.getTime());
  const newRow = Number(data.rowIndex) || now.getTime();
  const newRecord: AbsensiRecord = {
    rowIndex: newRow,
    id: newId,
    waktu: data.waktu || formattedDate,
    acara: data.acara || '-',
    nama: data.nama || '-',
    status: data.status || 'Hadir',
    keterangan: data.keterangan || '-',
  };

  const existingIdx = addedAbsensiList.findIndex(
    r => String(r.id) === newId || (`${r.acara}_${r.nama}_${r.waktu}`.toLowerCase() === `${newRecord.acara}_${newRecord.nama}_${newRecord.waktu}`.toLowerCase())
  );
  if (existingIdx !== -1) {
    addedAbsensiList[existingIdx] = newRecord;
  } else {
    addedAbsensiList.unshift(newRecord);
  }
  mockDb.submitKehadiran({ ...data, id: newId, rowIndex: newRow, waktu: newRecord.waktu });

  const gasRes = await callGasApi<any>('submitKehadiran', { payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;

  const sheets = getGoogleSheetsClient();
  if (sheets) {
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Data_Absensi!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[newId, formattedDate, data.acara, data.nama, data.status, data.keterangan || '-']],
        },
      });
      return { success: true, message: 'Presensi Asatidz berhasil dicatat ke Google Sheets!', data: newRecord };
    } catch (e) {
      console.warn('Sheets API append Absensi error:', e);
    }
  }

  return { success: true, message: 'Presensi berhasil disimpan!', data: newRecord };
}

export async function updateAbsensi(rowIndex: number | string, data: Partial<AbsensiRecord>) {
  if (rowIndex) editedAbsensiMap.set(String(rowIndex), { ...editedAbsensiMap.get(String(rowIndex)), ...data });
  if (data.id) editedAbsensiMap.set(String(data.id), { ...editedAbsensiMap.get(String(data.id)), ...data });

  const idx = addedAbsensiList.findIndex(r => String(r.id) === String(rowIndex) || String(r.rowIndex) === String(rowIndex));
  if (idx !== -1) {
    addedAbsensiList[idx] = { ...addedAbsensiList[idx], ...data };
  }
  mockDb.updateAbsensi(rowIndex, data);

  const gasRes = await callGasApi<any>('updateAbsensi', { rowIndex, payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return { success: true, message: 'Data presensi berhasil diperbarui!' };
}

export async function deleteAbsensi(rowIndex: number | string, id?: string) {
  if (rowIndex) deletedAbsensiKeys.add(String(rowIndex));
  if (id) deletedAbsensiKeys.add(String(id));

  const idx = addedAbsensiList.findIndex(r =>
    String(r.id) === String(rowIndex) ||
    String(r.rowIndex) === String(rowIndex) ||
    (id && String(r.id) === String(id))
  );
  if (idx !== -1) {
    addedAbsensiList.splice(idx, 1);
  }
  mockDb.deleteAbsensi(rowIndex);

  const gasRes = await callGasApi<any>('deleteAbsensi', { rowIndex, id }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return { success: true, message: 'Presensi berhasil dihapus!' };
}

// ==========================================
// LAPORAN DIVISI
// ==========================================
const deletedLaporanKeys = new Set<string>();
const editedLaporanMap = new Map<string, Partial<LaporanItem>>();
const addedLaporanList: LaporanItem[] = [];

export async function fetchLaporan(): Promise<LaporanItem[]> {
  const isDeleted = (l: LaporanItem) =>
    deletedLaporanKeys.has(String(l.id)) ||
    deletedLaporanKeys.has(String(l.rowIndex));

  const applyEdit = (l: LaporanItem): LaporanItem => {
    const edit =
      editedLaporanMap.get(String(l.id)) ||
      editedLaporanMap.get(String(l.rowIndex));
    return edit ? { ...l, ...edit } : l;
  };

  const mergeResults = (baseList: LaporanItem[]) => {
    const filtered = baseList.filter(l => !isDeleted(l)).map(applyEdit);
    const added = addedLaporanList.filter(l => !isDeleted(l)).map(applyEdit);
    const combined = [...added, ...filtered];

    const seen = new Set<string>();
    const result: LaporanItem[] = [];
    for (const item of combined) {
      const keyId = String(item.id || item.rowIndex);
      const contentKey = `${item.divisi}_${item.namaPelapor}_${item.periode}`.toLowerCase();
      if (!seen.has(keyId) && !seen.has(contentKey)) {
        seen.add(keyId);
        seen.add(contentKey);
        result.push(item);
      }
    }
    return result;
  };

  // 1. Try Google Apps Script API Bridge
  const gasData = await callGasApi<LaporanItem[]>('getLaporanDivisi');
  if (gasData && Array.isArray(gasData) && gasData.length > 0) {
    return mergeResults(gasData);
  }

  // 2. Try Public Google Sheets CSV export
  const csvRows = await fetchCsvSheet('Data_Laporan_Divisi');
  if (csvRows && csvRows.length > 1) {
    const list = csvRows.slice(1).map((row, index) => ({
      rowIndex: index + 2,
      id: String(row[0] || index + 1),
      waktu: String(row[1] || '-'),
      divisi: String(row[2] || '-'),
      namaPelapor: String(row[3] || '-'),
      periode: String(row[4] || '-'),
      hasilUsaha: String(row[5] || '-'),
      programKerja: String(row[6] || '-'),
      evaluasi: String(row[7] || '-'),
      laporanDana: String(row[8] || '-'),
    })).filter(r => r.divisi.trim() !== '').reverse();
    if (list.length > 0) return mergeResults(list);
  }

  // 3. Try Google Sheets API v4
  const sheets = getGoogleSheetsClient();
  if (sheets) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Data_Laporan_Divisi!A2:I',
      });
      const rows = res.data.values;
      if (rows && rows.length > 0) {
        const list = rows
          .map((row, index) => ({
            rowIndex: index + 2,
            id: row[0] || String(index + 1),
            waktu: row[1] || '-',
            divisi: row[2] || '-',
            namaPelapor: row[3] || '-',
            periode: row[4] || '-',
            hasilUsaha: row[5] || '-',
            programKerja: row[6] || '-',
            evaluasi: row[7] || '-',
            laporanDana: row[8] || '-',
          }))
          .filter(r => r.divisi.trim() !== '')
          .reverse();
        return mergeResults(list);
      }
    } catch (e) {
      console.warn('Sheets API Laporan error:', e);
    }
  }

  return mergeResults(mockDb.getLaporan());
}

export async function insertLaporan(data: Partial<LaporanItem>) {
  const now = new Date();
  const formattedDate =
    now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    now.toLocaleTimeString('id-ID');
  const newId = String(data.id || now.getTime());
  const newRow = Number(data.rowIndex) || now.getTime();
  const newRecord: LaporanItem = {
    rowIndex: newRow,
    id: newId,
    waktu: data.waktu || formattedDate,
    divisi: data.divisi || '-',
    namaPelapor: data.namaPelapor || '-',
    periode: data.periode || 'Pekan 1',
    hasilUsaha: data.hasilUsaha || '-',
    programKerja: data.programKerja || '-',
    evaluasi: data.evaluasi || '-',
    laporanDana: data.laporanDana || '-',
  };

  const existingIdx = addedLaporanList.findIndex(
    l => String(l.id) === newId || (`${l.divisi}_${l.namaPelapor}_${l.periode}`.toLowerCase() === `${newRecord.divisi}_${newRecord.namaPelapor}_${newRecord.periode}`.toLowerCase())
  );
  if (existingIdx !== -1) {
    addedLaporanList[existingIdx] = newRecord;
  } else {
    addedLaporanList.unshift(newRecord);
  }
  mockDb.submitLaporan({ ...data, id: newId, rowIndex: newRow, waktu: newRecord.waktu });

  const gasRes = await callGasApi<any>('submitLaporanDivisi', { payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;

  const sheets = getGoogleSheetsClient();
  if (sheets) {
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Data_Laporan_Divisi!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              newId,
              formattedDate,
              data.divisi,
              data.namaPelapor,
              data.periode,
              data.hasilUsaha || '-',
              data.programKerja || '-',
              data.evaluasi || '-',
              data.laporanDana || '-',
            ],
          ],
        },
      });
      return { success: true, message: 'Laporan Divisi berhasil dikirim ke Google Sheets!', data: newRecord };
    } catch (e) {
      console.warn('Sheets API append Laporan error:', e);
    }
  }

  return { success: true, message: 'Laporan berhasil disimpan!', data: newRecord };
}

export async function updateLaporan(rowIndex: number | string, data: Partial<LaporanItem>) {
  if (rowIndex) editedLaporanMap.set(String(rowIndex), { ...editedLaporanMap.get(String(rowIndex)), ...data });
  if (data.id) editedLaporanMap.set(String(data.id), { ...editedLaporanMap.get(String(data.id)), ...data });

  const idx = addedLaporanList.findIndex(l => String(l.id) === String(rowIndex) || String(l.rowIndex) === String(rowIndex));
  if (idx !== -1) {
    addedLaporanList[idx] = { ...addedLaporanList[idx], ...data };
  }
  mockDb.updateLaporan(rowIndex, data);

  const gasRes = await callGasApi<any>('updateLaporanDivisi', { rowIndex, payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return { success: true, message: 'Data laporan berhasil diperbarui!' };
}

export async function deleteLaporan(rowIndex: number | string, id?: string) {
  if (rowIndex) deletedLaporanKeys.add(String(rowIndex));
  if (id) deletedLaporanKeys.add(String(id));

  const idx = addedLaporanList.findIndex(l =>
    String(l.id) === String(rowIndex) ||
    String(l.rowIndex) === String(rowIndex) ||
    (id && String(l.id) === String(id))
  );
  if (idx !== -1) {
    addedLaporanList.splice(idx, 1);
  }
  mockDb.deleteLaporan(rowIndex);

  const gasRes = await callGasApi<any>('deleteLaporanDivisi', { rowIndex, id }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return { success: true, message: 'Laporan berhasil dihapus!' };
}
