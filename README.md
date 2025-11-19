# Base ResBot - LIVIAA ID 2025

Library / sample bot untuk meng-handle toko via WhatsApp (LIVIAA ID 2025).

## Fitur
- Katalog produk (lihat, tambah, hapus)
- Order via chat
- Notifikasi ke admin
- Cek status order
- Broadcast ke pembeli
- Auto-reply dasar
- Simpan state auth (QR login) di `auth_info.json`
- Simple web status page

## File penting
- `index.js` - entry point
- `base.js` - koneksi WA & event handling
- `src/` - modul (config, db, commands)
- `auth_info.json` - file yang menyimpan session (otomatis dibuat)

## Instalasi
1. `git clone` repo
2. `npm install`
3. Edit `src/config.js` -> ganti `ADMINS` dengan nomor admin
4. `npm start`
5. Scan QR code yang muncul di terminal pada run pertama

## Perintah (chat)
- `!menu` / `!help` : tampilkan menu
- `!produk` : daftar produk
- `!addproduk nama|harga|deskripsi|stok` (admin)
- `!hapusproduk <productId>` (admin)
- `!order <productId>|<qty>|<nama>|<alamat>`
- `!cekpesanan <orderId>`
- `!setstatus <orderId>|<status>` (admin)
- `!broadcast <pesan>` (admin)

## Catatan keamanan
- Simpan `auth_info.json` aman. Jangan commit ke publik.
- Pastikan nomor admin benar.
