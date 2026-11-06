import { AbsensiRecord, AcaraItem, DivisiItem, LaporanItem, AsatidzItem } from '@/types';

// Default initial datasets
let mockAsatidz: AsatidzItem[] = [
  { rowIndex: 2, id: '1', nama: 'Ari Surahman', jabatan: 'Pembina / Asatidz', status: 'Aktif' },
  { rowIndex: 3, id: '2', nama: 'Prayoga Wicaksana', jabatan: 'Koordinator Asatidz', status: 'Aktif' },
  { rowIndex: 4, id: '3', nama: 'Suhendi', jabatan: 'Asatidz Pengajar', status: 'Aktif' },
  { rowIndex: 5, id: '4', nama: 'M. Tamimi', jabatan: 'Asatidz Pengajar', status: 'Aktif' },
  { rowIndex: 6, id: '5', nama: 'Miftah Ali Mubarok', jabatan: 'Asatidz Pengajar', status: 'Aktif' },
  { rowIndex: 7, id: '6', nama: 'Zaki Hidayat', jabatan: 'Asatidz Pengajar', status: 'Aktif' },
  { rowIndex: 8, id: '7', nama: 'Yuliah elitha', jabatan: 'Ustadzah Pengajar', status: 'Aktif' },
  { rowIndex: 9, id: '8', nama: 'Mukhammad evan valentino', jabatan: 'Asatidz Pengajar', status: 'Aktif' },
  { rowIndex: 10, id: '9', nama: 'Rafa syabama', jabatan: 'Asatidz Pengajar', status: 'Aktif' },
  { rowIndex: 11, id: '10', nama: 'Indri Septiani', jabatan: 'Ustadzah Pengajar', status: 'Aktif' },
  { rowIndex: 12, id: '11', nama: 'Gina Amalia Putri', jabatan: 'Ustadzah Pengajar', status: 'Aktif' },
  { rowIndex: 13, id: '12', nama: 'Fauziah Nuraulia', jabatan: 'Ustadzah Pengajar', status: 'Aktif' },
  { rowIndex: 14, id: '13', nama: 'Ujang fauzan', jabatan: 'Asatidz Pengajar', status: 'Aktif' },
  { rowIndex: 15, id: '14', nama: 'Mila Tirta N.D', jabatan: 'Ustadzah Pengajar', status: 'Aktif' },
  { rowIndex: 16, id: '15', nama: 'Aay Bariyyatul Khotimah', jabatan: 'Ustadzah Pengajar', status: 'Aktif' },
  { rowIndex: 17, id: '16', nama: 'IKO FAJRIATURRIZQOH', jabatan: 'Ustadzah Pengajar', status: 'Aktif' },
  { rowIndex: 18, id: '17', nama: 'Dzikri Abdullah', jabatan: 'Asatidz Pengajar', status: 'Aktif' },
  { rowIndex: 19, id: '18', nama: 'Fajar Apriansyah', jabatan: 'Asatidz Pengajar', status: 'Aktif' },
  { rowIndex: 20, id: '19', nama: 'Eddi Yahdi', jabatan: 'Asatidz Pengajar', status: 'Aktif' },
];

let mockDivisi: DivisiItem[] = [
  { rowIndex: 2, id: '1', namaDivisi: 'Divisi Operasional & Logistik', keterangan: 'Mengelola operasional harian dan logistik perlengkapan', status: 'Aktif' },
  { rowIndex: 3, id: '2', namaDivisi: 'Divisi IT, Sistem & Komunikasi', keterangan: 'Mengelola infrastruktur IT dan server sinkronisasi', status: 'Aktif' },
  { rowIndex: 4, id: '3', namaDivisi: 'Divisi Humas & Publikasi', keterangan: 'Mengelola relasi publik, kemitraan, dan siaran pers', status: 'Aktif' },
  { rowIndex: 5, id: '4', namaDivisi: 'Divisi SDM & Personalia', keterangan: 'Mengelola kedisiplinan dan penugasan staf pengajar / asatidz', status: 'Aktif' },
  { rowIndex: 6, id: '5', namaDivisi: 'Divisi Keuangan & Akuntansi', keterangan: 'Mengelola pembukuan, realisasi dana kas, dan audit', status: 'Aktif' }
];

