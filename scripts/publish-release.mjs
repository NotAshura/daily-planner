// Uploads the built installer to GitHub and writes the latest.yml the updater relies on.
// Runs separately from electron-builder so a failed upload can be retried without rebuilding.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const releaseDir = path.join(root, "release");
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const { owner, repo } = pkg.build.publish[0];
const version = pkg.version;
const tag = `v${version}`;

const token = process.env.GH_TOKEN;
if (!token) {
  console.error("GH_TOKEN ist nicht gesetzt. Token im Terminal setzen und erneut ausführen.");
  process.exit(1);
}

const api = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "daily-planner-release",
};

const installer = path.join(releaseDir, `Daily Planner Setup ${version}.exe`);
const blockmap = `${installer}.blockmap`;
/** GitHub turns spaces into dots, so upload under the dashed name latest.yml refers to. */
const assetName = `Daily-Planner-Setup-${version}.exe`;

if (!existsSync(installer)) {
  console.error(`Fehlt: ${installer}\nZuerst "npm run release" ausführen.`);
  process.exit(1);
}

async function retry(label, task) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      if (attempt === 3) throw error;
      const wait = attempt * 5000;
      console.warn(`${label} fehlgeschlagen (${error.message}) – Versuch ${attempt + 1} in ${wait / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}

async function github(url, init = {}) {
  const response = await fetch(url, { ...init, headers: { ...headers, ...init.headers } });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} – ${(await response.text()).slice(0, 200)}`);
  }
  return response.json();
}

const installerBytes = await readFile(installer);
const sha512 = createHash("sha512").update(installerBytes).digest("base64");

const latestYml = [
  `version: ${version}`,
  "files:",
  `  - url: ${assetName}`,
  `    sha512: ${sha512}`,
  `    size: ${installerBytes.length}`,
  `path: ${assetName}`,
  `sha512: ${sha512}`,
  `releaseDate: '${new Date().toISOString()}'`,
  "",
].join("\n");
await writeFile(path.join(releaseDir, "latest.yml"), latestYml, "utf8");
console.log(`latest.yml für ${version} geschrieben`);

let release;
try {
  release = await github(`${api}/repos/${owner}/${repo}/releases/tags/${tag}`);
  console.log(`Release ${tag} existiert bereits`);
} catch {
  release = await github(`${api}/repos/${owner}/${repo}/releases`, {
    method: "POST",
    body: JSON.stringify({ tag_name: tag, name: tag, draft: false, prerelease: false }),
  });
  console.log(`Release ${tag} angelegt`);
}

async function upload(name, bytes) {
  const existing = release.assets.find((asset) => asset.name === name);
  if (existing) {
    await fetch(`${api}/repos/${owner}/${repo}/releases/assets/${existing.id}`, {
      method: "DELETE",
      headers,
    });
  }
  await retry(`Upload ${name}`, async () => {
    const url = `https://uploads.github.com/repos/${owner}/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(name)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/octet-stream" },
      body: bytes,
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText} – ${(await response.text()).slice(0, 200)}`);
    }
  });
  console.log(`hochgeladen: ${name} (${(bytes.length / 1024 / 1024).toFixed(1)} MB)`);
}

await upload(assetName, installerBytes);
if (existsSync(blockmap)) await upload(`${assetName}.blockmap`, await readFile(blockmap));
await upload("latest.yml", Buffer.from(latestYml, "utf8"));

const published = await github(`${api}/repos/${owner}/${repo}/releases/tags/${tag}`);
const names = published.assets.map((asset) => asset.name);
const missing = [assetName, "latest.yml"].filter((name) => !names.includes(name));

console.log(`\nRelease ${tag}: ${names.join(", ")}`);
if (missing.length || published.draft) {
  console.error(`\nUnvollständig! Fehlt: ${missing.join(", ") || "-"}${published.draft ? " (noch Entwurf)" : ""}`);
  process.exitCode = 1;
} else {
  console.log("\nRelease vollständig – der Update-Knopf in der App findet diese Version.");
}
