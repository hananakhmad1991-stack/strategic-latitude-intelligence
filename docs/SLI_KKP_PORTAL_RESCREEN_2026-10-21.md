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

## Regional KKP 2019–2024 · audited expansion
- `data/sli-kkp-regional-historical-2019-2024.json` memuat **354 observasi angka** pada dua seri KKP per provinsi/per tahun: nelayan tangkap laut (34 provinsi dengan angka di tiap tahun 2019–2023, 37 tahun 2024) dan produksi pembesaran rumput laut (26, 24, 24, 23, 24, 26 provinsi per tahun).
- **12 pemeriksaan total nasional:** seluruh enam tahun jumlah nelayan cocok secara eksak dengan baris TOTAL KKP. Rumput laut berbeda hanya -0,03 hingga +0,02 ton akibat pembulatan tabel KKP. Sumber asli:
  - https://portaldata.kkp.go.id/Portals/Data-Statistik/Nelayan/Tbl-Statis/d/65
  - https://portaldata.kkp.go.id/portals/data-statistik/prod-ikan/tbl-statis/d/1
- Angka `null` berarti sel tabel KKP kosong, bukan nol. KEP. BANGKA BELITUNG tahun sebelum 2024 disamakan nomenklaturnya, tetapi pemekaran Papua tahun 2024 **tidak** mengubah pengukuran 2019–2023. Tahun 2025 bertanda estimasi tidak dimasukkan.
- Peta interaktif memanfaatkan modul visualisasi provinsi SLI dengan GeoJSON 38 provinsi berlisensi komunitas CC BY 4.0 dan **batas ilustratif, bukan batas resmi BIG**. Oleh karena itu peta ini adalah *visualization preview*, tidak memenuhi permintaan peta geometri BIG resmi/WPP. Penggantian harus menunggu pemeriksaan versi, geometri, atribusi, perizinan, dan crosswalk kode provinsi/wilayah. Ina-Geoportal: https://tanahair.indonesia.go.id/portal-web/unduh/.
- Dashboard mendukung pemilihan kedua indikator dan tahun 2019–2024, choropleth berinteraksi melalui klik/keyboard, detail peringkat, tren nasional/provinsi dan ekspor CSV teratribusi. Nilai tidak diketahui tetap tidak diwarnai sebagai nilai nol.
- `scripts/sli_research_source_adapters.py`: indeks Research AI dibatasi **36 rekaman bukti historis** (12 total nasional dan 24 sampel top-2 provinsi per indikator/tahun). Ke-354 pengukuran tersedia melalui dashboard, bukan diklaim seluruhnya ada di konteks Worker. Ini *evidence retrieval* historis, bukan pembuktian sebab akibat atau retraining model.

## Peluang 1.377 baris pembenihan tersisa
- Tambah `scripts/import_kkp_hatchery_export.py` sebagai gerbang offline; meminta unduhan CSV **asli dari KKP** sesuai tahun dan 1.387 baris, memeriksa duplikasi kunci provinsi/kabupaten/komoditas, satuan dan angka, serta merekonsiliasi 10 baris publik yang sudah disalin sebelumnya.
- Secara default pemeriksa **hanya mengeluarkan audit** berisi checksum SHA256, jumlah baris, jumlah pasangan wilayah/komoditas dan perbedaan dengan total nasional; tidak mempublikasikan dataset.
- Full numeric export hanya ditulis ke `artifacts/` dengan bendera operator `--rights-reviewed` setelah izin penggunaan dan redistribusi ditinjau. Tidak ada jalan impor paksa untuk 10 dari 1.387 baris atau sumber fiktif. Full 1.387 belum diimpor, dan izin komersial belum diverifikasi.
- WPPNRI membutuhkan geometri berkoordinat dan peraturan batas resmi; tidak dibuat polygon palsu. Nilai produksi tangkap, konsumsi ikan, garam, armada, PNBP, kawasan konservasi, pembiayaan tetap berstatus kandidat sehingga tidak dinyatakan numerik diimpor.

## BIG official WPP polygon source found — geometry not yet imported
- Public BIG Satu Peta MapServer official **Layer 21**: https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/21
- The official service metadata declares Polygon geometry, EPSG:4326, JSON/geoJSON query formats, and 11 WPP-RI legend zones **571, 572, 573, 711–718**.
- Registered in `data/sli-kkp-wpp-official-geometry-lead.json`; actual polygon geometry, regulation vintage, polygon/area validity and bulk reuse rights are **not yet verified or imported**, so the 38-province map remains clearly labelled community-derived illustrative geography, not WPP.
- Official BIG service has other candidate map layers: conservation zones (33) and mangrove (57), neither numerically or spatially imported. Never treat WPP potential estimates as measured actual catches.

