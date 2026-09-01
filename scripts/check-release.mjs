// Checks that the release for the current version really carries the files the updater needs.
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const { owner, repo } = pkg.build.publish[0];
const tag = `v${pkg.version}`;

const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`, {
  headers: { Accept: "application/vnd.github+json", "User-Agent": "daily-planner-release" },
});

if (!response.ok) {
  console.error(`Release ${tag} ist öffentlich nicht abrufbar (${response.status}).`);
  process.exitCode = 1;
} else {
  const release = await response.json();
  const names = release.assets.map((asset) => asset.name);
  const required = [`Daily-Planner-Setup-${pkg.version}.exe`, "latest.yml"];
  const missing = required.filter((name) => !names.includes(name));

  console.log(`${tag}: ${names.join(", ") || "keine Dateien"}`);
  if (release.draft) console.error("Release ist noch ein Entwurf – Updates finden es nicht.");
  if (missing.length) console.error(`Fehlt: ${missing.join(", ")}`);
  process.exitCode = release.draft || missing.length ? 1 : 0;
}