let mockAcara: AcaraItem[] = [
  { rowIndex: 2, id: '101', namaAcara: 'Pengajian & Halaqah Kamisan Asatidz', tanggalAcara: new Date().toISOString().split('T')[0], isHidden: false, mapLink: '', lat: '', lng: '', radius: 250 },
  { rowIndex: 3, id: '102', namaAcara: 'Briefing Koordinasi Pagi (08.30 WIB)', tanggalAcara: new Date().toISOString().split('T')[0], isHidden: false, mapLink: '', lat: '', lng: '', radius: 200 },
  { rowIndex: 4, id: '103', namaAcara: 'Rapat Evaluasi Bulanan Pembina & Asatidz', tanggalAcara: '2026-11-10', isHidden: false, mapLink: '', lat: '', lng: '', radius: 150 },
  { rowIndex: 5, id: '104', namaAcara: 'Pelantikan Pengurus Asrama Santri 2026/2027', tanggalAcara: '2026-10-27', isHidden: true, mapLink: '', lat: '', lng: '', radius: 150 }
];

let mockAbsensi: AbsensiRecord[] = [
  { rowIndex: 2, id: '201', waktu: '04/11/2026 08:35:10', acara: 'Pengajian & Halaqah Kamisan Asatidz', nama: 'Ust. Dzikri Abdullah', status: 'Hadir', keterangan: 'Masjid Utama (Radius Akurat)' },
  { rowIndex: 3, id: '202', waktu: '04/11/2026 08:32:44', acara: 'Pengajian & Halaqah Kamisan Asatidz', nama: 'Ustz. Siti Laely Badriyah', status: 'Hadir', keterangan: 'Kampus Asatidz (Radius Akurat)' },
  { rowIndex: 4, id: '203', waktu: '04/11/2026 08:29:15', acara: 'Pengajian & Halaqah Kamisan Asatidz', nama: 'Ustz. Fauziah Hidayati', status: 'Hadir', keterangan: 'Kampus Asatidz (Radius Akurat)' },
  { rowIndex: 5, id: '204', waktu: '04/11/2026 08:25:01', acara: 'Pengajian & Halaqah Kamisan Asatidz', nama: 'Ust. Ahmad Faiz', status: 'Izin', keterangan: 'Penugasan safari dakwah luar kota' },
  { rowIndex: 6, id: '205', waktu: '04/11/2026 08:20:30', acara: 'Pengajian & Halaqah Kamisan Asatidz', nama: 'Ustz. Nurul Aulia', status: 'Sakit', keterangan: 'Istirahat di rumah dinas' },
  { rowIndex: 7, id: '206', waktu: '03/11/2026 08:40:11', acara: 'Briefing Koordinasi Pagi (08.30 WIB)', nama: 'Ust. Rian Syahputra', status: 'Hadir', keterangan: 'Kantor Pusat Salman (GPS Valid)' },
  { rowIndex: 8, id: '207', waktu: '03/11/2026 08:35:20', acara: 'Briefing Koordinasi Pagi (08.30 WIB)', nama: 'Ust. Budi Santoso', status: 'Hadir', keterangan: 'Kantor Pusat Salman (GPS Valid)' },
  { rowIndex: 9, id: '208', waktu: '03/11/2026 08:15:00', acara: 'Briefing Koordinasi Pagi (08.30 WIB)', nama: 'Ustz. Dewi Lestari', status: 'Izin', keterangan: 'Keperluan keluarga mendesak' },
  { rowIndex: 10, id: '209', waktu: '03/11/2026 08:10:45', acara: 'Briefing Koordinasi Pagi (08.30 WIB)', nama: 'Ust. Hendra Setiawan', status: 'Hadir', keterangan: 'Radius Akurat (GPS Valid)' },
  { rowIndex: 11, id: '210', waktu: '03/11/2026 08:05:12', acara: 'Briefing Koordinasi Pagi (08.30 WIB)', nama: 'Ustz. Indah Permata', status: 'Hadir', keterangan: 'Radius Akurat (GPS Valid)' },
  { rowIndex: 12, id: '211', waktu: '03/11/2026 08:01:50', acara: 'Briefing Koordinasi Pagi (08.30 WIB)', nama: 'Ust. Joko Widodo', status: 'Hadir', keterangan: 'Radius Akurat (GPS Valid)' },
  { rowIndex: 13, id: '212', waktu: '02/11/2026 08:30:22', acara: 'Pengajian & Halaqah Kamisan Asatidz', nama: 'Ustz. Kartika Sari', status: 'Hadir', keterangan: 'Radius Akurat (GPS Valid)' }
];

