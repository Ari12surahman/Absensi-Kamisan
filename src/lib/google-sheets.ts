import { google } from 'googleapis';
import { mockDb } from './mock-db';
import { AbsensiRecord, AcaraItem, DivisiItem, LaporanItem } from '@/types';

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1YC8IBmPgw7bFtJ7GVCZSaunQuD62hUg677S8pcOZHMs';
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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

// ==========================================
// DIVISI
// ==========================================
export async function fetchDivisi(): Promise<DivisiItem[]> {
  const sheets = getGoogleSheetsClient();
  if (!sheets) return mockDb.getDivisi();

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Data_Divisi!A2:D',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return mockDb.getDivisi();

    return rows
      .map((row, index) => ({
        rowIndex: index + 2,
        id: row[0] || String(index + 1),
        namaDivisi: row[1] || '',
        keterangan: row[2] || '-',
        status: row[3] || 'Aktif',
      }))
      .filter(d => d.namaDivisi.trim() !== '');
  } catch (error) {
    console.error('Error fetching Google Sheets Divisi, using fallback:', error);
    return mockDb.getDivisi();
  }
}

export async function insertDivisi(data: Partial<DivisiItem>) {
  const sheets = getGoogleSheetsClient();
  if (!sheets) return mockDb.addDivisi(data);

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
  } catch (error: any) {
    console.error('Error appending Divisi:', error);
    return mockDb.addDivisi(data);
  }
}

// ==========================================
// ACARA
// ==========================================
export async function fetchAcara(): Promise<AcaraItem[]> {
  const sheets = getGoogleSheetsClient();
  if (!sheets) return mockDb.getAcara();

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Data_Acara!A2:H',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return mockDb.getAcara();

    return rows
      .map((row, index) => ({
        rowIndex: index + 2,
        id: row[0] || String(index + 1),
        namaAcara: row[1] || '',
        tanggalAcara: row[2] || '',
        isHidden: String(row[3]).toLowerCase() === 'true',
        mapLink: row[4] || '',
        lat: row[5] || '',
        lng: row[6] || '',
        radius: parseInt(row[7]) || 150,
      }))
      .filter(a => a.namaAcara.trim() !== '')
      .reverse();
  } catch (error) {
    console.error('Error fetching Google Sheets Acara, using fallback:', error);
    return mockDb.getAcara();
  }
}

export async function insertAcara(data: Partial<AcaraItem>) {
  const sheets = getGoogleSheetsClient();
  if (!sheets) return mockDb.addAcara(data);

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
  } catch (error) {
    console.error('Error appending Acara:', error);
    return mockDb.addAcara(data);
  }
}

// ==========================================
// ABSENSI
// ==========================================
export async function fetchAbsensi(): Promise<AbsensiRecord[]> {
  const sheets = getGoogleSheetsClient();
  if (!sheets) return mockDb.getAbsensi();

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Data_Absensi!A2:F',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return mockDb.getAbsensi();

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
  } catch (error) {
    console.error('Error fetching Google Sheets Absensi, using fallback:', error);
    return mockDb.getAbsensi();
  }
}

export async function insertAbsensi(data: Partial<AbsensiRecord>) {
  const sheets = getGoogleSheetsClient();
  if (!sheets) return mockDb.submitKehadiran(data);

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
  } catch (error) {
    console.error('Error appending Absensi:', error);
    return mockDb.submitKehadiran(data);
  }
}

// ==========================================
// LAPORAN DIVISI
// ==========================================
export async function fetchLaporan(): Promise<LaporanItem[]> {
  const sheets = getGoogleSheetsClient();
  if (!sheets) return mockDb.getLaporan();

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Data_Laporan_Divisi!A2:I',
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) return mockDb.getLaporan();

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
  } catch (error) {
    console.error('Error fetching Google Sheets Laporan, using fallback:', error);
    return mockDb.getLaporan();
  }
}

export async function insertLaporan(data: Partial<LaporanItem>) {
  const sheets = getGoogleSheetsClient();
  if (!sheets) return mockDb.submitLaporan(data);

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
  } catch (error) {
    console.error('Error appending Laporan:', error);
    return mockDb.submitLaporan(data);
  }
}

