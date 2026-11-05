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
  AlertTriangle,
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
import { getDistanceFromLatLonInM, formatDistance, extractCoordinates, parseCoordinate } from '@/lib/geo-utils';
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
  const [inputAcaraLat, setInputAcaraLat] = useState<string>('');
  const [inputAcaraLng, setInputAcaraLng] = useState<string>('');
  const [inputAcaraMapLink, setInputAcaraMapLink] = useState<string>('');

  useEffect(() => {
    if (modalAcara.open) {
      setInputAcaraLat(modalAcara.item?.lat ? String(modalAcara.item.lat) : '');
      setInputAcaraLng(modalAcara.item?.lng ? String(modalAcara.item.lng) : '');
      setInputAcaraMapLink(modalAcara.item?.mapLink || '');
    }
  }, [modalAcara.open, modalAcara.item]);

  const [modalEditAbsen, setModalEditAbsen] = useState<{ open: boolean; item?: AbsensiRecord }>({ open: false });
  const [modalDivisi, setModalDivisi] = useState<{ open: boolean; item?: DivisiItem }>({ open: false });
  const [modalDetailLaporan, setModalDetailLaporan] = useState<{ open: boolean; item?: LaporanItem }>({ open: false });
  const [modalEditLaporan, setModalEditLaporan] = useState<{ open: boolean; item?: LaporanItem }>({ open: false });

  // Custom Confirmation Dialog Modal State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const requestConfirm = (options: {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      open: true,
      title: options.title || 'Konfirmasi Tindakan',
      message: options.message,
      confirmLabel: options.confirmLabel || 'Lanjutkan',
      cancelLabel: options.cancelLabel || 'Batal',
      isDanger: options.isDanger !== false,
      onConfirm: options.onConfirm,
    });
  };

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

  // Auto-select or sync selected acara when events load or get hidden
  useEffect(() => {
    const visible = acaraList.filter(a => !a.isHidden);
    if (visible.length === 1 && !formAbsenAcara) {
      setFormAbsenAcara(visible[0].namaAcara);
    } else if (formAbsenAcara && !visible.some(a => a.namaAcara === formAbsenAcara)) {
      setFormAbsenAcara(visible.length > 0 ? visible[0].namaAcara : '');
    }
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

    let targetLat = parseCoordinate(selectedAcaraObj?.lat, 'lat');
    let targetLng = parseCoordinate(selectedAcaraObj?.lng, 'lng');

    if ((isNaN(targetLat) || isNaN(targetLng) || !targetLat || !targetLng) && selectedAcaraObj?.mapLink) {
      const extracted = extractCoordinates(selectedAcaraObj.mapLink);
      if (extracted.lat && extracted.lng) {
        targetLat = parseCoordinate(extracted.lat, 'lat');
        targetLng = parseCoordinate(extracted.lng, 'lng');
      }
    }

    if (isNaN(targetLat) || isNaN(targetLng) || !targetLat || !targetLng) {
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

        const dist = Math.round(getDistanceFromLatLonInM(uLat, uLng, targetLat, targetLng));
        setLocationDistance(dist);

        const allowedRadius = Number(selectedAcaraObj?.radius) || 150;
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

  // LocalStorage Helpers for offline / instant persistence
  const getStoredList = <T,>(key: string): T[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  };

  const saveStoredList = <T,>(key: string, list: T[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch { }
  };

  const addStoredKey = (storageKey: string, idOrKey: string) => {
    if (typeof window === 'undefined') return;
    try {
      const list = getStoredList<string>(storageKey);
      if (!list.includes(idOrKey)) {
        list.push(idOrKey);
        saveStoredList(storageKey, list);
      }
    } catch { }
  };

  const removeStoredKey = (storageKey: string, idOrKey: string) => {
    if (typeof window === 'undefined') return;
    try {
      const list = getStoredList<string>(storageKey);
      const filtered = list.filter(k => k !== idOrKey && k.toLowerCase() !== idOrKey.toLowerCase());
      saveStoredList(storageKey, filtered);
    } catch { }
  };

  // Sanitize stored deleted keys on load to purge any accidental event/divisi name strings
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const purgeNamesFromDeletedStore = (storageKey: string) => {
      try {
        const list = getStoredList<string>(storageKey);
        // Only keep numeric strings or structured entity IDs (e.g. "17308...", "2", "ASATIDZ-...")
        const cleaned = list.filter(k => /^\d+$/.test(k) || /^[A-Z0-9]+-\d+$/i.test(k));
        saveStoredList(storageKey, cleaned);
      } catch { }
    };
    purgeNamesFromDeletedStore('salapp_deleted_acara');
    purgeNamesFromDeletedStore('salapp_deleted_divisi');
    purgeNamesFromDeletedStore('salapp_deleted_laporan');
    purgeNamesFromDeletedStore('salapp_deleted_absensi');
  }, []);

  // Data Fetchers with Hybrid Local Sync
  const fetchAbsensiData = async () => {
    setLoadingAbsensi(true);
    try {
      const res = await fetch('/api/absensi');
      const json = await res.json();
      if (json.success) {
        const deletedKeys = getStoredList<string>('salapp_deleted_absensi');
        const customAdded = getStoredList<AbsensiRecord>('salapp_custom_absensi');
        const editedMap = new Map<string, Partial<AbsensiRecord>>(
          getStoredList<[string, Partial<AbsensiRecord>]>('salapp_edited_absensi')
        );

        const isDeleted = (id?: string | number, rowIndex?: string | number) =>
          (id && deletedKeys.includes(String(id))) ||
          (rowIndex && deletedKeys.includes(String(rowIndex)));

        const activeCustom = customAdded
          .filter(r => !isDeleted(r.id, r.rowIndex))
          .map(r => {
            const edit = editedMap.get(String(r.id)) || editedMap.get(String(r.rowIndex));
            return edit ? { ...r, ...edit } : r;
          });

        const serverMerged = (json.data || [])
          .filter((r: AbsensiRecord) => !isDeleted(r.id, r.rowIndex))
          .map((r: AbsensiRecord) => {
            const edit = editedMap.get(String(r.id)) || editedMap.get(String(r.rowIndex));
            return edit ? { ...r, ...edit } : r;
          });

        const seen = new Set<string>();
        const finalAbsensiList: AbsensiRecord[] = [];

        for (const item of [...activeCustom, ...serverMerged]) {
          const idKey = String(item.id || item.rowIndex);
          const contentKey = `${item.acara}_${item.nama}_${item.waktu}`.toLowerCase();
          if (!seen.has(idKey) && !seen.has(contentKey)) {
            seen.add(idKey);
            seen.add(contentKey);
            finalAbsensiList.push(item);
          }
        }

        setAbsensiList(finalAbsensiList);
      }
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
      if (json.success) {
        const deletedKeys = getStoredList<string>('salapp_deleted_acara');
        const customAdded = getStoredList<AcaraItem>('salapp_custom_acara');
        const editedMap = new Map<string, Partial<AcaraItem>>(
          getStoredList<[string, Partial<AcaraItem>]>('salapp_edited_acara')
        );

        const isDeleted = (id?: string | number, rowIndex?: string | number) =>
          (id && deletedKeys.includes(String(id))) ||
          (rowIndex && deletedKeys.includes(String(rowIndex)));

        const activeCustom = customAdded
          .filter(a => !isDeleted(a.id, a.rowIndex))
          .map(a => {
            const edit =
              editedMap.get(String(a.id)) ||
              editedMap.get(String(a.rowIndex)) ||
              (a.namaAcara ? editedMap.get(a.namaAcara.trim().toLowerCase()) : undefined);
            return edit ? { ...a, ...edit } : a;
          });

        const serverMerged = (json.data || [])
          .filter((a: AcaraItem) => !isDeleted(a.id, a.rowIndex))
          .map((a: AcaraItem) => {
            const edit =
              editedMap.get(String(a.id)) ||
              editedMap.get(String(a.rowIndex)) ||
              (a.namaAcara ? editedMap.get(a.namaAcara.trim().toLowerCase()) : undefined);
            return edit ? { ...a, ...edit } : a;
          });

        const seen = new Set<string>();
        const finalAcaraList: AcaraItem[] = [];

        for (const item of [...activeCustom, ...serverMerged]) {
          const idKey = String(item.id || item.rowIndex);
          const nameKey = (item.namaAcara || '').trim().toLowerCase();
          if (!seen.has(idKey) && (!nameKey || !seen.has('name_' + nameKey))) {
            seen.add(idKey);
            if (nameKey) seen.add('name_' + nameKey);
            finalAcaraList.push(item);
          }
        }

        setAcaraList(finalAcaraList);
      }
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
      if (json.success) {
        const deletedKeys = getStoredList<string>('salapp_deleted_divisi');
        const customAdded = getStoredList<DivisiItem>('salapp_custom_divisi');
        const editedMap = new Map<string, Partial<DivisiItem>>(
          getStoredList<[string, Partial<DivisiItem>]>('salapp_edited_divisi')
        );

        const isDeleted = (id?: string | number, rowIndex?: string | number) =>
          (id && deletedKeys.includes(String(id))) ||
          (rowIndex && deletedKeys.includes(String(rowIndex)));

        const activeCustom = customAdded
          .filter(d => !isDeleted(d.id, d.rowIndex))
          .map(d => {
            const edit =
              editedMap.get(String(d.id)) ||
              editedMap.get(String(d.rowIndex)) ||
              (d.namaDivisi ? editedMap.get(d.namaDivisi.trim().toLowerCase()) : undefined);
            return edit ? { ...d, ...edit } : d;
          });

        const serverMerged = (json.data || [])
          .filter((d: DivisiItem) => !isDeleted(d.id, d.rowIndex))
          .map((d: DivisiItem) => {
            const edit =
              editedMap.get(String(d.id)) ||
              editedMap.get(String(d.rowIndex)) ||
              (d.namaDivisi ? editedMap.get(d.namaDivisi.trim().toLowerCase()) : undefined);
            return edit ? { ...d, ...edit } : d;
          });

        const seen = new Set<string>();
        const finalDivisiList: DivisiItem[] = [];

        for (const item of [...activeCustom, ...serverMerged]) {
          const idKey = String(item.id || item.rowIndex);
          const nameKey = (item.namaDivisi || '').trim().toLowerCase();
          if (!seen.has(idKey) && (!nameKey || !seen.has('name_' + nameKey))) {
            seen.add(idKey);
            if (nameKey) seen.add('name_' + nameKey);
            finalDivisiList.push(item);
          }
        }

        setDivisiList(finalDivisiList);
      }
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
      if (json.success) {
        const deletedKeys = getStoredList<string>('salapp_deleted_laporan');
        const customAdded = getStoredList<LaporanItem>('salapp_custom_laporan');
        const editedMap = new Map<string, Partial<LaporanItem>>(
          getStoredList<[string, Partial<LaporanItem>]>('salapp_edited_laporan')
        );

        const isDeleted = (id?: string | number, rowIndex?: string | number) =>
          (id && deletedKeys.includes(String(id))) ||
          (rowIndex && deletedKeys.includes(String(rowIndex)));

        const activeCustom = customAdded
          .filter(l => !isDeleted(l.id, l.rowIndex))
          .map(l => {
            const edit = editedMap.get(String(l.id)) || editedMap.get(String(l.rowIndex));
            return edit ? { ...l, ...edit } : l;
          });

        const serverMerged = (json.data || [])
          .filter((l: LaporanItem) => !isDeleted(l.id, l.rowIndex))
          .map((l: LaporanItem) => {
            const edit = editedMap.get(String(l.id)) || editedMap.get(String(l.rowIndex));
            return edit ? { ...l, ...edit } : l;
          });

        const seen = new Set<string>();
        const finalLaporanList: LaporanItem[] = [];

        for (const item of [...activeCustom, ...serverMerged]) {
          const idKey = String(item.id || item.rowIndex);
          const contentKey = `${item.divisi}_${item.namaPelapor}_${item.periode}`.toLowerCase();
          if (!seen.has(idKey) && !seen.has(contentKey)) {
            seen.add(idKey);
            seen.add(contentKey);
            finalLaporanList.push(item);
          }
        }

        setLaporanList(finalLaporanList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLaporan(false);
    }
  };

  // Delete & Toggle Handlers using Custom UI Confirm
  const handleDeleteAbsensi = (item: AbsensiRecord) => {
    requestConfirm({
      title: 'Hapus Catatan Presensi',
      message: `Apakah Anda yakin ingin menghapus data presensi asatidz "${item.nama}" pada kegiatan "${item.acara}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Ya, Hapus Presensi',
      isDanger: true,
      onConfirm: async () => {
        const key = String(item.id || item.rowIndex);
        addStoredKey('salapp_deleted_absensi', key);
        if (item.id) addStoredKey('salapp_deleted_absensi', String(item.id));
        if (item.rowIndex) addStoredKey('salapp_deleted_absensi', String(item.rowIndex));

        const customList = getStoredList<AbsensiRecord>('salapp_custom_absensi').filter(
          r => String(r.id) !== key && String(r.rowIndex) !== key
        );
        saveStoredList('salapp_custom_absensi', customList);

        setAbsensiList(prev =>
          prev.filter(r => (item.id ? r.id !== item.id : true) && (item.rowIndex ? r.rowIndex !== item.rowIndex : true))
        );

        await fetch(`/api/absensi?id=${item.id}&rowIndex=${item.rowIndex || ''}`, { method: 'DELETE' });
        showToast('Presensi berhasil dihapus!');
        fetchAbsensiData();
      },
    });
  };

  const handleDeleteAcara = (item: AcaraItem) => {
    requestConfirm({
      title: 'Hapus Agenda Acara',
      message: `Apakah Anda yakin ingin menghapus agenda kegiatan "${item.namaAcara}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Ya, Hapus Acara',
      isDanger: true,
      onConfirm: async () => {
        const key = String(item.id || item.rowIndex);
        addStoredKey('salapp_deleted_acara', key);
        if (item.id) addStoredKey('salapp_deleted_acara', String(item.id));
        if (item.rowIndex) addStoredKey('salapp_deleted_acara', String(item.rowIndex));

        const customList = getStoredList<AcaraItem>('salapp_custom_acara').filter(
          a =>
            String(a.id) !== key &&
            String(a.rowIndex) !== key &&
            !(item.id && String(a.id) === String(item.id)) &&
            !(item.rowIndex && String(a.rowIndex) === String(item.rowIndex))
        );
        saveStoredList('salapp_custom_acara', customList);

        setAcaraList(prev =>
          prev.filter(
            a =>
              String(a.id || a.rowIndex) !== key &&
              !(item.id && String(a.id) === String(item.id)) &&
              !(item.rowIndex && String(a.rowIndex) === String(item.rowIndex))
          )
        );

        await fetch(`/api/acara?id=${item.id}&rowIndex=${item.rowIndex || ''}&nama=${encodeURIComponent(item.namaAcara)}`, { method: 'DELETE' });
        showToast('Acara berhasil dihapus!');
        fetchAcaraData();
      },
    });
  };

  const handleToggleStatusAcara = async (item: AcaraItem) => {
    const newStatus = !item.isHidden;
    const key = String(item.id || item.rowIndex);

    setAcaraList(prev =>
      prev.map(a =>
        (a.id && a.id === item.id) || (a.rowIndex && a.rowIndex === item.rowIndex)
          ? { ...a, isHidden: newStatus }
          : a
      )
    );

    const editedList = getStoredList<[string, Partial<AcaraItem>]>('salapp_edited_acara');
    const idx = editedList.findIndex(([k]) => k === key);
    if (idx !== -1) editedList[idx] = [key, { ...editedList[idx][1], isHidden: newStatus }];
    else editedList.push([key, { isHidden: newStatus }]);
    saveStoredList('salapp_edited_acara', editedList);

    await fetch('/api/acara', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, rowIndex: item.rowIndex, isHidden: newStatus, namaAcara: item.namaAcara }),
    });
    showToast(newStatus ? 'Acara disembunyikan!' : 'Acara kembali aktif!');
    fetchAcaraData();
  };

  const handleDeleteLaporan = (item: LaporanItem) => {
    requestConfirm({
      title: 'Hapus Laporan Divisi',
      message: `Apakah Anda yakin ingin menghapus laporan "${item.divisi} (${item.periode})"?`,
      confirmLabel: 'Ya, Hapus Laporan',
      isDanger: true,
      onConfirm: async () => {
        const key = String(item.id || item.rowIndex);
        addStoredKey('salapp_deleted_laporan', key);
        if (item.id) addStoredKey('salapp_deleted_laporan', String(item.id));
        if (item.rowIndex) addStoredKey('salapp_deleted_laporan', String(item.rowIndex));

        const customList = getStoredList<LaporanItem>('salapp_custom_laporan').filter(
          l => String(l.id) !== key && String(l.rowIndex) !== key
        );
        saveStoredList('salapp_custom_laporan', customList);

        setLaporanList(prev =>
          prev.filter(
            l => (item.id ? l.id !== item.id : true) && (item.rowIndex ? l.rowIndex !== item.rowIndex : true)
          )
        );

        await fetch(`/api/laporan?id=${item.id}&rowIndex=${item.rowIndex || ''}`, { method: 'DELETE' });
        showToast('Laporan berhasil dihapus!');
        fetchLaporanData();
      },
    });
  };

  const handleDeleteDivisi = (item: DivisiItem) => {
    requestConfirm({
      title: 'Hapus Divisi',
      message: `Apakah Anda yakin ingin menghapus divisi "${item.namaDivisi}"?`,
      confirmLabel: 'Ya, Hapus Divisi',
      isDanger: true,
      onConfirm: async () => {
        const key = String(item.id || item.rowIndex);
        addStoredKey('salapp_deleted_divisi', key);
        if (item.id) addStoredKey('salapp_deleted_divisi', String(item.id));
        if (item.rowIndex) addStoredKey('salapp_deleted_divisi', String(item.rowIndex));

        const customList = getStoredList<DivisiItem>('salapp_custom_divisi').filter(
          d =>
            String(d.id) !== key &&
            String(d.rowIndex) !== key &&
            !(item.id && String(d.id) === String(item.id)) &&
            !(item.rowIndex && String(d.rowIndex) === String(item.rowIndex))
        );
        saveStoredList('salapp_custom_divisi', customList);

        setDivisiList(prev =>
          prev.filter(
            d =>
              String(d.id || d.rowIndex) !== key &&
              !(item.id && String(d.id) === String(item.id)) &&
              !(item.rowIndex && String(d.rowIndex) === String(item.rowIndex))
          )
        );

        await fetch(`/api/divisi?id=${item.id}&rowIndex=${item.rowIndex || ''}&nama=${encodeURIComponent(item.namaDivisi)}`, { method: 'DELETE' });
        showToast('Divisi berhasil dihapus!');
        fetchDivisiData();
      },
    });
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
      showToast(`Anda berada di luar radius presensi (${formatDistance(locationDistance)})!`, 'error');
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
          keterangan: formAbsenKet.trim() || (locationDistance !== null ? `Jarak GPS: ${formatDistance(locationDistance)}` : 'Hadir Tepat Waktu'),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Presensi Asatidz berhasil dicatat!');
        const newRecord: AbsensiRecord = {
          id: json.data?.id || Date.now().toString(),
          rowIndex: json.data?.rowIndex || Date.now(),
          waktu: json.data?.waktu || (new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('id-ID')),
          acara: formAbsenAcara,
          nama: formAbsenNama.trim(),
          status: formAbsenStatus,
          keterangan: formAbsenKet.trim() || (locationDistance !== null ? `Jarak GPS: ${formatDistance(locationDistance)}` : 'Hadir Tepat Waktu'),
        };
        const customAbsen = getStoredList<AbsensiRecord>('salapp_custom_absensi');
        customAbsen.unshift(newRecord);
        saveStoredList('salapp_custom_absensi', customAbsen);
        setAbsensiList(prev => [newRecord, ...prev]);

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
        const newLap: LaporanItem = {
          id: json.data?.id || Date.now().toString(),
          rowIndex: json.data?.rowIndex || Date.now(),
          waktu: json.data?.waktu || (new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('id-ID')),
          divisi: lapDivisi,
          namaPelapor: lapPelapor.trim(),
          periode: lapPeriode,
          hasilUsaha: lapHasil.trim() || '-',
          programKerja: lapProker.trim() || '-',
          evaluasi: lapEvaluasi.trim() || '-',
          laporanDana: combinedBudget,
        };
        const customLap = getStoredList<LaporanItem>('salapp_custom_laporan');
        customLap.unshift(newLap);
        saveStoredList('salapp_custom_laporan', customLap);
        setLaporanList(prev => [newLap, ...prev]);

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
    <div className="min-h-screen bg-background text-on-surface flex flex-col relative selection:bg-primary selection:text-white w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold ${toast.type === 'success'
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
        <div className="flex flex-col flex-1 w-full max-w-full overflow-x-hidden">
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
                      <div className={`w-2.5 h-2.5 rounded-full ${formAbsenStatus !== 'Hadir' || locationStatus === 'valid' || locationStatus === 'free'
                          ? 'bg-emerald-400 animate-ping'
                          : locationStatus === 'invalid'
                            ? 'bg-red-400 animate-pulse'
                            : 'bg-amber-400 animate-pulse'
                        }`}></div>
                      <span className="text-[11px] text-white/90 font-medium">
                        {formAbsenStatus !== 'Hadir'
                          ? `Status ${formAbsenStatus} • Bebas Radius`
                          : locationStatus === 'valid'
                            ? `Lokasi Sesuai (${locationDistance !== null ? formatDistance(locationDistance) : 'Akurat'}) • Presensi Valid`
                            : locationStatus === 'free'
                              ? 'Lokasi Bebas (Tanpa Geofence)'
                              : locationStatus === 'invalid'
                                ? `Di Luar Radius Acara (${formatDistance(locationDistance)})`
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
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95 ${formAbsenStatus === 'Hadir'
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
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95 ${formAbsenStatus === 'Izin'
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
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95 ${formAbsenStatus === 'Sakit'
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
                  <div className={`p-4 rounded-3xl border transition-all flex items-center justify-between gap-3 shadow-xs ${formAbsenStatus !== 'Hadir' || locationStatus === 'valid' || locationStatus === 'free'
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                      : locationStatus === 'invalid'
                        ? 'bg-red-50/90 border-red-200 text-red-950'
                        : locationStatus === 'disabled'
                          ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                          : 'bg-surface-container-low border-surface-container-high text-on-surface'
                    }`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${formAbsenStatus !== 'Hadir' || locationStatus === 'valid' || locationStatus === 'free'
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
                                    ? `GPS Valid (Jarak: ${formatDistance(locationDistance)})`
                                    : locationStatus === 'invalid'
                                      ? `Di Luar Area (Jarak Anda: ${formatDistance(locationDistance)})`
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
                              className={`py-2.5 rounded-xl text-[11px] font-bold border transition ${lapPeriode === p
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
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-full text-xs transition-all duration-300 active:scale-95 ${portalTab === 'absensi'
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
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-full text-xs transition-all duration-300 active:scale-95 ${portalTab === 'laporan'
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
        <div className="min-h-screen bg-background flex flex-col w-full max-w-full overflow-x-hidden">
          {/* Admin Fixed Top Header (Clean, Spacious, No Duplicate Tabs) */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high shadow-xs h-16 w-full max-w-full">
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
          <aside className="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest border-r border-surface-container-high shadow-xs z-30 hidden lg:flex flex-col justify-between py-6 px-5">
            <div className="flex flex-col space-y-6">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-3 mb-2.5">
                  Navigasi Utama
                </p>
                <nav className="flex flex-col space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setAdminTab('absensi')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition active:scale-95 ${adminTab === 'absensi'
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition active:scale-95 ${adminTab === 'acara'
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition active:scale-95 ${adminTab === 'laporan'
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition active:scale-95 ${adminTab === 'divisi'
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
          <main className="w-full max-w-full lg:pl-64 pt-20 pb-24 lg:pb-16 overflow-x-hidden">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-2 space-y-6">
              {/* ==================================================== */}
              {/* TAB 1: DATA PRESENSI                                */}
              {/* ==================================================== */}
              {adminTab === 'absensi' && (
                <div className="space-y-6 w-full max-w-full">
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

                  {/* MOBILE VIEW: Clean Vertical Cards (block md:hidden) - Zero Horizontal Scroll */}
                  <div className="space-y-3 block md:hidden">
                    {paginatedAbsensi.length === 0 ? (
                      <div className="bg-surface-container-lowest rounded-3xl p-8 text-center text-xs text-on-surface-variant font-medium border border-surface-container-high shadow-xs">
                        {loadingAbsensi ? 'Memuat data presensi...' : 'Tidak ada data presensi yang sesuai.'}
                      </div>
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
                          <div
                            key={item.id || idx}
                            className="bg-surface-container-lowest rounded-3xl p-4 shadow-xs border border-surface-container-high flex flex-col gap-3 transition"
                          >
                            {/* Card Header: Initials + Name + ID + Status Badge */}
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                  {initials}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <h3 className="text-sm font-bold text-on-surface truncate leading-tight">{item.nama}</h3>
                                  <span className="text-[10px] text-on-surface-variant font-mono uppercase mt-0.5">
                                    #{formatIndex(actualIdx)} &bull; ID: ASATIDZ-{item.id}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`h-6 px-2.5 rounded-full text-[10px] font-bold flex items-center shrink-0 uppercase tracking-wide ${item.status?.toLowerCase() === 'hadir'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : item.status?.toLowerCase() === 'izin'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                              >
                                {item.status?.toUpperCase()}
                              </span>
                            </div>

                            {/* Card Body: Agenda, Time & Keterangan */}
                            <div className="bg-surface-container-low/60 rounded-2xl p-3 flex flex-col gap-2 text-xs">
                              <div className="flex items-center gap-2 text-on-surface font-semibold text-xs truncate">
                                <Calendar size={14} className="text-primary shrink-0" />
                                <span className="truncate">{item.acara}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                                <div className="flex items-center gap-1.5 font-mono">
                                  <Clock size={13} className="shrink-0 text-outline" />
                                  <span>{item.waktu || '-'}</span>
                                </div>
                                {item.keterangan && (
                                  <div className="flex items-center gap-1 text-on-surface-variant truncate max-w-[55%]">
                                    <MapPin size={13} className="shrink-0 text-emerald-600" />
                                    <span className="truncate">{item.keterangan}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Card Footer: Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-surface-container-high/40">
                              <button
                                type="button"
                                onClick={() => setModalEditAbsen({ open: true, item })}
                                className="px-3.5 py-1.5 rounded-xl bg-primary-fixed text-primary hover:bg-primary-container hover:text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                              >
                                <Edit size={14} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAbsensi(item)}
                                className="px-3.5 py-1.5 rounded-xl bg-error-container text-error hover:bg-red-200 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                              >
                                <Trash2 size={14} />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* DESKTOP VIEW: Paginated Table (hidden md:block) */}
                  <div className="bg-surface-container-lowest rounded-3xl shadow-xs border border-surface-container-high overflow-x-auto table-scroll-container hide-scrollbar hidden md:block">
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
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${item.status?.toLowerCase() === 'hadir'
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
                                    onClick={() => handleDeleteAbsensi(item)}
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
                  </div>

                  {/* Common Pagination Bar (Mobile & Desktop) */}
                  <div className="px-5 py-3.5 bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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
              )}

              {/* ==================================================== */}
              {/* TAB 2: MANAJEMEN ACARA                              */}
              {/* ==================================================== */}
              {adminTab === 'acara' && (
                <div className="space-y-6 w-full max-w-full">
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

                  {/* MOBILE VIEW: Cards for Acara (block md:hidden) */}
                  <div className="space-y-3 block md:hidden">
                    {paginatedAcara.length === 0 ? (
                      <div className="bg-surface-container-lowest rounded-3xl p-8 text-center text-xs text-on-surface-variant font-medium border border-surface-container-high shadow-xs">
                        {loadingAcara ? 'Memuat data acara...' : 'Tidak ada agenda acara terdaftar.'}
                      </div>
                    ) : (
                      paginatedAcara.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="bg-surface-container-lowest rounded-3xl p-4 shadow-xs border border-surface-container-high flex flex-col gap-3 transition"
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                <Calendar size={18} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold text-on-surface truncate leading-tight">{item.namaAcara}</h3>
                                <span className="text-[11px] text-on-surface-variant font-medium mt-0.5 block">{item.tanggalAcara}</span>
                              </div>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 uppercase tracking-wide ${item.isHidden
                                  ? 'bg-surface-container text-on-surface-variant'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                            >
                              {item.isHidden ? 'DISEMBUNYIKAN' : 'TAMPIL'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-surface-container-low">
                            <span className="flex items-center gap-1 font-medium text-[11px]">
                              <MapPin size={13} className="text-primary" />
                              Toleransi: {item.radius || 150}m
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleStatusAcara(item)}
                                className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition active:scale-95"
                                title={item.isHidden ? 'Tampilkan' : 'Sembunyikan'}
                              >
                                {item.isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setModalAcara({ open: true, item })}
                                className="p-2 rounded-xl bg-primary-fixed text-primary hover:bg-primary-container hover:text-white transition active:scale-95"
                                title="Edit Acara"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAcara(item)}
                                className="p-2 rounded-xl bg-error-container text-error hover:bg-red-200 transition active:scale-95"
                                title="Hapus Acara"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* DESKTOP VIEW: Table Acara (hidden md:block) */}
                  <div className="bg-surface-container-lowest rounded-3xl shadow-xs border border-surface-container-high overflow-x-auto table-scroll-container hide-scrollbar hidden md:block">
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
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${item.isHidden
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
                                onClick={() => handleToggleStatusAcara(item)}
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
                                onClick={() => handleDeleteAcara(item)}
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
                <div className="space-y-6 w-full max-w-full">
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

                  {/* MOBILE VIEW: Cards for Laporan (block md:hidden) */}
                  <div className="space-y-3 block md:hidden">
                    {paginatedLaporan.length === 0 ? (
                      <div className="bg-surface-container-lowest rounded-3xl p-8 text-center text-xs text-on-surface-variant font-medium border border-surface-container-high shadow-xs">
                        {loadingLaporan ? 'Memuat data laporan...' : 'Tidak ada laporan divisi masuk.'}
                      </div>
                    ) : (
                      paginatedLaporan.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="bg-surface-container-lowest rounded-3xl p-4 shadow-xs border border-surface-container-high flex flex-col gap-3 transition"
                        >
                          {/* Card Header: Division Icon + Name + Reporter & Period */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                <FileText size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-primary truncate leading-tight">{item.divisi}</h3>
                                <p className="text-[11px] text-on-surface font-semibold mt-0.5 truncate">
                                  PJ: {item.namaPelapor}
                                </p>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-primary text-[10px] font-bold shrink-0 border border-surface-container-high/60">
                              {item.periode || 'Pekan Ini'}
                            </span>
                          </div>

                          {/* Capaian & Program Kerja */}
                          {item.hasilUsaha && (
                            <div className="bg-surface-container-low/40 p-3 rounded-2xl border border-surface-container-high/40 flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                                Capaian &amp; Proker
                              </span>
                              <p className="text-xs text-on-surface leading-relaxed break-words">
                                {item.hasilUsaha}
                              </p>
                            </div>
                          )}

                          {/* Anggaran & Kas (Dedicated full-width block, never overlaps or 'tembus-tembus') */}
                          {item.laporanDana && item.laporanDana !== '-' && (
                            <div className="bg-surface-container-low/80 p-3 rounded-2xl border border-surface-container-high/60 flex items-start gap-2.5">
                              <DollarSign size={16} className="text-primary shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                                  Anggaran &amp; Realisasi Kas
                                </span>
                                <p className="font-mono text-xs font-semibold text-primary break-words mt-0.5 leading-relaxed">
                                  {item.laporanDana}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-surface-container-low">
                            <button
                              type="button"
                              onClick={() => setModalDetailLaporan({ open: true, item })}
                              className="px-3 py-1.5 rounded-xl bg-primary-fixed text-primary hover:bg-primary-container hover:text-white text-xs font-bold transition flex items-center gap-1 active:scale-95"
                            >
                              <Eye size={14} />
                              <span>Detail</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setModalEditLaporan({ open: true, item })}
                              className="px-3 py-1.5 rounded-xl bg-surface-container text-on-surface-variant hover:text-primary text-xs font-bold transition flex items-center gap-1 active:scale-95"
                            >
                              <Edit size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLaporan(item)}
                              className="px-3 py-1.5 rounded-xl bg-error-container text-error hover:bg-red-200 text-xs font-bold transition flex items-center gap-1 active:scale-95"
                            >
                              <Trash2 size={14} />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* DESKTOP VIEW: Table Laporan (hidden md:block) */}
                  <div className="bg-surface-container-lowest rounded-3xl shadow-xs border border-surface-container-high overflow-x-auto table-scroll-container hide-scrollbar hidden md:block">
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
                            <td className="p-4 text-xs font-mono text-on-surface-variant max-w-[220px]">
                              <span className="px-2.5 py-1 rounded-lg bg-surface-container-low font-semibold text-primary block truncate" title={item.laporanDana}>
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
                                onClick={() => handleDeleteLaporan(item)}
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
                <div className="space-y-6 w-full max-w-full">
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

                  {/* MOBILE VIEW: Cards for Divisi (block md:hidden) */}
                  <div className="space-y-3 block md:hidden">
                    {paginatedDivisi.length === 0 ? (
                      <div className="bg-surface-container-lowest rounded-3xl p-8 text-center text-xs text-on-surface-variant font-medium border border-surface-container-high shadow-xs">
                        {loadingDivisi ? 'Memuat data divisi...' : 'Tidak ada divisi terdaftar.'}
                      </div>
                    ) : (
                      paginatedDivisi.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="bg-surface-container-lowest rounded-3xl p-4 shadow-xs border border-surface-container-high flex flex-col gap-3 transition"
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                <Building size={18} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold text-on-surface truncate leading-tight">{item.namaDivisi}</h3>
                                <span className="text-[10px] text-on-surface-variant font-mono mt-0.5 block">
                                  #{formatIndex(idx + 1)}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 uppercase tracking-wide ${item.status === 'Aktif' || !item.status
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-surface-container text-on-surface-variant'
                                }`}
                            >
                              {item.status || 'Aktif'}
                            </span>
                          </div>

                          {item.keterangan && (
                            <div className="bg-surface-container-low/50 p-3 rounded-2xl border border-surface-container-high/40">
                              <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                                {item.keterangan}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-surface-container-low">
                            <button
                              type="button"
                              onClick={() => setModalDivisi({ open: true, item })}
                              className="px-3 py-1.5 rounded-xl bg-primary-fixed text-primary hover:bg-primary-container hover:text-white text-xs font-bold transition flex items-center gap-1 active:scale-95"
                            >
                              <Edit size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDivisi(item)}
                              className="px-3 py-1.5 rounded-xl bg-error-container text-error hover:bg-red-200 text-xs font-bold transition flex items-center gap-1 active:scale-95"
                            >
                              <Trash2 size={14} />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* DESKTOP VIEW: Table Divisi (hidden md:block) */}
                  <div className="bg-surface-container-lowest rounded-3xl shadow-xs border border-surface-container-high overflow-x-auto table-scroll-container hide-scrollbar hidden md:block">
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
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Aktif' || !item.status
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
                                onClick={() => handleDeleteDivisi(item)}
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
            </div>
          </main>

          {/* Admin Mobile Bottom Bar (lg:hidden) */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden pb-safe bg-surface-container-lowest/95 backdrop-blur-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-surface-container-high">
            <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
              <button
                type="button"
                onClick={() => setAdminTab('absensi')}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition gap-0.5 ${adminTab === 'absensi' ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'
                  }`}
              >
                <Fingerprint size={20} />
                <span className="text-[10px]">Presensi</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('acara')}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition gap-0.5 ${adminTab === 'acara' ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'
                  }`}
              >
                <Calendar size={20} />
                <span className="text-[10px]">Acara</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('laporan')}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition gap-0.5 ${adminTab === 'laporan' ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'
                  }`}
              >
                <FileText size={20} />
                <span className="text-[10px]">Laporan</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('divisi')}
                className={`flex-1 flex flex-col items-center justify-center py-1 transition gap-0.5 ${adminTab === 'divisi' ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'
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
                  const targetItem = modalDivisi.item;
                  const key = String(targetItem.id || targetItem.rowIndex);
                  const updatedItem: DivisiItem = {
                    ...targetItem,
                    namaDivisi: nama,
                    keterangan: ket,
                    status: status as any,
                  };

                  setDivisiList(prev =>
                    prev.map(d =>
                      (d.id && d.id === targetItem.id) || (d.rowIndex && d.rowIndex === targetItem.rowIndex)
                        ? updatedItem
                        : d
                    )
                  );

                  const editedList = getStoredList<[string, Partial<DivisiItem>]>('salapp_edited_divisi');
                  const idx = editedList.findIndex(([k]) => k === key);
                  if (idx !== -1) editedList[idx] = [key, { namaDivisi: nama, keterangan: ket, status }];
                  else editedList.push([key, { namaDivisi: nama, keterangan: ket, status }]);
                  saveStoredList('salapp_edited_divisi', editedList);

                  const customList = getStoredList<DivisiItem>('salapp_custom_divisi');
                  const cIdx = customList.findIndex(d => String(d.id) === key || String(d.rowIndex) === key);
                  if (cIdx !== -1) {
                    customList[cIdx] = updatedItem;
                    saveStoredList('salapp_custom_divisi', customList);
                  }

                  await fetch('/api/divisi', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: modalDivisi.item.id, rowIndex: modalDivisi.item.rowIndex, data: { namaDivisi: nama, keterangan: ket, status } }),
                  });
                } else {
                  const newId = Date.now().toString();
                  const newRow = Date.now();
                  const newItem: DivisiItem = {
                    id: newId,
                    rowIndex: newRow,
                    namaDivisi: nama,
                    keterangan: ket,
                    status: status as any,
                  };

                  removeStoredKey('salapp_deleted_divisi', newId);
                  removeStoredKey('salapp_deleted_divisi', String(newRow));
                  removeStoredKey('salapp_deleted_divisi', nama.trim().toLowerCase());

                  setDivisiList(prev => {
                    const filtered = prev.filter(
                      d => String(d.id) !== newId && (d.namaDivisi || '').trim().toLowerCase() !== nama.toLowerCase()
                    );
                    return [newItem, ...filtered];
                  });

                  const customList = getStoredList<DivisiItem>('salapp_custom_divisi').filter(
                    d => String(d.id) !== newId && (d.namaDivisi || '').trim().toLowerCase() !== nama.toLowerCase()
                  );
                  customList.unshift(newItem);
                  saveStoredList('salapp_custom_divisi', customList);

                  await fetch('/api/divisi', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: newId, rowIndex: newRow, namaDivisi: nama, keterangan: ket, status }),
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

                const payload = {
                  namaAcara: nama,
                  tanggalAcara: tgl,
                  radius,
                  lat: inputAcaraLat.trim(),
                  lng: inputAcaraLng.trim(),
                  mapLink: inputAcaraMapLink.trim(),
                };

                if (modalAcara.item) {
                  const targetItem = modalAcara.item;
                  const key = String(targetItem.id || targetItem.rowIndex);
                  const updatedItem: AcaraItem = {
                    ...targetItem,
                    ...payload,
                  };

                  setAcaraList(prev =>
                    prev.map(a =>
                      (a.id && a.id === targetItem.id) || (a.rowIndex && a.rowIndex === targetItem.rowIndex)
                        ? updatedItem
                        : a
                    )
                  );

                  const editedList = getStoredList<[string, Partial<AcaraItem>]>('salapp_edited_acara');
                  const idx = editedList.findIndex(([k]) => k === key);
                  if (idx !== -1) editedList[idx] = [key, payload];
                  else editedList.push([key, payload]);
                  saveStoredList('salapp_edited_acara', editedList);

                  const customList = getStoredList<AcaraItem>('salapp_custom_acara');
                  const cIdx = customList.findIndex(a => String(a.id) === key || String(a.rowIndex) === key);
                  if (cIdx !== -1) {
                    customList[cIdx] = updatedItem;
                    saveStoredList('salapp_custom_acara', customList);
                  }

                  await fetch('/api/acara', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: targetItem.id, rowIndex: targetItem.rowIndex, ...payload }),
                  });
                } else {
                  const newId = Date.now().toString();
                  const newRow = Date.now();
                  const newItem: AcaraItem = {
                    id: newId,
                    rowIndex: newRow,
                    isHidden: false,
                    ...payload,
                  };

                  removeStoredKey('salapp_deleted_acara', newId);
                  removeStoredKey('salapp_deleted_acara', String(newRow));
                  removeStoredKey('salapp_deleted_acara', nama.trim().toLowerCase());

                  setAcaraList(prev => {
                    const filtered = prev.filter(
                      a => String(a.id) !== newId && (a.namaAcara || '').trim().toLowerCase() !== nama.toLowerCase()
                    );
                    return [newItem, ...filtered];
                  });

                  const customList = getStoredList<AcaraItem>('salapp_custom_acara').filter(
                    a => String(a.id) !== newId && (a.namaAcara || '').trim().toLowerCase() !== nama.toLowerCase()
                  );
                  customList.unshift(newItem);
                  saveStoredList('salapp_custom_acara', customList);

                  await fetch('/api/acara', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: newId, rowIndex: newRow, ...payload }),
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

              {/* Lokasi & Geofence GPS */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <MapPin size={15} className="text-primary" />
                    <span>Titik Lokasi GPS Kegiatan</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.geolocation) {
                        showToast('Membaca GPS satelit...');
                        navigator.geolocation.getCurrentPosition(
                          pos => {
                            setInputAcaraLat(pos.coords.latitude.toFixed(6));
                            setInputAcaraLng(pos.coords.longitude.toFixed(6));
                            showToast(`Titik GPS tersimpan: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                          },
                          err => showToast('Gagal membaca GPS: ' + err.message, 'error'),
                          { enableHighAccuracy: true, timeout: 8000 }
                        );
                      } else {
                        showToast('Browser tidak mendukung GPS', 'error');
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-primary text-white text-[10px] font-bold shadow-xs hover:bg-primary-container active:scale-95 transition flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    <span>Ambil GPS Saya Sekarang</span>
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={inputAcaraMapLink}
                    onChange={e => {
                      const val = e.target.value;
                      setInputAcaraMapLink(val);
                      const coords = extractCoordinates(val);
                      if (coords.lat && coords.lng) {
                        setInputAcaraLat(coords.lat);
                        setInputAcaraLng(coords.lng);
                        showToast('Koordinat berhasil diekstrak dari link!');
                      }
                    }}
                    placeholder="Tempel link Google Maps atau koordinat"
                    className="w-full border border-surface-container-high rounded-xl p-2.5 text-xs outline-none focus:border-primary bg-surface-container-lowest"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant block mb-0.5">Latitude:</span>
                    <input
                      type="text"
                      value={inputAcaraLat}
                      onChange={e => setInputAcaraLat(e.target.value)}
                      placeholder="Misal: -6.175392"
                      className="w-full border border-surface-container-high rounded-xl p-2 text-xs font-mono outline-none focus:border-primary bg-surface-container-lowest"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant block mb-0.5">Longitude:</span>
                    <input
                      type="text"
                      value={inputAcaraLng}
                      onChange={e => setInputAcaraLng(e.target.value)}
                      placeholder="Misal: 106.827153"
                      className="w-full border border-surface-container-high rounded-xl p-2 text-xs font-mono outline-none focus:border-primary bg-surface-container-lowest"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-on-surface-variant">
                    {inputAcaraLat && inputAcaraLng
                      ? '✅ Geofencing GPS Aktif'
                      : '🔓 Bebas Radius (Bisa absen di mana saja)'}
                  </span>
                  {(inputAcaraLat || inputAcaraLng) && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputAcaraLat('');
                        setInputAcaraLng('');
                        setInputAcaraMapLink('');
                        showToast('Geofence dinonaktifkan (Bebas Radius)');
                      }}
                      className="text-[10px] text-error font-bold hover:underline"
                    >
                      Jadikan Bebas Lokasi
                    </button>
                  )}
                </div>
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

      {/* ==================================================== */}
      {/* MODAL: EDIT DATA PRESENSI ASATIDZ                    */}
      {/* ==================================================== */}
      {modalEditAbsen.open && modalEditAbsen.item && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-surface-container-low px-5 py-4 border-b border-surface-container-high flex justify-between items-center">
              <h3 className="font-bold text-sm text-on-surface">Edit Data Presensi</h3>
              <button
                type="button"
                onClick={() => setModalEditAbsen({ open: false })}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const form = e.currentTarget;
                const nama = (form.elements.namedItem('nama') as HTMLInputElement).value.trim();
                const acara = (form.elements.namedItem('acara') as HTMLSelectElement).value;
                const status = (form.elements.namedItem('status') as HTMLSelectElement).value as 'Hadir' | 'Izin' | 'Sakit';
                const keterangan = (form.elements.namedItem('keterangan') as HTMLInputElement).value.trim();

                const targetItem = modalEditAbsen.item!;
                setModalEditAbsen({ open: false });
                showToast('Menyimpan perubahan presensi...');

                const key = String(targetItem.id || targetItem.rowIndex);
                const updatedItem: AbsensiRecord = {
                  ...targetItem,
                  nama,
                  acara,
                  status,
                  keterangan: keterangan || '-',
                };

                // Optimistic UI update
                setAbsensiList(prev =>
                  prev.map(r =>
                    (r.id && r.id === targetItem.id) || (r.rowIndex && r.rowIndex === targetItem.rowIndex)
                      ? updatedItem
                      : r
                  )
                );

                // LocalStorage update
                const editedList = getStoredList<[string, Partial<AbsensiRecord>]>('salapp_edited_absensi');
                const idx = editedList.findIndex(([k]) => k === key);
                if (idx !== -1) editedList[idx] = [key, { nama, acara, status, keterangan: keterangan || '-' }];
                else editedList.push([key, { nama, acara, status, keterangan: keterangan || '-' }]);
                saveStoredList('salapp_edited_absensi', editedList);

                const customList = getStoredList<AbsensiRecord>('salapp_custom_absensi');
                const cIdx = customList.findIndex(r => String(r.id) === key || String(r.rowIndex) === key);
                if (cIdx !== -1) {
                  customList[cIdx] = updatedItem;
                  saveStoredList('salapp_custom_absensi', customList);
                }

                await fetch('/api/absensi', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: targetItem.id,
                    rowIndex: targetItem.rowIndex,
                    data: { nama, acara, status, keterangan: keterangan || '-' },
                  }),
                });
                showToast('Presensi berhasil diperbarui!');
                fetchAbsensiData();
              }}
              className="p-5 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Nama Lengkap Asatidz <span className="text-error">*</span>
                </label>
                <input
                  name="nama"
                  defaultValue={modalEditAbsen.item.nama}
                  required
                  placeholder="Nama asatidz"
                  className="w-full border border-surface-container-high rounded-xl p-3 text-xs outline-none focus:border-primary bg-surface-container-low"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Agenda Acara <span className="text-error">*</span>
                </label>
                <select
                  name="acara"
                  defaultValue={modalEditAbsen.item.acara}
                  className="w-full border border-surface-container-high rounded-xl p-3 text-xs outline-none focus:border-primary bg-surface-container-low"
                >
                  {acaraList.map((a, i) => (
                    <option key={a.id || i} value={a.namaAcara}>
                      {a.namaAcara}
                    </option>
                  ))}
                  {!acaraList.some(a => a.namaAcara === modalEditAbsen.item?.acara) && (
                    <option value={modalEditAbsen.item.acara}>{modalEditAbsen.item.acara}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Status Kehadiran</label>
                <select
                  name="status"
                  defaultValue={modalEditAbsen.item.status}
                  className="w-full border border-surface-container-high rounded-xl p-3 text-xs outline-none focus:border-primary bg-surface-container-low"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Keterangan / Lokasi GPS</label>
                <input
                  name="keterangan"
                  defaultValue={modalEditAbsen.item.keterangan || ''}
                  placeholder="Keterangan kehadiran..."
                  className="w-full border border-surface-container-high rounded-xl p-3 text-xs outline-none focus:border-primary bg-surface-container-low"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md transition"
              >
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: EDIT LAPORAN DIVISI                           */}
      {/* ==================================================== */}
      {modalEditLaporan.open && modalEditLaporan.item && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-surface-container-low px-5 py-4 border-b border-surface-container-high flex justify-between items-center">
              <h3 className="font-bold text-sm text-on-surface">Edit Laporan Divisi</h3>
              <button
                type="button"
                onClick={() => setModalEditLaporan({ open: false })}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                const form = e.currentTarget;
                const divisi = (form.elements.namedItem('divisi') as HTMLSelectElement).value;
                const namaPelapor = (form.elements.namedItem('namaPelapor') as HTMLInputElement).value.trim();
                const periode = (form.elements.namedItem('periode') as HTMLSelectElement).value;
                const hasilUsaha = (form.elements.namedItem('hasilUsaha') as HTMLTextAreaElement).value.trim();
                const programKerja = (form.elements.namedItem('programKerja') as HTMLTextAreaElement).value.trim();
                const evaluasi = (form.elements.namedItem('evaluasi') as HTMLTextAreaElement).value.trim();
                const laporanDana = (form.elements.namedItem('laporanDana') as HTMLInputElement).value.trim();

                const targetItem = modalEditLaporan.item!;
                setModalEditLaporan({ open: false });
                showToast('Menyimpan perubahan laporan...');

                const key = String(targetItem.id || targetItem.rowIndex);
                const updatedItem: LaporanItem = {
                  ...targetItem,
                  divisi,
                  namaPelapor,
                  periode,
                  hasilUsaha: hasilUsaha || '-',
                  programKerja: programKerja || '-',
                  evaluasi: evaluasi || '-',
                  laporanDana: laporanDana || '-',
                };

                // Optimistic UI update
                setLaporanList(prev =>
                  prev.map(l =>
                    (l.id && l.id === targetItem.id) || (l.rowIndex && l.rowIndex === targetItem.rowIndex)
                      ? updatedItem
                      : l
                  )
                );

                // LocalStorage update
                const editedList = getStoredList<[string, Partial<LaporanItem>]>('salapp_edited_laporan');
                const idx = editedList.findIndex(([k]) => k === key);
                if (idx !== -1) editedList[idx] = [key, { divisi, namaPelapor, periode, hasilUsaha, programKerja, evaluasi, laporanDana }];
                else editedList.push([key, { divisi, namaPelapor, periode, hasilUsaha, programKerja, evaluasi, laporanDana }]);
                saveStoredList('salapp_edited_laporan', editedList);

                const customList = getStoredList<LaporanItem>('salapp_custom_laporan');
                const cIdx = customList.findIndex(l => String(l.id) === key || String(l.rowIndex) === key);
                if (cIdx !== -1) {
                  customList[cIdx] = updatedItem;
                  saveStoredList('salapp_custom_laporan', customList);
                }

                await fetch('/api/laporan', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: targetItem.id,
                    rowIndex: targetItem.rowIndex,
                    data: { divisi, namaPelapor, periode, hasilUsaha, programKerja, evaluasi, laporanDana },
                  }),
                });
                showToast('Laporan divisi berhasil diperbarui!');
                fetchLaporanData();
              }}
              className="p-5 overflow-y-auto space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Divisi <span className="text-error">*</span>
                  </label>
                  <select
                    name="divisi"
                    defaultValue={modalEditLaporan.item.divisi}
                    className="w-full border border-surface-container-high rounded-xl p-2.5 text-xs outline-none focus:border-primary bg-surface-container-low"
                  >
                    {divisiList.map((d, i) => (
                      <option key={d.id || i} value={d.namaDivisi}>
                        {d.namaDivisi}
                      </option>
                    ))}
                    {!divisiList.some(d => d.namaDivisi === modalEditLaporan.item?.divisi) && (
                      <option value={modalEditLaporan.item.divisi}>{modalEditLaporan.item.divisi}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Nama Asatidz Pelapor <span className="text-error">*</span>
                  </label>
                  <input
                    name="namaPelapor"
                    defaultValue={modalEditLaporan.item.namaPelapor}
                    required
                    className="w-full border border-surface-container-high rounded-xl p-2.5 text-xs outline-none focus:border-primary bg-surface-container-low"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Periode Laporan</label>
                <select
                  name="periode"
                  defaultValue={modalEditLaporan.item.periode}
                  className="w-full border border-surface-container-high rounded-xl p-2.5 text-xs outline-none focus:border-primary bg-surface-container-low"
                >
                  <option value="Pekan 1">Pekan 1</option>
                  <option value="Pekan 2">Pekan 2</option>
                  <option value="Pekan 3">Pekan 3</option>
                  <option value="Pekan 4">Pekan 4</option>
                  <option value="Bulanan">Bulanan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Hasil Usaha &amp; Capaian</label>
                <textarea
                  name="hasilUsaha"
                  rows={2}
                  defaultValue={modalEditLaporan.item.hasilUsaha}
                  className="w-full border border-surface-container-high rounded-xl p-2.5 text-xs outline-none focus:border-primary bg-surface-container-low"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Program Kerja Lanjutan</label>
                <textarea
                  name="programKerja"
                  rows={2}
                  defaultValue={modalEditLaporan.item.programKerja}
                  className="w-full border border-surface-container-high rounded-xl p-2.5 text-xs outline-none focus:border-primary bg-surface-container-low"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Evaluasi &amp; Kendala</label>
                <textarea
                  name="evaluasi"
                  rows={2}
                  defaultValue={modalEditLaporan.item.evaluasi}
                  className="w-full border border-surface-container-high rounded-xl p-2.5 text-xs outline-none focus:border-primary bg-surface-container-low"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Laporan Anggaran &amp; Kas</label>
                <input
                  name="laporanDana"
                  defaultValue={modalEditLaporan.item.laporanDana}
                  placeholder="Pengeluaran: Rp ... | Saldo: Rp ..."
                  className="w-full border border-surface-container-high rounded-xl p-2.5 text-xs outline-none focus:border-primary bg-surface-container-low"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md transition"
                >
                  Simpan Perubahan Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: CUSTOM KONFIRMASI (GANTI ALERT/CONFIRM BROWSER)*/}
      {/* ==================================================== */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-surface-container-high w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${confirmModal.isDanger
                  ? 'bg-error/10 text-error border-error/20'
                  : 'bg-primary/10 text-primary border-primary/20'
                }`}
            >
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-base font-bold text-on-surface mb-2">{confirmModal.title}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-6">{confirmModal.message}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                className="flex-1 py-2.5 px-4 rounded-xl border border-surface-container-high text-xs font-bold text-on-surface hover:bg-surface-container-low transition active:scale-95"
              >
                {confirmModal.cancelLabel || 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(prev => ({ ...prev, open: false }));
                  action();
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md transition active:scale-95 ${confirmModal.isDanger ? 'bg-error hover:bg-red-700' : 'bg-primary hover:bg-primary-container'
                  }`}
              >
                {confirmModal.confirmLabel || 'Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