let mockLaporan: LaporanItem[] = [
  {
    rowIndex: 2,
    id: '301',
    waktu: '04/11/2026 10:15:30',
    divisi: 'Divisi Operasional & Logistik',
    namaPelapor: 'Ust. Rahmat Hidayat',
    periode: 'Pekan 1',
    hasilUsaha: 'Pengadaan 12 roll kabel LAN, instalasi audio masjid, serta inventarisasi kitab santri selesai 100%.',
    programKerja: 'Peremajaan karpet aula utama dan pembersihan ruang transit asatidz.',
    evaluasi: 'Perlu penambahan colokan listrik di sudut ruang halaqah.',
    laporanDana: 'Pengeluaran: Rp 1.850.000 | Saldo: Rp 3.150.000 (Pengadaan kabel & mic wireless)'
  },
  {
    rowIndex: 3,
    id: '302',
    waktu: '03/11/2026 16:45:10',
    divisi: 'Divisi IT, Sistem & Komunikasi',
    namaPelapor: 'Ust. Irvan Maulana',
    periode: 'Pekan 1',
    hasilUsaha: 'Migrasi portal presensi SalApp Asatidz ke Next.js & sistem geofencing GPS real-time.',
    programKerja: 'Penyusunan modul panduan presensi mobile untuk seluruh asatidz.',
    evaluasi: 'Beberapa smartphone jadul butuh panduan kalibrasi kompas GPS.',
    laporanDana: 'Pengeluaran: Rp 350.000 | Saldo: Rp 4.650.000 (Langganan cloud server)'
  },
  {
    rowIndex: 4,
    id: '303',
    waktu: '02/11/2026 14:20:00',
    divisi: 'Divisi Humas & Publikasi',
    namaPelapor: 'Ustz. Annisa Fitri',
    periode: 'Pekan 4',
    hasilUsaha: 'Penerbitan buletin dakwah edisi November & publikasi kegiatan kajian asatidz.',
    programKerja: 'Penyusunan video profil santri tahfidz dan dokumentasi wisuda.',
    evaluasi: 'Perlu jadwal tetap untuk wawancara pembina halaqah.',
    laporanDana: 'Pengeluaran: Rp 950.000 | Saldo: Rp 1.550.000 (Cetak buletin & konsumsi tamu)'
  }
];

