# Cashly Buddy Frontend

Frontend Cashly menggunakan Next.js App Router, TypeScript, dan Tailwind CSS.
Tahap awal berfokus pada prototipe frontend dengan data fiktif. Requirement
proyek tersedia di `../specs/README.md`.

Copy UI utama mengikuti tampilan produk tanpa badge/peringatan simulasi, dummy,
atau demo (ADR-0024). Penanda dan bantuan akun contoh tetap ada pada alur auth.
Perubahan copy tidak menambah OCR, penyimpanan, atau reward; fixture dan batas
implementasi yang dijelaskan di dokumen ini tetap berlaku.

## Menjalankan proyek

Jalankan perintah dari folder `cashly-buddy-frontend`:

```sh
npm ci
npm run dev
```

Buka http://localhost:3000: aplikasi mengarah ke `/login`. Pilih **Isi data contoh**,
lalu **Masuk ke demo** untuk membuka `/beranda`. Acuan desain Beranda:
`public/assets/cashly_beranda_varian_b_floating_cards/`.

## Struktur folder

```text
src/
  app/                     # Routing, layout, metadata, dan global CSS
  components/
    ui/                    # Primitive UI reusable; tempat shadcn nantinya
    shared/                # Komponen lintas fitur: navigasi, state screens
    finance/               # Komponen pengeluaran, form, dan grafik
    gamification/          # Komponen mascot, streak, XP, dan misi
  features/
    auth/                  # Komposisi, hooks, schema, dan adapter fitur auth
    expenses/              # Logika tampilan fitur pengeluaran
    reports/               # Logika tampilan fitur laporan
    gamification/          # Logika tampilan fitur gamification
    home/                  # Komposisi Beranda dan interaksi pratinjau
  lib/
    api/                   # Tempat transport API saat tahap integrasi
    format/                # Utilitas format Rupiah dan tanggal bersama
    theme/                 # Utilitas tema
  mocks/
    fixtures/              # Dummy data fiktif untuk prototipe frontend
  styles/                  # Styles bersama dan semantic tokens nantinya
public/
  assets/                  # Referensi desain dan UI kit yang disediakan
```

Folder yang belum diimplementasikan berisi `.gitkeep` agar tersimpan di Git.
Konfigurasi proyek, environment, dan `public/` berada di root, sejajar dengan `src/`.

## Login demo

- Form email/kata sandi dengan validasi schema Zod dan kontrol tampilkan kata sandi.
- Hanya menerima akun fiktif dari `src/mocks/fixtures/auth.ts`; tombol Isi data contoh
  mengisi form. Data tidak dikirim ke server atau disimpan di browser.
- Ini alur pratinjau, bukan autentikasi atau pelindung route. `/beranda` dapat
  dibuka langsung. Signup dan pemulihan kata sandi masih berupa informasi.
- Input, tombol, dialog, dan tombol tema dipakai kembali dari komponen bersama.
- Layar login dirancang dari token/UI kit Cashly, tanpa aset desain layar baru.

## Cakupan Beranda

- Ringkasan pengeluaran, kategori floating cards, mascot Spline 3D, streak,
  misi, dan transaksi terbaru; nominal dan progres merupakan fixture fiktif.
- Detail kategori dan transaksi dapat ditinjau lewat dialog. Menu lain serta
  pencatatan pengeluaran menampilkan informasi tahap berikutnya.
- Tema sistem/terang/gelap, navigasi mobile dengan safe area, sidebar desktop,
  fallback mascot, dukungan reduced motion, dan indikator offline.
- Manifest dan ikon aplikasi Mochi tersedia. Tidak ada service worker, cache
  data keuangan, offline writes, koneksi backend, atau pemberian reward.
- Ilustrasi statis Mochi terbaru memakai referensi `public/mascot/mochi-reference (2).png`
  (mahkota, jubah dan koin), dengan latar dihapus menggunakan imagegen bawaan.
  Master alpha: `public/mascot/mochi-crown-transparent.png`; versi WebP untuk login,
  quick-add, scan dan fallback Beranda: `public/mascot/mochi-crown-transparent.webp`.
  Beranda tetap memakai scene Spline pengguna. Satu scene ini belum
  merepresentasikan keempat tahap evolusi.
- Ikon aplikasi memakai desain `stitch_cashly_icon_app/screen.png` yang disetujui
  pengguna: PNG 192/512, maskable 512, Apple touch 180, serta favicon PNG/ICO.
  Jalankan `npm run icons:generate` untuk menghasilkan ulang dari salinan sumber
  di `scripts/assets/cashly-app-icon.png`. Validasi install di iPhone/Android
  fisik dan HTTPS deployment belum dilakukan.
