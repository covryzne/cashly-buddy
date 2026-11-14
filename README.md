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
`../design-references/cashly_beranda_varian_b_floating_cards/`.

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
    assets/                # Registrasi cache aset dan preload background
    api/                   # Tempat transport API saat tahap integrasi
    format/                # Utilitas format Rupiah dan tanggal bersama
    theme/                 # Utilitas tema
  mocks/
    fixtures/              # Dummy data fiktif untuk prototipe frontend
  styles/                  # Styles bersama dan semantic tokens nantinya
public/
  branding/                # Identitas visual runtime
  icons/                   # Ikon PWA
  mascot/                  # Ilustrasi Mochi
  asset-worker.js          # Cache berversi untuk aset publik dalam allowlist
```

Folder yang belum diimplementasikan berisi `.gitkeep` agar tersimpan di Git.
Konfigurasi proyek, environment, dan `public/` berada di root, sejajar dengan `src/`.
Referensi desain berada di `../design-references/`, di luar aplikasi Next.js.

## Cache aset publik

Checklist implementasi dan hasil validasi: `docs/asset-cache.md`.

Worker v2 mempertahankan cookie browser pada request aset satu origin agar gambar
tetap dimuat melalui private dev tunnel. Spline CDN tetap tanpa credentials.
Sesudah pembaruan worker, buka ulang/reload halaman; jika halaman pertama masih
dikendalikan worker lama, reload sekali lagi setelah worker baru aktif. Tidak
perlu mengubah visibilitas tunnel atau membagikan token akses.

- Root mendaftarkan `/asset-worker.js` pada HTTPS/localhost, termasuk tunnel dev.
  Saat form login muncul, gambar/ikon runtime dan scene Mochi disiapkan di
  background tanpa menahan login atau membuat canvas/WebGL.
- Worker memakai cache-first hanya untuk allowlist. Next image variants diterima
  hanya jika sumbernya ada dalam daftar. HTML/RSC, auth, API, kredensial, foto
  struk, dan respons error tidak disimpan. Font/JS/CSS tetap memakai cache HTTP
  normal milik Next/browser; ini tidak menyediakan offline app shell.
- Reduced motion dan Save-Data melewati preload scene besar. Beranda tetap dapat
  memuat 3D ketika dipilih secara normal. Worker/cache yang tidak tersedia
  memiliki fallback fetch biasa; gagal scene memakai ilustrasi Mochi.
- **Naikkan VERSION di public/asset-worker.js setiap scene atau aset dalam daftar
  berubah**, walaupun URL-nya sama. Daftar URL scene di worker dan
  spline-mascot.tsx harus sama. Worker baru membersihkan versi aset Cashly lama
  tanpa reload halaman atau mengubah cache lain.
- Untuk rollback, terbitkan worker di URL yang sama dengan handler fetch dilepas
  dan aktivasi yang membersihkan cache berawalan cashly-public-assets-, kemudian
  unregister dirinya. Jangan hanya menghapus file worker, karena versi lama bisa
  tetap mengendalikan klien. Domain tunnel berbeda memiliki cache terpisah.
- Uji target: `npx playwright test tests/asset-cache.spec.ts tests/asset-worker.spec.ts tests/mascot.spec.ts --workers=3`.
  Verifikasi Safari standalone pada iPhone fisik tetap diperlukan.

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
- Manifest dan ikon aplikasi Mochi tersedia. Service worker hanya menyimpan aset
  publik dalam allowlist; tidak menyimpan HTML, data keuangan, API, auth, foto
  struk, atau offline writes. Backend dan pemberian reward belum terhubung.
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

Metode **Chat manual** menggantikan input manual langsung: pesan pembelian →
analisis → rincian yang dapat dikoreksi → konfirmasi. Panduan, batas parser
lokal, komponen shadcn dan setup MCP: [docs/chat-manual.md](docs/chat-manual.md).
Keputusan: [ADR-0029](../specs/ADR/0029-chat-manual-expense-and-shadcn-mcp.md).

**Voice note kilat** sudah menyediakan perekaman mikrofon dan playback lokal,
review setelah Tinjau, serta transkrip yang dapat diedit di rincian. Transkripsi otomatis belum
terhubung. Detail dan batas implementasi: [docs/voice-note.md](docs/voice-note.md).

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
- `../design-references` menjadi referensi implementasi di luar aplikasi Next.js.
  Baca berkasnya langsung dari workspace; hanya aset runtime hasil implementasi
  yang ditempatkan di public/branding, public/icons, dan public/mascot.

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

## Kredit komponen

- Fluid Orb oleh [Rare UI](https://rareui.com), Copyright © 2026 Swami Malode.
  Dipasang dari `swamimalode07/rare-ui/fluid-orb`, disesuaikan untuk Cashly;
  [lisensi dan atribusi](src/components/ui/RARE-UI-LICENSE.txt).
- VoiceNote, RollingText dan utilitas oleh [Detent](https://detentui.com),
  Copyright © 2026 Detent, MIT. Source registry disesuaikan ke token Cashly dan
  audio rekaman nyata; [lisensi](src/components/detent/LICENSE).

Detail integrasi: [docs/voice-orb-player.md](docs/voice-orb-player.md).

Diagnostik Chrome/hydration dan perbaikan orb pada dev Strict Mode:
[docs/browser-debugging.md](docs/browser-debugging.md).
Jalankan `npm run test:dev-browser` untuk memeriksa hydration dan WebGL hidup
langsung di dev server.
`npm run test:dev-autofill` mereproduksi ID autofill Chrome iOS sebelum hydration
pada login, register dan lupa sandi, termasuk kontrol untuk mendeteksi mismatch
lain di luar elemen form yang diberi exception.