export const mockDb = {
  // Divisi
  getDivisi: () => [...mockDivisi],
  addDivisi: (item: Partial<DivisiItem>) => {
    const newId = Date.now().toString();
    const newDivisi: DivisiItem = {
      rowIndex: Date.now(),
      id: newId,
      namaDivisi: item.namaDivisi || '',
      keterangan: item.keterangan || '-',
      status: item.status || 'Aktif',
    };
    mockDivisi.unshift(newDivisi);
    return newDivisi;
  },
  updateDivisi: (idOrRow: string | number, data: Partial<DivisiItem>) => {
    mockDivisi = mockDivisi.map(d =>
      String(d.id) === String(idOrRow) || String(d.rowIndex) === String(idOrRow)
        ? { ...d, ...data }
        : d
    );
    return true;
  },
  deleteDivisi: (idOrRow: string | number, nama?: string) => {
    mockDivisi = mockDivisi.filter(
      d =>
        String(d.id) !== String(idOrRow) &&
        String(d.rowIndex) !== String(idOrRow) &&
        (!nama || d.namaDivisi.toLowerCase() !== nama.toLowerCase())
    );
    return true;
  },

  // Acara
  getAcara: () => [...mockAcara],
  addAcara: (item: Partial<AcaraItem>) => {
    const newId = Date.now().toString();
    const newAcara: AcaraItem = {
      rowIndex: Date.now(),
      id: newId,
      namaAcara: item.namaAcara || '',
      tanggalAcara: item.tanggalAcara || new Date().toISOString().split('T')[0],
      isHidden: false,
      mapLink: item.mapLink || '',
      lat: item.lat || '',
      lng: item.lng || '',
      radius: item.radius || 150,
    };
    mockAcara.unshift(newAcara);
    return newAcara;
  },
  updateAcara: (idOrRow: string | number, data: Partial<AcaraItem>) => {
    mockAcara = mockAcara.map(a =>
      String(a.id) === String(idOrRow) || String(a.rowIndex) === String(idOrRow)
        ? { ...a, ...data }
        : a
    );
    return true;
  },
  toggleStatusAcara: (idOrRow: string | number, isHidden: boolean) => {
    mockAcara = mockAcara.map(a =>
      String(a.id) === String(idOrRow) || String(a.rowIndex) === String(idOrRow)
        ? { ...a, isHidden }
        : a
    );
    return true;
  },
  deleteAcara: (idOrRow: string | number) => {
    mockAcara = mockAcara.filter(
      a => String(a.id) !== String(idOrRow) && String(a.rowIndex) !== String(idOrRow)
    );
    return true;
  },

  // Absensi
  getAbsensi: () => [...mockAbsensi],
  submitKehadiran: (item: Partial<AbsensiRecord>) => {
    const now = new Date();
    const formattedDate =
      now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      now.toLocaleTimeString('id-ID');
    const newId = now.getTime().toString();
    const record: AbsensiRecord = {
      rowIndex: now.getTime(),
      id: newId,
      waktu: formattedDate,
      acara: item.acara || '-',
      nama: item.nama || '-',
      status: item.status || 'Hadir',
      keterangan: item.keterangan || '-',
    };
    mockAbsensi.unshift(record);
    return record;
  },
  updateAbsensi: (idOrRow: string | number, data: Partial<AbsensiRecord>) => {
    mockAbsensi = mockAbsensi.map(r =>
      String(r.id) === String(idOrRow) || String(r.rowIndex) === String(idOrRow)
        ? { ...r, ...data }
        : r
    );
    return true;
  },
  deleteAbsensi: (idOrRow: string | number) => {
    mockAbsensi = mockAbsensi.filter(
      r => String(r.id) !== String(idOrRow) && String(r.rowIndex) !== String(idOrRow)
    );
    return true;
  },

  // Laporan Divisi
  getLaporan: () => [...mockLaporan],
  submitLaporan: (item: Partial<LaporanItem>) => {
    const now = new Date();
    const formattedDate =
      now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      now.toLocaleTimeString('id-ID');
    const newId = now.getTime().toString();
    const record: LaporanItem = {
      rowIndex: now.getTime(),
      id: newId,
      waktu: formattedDate,
      divisi: item.divisi || '-',
      namaPelapor: item.namaPelapor || '-',
      periode: item.periode || 'Pekan 1',
      hasilUsaha: item.hasilUsaha || '-',
      programKerja: item.programKerja || '-',
      evaluasi: item.evaluasi || '-',
      laporanDana: item.laporanDana || '-',
    };
    mockLaporan.unshift(record);
    return record;
  },
  updateLaporan: (idOrRow: string | number, data: Partial<LaporanItem>) => {
    mockLaporan = mockLaporan.map(l =>
      String(l.id) === String(idOrRow) || String(l.rowIndex) === String(idOrRow)
        ? { ...l, ...data }
        : l
    );
    return true;
  },
  deleteLaporan: (idOrRow: string | number) => {
    mockLaporan = mockLaporan.filter(
      l => String(l.id) !== String(idOrRow) && String(l.rowIndex) !== String(idOrRow)
    );
    return true;
  },

  // Asatidz
  getAsatidz: () => [...mockAsatidz],
  addAsatidz: (item: Partial<AsatidzItem>) => {
    const newId = item.id ? String(item.id) : Date.now().toString();
    const newRow = item.rowIndex ? Number(item.rowIndex) : Date.now();
    const record: AsatidzItem = {
      rowIndex: newRow,
      id: newId,
      nama: (item.nama || '').trim(),
      jabatan: item.jabatan || 'Asatidz Pengajar',
      status: item.status || 'Aktif',
    };
    mockAsatidz.unshift(record);
    return record;
  },
  updateAsatidz: (idOrRow: string | number, data: Partial<AsatidzItem>) => {
    mockAsatidz = mockAsatidz.map(a =>
      String(a.id) === String(idOrRow) || String(a.rowIndex) === String(idOrRow) || (a.nama && a.nama.toLowerCase() === (data.nama || '').toLowerCase())
        ? { ...a, ...data }
        : a
    );
    return true;
  },
  deleteAsatidz: (idOrRow: string | number, nama?: string) => {
    mockAsatidz = mockAsatidz.filter(
      a =>
        String(a.id) !== String(idOrRow) &&
        String(a.rowIndex) !== String(idOrRow) &&
        !(nama && a.nama.toLowerCase() === nama.toLowerCase())
    );
    return true;
  },
};