- Ikon iPhone juga tersedia di `/apple-touch-icon.png` untuk fallback Safari.
  Akses aset lewat tunnel harus dapat dilakukan tanpa login; pratinjau Share Sheet
  dapat memiliki bingkai sistem yang berbeda dari ikon di Home Screen.

Ringkasan perubahan desain dan batas verifikasi: `docs/home-preview.md`.

Login dan `/register` memakai `AuthShell` bersama. Mobile menampilkan cerita
Mochi lengkap dengan dua floating notes dan ikon header baru. Form pendaftaran
memvalidasi nama, email, kata sandi dan konfirmasi secara lokal, lalu menghapus
input dan menawarkan demo. Tidak ada akun yang dibuat atau kredensial disimpan.
Tombol Google pada kedua form membuka penjelasan pratinjau; belum terhubung OAuth.
Aset header dan sumber logo Google tercatat di `public/branding/README.md`.

Link Lupa kata sandi membuka `/forgot-password`, dengan validasi email, data
contoh dan konfirmasi simulasi. Tidak ada email dikirim atau kata sandi diubah;
input dibersihkan setelah validasi dan dapat diisi ulang.

Setelah jepret atau memilih struk contoh, layar analisis struk menampilkan progres
simulasi selama 2,4 detik sebelum review dummy. Ketik manual saja membuka draft
kosong dengan foto tetap tersedia; Batal/Kembali membersihkan foto sementara dan
kembali ke pengantar izin. Galeri tetap memakai review manual. Progres ini belum
terhubung ke OCR atau upload foto. Progres OCR memakai lingkaran berpersentase tanpa bar linear. Loader aset
(scene 3D, foto dan kamera) memakai Slide asli dari loading-dev melalui AssetLoader
bersama, default 48px, dengan reduced motion bawaan library.
`npm run test:dev-styles` memeriksa computed style date/time dan scan langsung
di dev server; `CASHLY_DEV_URL` dapat menunjuk origin development lain.
Tailwind diproses lewat `postcss.config.mjs` dengan `@tailwindcss/postcss`,
tanpa rule loader Turbopack untuk semua CSS. Token dan stylesheet fitur diimpor
langsung dari root layout agar tetap tersedia pada dev server setelah restart.

Loader Mochi memakai Slide 28px. Circle OCR menampilkan persen saja, dengan
diameter 112px (100px pada viewport pendek). Pengantar izin kamera dilewati jika
izin browser sudah diberikan atau stream pernah berhasil dibuka. Hanya flag
preferensi pengantar yang disimpan lokal; izin asli tetap ditentukan browser dan
flag dibersihkan ketika akses ditolak/dicabut. Kamera tetap berhenti saat ditutup.

## Aturan penempatan kode

- Alias `@/` mengarah ke `src/`, misalnya `@/components/shared/AppShell`.
- `app/` menyusun halaman dari komponen; gunakan Server Components secara
  default dan Client Components untuk interaksi atau browser APIs.
- Cari dan gunakan kembali komponen yang ada sebelum menambah komponen baru.
  Simpan primitive di `components/ui`, komponen lintas fitur di `shared`, dan
  widget domain di `finance` atau `gamification`.
- Simpan hooks, schema, adapter data, dan logika tampilan khusus fitur di
  `features/<fitur>`. Hook yang hanya dipakai satu fitur tetap di fitur tersebut.
- Pusatkan format uang dan tanggal di `lib/format`; gunakan semantic tokens
  untuk konsistensi light/dark saat UI mulai diimplementasikan.
- Letakkan data prototipe di `mocks/fixtures` dan pisahkan dari komponen
  presentasi. Data harus fiktif dan jelas sebagai demo, bukan data pengguna.
- `public/assets` menjadi referensi implementasi, bukan kode yang langsung
  disalin tanpa review. Aset publik diakses lewat `/assets/...`.

Koneksi backend, autentikasi nyata, database, dan aturan bisnis yang otoritatif
belum diimplementasikan pada tahap struktur ini.

## Verifikasi

```sh
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

Tes E2E memerlukan Google Chrome lokal. Jalankan build sebelum E2E karena
Playwright menjalankan production server di port 3127. Screenshot setiap
viewport tersimpan di `test-results/` (diabaikan Git).
