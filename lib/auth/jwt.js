// lib/auth/jwt.js — terbit & verifikasi JWT dengan jose (HS256). Rahasia dari JWT_SECRET.
// Muatan token: id, peran, wilayah_id, token_version (tv). Tidak ada data sensitif lain.
import { SignJWT, jwtVerify } from 'jose';

const ALGORITMA = 'HS256';
const PENERBIT = 'warkop-nusantara';

function kunciRahasia() {
  const rahasia = process.env.JWT_SECRET;
  if (!rahasia || rahasia.length < 32) {
    throw new Error('JWT_SECRET belum diisi atau terlalu pendek (minimal 32 karakter; anjuran openssl rand -hex 48)');
  }
  return new TextEncoder().encode(rahasia);
}

/** Masa berlaku dari JWT_EXPIRY (format jose: "8h", "30m", "7d"); bawaan 8h. */
export function masaBerlakuToken() {
  return process.env.JWT_EXPIRY || '8h';
}

/** Menerbitkan token untuk pengguna {id, peran, wilayah_id, token_version}. */
export async function terbitkanToken(pengguna) {
  return new SignJWT({
    peran: pengguna.peran,
    wilayah_id: pengguna.wilayah_id ?? null,
    tv: Number(pengguna.token_version) || 0,
  })
    .setProtectedHeader({ alg: ALGORITMA })
    .setSubject(String(pengguna.id))
    .setIssuer(PENERBIT)
    .setIssuedAt()
    .setExpirationTime(masaBerlakuToken())
    .sign(kunciRahasia());
}

/**
 * Memverifikasi token. Mengembalikan {id, peran, wilayah_id, token_version, kedaluwarsa}
 * atau null bila tidak sah/kedaluwarsa. TIDAK memeriksa basis data — pemeriksaan
 * token_version terhadap DB ada di lib/auth/sesi.js (lapisan 3 dan 4).
 */
export async function verifikasiToken(token) {
  try {
    const { payload } = await jwtVerify(token, kunciRahasia(), { algorithms: [ALGORITMA], issuer: PENERBIT });
    return {
      id: Number(payload.sub),
      peran: payload.peran,
      wilayah_id: payload.wilayah_id ?? null,
      token_version: Number(payload.tv) || 0,
      kedaluwarsa: payload.exp,
    };
  } catch {
    return null;
  }
}
