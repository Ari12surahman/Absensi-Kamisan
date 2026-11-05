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

export async function fetchDivisi(): Promise<DivisiItem[]> {
  const isDeleted = (d: DivisiItem) =>
    deletedDivisiKeys.has(String(d.id)) ||
    deletedDivisiKeys.has(String(d.rowIndex)) ||
    deletedDivisiKeys.has((d.namaDivisi || '').trim().toLowerCase());

  // 1. Try Google Apps Script API Bridge
  const gasData = await callGasApi<DivisiItem[]>('getDivisi');
  if (gasData && Array.isArray(gasData) && gasData.length > 0) {
    return gasData.filter(d => !isDeleted(d));
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
    }))
    .filter(d => d.namaDivisi !== '')
    .filter(d => !isDeleted(d));
    if (list.length > 0) return list;
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
        return rows
          .map((row, index) => ({
            rowIndex: index + 2,
            id: row[0] || String(index + 1),
            namaDivisi: row[1] || '',
            keterangan: row[2] || '-',
            status: row[3] || 'Aktif',
          }))
          .filter(d => d.namaDivisi.trim() !== '')
          .filter(d => !isDeleted(d));
      }
    } catch (e) {
      console.warn('Sheets API Divisi error:', e);
    }
  }

  // 4. Fallback to mockDb
  return mockDb.getDivisi().filter(d => !isDeleted(d));
}

export async function insertDivisi(data: Partial<DivisiItem>) {
  const gasRes = await callGasApi<any>('addDivisi', { payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;

  const sheets = getGoogleSheetsClient();
  if (sheets) {
    try {
      const id = Date.now().toString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Data_Divisi!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[id, data.namaDivisi, data.keterangan || '-', data.status || 'Aktif']],
        },
      });
      return { success: true, message: 'Divisi berhasil disimpan ke Google Sheets!' };
    } catch (e) {
      console.warn('Sheets API append Divisi error:', e);
    }
  }

  return mockDb.addDivisi(data);
}

