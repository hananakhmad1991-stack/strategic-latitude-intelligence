# KKP Portal Statistik — screening tambahan 21 Oktober 2026

Halaman sumber: https://portaldata.kkp.go.id/portals/data-statistik/layer1

## Sudah diimpor secara numerik

- `data/sli-kkp-portal-screened-2024.json`: 37 baris provinsi nelayan tangkap laut tahun observasi 2024. Penjumlahan 2.819.994 orang, sama dengan total tabel resmi.
- Rumput laut pembesaran: 26 baris provinsi dengan angka 2024 yang tercetak. Penjumlahan 9.853.604,03 ton berbeda 0,03 ton dari total nasional 9.853.604,06 akibat pembulatan baris.
- Pembenihan: 12 kategori kelompok ikan terbesar tahun 2024, dengan satuan asli portal `ribu ekor`. Portal memiliki 1.387 baris kabupaten/komoditas, tetapi rincian tersebut BELUM diimpor.

Sumber: https://portaldata.kkp.go.id/Portals/Data-Statistik/Nelayan/Tbl-Statis/d/65 ; https://portaldata.kkp.go.id/portals/data-statistik/prod-ikan/tbl-statis/d/1 ; https://portaldata.kkp.go.id/datainsight/produksi-ikan-pembenihan

## Sumber ditemukan, tetapi belum diimpor sebagai angka

`data/sli-kkp-screened-source-register.json`: 25 rute resmi di 12 tema. Hanya tiga sumber punya subset angka di layar. Sisanya tetap `not_imported`: perikanan tangkap, garam, petambak, konsumsi, serapan, ekspor/impor HS, PDB perikanan, kapal, luas budidaya, SDM, PNBP, pengawasan, mangrove dan kawasan laut.

## Visual dan metodologi

Dashboard baru: `marine-fisheries-intelligence.html#marine-source-atlas`. Ranking provinsi, filter, tabel sumber, grafik pembenihan, ekspor CSV dan katalog sumber. Ini bukan peta batas administrasi atau WPP yang telah diuji; geometri peta harus ditambahkan dari sumber geospasial resmi terverifikasi.

Sel kosong bukan nol; observasi 2024 bukan data live; 2025 estimasi tidak dicampur dengan data observasi; rumput laut bukan tambahan dari total budidaya; satuan bibit ikan tidak dikonversi ke ton. Izin redistribusi untuk penggunaan komersial harus diperiksa secara terpisah.

Backlog: rincian 1.387 baris pembenihan, data penangkapan per WPP, potensi vs tangkapan aktual, matriks HS–mitra–periode untuk Sankey, serta GeoJSON/WMS wilayah dan konservasi yang punya versi dan izin jelas.

Uji: `node --test tests/qa-sli-kkp-source-atlas.mjs`.
## Tambahan pembenihan kabupaten/kota (sesudah PR #136)

- Sumber resmi KKP menampilkan 1.387 baris tahun 2024 dalam tabel insight. Sepuluh baris teratas yang terlihat sudah ditranskripsi berikut provinsi, kabupaten/kota, kelompok ikan, volume (ribu ekor), nilai (Rp juta), dan harga rata-rata tertimbang (Rp/ribu ekor). **1.377 baris lainnya belum diimpor.**
- Ini hanya subset baris yang terlihat, bukan keseluruhan kabupaten, bukan penjumlahan provinsi, dan bukan statistik 2026. Harga rata-rata tertimbang tercetak bukan harga transaksi setiap ikan dan dapat dibulatkan.
- Dashboard dapat mencari provinsi, kabupaten dan komoditas, menampilkan enam kolom angka, dan mengekspor subset terfilter dengan satuan, status sampel, observasi, dan tautan sumber.
- Adapter Research AI secara khusus menghasilkan 34 rekaman 2024 yang masing-masing punya URL KKP: dua total nasional, masing-masing lima provinsi teratas untuk dua indikator, dua belas kategori benih, dan sepuluh baris pembenihan kabupaten/kota. Rekaman ini adalah evidence yang terkait sumber, bukan otomatis fakta terbaru, analisis sebab-akibat, atau angka 1.387 baris yang sudah lengkap.
- Tes menolak nilai tidak numerik, duplikasi komoditas dan wilayah, satuan keliru, serta tidak sinkronnya angka sumber dan Research AI.
