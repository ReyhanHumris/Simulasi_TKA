 # TODO — Persiapkan Deploy Vercel

- [x] 1. Bersihkan `index.html` — hapus script arena development (recording, views, element-picker)
- [x] 2. Buat `vercel.json` — konfigurasi Vite framework + SPA rewrites
- [x] 3. Tambah `engines` (Node >=20.19.0) di `package.json`
- [x] 4. Update `README.md` — tambah panduan deployment Vercel
- [x] 5. Verifikasi build produksi (`npm run build`) — berhasil, tanpa warning

---

# TODO — Perbaiki Error TS7023 (Deploy Vercel Gagal)

**Error:** `src/App.tsx(572,11): error TS7023: 'fact' implicitly has return type 'any' because it does not have a return type annotation and is referenced directly or indirectly in one of its return expressions.`

**Akar Masalah:** Variabel `const fact` dan `const fact25` berbentuk arrow function rekursif. TypeScript strict (`tsc -b`) tidak dapat menyimpulkan tipe return karena `const` direferensikan di dalam initializer-nya sendiri sebelum binding selesai (circular reference). `npm run dev` tidak memvalidasi tipe (Vite/esbuild), sehingga error baru muncul saat `tsc -b` dijalankan Vercel saat deploy.

- [x] 1. Analisis error & identifikasi baris bermasalah di `src/App.tsx`
- [x] 2. Ubah `const fact = (n: number): number => ...` menjadi `function fact(n: number): number { ... }` (function declaration bersifat hoisted sehingga rekursi aman dari TS7023)
- [x] 3. Ubah `const fact25 = (n: number): number => ...` menjadi `function fact25(n: number): number { ... }` (alasan sama)
- [x] 4. Verifikasi build produksi (`npm run build`) — berhasil, `tsc -b && vite build` lolos tanpa error TS7023 (built in 3.48s)
- [x] 4. Verifikasi build produksi (`npm run build`) — memastikan `tsc -b` lolos tanpa error TS7023
- [ ] 5. Deploy ulang ke Vercel & konfirmasi hasil
