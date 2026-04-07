/*
  Orbit Chat landing page downloads

  Goal: link download buttons to the *latest* GitHub Release assets.

  Approach:
  - Prefer reading electron-builder metadata files that are commonly uploaded as release assets:
      - latest.yml (Windows)
      - latest-mac.yml (macOS)
  - These are fetched via the stable /releases/latest/download/* URLs.
  - If unavailable, fall back to the releases page.
*/

const OWNER = "orbit-chat";
const REPO = "orbit-chat";

const releasesLatestUrl = `https://github.com/${OWNER}/${REPO}/releases/latest`;
const latestDownloadBase = `https://github.com/${OWNER}/${REPO}/releases/latest/download`;
const apiLatestUrl = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;

function setHref(id, href) {
  const link = document.getElementById(id);
  if (!link || !href) return;
  link.setAttribute("href", href);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (!el || typeof text !== "string") return;
  el.textContent = text;
}

function parseYamlScalar(text, key) {
  // Very small scalar parser: `key: value` (no nested objects).
  const re = new RegExp(`^${key}\\s*:\\s*(.+)\\s*$`, "m");
  const match = text.match(re);
  if (!match) return null;
  return match[1].replace(/^['"]|['"]$/g, "");
}

function parseYamlUrls(text) {
  // Pulls `- url: ...` entries.
  const urls = [];
  const re = /^\s*-\s*url\s*:\s*(.+)\s*$/gm;
  let match;
  while ((match = re.exec(text)) !== null) {
    urls.push(match[1].replace(/^['"]|['"]$/g, ""));
  }
  return urls;
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function fetchJson(url) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

function pickAssetUrl(assets, predicate) {
  if (!Array.isArray(assets)) return null;
  const asset = assets.find((a) => predicate(String(a?.name ?? "")));
  return typeof asset?.browser_download_url === "string" ? asset.browser_download_url : null;
}

async function hydrateDownloads() {
  // Default fallback: always a valid destination.
  setHref("dl-windows", releasesLatestUrl);
  setHref("dl-macos", releasesLatestUrl);
  setHref("dl-all", releasesLatestUrl);
  setText("dl-status", "Latest release");

  try {
    // 1) Best: GitHub Releases API (works with CORS).
    const release = await fetchJson(apiLatestUrl);
    const assets = Array.isArray(release.assets) ? release.assets : [];

    const windowsUrl = pickAssetUrl(assets, (name) => name.toLowerCase().endsWith(".exe"));
    const macDmgUrl = pickAssetUrl(assets, (name) => name.toLowerCase().endsWith(".dmg"));
    const macZipUrl = pickAssetUrl(assets, (name) => name.toLowerCase().endsWith(".zip"));

    if (windowsUrl) setHref("dl-windows", windowsUrl);
    if (macDmgUrl) setHref("dl-macos", macDmgUrl);
    else if (macZipUrl) setHref("dl-macos", macZipUrl);

    const tag = typeof release.tag_name === "string" ? release.tag_name : "";
    if (tag) setText("dl-status", tag.startsWith("v") ? tag : `v${tag}`);

    // Done.
    return;
  } catch {
    // 2) Fallback: electron-builder metadata files uploaded as release assets.
    try {
      const winYml = await fetchText(`${latestDownloadBase}/latest.yml`);
      const winVersion = parseYamlScalar(winYml, "version");
      const winPath = parseYamlScalar(winYml, "path");
      if (winPath) setHref("dl-windows", `${latestDownloadBase}/${encodeURIComponent(winPath)}`);

      const macYml = await fetchText(`${latestDownloadBase}/latest-mac.yml`);
      const macVersion = parseYamlScalar(macYml, "version");
      const macUrls = parseYamlUrls(macYml);
      const dmg = macUrls.find((u) => u.toLowerCase().endsWith(".dmg"));
      const zip = macUrls.find((u) => u.toLowerCase().endsWith(".zip"));
      if (dmg) setHref("dl-macos", `${latestDownloadBase}/${encodeURIComponent(dmg)}`);
      else if (zip) setHref("dl-macos", `${latestDownloadBase}/${encodeURIComponent(zip)}`);

      const version = macVersion || winVersion;
      if (version) setText("dl-status", `v${version}`);
      return;
    } catch {
      // 3) Final fallback: keep pointing at the releases page.
      setText("dl-status", "Downloads: releases");
    }
  } catch {
    setText("dl-status", "Downloads: releases");
  }
}

hydrateDownloads();
