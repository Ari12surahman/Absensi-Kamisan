export interface AbsensiRecord {
  rowIndex?: number;
  id: string;
  waktu: string;
  acara: string;
  nama: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | string;
  keterangan: string;
}

export interface AcaraItem {
  rowIndex?: number;
  id: string;
  namaAcara: string;
  tanggalAcara: string;
  isHidden: boolean;
  mapLink: string;
  lat?: number | string;
  lng?: number | string;
  radius: number;
}

export interface DivisiItem {
  rowIndex?: number;
  id: string;
  namaDivisi: string;
  keterangan: string;
  status: 'Aktif' | 'Non-Aktif' | string;
}

export interface AsatidzItem {
  rowIndex?: number;
  id: string;
  nama: string;
  jabatan?: string;
  status?: 'Aktif' | 'Non-Aktif' | string;
}

export interface LaporanItem {
  rowIndex?: number;
  id: string;
  waktu: string;
  divisi: string;
  namaPelapor: string;
  periode: string;
  hasilUsaha: string;
  programKerja: string;
  evaluasi: string;
  laporanDana: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

