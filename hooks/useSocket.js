'use client';
// hooks/useSocket.js — sambungan Socket.io klien (TAHAP-08 §6). SAME-ORIGIN: cookie httpOnly
// diterbitkan di staf.<domain>, jadi sambungan ke origin ini membawanya; NEXT_PUBLIC_WS_URL hanya
// bila terisi (REFERENSI 13). Realtime = penyempurna: sambungan gagal -> antarmuka tetap jalan tanpa
// galat mengganggu; pulih -> panggil onSambungUlang (sinkronisasi ulang lewat API), karena event
// selama terputus sudah hilang; dibersihkan saat komponen dilepas.
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * @param {Record<string, (muatan:any)=>void>} penangan  peta event -> fungsi
 * @param {{onSambungUlang?: () => void, aktif?: boolean}} opsi
 * @returns {'menyambung'|'tersambung'|'terputus'|'ditolak'}
 */
export default function useSocket(penangan, { onSambungUlang, aktif = true } = {}) {
  const [keadaan, setKeadaan] = useState('menyambung');
  const refPenangan = useRef(penangan);
  const refSambungUlang = useRef(onSambungUlang);

  // Penangan terbaru disimpan di ref (diperbarui di effect, bukan saat render) agar socket tidak dibuat ulang.
  useEffect(() => {
    refPenangan.current = penangan;
    refSambungUlang.current = onSambungUlang;
  }, [penangan, onSambungUlang]);

  useEffect(() => {
    if (!aktif || typeof window === 'undefined') return undefined;
    const tujuan = process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
    const socket = io(tujuan, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
    });
    let pernahTersambung = false;
    socket.on('connect', () => {
      setKeadaan('tersambung');
      if (pernahTersambung) refSambungUlang.current?.(); // pulih dari putus: susul ketinggalan lewat API
      pernahTersambung = true;
    });
    socket.on('disconnect', () => setKeadaan('terputus'));
    socket.on('connect_error', (galat) => {
      // Ditolak autentikasi (tanpa token/sesi batal): berhenti mencoba — halaman tetap berfungsi.
      const pesan = String(galat?.message || '');
      if (/TANPA_TOKEN|TOKEN_TIDAK_SAH|AKUN_NONAKTIF|SESI_DIBATALKAN/.test(pesan)) { setKeadaan('ditolak'); socket.disconnect(); }
      else setKeadaan('terputus');
    });
    const daftar = Object.keys(refPenangan.current || {});
    const pembungkus = {};
    for (const nama of daftar) {
      pembungkus[nama] = (muatan) => refPenangan.current?.[nama]?.(muatan);
      socket.on(nama, pembungkus[nama]);
    }
    return () => {
      for (const nama of daftar) socket.off(nama, pembungkus[nama]);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [aktif]);

  return keadaan;
}
