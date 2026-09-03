// components/ui/Input.js — input teks / textarea berlabel. Kelas VERBATIM dari
// kontak_pengaduan_warkop_nusantara_updated_logo/code.html (garis bawah, fokus emas via
// .form-input-focus di globals.css). Setiap input WAJIB berlabel (aksesibilitas TAHAP-04).
//   <Input id="nama" label="Nama Lengkap (Sesuai KTP)" placeholder="…" />
//   <Input id="deskripsi" label="…" multibaris rows={5} />
export const KELAS_INPUT = Object.freeze({
  pembungkus: 'form-input-focus border-b border-outline-variant transition-colors',
  label: 'font-label-md text-label-md text-primary block mb-1',
  input: 'w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface py-2 px-0',
  textarea: 'w-full bg-transparent border border-outline-variant rounded p-3 focus:border-secondary focus:ring-0 font-body-md text-body-md text-on-surface',
  keterangan: 'font-body-md text-body-md text-on-surface-variant mt-1 text-sm',
  galat: 'font-label-md text-label-md text-on-error-container mt-1 text-xs',
});

export default function Input({ id, label, multibaris = false, keterangan = null, galat = null, className = '', ...props }) {
  const Elemen = multibaris ? 'textarea' : 'input';
  const idKeterangan = keterangan ? `${id}-keterangan` : undefined;
  const idGalat = galat ? `${id}-galat` : undefined;
  return (
    <div className={`${KELAS_INPUT.pembungkus}${className ? ` ${className}` : ''}`}>
      <label className={multibaris ? 'font-label-md text-label-md text-primary block mb-2' : KELAS_INPUT.label} htmlFor={id}>{label}</label>
      <Elemen
        id={id}
        className={multibaris ? KELAS_INPUT.textarea : KELAS_INPUT.input}
        aria-describedby={[idKeterangan, idGalat].filter(Boolean).join(' ') || undefined}
        aria-invalid={galat ? true : undefined}
        {...(multibaris ? {} : { type: props.type ?? 'text' })}
        {...props}
      />
      {keterangan ? <p id={idKeterangan} className={KELAS_INPUT.keterangan}>{keterangan}</p> : null}
      {galat ? <p id={idGalat} className={KELAS_INPUT.galat} role="alert">{galat}</p> : null}
    </div>
  );
}
