import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { AbsensiRecord, LaporanItem } from '@/types';

// ==========================================
// EXPORT EXCEL PRESENSI
// ==========================================
export function exportExcelPresensi(data: AbsensiRecord[], filterAcara: string = '') {
  const titleAcara = filterAcara || 'Semua_Acara';

  const rows: any[][] = [
    ['LAPORAN REKAPITULASI PRESENSI ASATIDZ - SALAPP ASATIDZ'],
    [`Agenda Kegiatan: ${filterAcara || 'Semua Acara'}`],
    [`Waktu Unduh: ${new Date().toLocaleString('id-ID')}`],
    [],
    ['No', 'Waktu Presensi', 'Nama Asatidz / Staf', 'Agenda Kegiatan', 'Status Kehadiran', 'Keterangan / Verifikasi GPS'],
  ];

  data.forEach((item, idx) => {
    rows.push([
      idx + 1,
      item.waktu || '-',
      item.nama || '-',
      item.acara || '-',
      (item.status || '-').toUpperCase(),
      item.keterangan || '-',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 6 }, { wch: 22 }, { wch: 30 }, { wch: 32 }, { wch: 16 }, { wch: 40 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data_Presensi');
  XLSX.writeFile(wb, `SalApp_Presensi_${titleAcara.replace(/\s+/g, '_')}.xlsx`);
}

// ==========================================
// EXPORT PDF PRESENSI
// ==========================================
export function exportPdfPresensi(data: AbsensiRecord[], filterAcara: string = '') {
  const titleAcara = filterAcara || 'Semua Acara';
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(53, 37, 205);
  doc.text('LAPORAN REKAPITULASI PRESENSI ASATIDZ', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(`SalApp Asatidz | Agenda: ${titleAcara} | Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 22);

  const tableHead = [['NO', 'WAKTU', 'NAMA ASATIDZ / STAF', 'AGENDA ACARA', 'STATUS', 'KETERANGAN']];
  const tableBody = data.map((item, idx) => [
    idx + 1,
    item.waktu || '-',
    item.nama || '-',
    item.acara || '-',
    (item.status || '-').toUpperCase(),
    item.keterangan || '-',
  ]);

  (doc as any).autoTable({
    head: tableHead,
    body: tableBody,
    startY: 26,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [53, 37, 205], textColor: 255, fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 32 },
      2: { cellWidth: 40 },
      3: { cellWidth: 40 },
      4: { halign: 'center', cellWidth: 20 },
      5: { cellWidth: 'auto' },
    },
  });

  doc.save(`SalApp_Presensi_${titleAcara.replace(/\s+/g, '_')}.pdf`);
}

// ==========================================
// EXPORT EXCEL LAPORAN DIVISI
// ==========================================
export function exportExcelLaporan(data: LaporanItem[], filterDivisi: string = '') {
  const titleDivisi = filterDivisi || 'Semua_Divisi';

  const rows: any[][] = [
    ['LAPORAN PERTANGGUNGJAWABAN DIVISI - SALAPP ASATIDZ'],
    [`Filter Divisi: ${filterDivisi || 'Semua Divisi'}`],
    [`Waktu Unduh: ${new Date().toLocaleString('id-ID')}`],
    [],
    [
      'No',
      'Waktu Kirim',
      'Divisi',
      'Nama Pelapor',
      'Periode',
      'Hasil Usaha & Capaian',
      'Program Kerja Pekan Depan',
      'Evaluasi / Kendala',
      'Laporan Anggaran & Kas',
    ],
  ];

  data.forEach((item, idx) => {
    rows.push([
      idx + 1,
      item.waktu || '-',
      item.divisi || '-',
      item.namaPelapor || '-',
      item.periode || '-',
      item.hasilUsaha || '-',
      item.programKerja || '-',
      item.evaluasi || '-',
      item.laporanDana || '-',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 24 },
    { wch: 24 },
    { wch: 18 },
    { wch: 40 },
    { wch: 40 },
    { wch: 35 },
    { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan_Divisi');
  XLSX.writeFile(wb, `SalApp_Laporan_${titleDivisi.replace(/\s+/g, '_')}.xlsx`);
}

// ==========================================
// EXPORT PDF LAPORAN DIVISI (A4 Landscape)
// ==========================================
export function exportPdfLaporan(data: LaporanItem[], filterDivisi: string = '') {
  const titleDivisi = filterDivisi || 'Semua Divisi';
  const doc = new jsPDF('l', 'mm', 'a4');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(53, 37, 205);
  doc.text('LAPORAN REKAPITULASI PROGRES DIVISI', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text(`SalApp Asatidz | Divisi: ${titleDivisi} | Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 22);

  const tableHead = [
    ['NO', 'WAKTU', 'DIVISI', 'PELAPOR', 'PERIODE', 'HASIL USAHA', 'PROKER PEKAN DEPAN', 'EVALUASI', 'ANGGARAN & KAS'],
  ];
  const tableBody = data.map((item, idx) => [
    idx + 1,
    item.waktu || '-',
    item.divisi || '-',
    item.namaPelapor || '-',
    item.periode || '-',
    item.hasilUsaha || '-',
    item.programKerja || '-',
    item.evaluasi || '-',
    item.laporanDana || '-',
  ]);

  (doc as any).autoTable({
    head: tableHead,
    body: tableBody,
    startY: 26,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [53, 37, 205], textColor: 255, fontStyle: 'bold', halign: 'center' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 26 },
      2: { cellWidth: 30 },
      3: { cellWidth: 28 },
      4: { cellWidth: 20 },
      5: { cellWidth: 42 },
      6: { cellWidth: 42 },
      7: { cellWidth: 38 },
      8: { cellWidth: 'auto' },
    },
  });

  doc.save(`SalApp_Laporan_${titleDivisi.replace(/\s+/g, '_')}.pdf`);
}

