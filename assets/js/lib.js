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
const base = await res.json();
  const custom = getCustomComics();

  const bySlug = new Map();
  (base.comics ?? []).forEach((c) => {
    if (!c?.slug) return;
    bySlug.set(c.slug, c);
  });
  (custom ?? []).forEach((c) => {
    if (!c?.slug) return;
    bySlug.set(c.slug, c);
  });

  return { ...base, comics: Array.from(bySlug.values()) };
}

export function getCustomComics() {
  try {
    const raw = localStorage.getItem("customComics");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Không đọc được customComics trong localStorage", e);
    return [];
  }
}

export function persistCustomComics(list) {
  try {
    const bySlug = new Map();
    (list ?? []).forEach((c) => {
      if (!c?.slug) return;
      bySlug.set(c.slug, c);
    });
    localStorage.setItem("customComics", JSON.stringify(Array.from(bySlug.values())));
  } catch (e) {
    console.warn("Không lưu được customComics", e);
  }
}

export function latestChapterName(comic) {
  const ch = (comic.chapters ?? [])[0];
  return ch?.name ?? "—";
}

export function latestUpdatedAt(comic) {
  const ch = (comic.chapters ?? [])[0];
  return ch?.updatedAt ?? comic.updatedAt ?? "—";
}
