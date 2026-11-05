'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Fingerprint,
  FileText,
  Shield,
  Clock,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Edit,
  Download,
  Eye,
  EyeOff,
  LogOut,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Send,
  Building,
  User,
  Radio,
  Sliders,
  DollarSign,
  TrendingUp,
  Check,
  X
} from 'lucide-react';
import { AbsensiRecord, AcaraItem, DivisiItem, LaporanItem } from '@/types';
import { getDistanceFromLatLonInM } from '@/lib/geo-utils';
import {
  exportExcelPresensi,
  exportPdfPresensi,
  exportExcelLaporan,
  exportPdfLaporan,
} from '@/lib/export-utils';

export default function SalAppPage() {
  // Navigation & View States
  const [currentView, setCurrentView] = useState<'portal' | 'login' | 'admin'>('portal');
  const [portalTab, setPortalTab] = useState<'absensi' | 'laporan'>('absensi');
  const [adminTab, setAdminTab] = useState<'absensi' | 'acara' | 'laporan' | 'divisi'>('absensi');

  // Real-time Clock & Date
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Toast Notification
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Data States
  const [absensiList, setAbsensiList] = useState<AbsensiRecord[]>([]);
  const [acaraList, setAcaraList] = useState<AcaraItem[]>([]);
  const [divisiList, setDivisiList] = useState<DivisiItem[]>([]);
  const [laporanList, setLaporanList] = useState<LaporanItem[]>([]);

  // Loading States
  const [loadingAbsensi, setLoadingAbsensi] = useState(false);
  const [loadingAcara, setLoadingAcara] = useState(false);
  const [loadingDivisi, setLoadingDivisi] = useState(false);
  const [loadingLaporan, setLoadingLaporan] = useState(false);

  // Pagination States (10 items per page)
  const PAGE_SIZE = 10;
  const [pageAbsensi, setPageAbsensi] = useState(1);
  const [pageAcara, setPageAcara] = useState(1);
  const [pageLaporan, setPageLaporan] = useState(1);
  const [pageDivisi, setPageDivisi] = useState(1);

  // Filters & Search
  const [filterAcaraAdmin, setFilterAcaraAdmin] = useState('');
  const [searchAbsensiAdmin, setSearchAbsensiAdmin] = useState('');
  const [filterDivisiAdmin, setFilterDivisiAdmin] = useState('');
  const [searchLaporanAdmin, setSearchLaporanAdmin] = useState('');

  // Form Presensi State
  const [formAbsenAcara, setFormAbsenAcara] = useState('');
  const [formAbsenNama, setFormAbsenNama] = useState('');
  const [formAbsenStatus, setFormAbsenStatus] = useState<'Hadir' | 'Izin' | 'Sakit'>('Hadir');
  const [formAbsenKet, setFormAbsenKet] = useState('');
  const [submittingAbsen, setSubmittingAbsen] = useState(false);

  // Geolocation Geofencing
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'valid' | 'invalid' | 'disabled' | 'idle' | 'free'>('idle');
  const [locationDistance, setLocationDistance] = useState<number | null>(null);

  // Form Laporan Divisi State
  const [lapDivisi, setLapDivisi] = useState('');
  const [lapPelapor, setLapPelapor] = useState('');
  const [lapPeriode, setLapPeriode] = useState('Pekan 1');
  const [lapHasil, setLapHasil] = useState('');
  const [lapProker, setLapProker] = useState('');
  const [lapEvaluasi, setLapEvaluasi] = useState('');
  const [budgetExpense, setBudgetExpense] = useState('');
  const [budgetBalance, setBudgetBalance] = useState('');
  const [budgetNote, setBudgetNote] = useState('');
  const [autoSyncSheet, setAutoSyncSheet] = useState(true);
  const [submittingLaporan, setSubmittingLaporan] = useState(false);

  // Login Admin State
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // Modals State
  const [modalAcara, setModalAcara] = useState<{ open: boolean; item?: AcaraItem }>({ open: false });
  const [modalEditAbsen, setModalEditAbsen] = useState<{ open: boolean; item?: AbsensiRecord }>({ open: false });
  const [modalDivisi, setModalDivisi] = useState<{ open: boolean; item?: DivisiItem }>({ open: false });
  const [modalDetailLaporan, setModalDetailLaporan] = useState<{ open: boolean; item?: LaporanItem }>({ open: false });
  const [modalEditLaporan, setModalEditLaporan] = useState<{ open: boolean; item?: LaporanItem }>({ open: false });

  // Clock Effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB');
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial dropdowns
  useEffect(() => {
    fetchAcaraData();
    fetchDivisiData();
  }, []);

  // Selected Acara Object
  const selectedAcaraObj = useMemo(() => {
    return acaraList.find(a => a.namaAcara === formAbsenAcara);
  }, [acaraList, formAbsenAcara]);

  // Geolocation Geofence Tracker
  const checkLocation = () => {
    if (formAbsenStatus === 'Izin' || formAbsenStatus === 'Sakit') {
      setLocationStatus('valid');
      return;
    }

    if (!formAbsenAcara) {
      setLocationStatus('idle');
      return;
    }

    if (!selectedAcaraObj || !selectedAcaraObj.lat || !selectedAcaraObj.lng) {
      setLocationStatus('free');
      setLocationDistance(null);
      return;
    }

    setLocationStatus('loading');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('disabled');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const uLat = pos.coords.latitude;
        const uLng = pos.coords.longitude;
        setUserLat(uLat);
        setUserLng(uLng);

        const targetLat = typeof selectedAcaraObj.lat === 'string' ? parseFloat(selectedAcaraObj.lat) : selectedAcaraObj.lat;
        const targetLng = typeof selectedAcaraObj.lng === 'string' ? parseFloat(selectedAcaraObj.lng) : selectedAcaraObj.lng;
        const dist = Math.round(getDistanceFromLatLonInM(uLat, uLng, targetLat, targetLng));
        setLocationDistance(dist);

        const allowedRadius = Number(selectedAcaraObj.radius) || 150;
        if (dist <= allowedRadius) {
          setLocationStatus('valid');
        } else {
          setLocationStatus('invalid');
        }
      },
      err => {
        console.warn('Geolocation error:', err);
        setLocationStatus('disabled');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    checkLocation();
  }, [formAbsenAcara, formAbsenStatus, selectedAcaraObj]);

  // Data Fetchers
  const fetchAbsensiData = async () => {
    setLoadingAbsensi(true);
    try {
      const res = await fetch('/api/absensi');
      const json = await res.json();
      if (json.success) setAbsensiList(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAbsensi(false);
    }
  };

  const fetchAcaraData = async () => {
    setLoadingAcara(true);
    try {
      const res = await fetch('/api/acara');
      const json = await res.json();
      if (json.success) setAcaraList(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAcara(false);
    }
  };

  const fetchDivisiData = async () => {
    setLoadingDivisi(true);
    try {
      const res = await fetch('/api/divisi');
      const json = await res.json();
      if (json.success) setDivisiList(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDivisi(false);
    }
  };

  const fetchLaporanData = async () => {
    setLoadingLaporan(true);
    try {
      const res = await fetch('/api/laporan');
      const json = await res.json();
      if (json.success) setLaporanList(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLaporan(false);
    }
  };

  // On Switch to Admin -> Fetch data on-demand (lazy)
  useEffect(() => {
    if (currentView === 'admin') {
      if (adminTab === 'absensi' && absensiList.length === 0) fetchAbsensiData();
      if (adminTab === 'acara' && acaraList.length === 0) fetchAcaraData();
      if (adminTab === 'laporan' && laporanList.length === 0) fetchLaporanData();
      if (adminTab === 'divisi' && divisiList.length === 0) fetchDivisiData();
    }
  }, [currentView, adminTab]);

  // Submit Presensi
  const handleSubmitAbsensi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAbsenAcara) {
      showToast('Pilih agenda kegiatan terlebih dahulu!', 'error');
      return;
    }
    if (!formAbsenNama.trim()) {
      showToast('Nama lengkap asatidz wajib diisi!', 'error');
      return;
    }
    if (formAbsenStatus === 'Hadir' && locationStatus === 'invalid') {
      showToast(`Anda berada di luar radius presensi (${locationDistance}m)!`, 'error');
      return;
    }
    if (formAbsenStatus === 'Hadir' && locationStatus === 'disabled') {
      showToast('Izin GPS dibutuhkan! Mohon aktifkan lokasi browser Anda.', 'error');
      return;
    }

    setSubmittingAbsen(true);
    try {
      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acara: formAbsenAcara,
          nama: formAbsenNama.trim(),
          status: formAbsenStatus,
          keterangan: formAbsenKet.trim() || (locationDistance ? `Jarak GPS: ${locationDistance}m` : 'Hadir Tepat Waktu'),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Presensi Asatidz berhasil dicatat!');
        setFormAbsenNama('');
        setFormAbsenKet('');
        setFormAbsenStatus('Hadir');
        fetchAbsensiData();
      } else {
        showToast(json.message || 'Gagal mengirim presensi', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setSubmittingAbsen(false);
    }
  };

  // Submit Laporan Divisi
  const handleSubmitLaporan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lapDivisi) {
      showToast('Pilih divisi pelapor!', 'error');
      return;
    }
    if (!lapPelapor.trim()) {
      showToast('Nama asatidz pelapor wajib diisi!', 'error');
      return;
    }

    setSubmittingLaporan(true);
    const combinedBudget = `Pengeluaran: Rp ${budgetExpense || '0'} | Saldo: Rp ${budgetBalance || '0'}${budgetNote ? ' (' + budgetNote + ')' : ''}`;

    try {
      const res = await fetch('/api/laporan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          divisi: lapDivisi,
          namaPelapor: lapPelapor.trim(),
          periode: lapPeriode,
          hasilUsaha: lapHasil.trim() || '-',
          programKerja: lapProker.trim() || '-',
          evaluasi: lapEvaluasi.trim() || '-',
          laporanDana: combinedBudget,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Laporan Divisi berhasil dikirim!');
        setLapHasil('');
        setLapProker('');
        setLapEvaluasi('');
        setBudgetExpense('');
        setBudgetBalance('');
        setBudgetNote('');
        fetchLaporanData();
      } else {
        showToast(json.message || 'Gagal mengirim laporan', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem', 'error');
    } finally {
      setSubmittingLaporan(false);
    }
  };

  // Login Admin
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPass.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setAdminPass('');
        setCurrentView('admin');
        setAdminTab('absensi');
        showToast('Selamat datang di Konsol SalApp Asatidz!');
      } else {
        showToast(json.message || 'Password salah!', 'error');
      }
    } catch (err: any) {
      showToast('Gagal memverifikasi password', 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  // Filtered Lists for Admin
  const filteredAbsensi = useMemo(() => {
    return absensiList.filter(item => {
      const matchAcara = !filterAcaraAdmin || item.acara === filterAcaraAdmin;
      const matchSearch =
        !searchAbsensiAdmin ||
        item.nama?.toLowerCase().includes(searchAbsensiAdmin.toLowerCase()) ||
        item.keterangan?.toLowerCase().includes(searchAbsensiAdmin.toLowerCase());
      return matchAcara && matchSearch;
    });
  }, [absensiList, filterAcaraAdmin, searchAbsensiAdmin]);

  const filteredLaporan = useMemo(() => {
    return laporanList.filter(item => {
      const matchDivisi = !filterDivisiAdmin || item.divisi === filterDivisiAdmin;
      const matchSearch =
        !searchLaporanAdmin ||
        item.namaPelapor?.toLowerCase().includes(searchLaporanAdmin.toLowerCase()) ||
        item.hasilUsaha?.toLowerCase().includes(searchLaporanAdmin.toLowerCase()) ||
        item.evaluasi?.toLowerCase().includes(searchLaporanAdmin.toLowerCase());
      return matchDivisi && matchSearch;
    });
  }, [laporanList, filterDivisiAdmin, searchLaporanAdmin]);

  // Paginated Items
  const paginatedAbsensi = useMemo(() => {
    const start = (pageAbsensi - 1) * PAGE_SIZE;
    return filteredAbsensi.slice(start, start + PAGE_SIZE);
  }, [filteredAbsensi, pageAbsensi]);

  const paginatedAcara = useMemo(() => {
    const start = (pageAcara - 1) * PAGE_SIZE;
    return acaraList.slice(start, start + PAGE_SIZE);
  }, [acaraList, pageAcara]);

  const paginatedLaporan = useMemo(() => {
    const start = (pageLaporan - 1) * PAGE_SIZE;
    return filteredLaporan.slice(start, start + PAGE_SIZE);
  }, [filteredLaporan, pageLaporan]);

  const paginatedDivisi = useMemo(() => {
    const start = (pageDivisi - 1) * PAGE_SIZE;
    return divisiList.slice(start, start + PAGE_SIZE);
  }, [divisiList, pageDivisi]);

  // Format ID Helper
  const formatIndex = (idx: number) => String(idx).padStart(2, '0');

  // KPI Computations
  const totalHadirCount = absensiList.filter(a => a.status?.toLowerCase() === 'hadir').length;
  const onTimePercentage = absensiList.length > 0 ? Math.round((totalHadirCount / absensiList.length) * 100) : 100;
  const izinSakitCount = absensiList.filter(a => ['izin', 'sakit'].includes(a.status?.toLowerCase())).length;

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col relative selection:bg-primary selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : toast.type === 'error'
                ? 'bg-rose-600 text-white shadow-rose-600/30'
                : 'bg-indigo-600 text-white shadow-indigo-600/30'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <HelpCircle size={18} />}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: PORTAL PUBLIK ASATIDZ                         */}
      {/* ==================================================== */}
      {currentView === 'portal' && (
        <div className="flex flex-col flex-1 w-full">
          {/* Top Clean App Header */}
          <header className="fixed top-0 w-full z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-xs pt-safe">
            <div className="h-16 px-4 flex items-center justify-between gap-3 max-w-lg mx-auto">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-md shadow-primary/25 shrink-0">
                  <Fingerprint size={22} />
                </div>
                <div className="flex flex-col min-w-0">
                  <h1 className="text-sm font-extrabold text-on-surface truncate leading-tight tracking-tight">
                    SalApp Asatidz
                  </h1>
                  <span className="text-[11px] text-on-surface-variant truncate font-medium">
                    Portal Presensi &amp; Pelaporan Terpadu
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs text-xs font-semibold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Online</span>
              </div>
            </div>
          </header>

          {/* Main Content Form Area */}
          <main className="flex flex-col relative w-full pt-20 pb-32 px-4 max-w-lg mx-auto space-y-4 flex-1">
            {/* TAB 1: FORM PRESENSI ASATIDZ */}
            {portalTab === 'absensi' && (
              <section className="w-full flex flex-col space-y-4">
                {/* Hero Realtime Clock Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-container to-tertiary p-5 text-on-primary shadow-xl shadow-primary/20">
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-1.5 text-xs text-on-primary-container font-medium">
                      <Clock size={16} />
                      <span>Presensi Resmi Asatidz</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-xs uppercase tracking-wider">
                      Live GPS
                    </span>
                  </div>

                  <div className="my-2 relative z-10">
                    <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {currentTime || '08:00:00 WIB'}
                    </div>
                    <div className="text-xs text-on-primary-container font-medium mt-1 flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{currentDate || 'Memuat tanggal...'}</span>
                    </div>
                  </div>

                  {/* Geofence GPS Status Banner */}
                  <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs relative z-10">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        formAbsenStatus !== 'Hadir' || locationStatus === 'valid' || locationStatus === 'free'
                          ? 'bg-emerald-400 animate-ping'
                          : locationStatus === 'invalid'
                          ? 'bg-red-400 animate-pulse'
                          : 'bg-amber-400 animate-pulse'
                      }`}></div>
                      <span className="text-[11px] text-white/90 font-medium">
                        {formAbsenStatus !== 'Hadir'
                          ? `Status ${formAbsenStatus} • Bebas Radius`
                          : locationStatus === 'valid'
                          ? `Lokasi Sesuai (${locationDistance !== null ? locationDistance + 'm' : 'Akurat'}) • Presensi Valid`
                          : locationStatus === 'free'
                          ? 'Lokasi Bebas (Tanpa Geofence)'
                          : locationStatus === 'invalid'
                          ? `Di Luar Radius Acara (${locationDistance}m)`
                          : locationStatus === 'disabled'
                          ? 'Izin GPS Dibutuhkan'
                          : locationStatus === 'loading'
                          ? 'Mendeteksi koordinat GPS...'
                          : 'Pilih agenda untuk cek radius'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Input Presensi */}
                <form onSubmit={handleSubmitAbsensi} className="flex flex-col space-y-4">
                  {/* Select Acara Kegiatan */}
                  <div className="p-4 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-2">
                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <Calendar size={16} className="text-primary" />
                      <span>Pilih Agenda Kegiatan Asatidz <span className="text-error">*</span></span>
                    </label>
                    <select
                      value={formAbsenAcara}
                      onChange={e => setFormAbsenAcara(e.target.value)}
                      required
                      className="w-full bg-surface-container-low text-on-surface text-xs font-semibold rounded-2xl p-3 focus:outline-none focus:bg-surface-container border border-transparent focus:border-primary transition"
                    >
                      <option value="">-- Pilih Kegiatan --</option>
                      {acaraList
                        .filter(a => !a.isHidden)
                        .map(a => (
                          <option key={a.id} value={a.namaAcara}>
                            {a.namaAcara} ({a.tanggalAcara})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Input Nama Lengkap */}
                  <div className="p-4 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-2">
                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <User size={16} className="text-primary" />
                      <span>Nama Lengkap Asatidz / Pengajar <span className="text-error">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={formAbsenNama}
                      onChange={e => setFormAbsenNama(e.target.value)}
                      placeholder="Contoh: Ust. Dzikri Abdullah"
                      required
                      className="w-full bg-surface-container-low text-on-surface text-xs font-semibold rounded-2xl p-3 focus:outline-none focus:bg-surface-container border border-transparent focus:border-primary transition"
                    />
                  </div>

                  {/* 3 Large Visual Status Buttons */}
                  <div className="p-4 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-2.5">
                    <label className="text-xs font-bold text-on-surface">Pilih Status Kehadiran</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormAbsenStatus('Hadir')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95 ${
                          formAbsenStatus === 'Hadir'
                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                            : 'bg-surface-container-low text-on-surface-variant border-surface-container-high hover:bg-surface-container'
                        }`}
                      >
                        <CheckCircle size={20} className={formAbsenStatus === 'Hadir' ? 'text-white' : 'text-emerald-600'} />
                        <span>Hadir</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormAbsenStatus('Izin')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95 ${
                          formAbsenStatus === 'Izin'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/25'
                            : 'bg-surface-container-low text-on-surface-variant border-surface-container-high hover:bg-surface-container'
                        }`}
                      >
                        <HelpCircle size={20} className={formAbsenStatus === 'Izin' ? 'text-white' : 'text-amber-600'} />
                        <span>Izin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormAbsenStatus('Sakit')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95 ${
                          formAbsenStatus === 'Sakit'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25'
                            : 'bg-surface-container-low text-on-surface-variant border-surface-container-high hover:bg-surface-container'
                        }`}
                      >
                        <AlertCircle size={20} className={formAbsenStatus === 'Sakit' ? 'text-white' : 'text-rose-600'} />
                        <span>Sakit</span>
                      </button>
                    </div>
                  </div>

                  {/* Keterangan Tambahan */}
                  <div className="p-4 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-2">
                    <label className="text-xs font-bold text-on-surface">Keterangan / Alasan (Opsional)</label>
                    <input
                      type="text"
                      value={formAbsenKet}
                      onChange={e => setFormAbsenKet(e.target.value)}
                      placeholder="Misal: Hadir tepat waktu, tugas dinas, izin keperluan dakwah..."
                      className="w-full bg-surface-container-low text-on-surface text-xs font-medium rounded-2xl p-3 focus:outline-none focus:bg-surface-container border border-transparent focus:border-primary transition"
                    />
                  </div>

                  {/* Indikator Geolocation Box (Pelacak GPS Akurat) */}
                  <div className={`p-4 rounded-3xl border transition-all flex items-center justify-between gap-3 shadow-xs ${
                    formAbsenStatus !== 'Hadir' || locationStatus === 'valid' || locationStatus === 'free'
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                      : locationStatus === 'invalid'
                      ? 'bg-red-50/90 border-red-200 text-red-950'
                      : locationStatus === 'disabled'
                      ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                      : 'bg-surface-container-low border-surface-container-high text-on-surface'
                  }`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                        formAbsenStatus !== 'Hadir' || locationStatus === 'valid' || locationStatus === 'free'
                          ? 'bg-emerald-600 text-white'
                          : locationStatus === 'invalid'
                          ? 'bg-red-600 text-white'
                          : locationStatus === 'disabled'
                          ? 'bg-amber-600 text-white'
                          : 'bg-primary text-white'
                      }`}>
                        {locationStatus === 'loading' ? (
                          <RefreshCw size={20} className="animate-spin text-white" />
                        ) : formAbsenStatus !== 'Hadir' || locationStatus === 'valid' ? (
                          <CheckCircle size={22} />
                        ) : locationStatus === 'free' ? (
                          <Radio size={22} />
                        ) : locationStatus === 'invalid' ? (
                          <AlertCircle size={22} />
                        ) : (
                          <MapPin size={22} />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold leading-tight">
                          {formAbsenStatus !== 'Hadir'
                            ? `Lokasi Bebas Valid (Status: ${formAbsenStatus})`
                            : !formAbsenAcara
                            ? 'Pilih Agenda Kegiatan'
                            : locationStatus === 'loading'
                            ? 'Memeriksa Titik Lokasi GPS...'
                            : locationStatus === 'free'
                            ? 'Lokasi Bebas (Tanpa Batas Radius)'
                            : locationStatus === 'valid'
                            ? `GPS Valid (Jarak: ${locationDistance} meter)`
                            : locationStatus === 'invalid'
                            ? `Di Luar Area (Jarak Anda: ${locationDistance}m)`
                            : locationStatus === 'disabled'
                            ? 'Akses GPS Ditolak / Gagal'
                            : 'Memeriksa Titik Lokasi GPS...'}
                        </span>
                        <span className="text-[11px] opacity-80 truncate mt-0.5">
                          {formAbsenStatus !== 'Hadir'
                            ? 'Status izin/sakit tidak dibatasi radius'
                            : !formAbsenAcara
                            ? 'Silakan tentukan agenda hari ini terlebih dahulu'
                            : locationStatus === 'loading'
                            ? 'Mendeteksi koordinat GPS satelit perangkat Anda...'
                            : locationStatus === 'free'
                            ? 'Acara ini tidak mengaktifkan pembatasan geofencing'
                            : locationStatus === 'valid'
                            ? `Radius toleransi ${selectedAcaraObj?.radius || 150}m • Lokasi terverifikasi`
                            : locationStatus === 'invalid'
                            ? `Maksimal toleransi ${selectedAcaraObj?.radius || 150}m dari titik acara`
                            : locationStatus === 'disabled'
                            ? 'Mohon aktifkan izin GPS lokasi pada browser Anda'
                            : 'Mendeteksi koordinat GPS perangkat Anda'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={checkLocation}
                      title="Perbarui Titik Lokasi GPS"
                      className="p-2.5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all flex items-center justify-center shrink-0 shadow-xs border border-surface-container-high active:scale-95"
                    >
                      <RefreshCw size={18} className={locationStatus === 'loading' ? 'animate-spin text-primary' : ''} />
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submittingAbsen}
                    className="w-full py-4 rounded-2xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-container active:scale-95 transition disabled:opacity-50"
                  >
                    {submittingAbsen ? (
                      <>
                        <div className="spinner"></div>
                        <span>Mencatat Presensi...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Kirim Presensi Sekarang</span>
                      </>
                    )}
                  </button>
                </form>
              </section>
            )}

            {/* TAB 2: FORM LAPORAN DIVISI ASATIDZ */}
            {portalTab === 'laporan' && (
              <section className="w-full flex flex-col space-y-4">
                {/* Laporan Header Banner */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-tertiary to-primary text-white shadow-lg shadow-tertiary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold">Laporan Progres Divisi</h2>
                      <p className="text-xs text-white/80 mt-0.5">Input capaian kerja dan realisasi kas asatidz</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                      <FileText size={22} className="text-white" />
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitLaporan} className="flex flex-col space-y-4">
                  {/* Divisi & Periode */}
                  <div className="p-4 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
                    <div>
                      <label className="text-xs font-bold text-on-surface block mb-1.5">
                        Divisi Operasional <span className="text-error">*</span>
                      </label>
                      <select
                        value={lapDivisi}
                        onChange={e => setLapDivisi(e.target.value)}
                        required
                        className="w-full bg-surface-container-low text-on-surface text-xs font-semibold rounded-2xl p-3 focus:outline-none focus:bg-surface-container border border-transparent focus:border-primary transition"
                      >
                        <option value="">Pilih Divisi</option>
                        {divisiList
                          .filter(d => d.status === 'Aktif' || !d.status)
                          .map(d => (
                            <option key={d.id} value={d.namaDivisi}>
                              {d.namaDivisi}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-bold text-on-surface block mb-1">
                          Nama Asatidz Pelapor <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          value={lapPelapor}
                          onChange={e => setLapPelapor(e.target.value)}
                          placeholder="Nama asatidz penanggungjawab"
                          required
                          className="w-full bg-surface-container-low text-on-surface text-xs font-semibold rounded-2xl p-3 focus:outline-none focus:bg-surface-container border border-transparent focus:border-primary transition"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-on-surface block mb-1">Pilihan Cepat Pekan</label>
                        <div className="grid grid-cols-4 gap-1">
                          {['Pekan 1', 'Pekan 2', 'Pekan 3', 'Pekan 4'].map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setLapPeriode(p)}
                              className={`py-2.5 rounded-xl text-[11px] font-bold border transition ${
                                lapPeriode === p
                                  ? 'bg-primary text-white border-primary shadow-xs'
                                  : 'bg-surface-container-low text-on-surface-variant border-surface-container-high hover:bg-surface-container'
                              }`}
                            >
                              {p.replace('Pekan ', 'P')}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hasil Usaha & Capaian */}
                  <div className="p-4 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-2">
                    <label className="text-xs font-bold text-on-surface">1. Hasil Kerja &amp; Capaian Selesai</label>
                    <textarea
                      rows={3}
                      value={lapHasil}
                      onChange={e => setLapHasil(e.target.value)}
                      placeholder="Rangkum hasil kerja selesai pekan ini, halaqah terlaksana, target tercapai..."
                      className="w-full bg-surface-container-low text-on-surface text-xs font-medium rounded-2xl p-3 focus:outline-none focus:bg-surface-container border border-transparent focus:border-primary transition resize-y"
                    ></textarea>
                  </div>

                  {/* Proker Pekan Depan */}
                  <div className="p-4 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-2">
                    <label className="text-xs font-bold text-on-surface">2. Program Kerja Tindak Lanjut Pekan Depan</label>
                    <textarea
                      rows={2}
                      value={lapProker}
                      onChange={e => setLapProker(e.target.value)}
                      placeholder="Rencana tindak lanjut pekan berikutnya..."
                      className="w-full bg-surface-container-low text-on-surface text-xs font-medium rounded-2xl p-3 focus:outline-none focus:bg-surface-container border border-transparent focus:border-primary transition resize-y"
                    ></textarea>
                  </div>

                  {/* Hambatan / Evaluasi */}
                  <div className="p-4 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-2">
                    <label className="text-xs font-bold text-on-surface">3. Evaluasi &amp; Kendala</label>
                    <textarea
                      rows={2}
                      value={lapEvaluasi}
                      onChange={e => setLapEvaluasi(e.target.value)}
                      placeholder="Catatan kendala teknis atau kebutuhan koordinasi..."
                      className="w-full bg-surface-container-low text-on-surface text-xs font-medium rounded-2xl p-3 focus:outline-none focus:bg-surface-container border border-transparent focus:border-primary transition resize-y"
                    ></textarea>
                  </div>

                  {/* Anggaran & Kas */}
                  <div className="p-4 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
                    <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <DollarSign size={16} className="text-primary" />
                      <span>4. Laporan Anggaran &amp; Kas Divisi</span>
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <span className="text-[10px] text-on-surface-variant font-bold block mb-1">Pengeluaran (Rp)</span>
                        <input
                          type="text"
                          value={budgetExpense}
                          onChange={e => setBudgetExpense(e.target.value)}
                          placeholder="0"
                          className="w-full bg-surface-container-low text-on-surface text-xs font-semibold rounded-2xl p-3 focus:outline-none focus:bg-surface-container border border-transparent focus:border-primary transition"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-on-surface-variant font-bold block mb-1">Sisa Saldo Kas (Rp)</span>
                        <input
                          type="text"
                          value={budgetBalance}
                          onChange={e => setBudgetBalance(e.target.value)}
                          placeholder="0"
                          className="w-full bg-surface-container-low text-on-surface text-xs font-semibold rounded-2xl p-3 focus:outline-none focus:bg-surface-container border border-transparent focus:border-primary transition"
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      value={budgetNote}
                      onChange={e => setBudgetNote(e.target.value)}
                      placeholder="Catatan singkat (misal: konsumsi pengajian, atk halaqah)..."
                      className="w-full bg-surface-container-low text-on-surface text-xs font-medium rounded-2xl p-3 focus:outline-none focus:bg-surface-container border border-transparent focus:border-primary transition"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submittingLaporan}
                    className="w-full py-4 rounded-2xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary-container active:scale-95 transition disabled:opacity-50"
                  >
                    {submittingLaporan ? (
                      <>
                        <div className="spinner"></div>
                        <span>Mengirim Laporan...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Kirim Laporan Divisi</span>
                      </>
                    )}
                  </button>
                </form>
              </section>
            )}
          </main>

          {/* Floating Dock Navigation Bar ("Kece") */}
          <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md">
            <div className="flex items-center justify-between p-1.5 bg-surface-container-lowest/90 backdrop-blur-2xl rounded-full border border-surface-container-high/90 shadow-[0_16px_40px_rgba(27,27,31,0.14),0_2px_12px_rgba(53,37,205,0.08)]">
              {/* Presensi Tab */}
              <button
                type="button"
                onClick={() => setPortalTab('absensi')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-full text-xs transition-all duration-300 active:scale-95 ${
                  portalTab === 'absensi'
                    ? 'bg-primary text-white font-bold shadow-md shadow-primary/25'
                    : 'text-on-surface-variant hover:text-on-surface font-semibold'
                }`}
              >
                <Fingerprint size={18} />
                <span>Presensi</span>
              </button>

              {/* Laporan Tab */}
              <button
                type="button"
                onClick={() => setPortalTab('laporan')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-full text-xs transition-all duration-300 active:scale-95 ${
                  portalTab === 'laporan'
                    ? 'bg-primary text-white font-bold shadow-md shadow-primary/25'
                    : 'text-on-surface-variant hover:text-on-surface font-semibold'
                }`}
              >
                <FileText size={18} />
                <span>Laporan</span>
              </button>

              {/* Admin Link */}
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-full text-xs text-on-surface-variant hover:text-primary font-semibold transition-all duration-300 active:scale-95"
              >
                <Shield size={18} className="text-secondary" />
                <span>Admin</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: LOGIN ADMIN                                  */}
      {/* ==================================================== */}
      {currentView === 'login' && (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high w-full max-w-sm p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setCurrentView('portal')}
              className="absolute top-5 left-5 text-on-surface-variant hover:text-on-surface p-1 rounded-xl transition"
            >
              <ArrowLeft size={22} />
            </button>

            <div className="text-center mb-6 mt-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-fixed text-primary mb-3 shadow-xs">
                <Shield size={32} />
              </div>
              <h2 className="text-lg font-extrabold text-on-surface">Konsol SalApp Asatidz</h2>
              <p className="text-xs text-on-surface-variant mt-1">Masukkan kata sandi pengelola internal</p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showAdminPass ? "text" : "password"}
                  value={adminPass}
                  onChange={e => setAdminPass(e.target.value)}
                  placeholder="Masukkan Password"
                  required
                  className="w-full pl-4 pr-11 py-3 bg-surface-container-low rounded-2xl text-xs font-semibold text-on-surface outline-none border border-surface-container-high focus:border-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 transition"
                  title={showAdminPass ? "Sembunyikan password" : "Lihat password"}
                >
                  {showAdminPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-[11px] text-on-surface-variant text-center">
                Sandi bawaan: <code className="font-mono text-primary font-bold">admin123</code> atau <code className="font-mono text-primary font-bold">admin</code>
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3.5 rounded-2xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/25 hover:bg-primary-container active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loggingIn ? (
                  <>
                    <div className="spinner"></div>
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('portal')}
                className="w-full py-2.5 text-xs font-bold text-on-surface-variant hover:text-on-surface transition text-center"
              >
                Kembali ke Portal Presensi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: ADMIN DASHBOARD (DESKTOP & MOBILE)             */}
      {/* ==================================================== */}
      {currentView === 'admin' && (
        <div className="min-h-screen bg-background flex flex-col">
          {/* Admin Fixed Top Header (Clean, Spacious, No Duplicate Tabs) */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high shadow-xs h-16">
            <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
              {/* Brand Logo & Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold shadow-md shadow-primary/20 shrink-0">
                  <Shield size={22} />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-sm font-extrabold text-on-surface leading-tight tracking-tight">
                    SalApp Asatidz &bull; Admin
                  </h2>
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                    Sistem Operasional Salman
                  </span>
                </div>
              </div>

              {/* Profile & Actions */}
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-surface-container-low border border-surface-container-high">
                  <div className="w-7 h-7 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs">
                    <User size={16} />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-on-surface leading-tight">Admin Asatidz</span>
                    <span className="text-[9px] text-on-surface-variant font-medium">Super Admin</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentView('portal')}
                  className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary text-xs font-bold transition flex items-center gap-1.5 border border-surface-container-high active:scale-95"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Portal Asatidz</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('portal');
                    showToast('Berhasil keluar dari admin', 'info');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-error-container hover:bg-red-200 text-error text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </div>
          </header>

          {/* Desktop Fixed Sidebar (280px w-64) */}
          <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest border-r border-surface-container-high shadow-xs z-30 hidden lg:flex flex-col justify-between py-6 px-4">
            <div className="flex flex-col space-y-6">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-3 mb-2">
                  Navigasi Utama
                </p>
                <nav className="flex flex-col space-y-1">
                  <button
                    type="button"
                    onClick={() => setAdminTab('absensi')}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs transition active:scale-95 ${
                      adminTab === 'absensi'
                        ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium'
                    }`}
                  >
                    <Fingerprint size={20} />
                    <span>Data Presensi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminTab('acara')}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs transition active:scale-95 ${
                      adminTab === 'acara'
                        ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium'
                    }`}
                  >
                    <Calendar size={20} />
                    <span>Manajemen Acara</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminTab('laporan')}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs transition active:scale-95 ${
                      adminTab === 'laporan'
                        ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium'
                    }`}
                  >
                    <FileText size={20} />
                    <span>Laporan Divisi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminTab('divisi')}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs transition active:scale-95 ${
                      adminTab === 'divisi'
                        ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low font-medium'
                    }`}
                  >
                    <Building size={20} />
                    <span>Kelola Divisi</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Sidebar Bottom Sync Badge */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Cloud Realtime Sync</span>
                <span className="text-[10px] text-on-surface-variant">Terhubung Google Sheets</span>
              </div>
            </div>
          </aside>

          {/* Admin Main Workspace (Offset for Desktop Sidebar) */}
          <main className="w-full lg:pl-64 pt-20 pb-24 lg:pb-12 px-4 sm:px-6 lg:px-8 space-y-6">
            {/* ==================================================== */}
            {/* TAB 1: DATA PRESENSI                                */}
            {/* ==================================================== */}
            {adminTab === 'absensi' && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                      Data Kehadiran &amp; Presensi Asatidz
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Monitoring presensi aktif seluruh halaqah dan kegiatan asatidz secara real-time.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchAbsensiData}
                      className="px-3.5 py-2.5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant font-bold text-xs transition border border-surface-container-high shadow-xs flex items-center gap-1.5 active:scale-95"
                    >
                      <RefreshCw size={16} className={loadingAbsensi ? 'animate-spin' : ''} />
                      <span>Segarkan</span>
                    </button>
                  </div>
                </div>

                {/* 4 KPI Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Total Presensi</span>
                      <div className="w-10 h-10 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center">
                        <Fingerprint size={20} />
                      </div>
                    </div>
                    <div>
                      <span className="text-3xl font-extrabold text-on-surface font-sans">{absensiList.length}</span>
                      <p className="text-[11px] text-emerald-600 font-bold mt-1">Presensi aktif tercatat</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Hadir Tepat Waktu</span>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle size={20} />
                      </div>
                    </div>
                    <div>
                      <span className="text-3xl font-extrabold text-on-surface font-sans">{totalHadirCount}</span>
                      <p className="text-[11px] text-primary font-bold mt-1">Tingkat Disiplin {onTimePercentage}%</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Izin &amp; Sakit</span>
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <AlertCircle size={20} />
                      </div>
                    </div>
                    <div>
                      <span className="text-3xl font-extrabold text-on-surface font-sans">{izinSakitCount}</span>
                      <p className="text-[11px] text-amber-700 font-medium mt-1">Berkas &amp; alasan ditinjau</p>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Agenda Berjalan</span>
                      <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                        <Calendar size={20} />
                      </div>
                    </div>
                    <div>
                      <span className="text-3xl font-extrabold text-on-surface font-sans">{new Set(absensiList.map(a => a.acara)).size}</span>
                      <p className="text-[11px] text-purple-700 font-medium mt-1">Halaqah &amp; kajian aktif</p>
                    </div>
                  </div>
                </div>

                {/* Filter & Export Bar */}
                <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-surface-container-lowest p-4 rounded-3xl border border-surface-container-high shadow-xs">
                  <div className="flex flex-wrap items-center gap-2.5 flex-1">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                      <input
                        type="text"
                        value={searchAbsensiAdmin}
                        onChange={e => {
                          setSearchAbsensiAdmin(e.target.value);
                          setPageAbsensi(1);
                        }}
                        placeholder="Cari nama asatidz atau keterangan..."
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low rounded-2xl text-xs font-medium text-on-surface outline-none border border-transparent focus:border-primary transition"
                      />
                    </div>

                    <div className="relative min-w-[180px]">
                      <select
                        value={filterAcaraAdmin}
                        onChange={e => {
                          setFilterAcaraAdmin(e.target.value);
                          setPageAbsensi(1);
                        }}
                        className="w-full px-4 py-2.5 bg-surface-container-low rounded-2xl text-xs font-semibold text-on-surface outline-none border border-transparent focus:border-primary transition"
                      >
                        <option value="">Semua Agenda Acara</option>
                        {[...new Set(absensiList.map(a => a.acara))].filter(Boolean).map(ac => (
                          <option key={ac} value={ac}>
                            {ac}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => exportExcelPresensi(filteredAbsensi, filterAcaraAdmin)}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95"
                    >
                      <Download size={16} />
                      <span>Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportPdfPresensi(filteredAbsensi, filterAcaraAdmin)}
                      className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95"
                    >
                      <Download size={16} />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Paginated Table Card */}
                <div className="bg-surface-container-lowest rounded-3xl shadow-xs border border-surface-container-high overflow-x-auto hide-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant text-[11px] border-b border-surface-container-high font-bold uppercase tracking-wider">
                        <th className="p-4 w-12 text-center">NO</th>
                        <th className="p-4 whitespace-nowrap">WAKTU</th>
                        <th className="p-4 whitespace-nowrap">NAMA ASATIDZ</th>
                        <th className="p-4 whitespace-nowrap">AGENDA ACARA</th>
                        <th className="p-4 whitespace-nowrap text-center">STATUS</th>
                        <th className="p-4 min-w-[160px]">KETERANGAN / GPS</th>
                        <th className="p-4 text-center whitespace-nowrap">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-surface-container-high">
                      {paginatedAbsensi.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center p-8 text-on-surface-variant font-medium">
                            {loadingAbsensi ? 'Memuat data presensi...' : 'Tidak ada data presensi yang sesuai.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedAbsensi.map((item, idx) => {
                          const actualIdx = (pageAbsensi - 1) * PAGE_SIZE + idx + 1;
                          const initials = (item.nama || 'AS')
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                          return (
                            <tr key={item.id || idx} className="hover:bg-surface-container-low transition-colors">
                              <td className="p-4 text-center font-bold text-on-surface-variant">{formatIndex(actualIdx)}</td>
                              <td className="p-4 whitespace-nowrap font-mono text-[11px]">{item.waktu || '-'}</td>
                              <td className="p-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                    {initials}
                                  </div>
                                  <div>
                                    <p className="font-bold text-on-surface leading-tight">{item.nama}</p>
                                    <span className="text-[10px] text-on-surface-variant font-mono uppercase">ID: ASATIDZ-{item.id}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 whitespace-nowrap font-medium text-on-surface text-xs">{item.acara}</td>
                              <td className="p-4 text-center whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${
                                    item.status?.toLowerCase() === 'hadir'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : item.status?.toLowerCase() === 'izin'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {item.status?.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-4 text-xs text-on-surface-variant font-medium">{item.keterangan || '-'}</td>
                              <td className="p-4 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setModalEditAbsen({ open: true, item })}
                                  className="text-primary bg-primary-fixed hover:bg-primary-container hover:text-white p-2 rounded-xl transition mr-1"
                                  title="Edit Presensi"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm('Yakin ingin menghapus presensi ini?')) {
                                      await fetch(`/api/absensi?id=${item.id}&rowIndex=${item.rowIndex || ''}`, { method: 'DELETE' });
                                      showToast('Presensi berhasil dihapus!');
                                      fetchAbsensiData();
                                    }
                                  }}
                                  className="text-error bg-error-container hover:bg-red-200 p-2 rounded-xl transition"
                                  title="Hapus Presensi"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Pagination Bar */}
                  <div className="px-5 py-3.5 bg-surface-container-low/70 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-on-surface-variant font-medium text-center sm:text-left">
                      Menampilkan{' '}
                      <span className="font-bold text-on-surface">
                        {filteredAbsensi.length > 0 ? (pageAbsensi - 1) * PAGE_SIZE + 1 : 0} -{' '}
                        {Math.min(pageAbsensi * PAGE_SIZE, filteredAbsensi.length)}
                      </span>{' '}
                      dari <span className="font-bold text-on-surface">{filteredAbsensi.length}</span> data (Hal. {pageAbsensi}/
                      {Math.max(1, Math.ceil(filteredAbsensi.length / PAGE_SIZE))})
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPageAbsensi(p => Math.max(1, p - 1))}
                        disabled={pageAbsensi <= 1}
                        className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs transition flex items-center gap-1"
                      >
                        <ChevronLeft size={16} />
                        <span className="hidden sm:inline">Sebelumnya</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPageAbsensi(p => Math.min(Math.ceil(filteredAbsensi.length / PAGE_SIZE), p + 1))}
                        disabled={pageAbsensi >= Math.ceil(filteredAbsensi.length / PAGE_SIZE)}
                        className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs transition flex items-center gap-1"
                      >
                        <span className="hidden sm:inline">Berikutnya</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 2: MANAJEMEN ACARA                              */}
            {/* ==================================================== */}
            {adminTab === 'acara' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">Manajemen Agenda Acara</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Kelola jadwal pengajian, halaqah, koordinasi GPS geofencing toleransi jarak.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalAcara({ open: true })}
                      className="px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary-container text-white font-bold text-xs transition shadow-md shadow-primary/25 flex items-center gap-1.5 active:scale-95"
                    >
                      <Plus size={18} />
                      <span>Tambah Acara Baru</span>
                    </button>
                    <button
                      type="button"
                      onClick={fetchAcaraData}
                      className="p-2.5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant font-bold text-xs transition border border-surface-container-high shadow-xs"
                    >
                      <RefreshCw size={18} className={loadingAcara ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {/* Table Acara */}
                <div className="bg-surface-container-lowest rounded-3xl shadow-xs border border-surface-container-high overflow-x-auto hide-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant text-[11px] border-b border-surface-container-high font-bold uppercase tracking-wider">
                        <th className="p-4 w-12 text-center">NO</th>
                        <th className="p-4 whitespace-nowrap">NAMA AGENDA</th>
                        <th className="p-4 whitespace-nowrap">TANGGAL</th>
                        <th className="p-4 whitespace-nowrap text-center">STATUS</th>
                        <th className="p-4 whitespace-nowrap">RADIUS GPS</th>
                        <th className="p-4 text-center whitespace-nowrap">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-surface-container-high">
                      {paginatedAcara.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-surface-container-low transition-colors">
                          <td className="p-4 text-center font-bold text-on-surface-variant">{formatIndex(idx + 1)}</td>
                          <td className="p-4 font-bold text-on-surface text-xs sm:text-sm whitespace-nowrap">{item.namaAcara}</td>
                          <td className="p-4 text-xs font-medium text-on-surface-variant whitespace-nowrap">{item.tanggalAcara}</td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                item.isHidden
                                  ? 'bg-surface-container text-on-surface-variant'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {item.isHidden ? 'DISEMBUNYIKAN' : 'TAMPIL'}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-on-surface-variant whitespace-nowrap font-medium">
                            Toleransi: {item.radius || 150}m
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={async () => {
                                await fetch('/api/acara', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: item.id, rowIndex: item.rowIndex, isHidden: !item.isHidden }),
                                });
                                showToast('Status acara diubah!');
                                fetchAcaraData();
                              }}
                              className="text-on-surface-variant hover:text-primary p-2 rounded-xl hover:bg-surface-container transition mr-1"
                              title={item.isHidden ? 'Tampilkan' : 'Sembunyikan'}
                            >
                              {item.isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setModalAcara({ open: true, item })}
                              className="text-primary bg-primary-fixed hover:bg-primary-container hover:text-white p-2 rounded-xl transition mr-1"
                              title="Edit Acara"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm('Yakin ingin menghapus acara ini?')) {
                                  await fetch(`/api/acara?id=${item.id}&rowIndex=${item.rowIndex || ''}`, { method: 'DELETE' });
                                  showToast('Acara berhasil dihapus!');
                                  fetchAcaraData();
                                }
                              }}
                              className="text-error bg-error-container hover:bg-red-200 p-2 rounded-xl transition"
                              title="Hapus Acara"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 3: LAPORAN DIVISI                               */}
            {/* ==================================================== */}
            {adminTab === 'laporan' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">Laporan Divisi Masuk</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Verifikasi capaian kerja divisi, evaluasi hambatan, dan realisasi kas per pekan.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => exportExcelLaporan(filteredLaporan, filterDivisiAdmin)}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95"
                    >
                      <Download size={16} />
                      <span>Excel</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => exportPdfLaporan(filteredLaporan, filterDivisiAdmin)}
                      className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95"
                    >
                      <Download size={16} />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Table Laporan */}
                <div className="bg-surface-container-lowest rounded-3xl shadow-xs border border-surface-container-high overflow-x-auto hide-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant text-[11px] border-b border-surface-container-high font-bold uppercase tracking-wider">
                        <th className="p-4 w-12 text-center">NO</th>
                        <th className="p-4 whitespace-nowrap">DIVISI</th>
                        <th className="p-4 whitespace-nowrap">PELAPOR &amp; PERIODE</th>
                        <th className="p-4 min-w-[200px]">RINGKASAN CAPAIAN</th>
                        <th className="p-4 whitespace-nowrap">ANGGARAN &amp; KAS</th>
                        <th className="p-4 text-center whitespace-nowrap">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-surface-container-high">
                      {paginatedLaporan.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-surface-container-low transition-colors">
                          <td className="p-4 text-center font-bold text-on-surface-variant">{formatIndex(idx + 1)}</td>
                          <td className="p-4 whitespace-nowrap font-bold text-primary">{item.divisi}</td>
                          <td className="p-4 whitespace-nowrap">
                            <p className="font-bold text-on-surface">{item.namaPelapor}</p>
                            <span className="text-[11px] text-on-surface-variant font-medium">{item.periode}</span>
                          </td>
                          <td className="p-4 min-w-[200px]">
                            <p className="text-xs text-on-surface line-clamp-2 leading-relaxed">{item.hasilUsaha}</p>
                          </td>
                          <td className="p-4 text-xs font-mono text-on-surface-variant whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg bg-surface-container-low font-semibold text-primary">
                              {item.laporanDana}
                            </span>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setModalDetailLaporan({ open: true, item })}
                              className="text-primary bg-primary-fixed hover:bg-primary-container hover:text-white p-2 rounded-xl transition mr-1"
                              title="Lihat Detail Laporan"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setModalEditLaporan({ open: true, item })}
                              className="text-on-surface-variant hover:text-primary bg-surface-container hover:bg-surface-container-high p-2 rounded-xl transition mr-1"
                              title="Edit Laporan"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm('Yakin ingin menghapus laporan ini?')) {
                                  await fetch(`/api/laporan?id=${item.id}&rowIndex=${item.rowIndex || ''}`, { method: 'DELETE' });
                                  showToast('Laporan berhasil dihapus!');
                                  fetchLaporanData();
                                }
                              }}
                              className="text-error bg-error-container hover:bg-red-200 p-2 rounded-xl transition"
                              title="Hapus Laporan"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 4: KELOLA DIVISI                                */}
            {/* ==================================================== */}
            {adminTab === 'divisi' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">Kelola Struktur Divisi</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Daftar divisi operasional asatidz yang terintegrasi langsung dengan formulir laporan.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalDivisi({ open: true })}
                      className="px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary-container text-white font-bold text-xs transition shadow-md shadow-primary/25 flex items-center gap-1.5 active:scale-95"
                    >
                      <Plus size={18} />
                      <span>Tambah Divisi Baru</span>
                    </button>
                    <button
                      type="button"
                      onClick={fetchDivisiData}
                      className="p-2.5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant font-bold text-xs transition border border-surface-container-high shadow-xs"
                    >
                      <RefreshCw size={18} className={loadingDivisi ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {/* Table Divisi */}
                <div className="bg-surface-container-lowest rounded-3xl shadow-xs border border-surface-container-high overflow-x-auto hide-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant text-[11px] border-b border-surface-container-high font-bold uppercase tracking-wider">
                        <th className="p-4 w-12 text-center">NO</th>
                        <th className="p-4 whitespace-nowrap">NAMA DIVISI</th>
                        <th className="p-4">KETERANGAN / DESKRIPSI PERAN</th>
                        <th className="p-4 whitespace-nowrap text-center">STATUS</th>
                        <th className="p-4 text-center whitespace-nowrap">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-surface-container-high">
                      {paginatedDivisi.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-surface-container-low transition-colors">
                          <td className="p-4 text-center font-bold text-on-surface-variant">{formatIndex(idx + 1)}</td>
                          <td className="p-4 whitespace-nowrap font-bold text-on-surface">{item.namaDivisi}</td>
                          <td className="p-4 text-xs text-on-surface-variant font-medium">{item.keterangan || '-'}</td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                item.status === 'Aktif' || !item.status
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-surface-container text-on-surface-variant'
                              }`}
                            >
                              {item.status || 'Aktif'}
                            </span>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setModalDivisi({ open: true, item })}
                              className="text-primary bg-primary-fixed hover:bg-primary-container hover:text-white p-2 rounded-xl transition mr-1"
                              title="Edit Divisi"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm('Yakin ingin menghapus divisi ini?')) {
                                  await fetch(`/api/divisi?id=${item.id}&rowIndex=${item.rowIndex || ''}`, { method: 'DELETE' });
                                  showToast('Divisi berhasil dihapus!');
                                  fetchDivisiData();
                                }
                              }}
                              className="text-error bg-error-container hover:bg-red-200 p-2 rounded-xl transition"
                              title="Hapus Divisi"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>

          {/* Admin Mobile Bottom Bar (lg:hidden) */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden pb-safe bg-surface-container-lowest/95 backdrop-blur-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-surface-container-high">
            <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
              <button
                type="button"
                onClick={() => setAdminTab('absensi')}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition gap-0.5 ${
                  adminTab === 'absensi' ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'
                }`}
              >
                <Fingerprint size={20} />
                <span className="text-[10px]">Presensi</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('acara')}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition gap-0.5 ${
                  adminTab === 'acara' ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'
                }`}
              >
                <Calendar size={20} />
                <span className="text-[10px]">Acara</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('laporan')}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition gap-0.5 ${
                  adminTab === 'laporan' ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'
                }`}
              >
                <FileText size={20} />
                <span className="text-[10px]">Laporan</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('divisi')}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition gap-0.5 ${
                  adminTab === 'divisi' ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'
                }`}
              >
                <Building size={20} />
                <span className="text-[10px]">Divisi</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: KELOLA DIVISI (TAMBAH / EDIT)                 */}
      {/* ==================================================== */}
      {modalDivisi.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high w-full max-w-sm overflow-hidden">
            <div className="bg-surface-container-low px-5 py-4 border-b border-surface-container-high flex justify-between items-center">
              <h3 className="font-bold text-sm text-on-surface">
                {modalDivisi.item ? 'Edit Divisi' : 'Tambah Divisi Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalDivisi({ open: false })}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const form = e.currentTarget;
                const nama = (form.elements.namedItem('namaDivisi') as HTMLInputElement).value.trim();
                const ket = (form.elements.namedItem('keterangan') as HTMLInputElement).value.trim();
                const status = (form.elements.namedItem('status') as HTMLSelectElement).value;

                setModalDivisi({ open: false });
                showToast('Menyimpan data divisi...');

                if (modalDivisi.item) {
                  await fetch('/api/divisi', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: modalDivisi.item.id, rowIndex: modalDivisi.item.rowIndex, data: { namaDivisi: nama, keterangan: ket, status } }),
                  });
                } else {
                  await fetch('/api/divisi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ namaDivisi: nama, keterangan: ket, status }),
                  });
                }
                showToast('Divisi berhasil disimpan!');
                fetchDivisiData();
              }}
              className="p-5 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Nama Divisi <span className="text-error">*</span>
                </label>
                <input
                  name="namaDivisi"
                  defaultValue={modalDivisi.item?.namaDivisi || ''}
                  required
                  placeholder="Contoh: Divisi Keuangan & Usaha"
                  className="w-full border border-surface-container-high rounded-xl p-3 text-xs outline-none focus:border-primary bg-surface-container-low"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Keterangan / Peran</label>
                <input
                  name="keterangan"
                  defaultValue={modalDivisi.item?.keterangan || ''}
                  placeholder="Contoh: Mengelola dana kas & sarana asatidz"
                  className="w-full border border-surface-container-high rounded-xl p-3 text-xs outline-none focus:border-primary bg-surface-container-low"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Status Divisi</label>
                <select
                  name="status"
                  defaultValue={modalDivisi.item?.status || 'Aktif'}
                  className="w-full border border-surface-container-high rounded-xl p-3 text-xs outline-none focus:border-primary bg-surface-container-low"
                >
                  <option value="Aktif">Aktif (Tampil di form laporan)</option>
                  <option value="Non-Aktif">Non-Aktif (Sembunyikan)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md transition"
              >
                Simpan Divisi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: TAMBAH / EDIT ACARA                           */}
      {/* ==================================================== */}
      {modalAcara.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high w-full max-w-sm overflow-hidden">
            <div className="bg-surface-container-low px-5 py-4 border-b border-surface-container-high flex justify-between items-center">
              <h3 className="font-bold text-sm text-on-surface">{modalAcara.item ? 'Edit Acara' : 'Tambah Acara Baru'}</h3>
              <button
                type="button"
                onClick={() => setModalAcara({ open: false })}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const form = e.currentTarget;
                const nama = (form.elements.namedItem('namaAcara') as HTMLInputElement).value.trim();
                const tgl = (form.elements.namedItem('tanggalAcara') as HTMLInputElement).value;
                const radius = parseInt((form.elements.namedItem('radius') as HTMLInputElement).value) || 150;

                setModalAcara({ open: false });
                showToast('Menyimpan data acara...');

                if (modalAcara.item) {
                  await fetch('/api/acara', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: modalAcara.item.id, rowIndex: modalAcara.item.rowIndex, namaAcara: nama, tanggalAcara: tgl, radius }),
                  });
                } else {
                  await fetch('/api/acara', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ namaAcara: nama, tanggalAcara: tgl, radius }),
                  });
                }
                showToast('Acara berhasil disimpan!');
                fetchAcaraData();
              }}
              className="p-5 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Nama Agenda Kegiatan <span className="text-error">*</span>
                </label>
                <input
                  name="namaAcara"
                  defaultValue={modalAcara.item?.namaAcara || ''}
                  required
                  placeholder="Contoh: Pengajian Kamisan Asatidz"
                  className="w-full border border-surface-container-high rounded-xl p-3 text-xs outline-none focus:border-primary bg-surface-container-low"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Tanggal Kegiatan <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  name="tanggalAcara"
                  defaultValue={modalAcara.item?.tanggalAcara || new Date().toISOString().split('T')[0]}
                  required
                  className="w-full border border-surface-container-high rounded-xl p-3 text-xs outline-none focus:border-primary bg-surface-container-low"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Radius Toleransi GPS (Meter)</label>
                <input
                  type="number"
                  name="radius"
                  defaultValue={modalAcara.item?.radius || 150}
                  required
                  min={10}
                  className="w-full border border-surface-container-high rounded-xl p-3 text-xs outline-none focus:border-primary bg-surface-container-low"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md transition"
              >
                Simpan Agenda
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: DETAIL REVIEW LAPORAN DIVISI                  */}
      {/* ==================================================== */}
      {modalDetailLaporan.open && modalDetailLaporan.item && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-primary p-5 text-white flex justify-between items-start">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white mb-1.5 inline-block">
                  {modalDetailLaporan.item.divisi}
                </span>
                <h3 className="text-base font-bold leading-tight">Detail Laporan Progres Asatidz</h3>
                <p className="text-xs text-white/80 mt-1">
                  Oleh: {modalDetailLaporan.item.namaPelapor} &bull; Periode: {modalDetailLaporan.item.periode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalDetailLaporan({ open: false })}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high">
                <span className="text-[11px] font-bold text-on-surface-variant block mb-1">1. Hasil Usaha &amp; Capaian:</span>
                <p className="text-xs text-on-surface font-medium leading-relaxed">{modalDetailLaporan.item.hasilUsaha}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high">
                <span className="text-[11px] font-bold text-on-surface-variant block mb-1">2. Program Kerja Pekan Depan:</span>
                <p className="text-xs text-on-surface font-medium leading-relaxed">{modalDetailLaporan.item.programKerja}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high">
                <span className="text-[11px] font-bold text-on-surface-variant block mb-1">3. Evaluasi &amp; Kendala:</span>
                <p className="text-xs text-on-surface font-medium leading-relaxed">{modalDetailLaporan.item.evaluasi}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
                <span className="text-[11px] font-bold text-purple-800 block mb-1">4. Laporan Dana &amp; Realisasi Kas:</span>
                <p className="text-xs text-purple-950 font-bold font-mono">{modalDetailLaporan.item.laporanDana}</p>
              </div>
            </div>

            <div className="p-4 bg-surface-container-low border-t border-surface-container-high flex justify-end">
              <button
                type="button"
                onClick={() => setModalDetailLaporan({ open: false })}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs"
              >
                Tutup Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
