/* SLI User Intelligence isolated browser QA: GET-only, no credential storage.
 * Hosted on GitHub Pages; API remains Cloudflare Access-protected.
 */
(() => {
  "use strict";
  const BASE = "https://sli-user-intelligence.hananakhmad1991.workers.dev";
  const button = document.getElementById("check");
  const summary = document.getElementById("summary");
  const status = (id, text, kind = "") => {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = text;
    node.className = "status " + kind;
  };
  async function get(path) {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 15000);
    try {
      const response = await fetch(BASE + path, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        mode: "cors",
        redirect: "follow",
        headers: { "Accept": "application/json" },
        signal: abort.signal
      });
      const type = response.headers.get("content-type") || "";
      if (!response.ok) throw Error("HTTP " + response.status);
      if (!type.includes("application/json")) throw Error("Respons bukan JSON (mungkin login diperlukan)");
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
  async function check() {
    button.disabled = true;
    summary.textContent = "Menghubungi backend privat SLI…";
    for (const id of ["me", "preferences", "inbox", "cron"]) status(id, "Memeriksa…", "pending");
    const tasks = [
      ["me", "/api/me", (data) => data.identity_provider === "cloudflare_access"
        ? "Login valid" : null],
      ["preferences", "/api/preferences", (data) => typeof data.enrolled === "boolean"
        ? (data.enrolled ? "Tersimpan" : "Belum disimpan (normal)") : null],
      ["inbox", "/api/inbox?limit=1", (data) => Array.isArray(data.items) && Number.isInteger(data.unread)
        ? ("Inbox tersedia (" + data.unread + " belum dibaca)") : null],
      ["cron", "/api/health", (data) => {
        const monitor = data?.scheduler;
        if (!monitor || monitor.status !== "ok" || !Number.isFinite(Date.parse(monitor.last_run_at)))
          return null;
        if (monitor.consecutive_failures !== 0) return null;
        // Verify the schedule actually ran recently, rather than reporting stale green.
        const age = Date.now() - Date.parse(monitor.last_run_at);
        if (age < -120000 || age > 35 * 60 * 1000) return null;
        return "Cron sehat (terakhir " + new Date(monitor.last_run_at).toLocaleTimeString("id-ID") + ")";
      }]
    ];
    let passed = 0;
    const details = [];
    try {
      for (const [id, path, checker] of tasks) {
        try {
          const data = await get(path);
          const result = checker(data);
          if (!result) throw Error(id === "cron"
            ? "Cron belum menunjukkan status sehat dan terbaru. Lihat /api/health setelah jadwal 15 menit berjalan."
            : "Format respons tidak sesuai");
          status(id, result, "good");
          passed++;
        } catch (error) {
          status(id, "Belum berhasil", "bad");
          details.push(id + ": " + (error?.name === "AbortError"
            ? "timeout (15 detik)" : error instanceof TypeError
            ? "fetch/CORS gagal; periksa sesi login dan pembatasan cookie lintas situs"
            : String(error?.message || "Permintaan gagal")));
        }
      }
      summary.textContent = passed === 4
        ? "4/4 pemeriksaan berhasil dari GitHub Pages. Perlu verifikasi isolasi akun kedua sebelum fitur publik diaktifkan."
        : passed + "/4 pemeriksaan berhasil. " + details.join(" | ");
    } finally {
      button.disabled = false;
    }
  }
  // Owner-initiated mutation QA only. This never runs automatically.
  const writeButton = document.getElementById("write");
  const restoreButton = document.getElementById("restore");
  const tickerInput = document.getElementById("ticker");
  const writeStatus = document.getElementById("write-status");
  let savedBaseline = null;
  let writtenPreferences = null;
  const preferencesEqual = (a, b) => {
    const keys = ["tickers", "sectors", "kinds", "include_sector", "in_app"];
    return keys.every(key => JSON.stringify(a?.[key]) === JSON.stringify(b?.[key]));
  };
  async function putPreferences(body) {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 15000);
    try {
      const response = await fetch(BASE + "/api/preferences", {
        method: "PUT",
        credentials: "include",
        cache: "no-store",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abort.signal
      });
      const type = response.headers.get("content-type") || "";
      if (!response.ok) {
        let reason = "HTTP " + response.status;
        if (type.includes("application/json")) {
          const detail = await response.json().catch(() => null);
          if (typeof detail?.error === "string") reason += ": " + detail.error;
        }
        throw Error(reason);
      }
      if (!type.includes("application/json")) throw Error("Respons bukan JSON");
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
  async function saveAndVerify() {
    if (!writeButton || !writeStatus || !tickerInput) return;
    const ticker = tickerInput.value.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(ticker)) {
      writeStatus.textContent = "Ticker harus tepat empat karakter A-Z/0-9.";
      return;
    }
    if (savedBaseline) {
      writeStatus.textContent = "Selesaikan atau pulihkan uji sebelumnya sebelum membuat perubahan berikutnya.";
      return;
    }
    writeButton.disabled = true;
    tickerInput.disabled = true;
    writeStatus.textContent = "Membaca preferensi saat ini…";
    try {
      const existing = await get("/api/preferences");
      if (typeof existing.enrolled !== "boolean" || !Array.isArray(existing.preferences?.tickers)) {
        throw Error("Respons preferensi akun tidak valid");
      }
      if (existing.preferences.tickers.includes(ticker)) {
        throw Error("Ticker ini sudah ada. Pilih ticker lain supaya uji penyimpanan benar-benar mengubah data.");
      }
      if (existing.preferences.tickers.length >= 30) throw Error("Batas 30 ticker sudah penuh.");
      const next = {
        tickers: [...existing.preferences.tickers, ticker],
        sectors: [...existing.preferences.sectors],
        kinds: [...existing.preferences.kinds],
        include_sector: existing.preferences.include_sector,
        in_app: existing.preferences.in_app
      };
      const warning = existing.enrolled
        ? "Tambah " + ticker + " ke watchlist akun, verifikasi, lalu boleh pulihkan preferensi lama?"
        : "Akun belum terdaftar. Menyimpan " + ticker + " akan mendaftarkan akun, dan halaman ini TIDAK otomatis menghapusnya. Lanjutkan?";
      if (!window.confirm(warning)) {
        writeStatus.textContent = "Dibatalkan; tidak ada data yang diubah.";
        return;
      }
      savedBaseline = existing;
      const saved = await putPreferences(next);
      if (!saved.enrolled || !preferencesEqual(saved.preferences, next))
        throw Error("Server tidak mengonfirmasi preferensi yang dikirim. Periksa keadaan akun sebelum mencoba ulang.");
      writtenPreferences = next;
      const fetched = await get("/api/preferences");
      if (!fetched.enrolled || !preferencesEqual(fetched.preferences, next))
        throw Error("Simpan sukses tetapi baca ulang berbeda. Jangan ulangi tanpa pemeriksaan.");
      if (existing.enrolled) {
        restoreButton.disabled = false;
        writeStatus.textContent = "PASS — " + ticker + " tersimpan dan terbaca ulang dari D1. Klik Pulihkan untuk mengembalikan preferensi lama.";
      } else {
        writeStatus.textContent = "PASS — " + ticker + " tersimpan dan terbaca ulang dari D1. Akun kini terdaftar; halaman ini tidak menghapus akun atau inbox.";
      }
    } catch (error) {
      writeStatus.textContent = "Uji belum tuntas: " + String(error?.message || error) +
        (savedBaseline ? " Jika data sudah berubah, cek /api/preferences sebelum mengulangi." : "");
    } finally {
      writeButton.disabled = !!savedBaseline;
      tickerInput.disabled = !!savedBaseline;
    }
  }
  async function restorePrevious() {
    if (!savedBaseline?.enrolled || !writtenPreferences || !restoreButton || !writeStatus) return;
    if (!window.confirm("Pulihkan preferensi sebelumnya pada akun ini?")) return;
    restoreButton.disabled = true;
    writeStatus.textContent = "Memeriksa konflik sebelum memulihkan…";
    try {
      const current = await get("/api/preferences");
      if (!current.enrolled || !preferencesEqual(current.preferences, writtenPreferences))
        throw Error("Preferensi berubah sejak uji tulis. Pemulihan dibatalkan agar perubahan lain tidak tertimpa.");
      await putPreferences(savedBaseline.preferences);
      const confirmed = await get("/api/preferences");
      if (!confirmed.enrolled || !preferencesEqual(confirmed.preferences, savedBaseline.preferences))
        throw Error("Pemulihan belum terverifikasi. Periksa preferensi akun.");
      savedBaseline = null;
      writtenPreferences = null;
      writeStatus.textContent = "PASS — preferensi lama dipulihkan dan diverifikasi melalui D1.";
      writeButton.disabled = false;
      tickerInput.disabled = false;
    } catch (error) {
      writeStatus.textContent = "Tidak dipulihkan: " + String(error?.message || error);
      restoreButton.disabled = false;
    }
  }
  button?.addEventListener("click", check);
  writeButton?.addEventListener("click", saveAndVerify);
  restoreButton?.addEventListener("click", restorePrevious);
})();