export async function updateDivisi(rowIndex: number | string, data: Partial<DivisiItem>) {
  const gasRes = await callGasApi<any>('updateDivisi', { rowIndex, payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return mockDb.updateDivisi(String(rowIndex), data);
}

export async function deleteDivisi(rowIndex: number | string, id?: string, nama?: string) {
  if (rowIndex) deletedDivisiKeys.add(String(rowIndex));
  if (id) deletedDivisiKeys.add(String(id));
  if (nama) deletedDivisiKeys.add(nama.trim().toLowerCase());

  const gasRes = await callGasApi<any>('deleteDivisi', { rowIndex, id, nama }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return mockDb.deleteDivisi(String(rowIndex), nama);
}

// ==========================================
// ACARA
// ==========================================
export async function fetchAcara(): Promise<AcaraItem[]> {
  // 1. Try Google Apps Script API Bridge
  const gasData = await callGasApi<AcaraItem[]>('getAcara');
  if (gasData && Array.isArray(gasData) && gasData.length > 0) {
    return gasData.map(a => ({
      ...a,
      lat: a.lat ? String(a.lat).replace(/['"]/g, '').replace(',', '.').trim() : '',
      lng: a.lng ? String(a.lng).replace(/['"]/g, '').replace(',', '.').trim() : '',
    }));
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
    if (list.length > 0) return list;
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
        return rows
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
      }
    } catch (e) {
      console.warn('Sheets API Acara error:', e);
    }
  }

  return mockDb.getAcara();
}

export async function insertAcara(data: Partial<AcaraItem>) {
  const gasRes = await callGasApi<any>('addAcara', { payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;

  const sheets = getGoogleSheetsClient();
  if (sheets) {
    try {
      const id = Date.now().toString();
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Data_Acara!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              id,
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
      return { success: true, message: 'Acara berhasil ditambahkan ke Google Sheets!' };
    } catch (e) {
      console.warn('Sheets API append Acara error:', e);
    }
  }

  return mockDb.addAcara(data);
}

export async function updateAcara(rowIndex: number | string, data: Partial<AcaraItem>) {
  const gasRes = await callGasApi<any>('updateAcara', { rowIndex, payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return mockDb.updateAcara(String(rowIndex), data);
}

export async function deleteAcara(rowIndex: number | string) {
  const gasRes = await callGasApi<any>('deleteAcara', { rowIndex }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return mockDb.deleteAcara(String(rowIndex));
}

export async function toggleStatusAcara(rowIndex: number | string, hideStatus: boolean) {
  const gasRes = await callGasApi<any>('toggleStatusAcara', { rowIndex, hideStatus }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return mockDb.toggleStatusAcara(String(rowIndex), hideStatus);
}

// ==========================================
// ABSENSI
// ==========================================
export async function fetchAbsensi(): Promise<AbsensiRecord[]> {
  // 1. Try Google Apps Script API Bridge
  const gasData = await callGasApi<AbsensiRecord[]>('getAbsensi');
  if (gasData && Array.isArray(gasData) && gasData.length > 0) {
    return gasData;
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
    if (list.length > 0) return list;
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
        return rows
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
      }
    } catch (e) {
      console.warn('Sheets API Absensi error:', e);
    }
  }

  return mockDb.getAbsensi();
}

export async function insertAbsensi(data: Partial<AbsensiRecord>) {
  const gasRes = await callGasApi<any>('submitKehadiran', { payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;

  const sheets = getGoogleSheetsClient();
  if (sheets) {
    try {
      const now = new Date();
      const formattedDate =
        now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' +
        now.toLocaleTimeString('id-ID');
      const id = now.getTime().toString();

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Data_Absensi!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[id, formattedDate, data.acara, data.nama, data.status, data.keterangan || '-']],
        },
      });
      return { success: true, message: 'Presensi Asatidz berhasil dicatat ke Google Sheets!' };
    } catch (e) {
      console.warn('Sheets API append Absensi error:', e);
    }
  }

  return mockDb.submitKehadiran(data);
}

export async function updateAbsensi(rowIndex: number | string, data: Partial<AbsensiRecord>) {
  const gasRes = await callGasApi<any>('updateAbsensi', { rowIndex, payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return mockDb.updateAbsensi(String(rowIndex), data);
}

export async function deleteAbsensi(rowIndex: number | string) {
  const gasRes = await callGasApi<any>('deleteAbsensi', { rowIndex }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return mockDb.deleteAbsensi(String(rowIndex));
}

// ==========================================
// LAPORAN DIVISI
// ==========================================
export async function fetchLaporan(): Promise<LaporanItem[]> {
  // 1. Try Google Apps Script API Bridge
  const gasData = await callGasApi<LaporanItem[]>('getLaporanDivisi');
  if (gasData && Array.isArray(gasData) && gasData.length > 0) {
    return gasData;
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
    if (list.length > 0) return list;
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
        return rows
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
      }
    } catch (e) {
      console.warn('Sheets API Laporan error:', e);
    }
  }

  return mockDb.getLaporan();
}

export async function insertLaporan(data: Partial<LaporanItem>) {
  const gasRes = await callGasApi<any>('submitLaporanDivisi', { payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;

  const sheets = getGoogleSheetsClient();
  if (sheets) {
    try {
      const now = new Date();
      const formattedDate =
        now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' +
        now.toLocaleTimeString('id-ID');
      const id = now.getTime().toString();

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Data_Laporan_Divisi!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              id,
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
      return { success: true, message: 'Laporan Divisi berhasil dikirim ke Google Sheets!' };
    } catch (e) {
      console.warn('Sheets API append Laporan error:', e);
    }
  }

  return mockDb.submitLaporan(data);
}

export async function updateLaporan(rowIndex: number | string, data: Partial<LaporanItem>) {
  const gasRes = await callGasApi<any>('updateLaporanDivisi', { rowIndex, payload: data }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return mockDb.updateLaporan(String(rowIndex), data);
}

export async function deleteLaporan(rowIndex: number | string) {
  const gasRes = await callGasApi<any>('deleteLaporanDivisi', { rowIndex }, 'POST');
  if (gasRes && gasRes.success) return gasRes;
  return mockDb.deleteLaporan(String(rowIndex));
}
