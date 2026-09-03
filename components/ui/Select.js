// components/ui/Select.js — <select> berlabel. Kelas VERBATIM dari
// kontak_pengaduan_warkop_nusantara_updated_logo/code.html ("Kategori Masalah").
//   <Select id="kategori" label="Kategori Masalah" placeholder="Pilih Kategori..." opsi={[{nilai, label}]} />
import { KELAS_INPUT } from './Input';

export const KELAS_SELECT = 'w-full bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface py-2 px-0 appearance-none cursor-pointer';

export default function Select({ id, label, opsi = [], placeholder = null, galat = null, className = '', ...props }) {
  const idGalat = galat ? `${id}-galat` : undefined;
  return (
    <div className={`${KELAS_INPUT.pembungkus}${className ? ` ${className}` : ''}`}>
      <label className={KELAS_INPUT.label} htmlFor={id}>{label}</label>
      <select id={id} className={KELAS_SELECT} aria-describedby={idGalat} aria-invalid={galat ? true : undefined} {...props}>
        {placeholder !== null ? <option disabled value="">{placeholder}</option> : null}
        {opsi.map((o) => (
          <option key={o.nilai} value={o.nilai}>{o.label}</option>
        ))}
      </select>
      {galat ? <p id={idGalat} className={KELAS_INPUT.galat} role="alert">{galat}</p> : null}
    </div>
  );
}
