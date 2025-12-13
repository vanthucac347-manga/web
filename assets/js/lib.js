console.log("✅ lib.js loaded", import.meta.url);

export function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

export function formatViews(n) {
  n = Number(n || 0);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function loadComics() {
  console.log("✅ loadComics() fetching comics.json...");
  const res = await fetch("data/comics.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Không tải được data/comics.json (HTTP " + res.status + ")");
  return res.json();
}

export function latestChapterName(comic) {
  const ch = (comic.chapters ?? [])[0];
  return ch?.name ?? "—";
}

export function latestUpdatedAt(comic) {
  const ch = (comic.chapters ?? [])[0];
  return ch?.updatedAt ?? comic.updatedAt ?? "—";
}
