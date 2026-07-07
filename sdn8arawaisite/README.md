# SD Negeri 8 Arawai — Portal Sekolah

Website sekolah satu halaman (single-page) yang dibangun dari desain Claude Design.
Bergaya **Ceria & Ramah Anak** (maroon + Baloo 2/Nunito), tanpa build step —
cukup HTML, CSS, dan JavaScript biasa.

## Isi

| File | Keterangan |
|------|------------|
| `index.html` | Kerangka halaman: header, footer, dan titik pasang konten |
| `styles.css` | Seluruh gaya (tema, layout, animasi) |
| `app.js` | Data + logika: routing, filter, login, form aduan, animasi kursor & stick figure |
| `assets/` | `logo.png` (Tut Wuri Handayani) dan `hero-sekolah.png` |

## Fitur

- **Beranda** — hero foto sekolah, Layanan Digital Sekolah, sambutan Kepala Dinas & Kepala Sekolah, Visi–Misi, kurikulum kelas 1–6, banner PSB, pengumuman & berita
- **Profil**, **Kurikulum** (jadwal + materi per kelas), **Ruang Karya** (galeri + filter + detail), **Artikel & Berita** (cari + muat lebih banyak + baca penuh)
- **Layanan Aduan** — form keluhan/saran dengan mode anonim
- **Akses Khusus** — login berperan → rapor wali murid / panel CMS staf
- Sentuhan: kursor kustom, navbar transparan saat scroll, animasi stick figure, ikon sosial + peta lokasi

Akun demo: `wali@sekolah.id / wali123` · `staf@sekolah.id / staf123`
(semua data masih tiruan/mock — cocok untuk preview portofolio).

## Cara menjalankan lokal

Buka `index.html` langsung di browser, atau jalankan server statis kecil:

```bash
cd site
python3 -m http.server 8080   # lalu buka http://localhost:8080
```

## Cara live di shared hosting (Hostinger, subdomain)

1. **Buat subdomain** di hPanel → *Domains → Subdomains* (mis. `sekolah.namaanda.com`). Catat folder yang dibuat (mis. `public_html/sekolah/`).
2. **Upload** seluruh isi folder `site/` (yaitu `index.html`, `styles.css`, `app.js`, dan folder `assets/`) ke folder subdomain lewat *File Manager*. Pastikan `index.html` berada langsung di dalam folder subdomain.
3. **Aktifkan SSL** di *Domains → SSL* agar alamat menjadi `https://`.
4. Buka `https://sekolah.namaanda.com`. Jika belum muncul, tunggu 5–30 menit (propagasi DNS) lalu refresh.

> Butuh internet untuk memuat Google Fonts dan peta Google Maps — itu wajar dan tetap berjalan di hosting.
