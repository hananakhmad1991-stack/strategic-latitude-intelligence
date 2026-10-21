# Free public-data acquisition route — BPS 2025 HS × partner pilot

**Open request / not submitted.** This memo prepares a precise question for BPS PST and its public WebAPI support. Nothing below indicates the request has been sent, a license has been granted, or a national bilateral HS cell has been downloaded.

## Public routes identified
1. Official export/import dashboard (national scope): https://www.bps.go.id/id/exim — exposed filters for flow, HS, year, country, port, month; need to verify if **one output table actually includes the HS × country joint rows** and offers a public downloadable format.
2. 2025 export yearbook: https://www.bps.go.id/id/publication/2026/08/10/556d446e35c86054cb33739f/statistik-perdagangan-luar-negeri-indonesia-ekspor-2025.html — official annual HS2022, FOB, commodity and destination breakdowns; inspect actual pages, don't infer the cross-classification only from the abstract.
3. 2025 import yearbook: https://www.bps.go.id/id/publication/2026/08/04/29900d4157c9ba7ad7fc72ea/statistik-perdagangan-luar-negeri-indonesia-impor-2025 — official annual import source, distinguish CIF.
4. **Free PST consultation:** https://pst.bps.go.id/ — BPS labels statistical consultation free; use this to request help accessing already public aggregate tabulations rather than ordering paid microdata.
5. **Free WebAPI developer channel:** https://webapi.bps.go.id/developer — BPS says its JSON API includes static/dynamic statistical tables; coverage of national joint HS × country table is *unconfirmed*. Do not assume API endpoints or bypass authenticated browser flows.
6. Public website terms: https://www.bps.go.id/id/term-of-use — commercial/noncommercial use and reuse described, subject to attribution and terms. See https://ppid.bps.go.id/app/konten/3505/Standar-Layanan-Informasi-Publik.html. This is not a paid SILASTIK microdata license.

## Six targeted commodity queries — **no trade numbers claimed**
| Sector | Item (research pilot only) | HS 2022 candidate | Cut |
| --- | --- | --- | --- |
| Food & agriculture | Rice | 1006 | Indonesia → individual partner country, annual 2025 imports/exports |
| Food & agriculture | Coffee | 0901 | Indonesia → individual partner, annual 2025 imports/exports |
| Food & agriculture | Palm oil/fractions | 1511 | Indonesia → individual partner, annual 2025 imports/exports |
| Marine & fisheries | Frozen non-coldwater shrimp/prawns | 030617 | Indonesia → individual partner, annual 2025 imports/exports |
| Minerals | Coal | 2701 | Indonesia → individual partner, annual 2025 imports/exports |
| Minerals | Nickel ores/concentrates | 2604 | Indonesia → individual partner, annual 2025 imports/exports |

Confirm exact HS2022/BTKI codes with official BPS HS master. HS030617 is *not* all shrimp, and HS2604 excludes nickel matte and ferronickel. One HS level and period per chart; import CIF and export FOB are separate. No empty cells become zero.

## BPS consultation message — ready to submit manually (NOT SENT)

**Perihal: Konsultasi akses tabulasi publik BPS ekspor-impor HS × negara mitra tahun 2025**

Yth. Tim Pelayanan Statistik Terpadu BPS,

Saya sedang mengembangkan visualisasi analitis perdagangan Indonesia yang menggunakan data agregat publik BPS dengan pencantuman sumber, periode, dan keterbatasannya. Saya ingin menanyakan apakah tersedia **tabulasi agregat yang sudah dipublikasikan secara gratis**, dalam format CSV/XLSX/PDF atau melalui WebAPI BPS, dengan satu baris yang menghubungkan seluruh dimensi berikut: (1) ekspor atau impor; (2) kode komoditas HS 2022 minimal 4–6 digit; (3) masing-masing negara tujuan/asalan; (4) tahun penuh 2025; (5) nilai USD FOB untuk ekspor atau CIF untuk impor; dan jika ada (6) berat bersih kilogram.

Sebagai pilot, komoditas yang ingin diperiksa adalah HS 1006 (beras), HS 0901 (kopi), HS 1511 (minyak sawit), HS 030617 (udang beku kategori tertentu), HS 2701 (batubara) dan HS 2604 (bijih nikel). Kami **tidak meminta data identitas pelaku usaha atau mikrodata terbatas**. Kami juga tidak ingin menggabungkan marginal komoditas dan marginal negara menjadi sel yang tidak tersedia dalam sumber.

Apakah kombinasi dimensi tersebut dapat diunduh dari laman Data Ekspor Impor Nasional BPS atau dari tabel statistik publik melalui WebAPI? Jika ya, mohon petunjuk pilihan agregasi, unduhan, tahun acuan dan metadata yang tepat. Apakah tabulasi publik tersebut dapat divisualisasikan dan ditampilkan kembali dengan atribusi BPS pada platform riset yang berpotensi menyediakan layanan berlangganan, sesuai ketentuan penggunaan situs BPS? Jika terdapat ketentuan khusus untuk file tertentu, mohon informasinya.

Terima kasih atas panduan Bapak/Ibu.

## Acceptance steps after official answer
- Record official response URL/date, allowed data access method, license scope, format and any caveats.
- Download and retain original source output, query parameter selections, checksum and page/table/row pointer.
- Normalize *observed* national HS-partner values using `inputs/BPS_HS_PARTNER_TEMPLATE.csv`, now requiring `geographic_scope=Indonesia`.
- Verify each original cell individually, review publication/reuse terms, then use `scripts/import_bps_hs_partner.py` with signed-off manual attestation; don't self-approve from CI.
- Keep [Issue #127](https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/issues/127) open until first numeric cells are independently verified and exported through the dashboard.

## Excluded lead
BPS Jawa Tengah October 2025 press release exists at https://jateng.bps.go.id/id/pressrelease/2025/12/01/1611/ekspor-dan-impor-jawa-tengah-oktober-2025-masing-masing-tercatat-us-1-123-60-juta-dan-us-1-344-87-juta-.html. Its presentation shows selected HS × country relationships in a secondary copy, but **Jawa Tengah Jan–Oct 2025 is not Indonesia full-year 2025**. Never place its figures into the national BPS matrix; the original slide still requires a source review.
