# Nuveicecream — Checkout + Admin + Google Sheets

Paket ini adalah **starter revisi** yang memakai desain dari file website yang tersedia di riwayat proyek (versi HTML MeloIce). File database Apps Script dan frontend perlu dipasangkan dengan deployment Google Apps Script milikmu sebelum dipakai live. Ini bukan klaim bahwa integrasi sudah tersambung ke database produksi kamu.

## Isi paket
- `index.html`, `style.css`, `script.js`: frontend, form checkout nama + WhatsApp, login admin, dashboard pesanan, perubahan status, CRUD produk/pesanan.
- `config.js`: hanya tempat URL Web App Apps Script; tidak menyimpan password.
- `Code.gs`: backend Apps Script, membuat sheet/header, menerima order, login admin, CRUD dan session.

## 1. Siapkan Google Sheets dan Apps Script
1. Buka spreadsheet database kamu, lalu pilih **Extensions → Apps Script**. Jika Apps Script sudah berisi backend lama yang berfungsi, buat salinan proyek dulu dan gabungkan fungsi ini dengan hati-hati; jangan langsung menimpa backend lama.
2. Masukkan isi `Code.gs` ke proyek Apps Script baru atau file `.gs` terpisah.
3. Buka **Project Settings → Script Properties**, tambahkan:
   - `ADMIN_PASSWORD` = `Bismillaah`
   - `SPREADSHEET_ID` = ID spreadsheet kamu (bagian di antara `/d/` dan `/edit` pada URL)
4. Jalankan `setupDatabase()` dari editor Apps Script satu kali, lalu izinkan akses. Fungsi membuat sheet `Orders`, `Products`, `ActivityLogs` beserta header otomatis. Jika sheet dengan header yang tidak cocok sudah ada, fungsi sengaja berhenti agar tidak merusak data.
5. Deploy → **New deployment** → pilih **Web app**. Execute as: **Me**. Atur akses sesuai opsi yang tersedia untuk kebutuhan publik. Salin URL yang berakhiran `/exec`.
6. Buka `config.js`, ganti `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE` dengan URL `/exec` tadi.
7. Upload semua file frontend ke repository GitHub Pages.

## 2. Cara kerja
- Pelanggan menambahkan produk, lalu menekan **Pesan Sekarang** saat keranjang sudah berisi item. Form meminta nama dan nomor WhatsApp.
- Pesanan tersimpan di sheet `Orders` dengan status `Menunggu`.
- Tombol **Admin** di header membuka login. Password diverifikasi server-side melalui Script Properties.
- Dashboard menampilkan pesanan, pencarian, filter, tautan WhatsApp, update status, dan hapus pesanan.
- CRUD produk mendukung tambah/edit/hapus di sheet `Products`.
- Sesi admin disimpan di CacheService dan berakhir setelah kira-kira 6 jam.

## Penting sebelum live
- Password tidak ditaruh di GitHub. `ADMIN_PASSWORD` berada di Script Properties. Untuk produksi, gunakan password unik yang kuat dan ubah nilai Script Property.
- Backend ini contoh integrasi mandiri. Jika database kamu yang sekarang memakai nama sheet/header/action berbeda, sesuaikan `SHEETS` dan fungsi pembacaan sebelum deployment. Jangan jalankan `setupDatabase()` pada sheet lama dengan header berbeda tanpa membuat backup.
- Endpoint Apps Script yang dibuka untuk publik tetap harus memvalidasi setiap input. `createOrder` sengaja publik; semua tindakan admin memerlukan token sesi.
- Google Apps Script Web App kadang menampilkan error deployment/otorisasi saat konfigurasi akses tidak sesuai. Uji di URL `/exec` dan lakukan satu pesanan percobaan sebelum diumumkan.
- Produk yang ditampilkan pada HTML statis awal belum otomatis dibaca dari sheet oleh katalog publik. CRUD mengelola sheet; sinkronisasi katalog publik perlu disesuaikan dengan struktur produk dan website produksi kamu.
- Karena ZIP ini dibuat dari file website lama yang tersedia, cocokkan kembali nama brand, produk, harga, gambar, dan integrasi yang ada pada versi live sebelum menggantikan repository saat ini.
