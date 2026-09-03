// components/ui/Tabel.js — tabel data staf. Kelas VERBATIM dari kelola_artikel_admin/code.html
// (baris 183–195): pembungkus kartu border-tertiary, kepala bg-primary, baris divide-y.
//   <Tabel kolom={[{kunci:'judul', label:'Judul Artikel'}, {kunci:'status', label:'Status', kelas:'hidden md:table-cell'}]}
//          baris={data} kunciBaris={(b) => b.id} sel={(b, k) => …} keteranganKosong="Belum ada artikel" />
// Tampilan responsif: kolom bisa diberi kelas hidden md:table-cell seperti di desain.
export const KELAS_TABEL = Object.freeze({
  pembungkus: 'bg-surface-container-lowest border border-tertiary rounded-lg overflow-hidden shadow-sm',
  gulir: 'overflow-x-auto',
  tabel: 'w-full text-left border-collapse',
  kepala: 'bg-primary text-on-primary',
  th: 'px-6 py-4 font-label-md text-label-md border-b border-outline-variant',
  badan: 'divide-y divide-outline-variant',
  baris: 'hover:bg-surface-container-low transition-colors bg-surface-container-lowest',
  td: 'px-6 py-4',
  kaki: 'px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center text-sm text-on-surface-variant',
});

export default function Tabel({ kolom, baris, kunciBaris, sel, keteranganKosong = 'Tidak ada data', kaki = null, keterangan = null }) {
  return (
    <div className={KELAS_TABEL.pembungkus}>
      <div className={KELAS_TABEL.gulir}>
        <table className={KELAS_TABEL.tabel}>
          {keterangan ? <caption className="sr-only">{keterangan}</caption> : null}
          <thead className={KELAS_TABEL.kepala}>
            <tr>
              {kolom.map((k) => (
                <th key={k.kunci} scope="col" className={`${KELAS_TABEL.th}${k.kelas ? ` ${k.kelas}` : ''}`}>{k.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className={KELAS_TABEL.badan}>
            {baris.length === 0 ? (
              <tr className={KELAS_TABEL.baris}>
                <td className={`${KELAS_TABEL.td} text-on-surface-variant font-body-md text-body-md text-center`} colSpan={kolom.length}>{keteranganKosong}</td>
              </tr>
            ) : (
              baris.map((b) => (
                <tr key={kunciBaris(b)} className={KELAS_TABEL.baris}>
                  {kolom.map((k) => (
                    <td key={k.kunci} className={`${KELAS_TABEL.td}${k.kelas ? ` ${k.kelas}` : ''}${k.kelasSel ? ` ${k.kelasSel}` : ''}`}>{sel(b, k.kunci)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {kaki ? <div className={KELAS_TABEL.kaki}>{kaki}</div> : null}
    </div>
  );
}
