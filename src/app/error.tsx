'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('SalApp Client Error caught by boundary:', error);
  }, [error]);

  const handleResetStorage = () => {
    try {
      localStorage.removeItem('salapp_edited_absensi');
      localStorage.removeItem('salapp_edited_acara');
      localStorage.removeItem('salapp_edited_asatidz');
      localStorage.removeItem('salapp_edited_divisi');
      localStorage.removeItem('salapp_edited_laporan');
      localStorage.removeItem('salapp_deleted_absensi');
      localStorage.removeItem('salapp_deleted_acara');
      localStorage.removeItem('salapp_deleted_asatidz');
      localStorage.removeItem('salapp_deleted_divisi');
      localStorage.removeItem('salapp_deleted_laporan');
      localStorage.removeItem('salapp_custom_absensi');
      localStorage.removeItem('salapp_custom_acara');
      localStorage.removeItem('salapp_custom_asatidz');
      localStorage.removeItem('salapp_custom_divisi');
      localStorage.removeItem('salapp_custom_laporan');
    } catch { }
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Terjadi Kendala Memuat Aplikasi</h2>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Sistem mendeteksi adanya data lokal atau koneksi yang perlu diperbarui. Anda dapat menyegarkan aplikasi atau mereset cache lokal.
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <RefreshCw size={16} />
            <span>Coba Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={handleResetStorage}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition flex items-center justify-center gap-2"
          >
            <Trash2 size={15} />
            <span>Bersihkan Cache Lokal & Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}

