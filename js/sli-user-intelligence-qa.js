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
    for (const id of ["me", "preferences", "inbox"]) status(id, "Memeriksa…", "pending");
    const tasks = [
      ["me", "/api/me", (data) => data.identity_provider === "cloudflare_access"
        ? "Login valid" : null],
      ["preferences", "/api/preferences", (data) => typeof data.enrolled === "boolean"
        ? (data.enrolled ? "Tersimpan" : "Belum disimpan (normal)") : null],
      ["inbox", "/api/inbox?limit=1", (data) => Array.isArray(data.items) && Number.isInteger(data.unread)
        ? ("Inbox tersedia (" + data.unread + " belum dibaca)") : null]
    ];
    let passed = 0;
    const details = [];
    try {
      for (const [id, path, checker] of tasks) {
        try {
          const data = await get(path);
          const result = checker(data);
          if (!result) throw Error("Format respons tidak sesuai");
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
      summary.textContent = passed === 3
        ? "3/3 pemeriksaan baca berhasil dari GitHub Pages. Berikutnya: uji penyimpanan watchlist dengan persetujuan pemilik dan akun kedua."
        : passed + "/3 pemeriksaan berhasil. " + details.join(" | ");
    } finally {
      button.disabled = false;
    }
  }
  button?.addEventListener("click", check);
})();