## Tahap BIG/WPP + unduh pembenihan + Owner Worker (22 Oktober 2026)
- Sumber polygon WPP-NRI: [BIG Kebijakan Satu Peta MapServer Layer 21](https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/21). Kode 11 zona hanya dari layanan resmi: 571,572,573,711,712,713,714,715,716,717,718. Pemanfaatan geometri di dashboard berupa **fetch langsung saat pemilik mengklik tombol**, menerima dan memvalidasi 11 kode, tipe Polygon/MultiPolygon, batas koordinat, dan penutupan ring. Geometri tidak di-*commit* ke repository, bukan hasil penelusuran ulang manual, dan tidak dipakai untuk mengklaim PNBP/stok/JTB/ton tangkapan. Status sumber/lisensi/vintage regulasi tetap eksplisit **belum dikonfirmasi**.
- Tampilan on-demand: `js/sli-kkp-wpp-live.mjs`; bila gagal CORS, server BIG tidak mengirim geometri, respons non-geoJSON, atau kurang dari 11 WPP resmi, **tidak membuat polygon fallback**. Unit test `tests/qa-sli-kkp-wpp-live.mjs` mencakup input palsu, geometri rusak, koordinat salah, 11 kode lengkap, dan markup.
- **Pengambilan langsung KKP 1.387 baris:** `scripts/probe_kkp_public_download.mjs` menggunakan Chromium hanya pada halaman resmi yang memiliki tombol “Unduh Data”, bukan mencari endpoint tersembunyi. Bila unduhan CSV memuat semua 1.387 baris, validator `scripts/import_kkp_hatchery_export.py` dapat mencocokkan kesepuluh baris sumber yang telah didigitalisasi. Audit menyimpan SHA256, jumlah/format/status; salinan unduhan tidak disimpan ke repository atau diunggah sebagai GitHub artifact. Unduhan XLSX/binary tidak diperlakukan sebagai CSV terverifikasi; izin penggunaan ulang dan audit metode harus dilakukan sebelum promosi data.
- **Worker Owner negatif nyata**: `scripts/probe_sli_owner_worker_live.mjs` mengirim instruksi uji tanpa token dari origin HTTPS SLI; lulus hanya bila jawaban `401 owner_authentication_required`. Tidak membuktikan model menjawab secara benar. Uji positif memerlukan Owner Test token tersimpan dalam GitHub environment `sli-owner-staging` sebagai secret `SLI_OWNER_TEST_TOKEN`, dipanggil lewat `workflow_dispatch` di `main` dengan `authorize_paid_owner_test=true`. Guard ini sengaja tidak berjalan otomatis di PR agar kredensial tetap terisolasi.
- Rekaman pemeriksaan: workflow `SLI KKP BIG live source + Owner Worker acceptance` menyimpan hanya audit status nonrahasia di GitHub Actions artifacts. **Unit/CI lulus ≠ hak redistribusi, geometri pada setiap client berhasil dimuat, 1.377 baris sisanya tervalidasi, atau uji Owner terautentikasi lulus.**

### Tambahan ringkasan pembenihan provinsi 2024 — angka parsial yang dapat diperiksa
- `data/sli-kkp-hatchery-province-cards-2024.json` mengarsipkan **33 angka kartu ringkasan provinsi yang tampil** pada halaman publik KKP `datainsight/produksi-ikan-pembenihan` (rilis 15 Oktober 2025; data observasi 2024), bukan data rincian yang berjumlah 1.387 baris.
- Subtotal 33 kartu = **187.483.665 ribu ekor**; total nasional tercetak = **188.203.415 ribu ekor**; selisih **719.750 ribu ekor** tidak teralokasi dan TIDAK boleh dibebankan secara otomatis pada Maluku Utara atau provinsi Papua baru. Tidak ada zero-fill, penyamaan otomatis dengan 38 provinsi masa kini, estimasi 2026, ataupun koreksi angka KKP tanpa sumber asli.
- `js/sli-kkp-hatchery-provincial.mjs` merender pemeringkatan dengan filter dan CSV teratribusi; panel menjelaskan cakupan dan selisih nasional. Unit KKP tetap `ribu ekor`, berbeda dari `ton` hasil tangkapan. Tidak boleh dijumlahkan lagi dengan 12 kategori unggulan atau sepuluh baris kabupaten karena dimensi tersebut merujuk pada produksi yang sama.
- `scripts/sli_research_source_adapters.py` memasukkan enam sampel bukti teratribusi (total nasional dan lima kartu provinsi terbesar) ke indeks Research AI, menyertakan selisih nasional di catatan sumber. **33 kartu publik tidak dinyatakan sebagai 1.387 baris yang telah tervalidasi.**
### Hasil pemeriksaan jaringan awal pada runner
- BIG layer 21 adalah layanan resmi yang terdaftar, tetapi permintaan GeoJSON lengkap dari runner pada pengujian awal berakhir **timeout 25 detik**. Ini bukan bukti poligon sudah berhasil dimuat; tombol opt-in akan menampilkan kesalahan tanpa melukis poligon substitusi. Periksa stabilitas query/CORS dan versi regulasi saat verifikasi berikutnya.
- KKP halaman publik HTTP 200 dan tombol `Unduh Data` ditemukan, namun uji Chromium tidak mengeluarkan berkas yang dapat diunduh dalam batas waktu pengamatan. Hasil itu tidak membenarkan impor 1.377 sisanya. Perlu diagnosis implementasi export yang sah atau ekspor file resmi yang diperoleh pemilik.
- Owner Worker menerima pengujian tanpa token dari origin SLI dan mengembalikan **401 owner_authentication_required**, membuktikan penolakan akses tanpa token dalam pengujian tersebut. **Uji positive authorized masih belum dilakukan** karena token sengaja disimpan hanya sebagai secret Owner di Cloudflare; belum ada pembuktian retrieval 33/354 angka historis oleh Worker produksi.
