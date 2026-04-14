#!/usr/bin/env node
/**
 * Bump the project version across all config files that require manual sync:
 *   - package.json          (source of truth)
 *   - src-tauri/Cargo.toml  (Rust crate version)
 *   - CHANGELOG.md          (scaffolds new section or promotes [Unreleased])
 *
 * tauri.conf.json reads from package.json automatically ("version": "../package.json").
 * The frontend reads via getVersion() from the Tauri runtime — no change needed there.
 *
 * Usage:
 *   bun run bump <new-version>
 *   bun run bump 0.4.0
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const newVersion = process.argv[2];

if (!newVersion) {
  console.error("❌  Usage: bun run bump <version>  (e.g. bun run bump 0.4.0)");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+/.test(newVersion)) {
  console.error(
    `❌  Invalid version format: "${newVersion}". Expected semver (e.g. 1.2.3)`,
  );
  process.exit(1);
}

// ── package.json ─────────────────────────────────────────────────────────────
const pkgPath = resolve(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const prevVersion = pkg.version;
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`✓  package.json         ${prevVersion} → ${newVersion}`);

// ── src-tauri/Cargo.toml ─────────────────────────────────────────────────────
const cargoPath = resolve(root, "src-tauri", "Cargo.toml");
const cargo = readFileSync(cargoPath, "utf8");
const updatedCargo = cargo.replace(
  /^version = ".*"$/m,
  `version = "${newVersion}"`,
);
if (updatedCargo === cargo) {
  console.warn("⚠️   Cargo.toml version not updated — pattern not found");
} else {
  writeFileSync(cargoPath, updatedCargo);
  console.log(`✓  src-tauri/Cargo.toml ${prevVersion} → ${newVersion}`);
}

// ── CHANGELOG.md ─────────────────────────────────────────────────────────────
const changelogPath = resolve(root, "CHANGELOG.md");

if (!existsSync(changelogPath)) {
  console.warn("⚠️   CHANGELOG.md not found — skipping changelog update");
} else {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let changelog = readFileSync(changelogPath, "utf8");

  const versionHeader = `## [${newVersion}]`;
  const alreadyExists = changelog.includes(versionHeader);

  if (alreadyExists) {
    // Version section already written manually — nothing to do
    console.log(
      `✓  CHANGELOG.md         section [${newVersion}] already exists`,
    );
  } else {
    // Check if [Unreleased] has content to promote
    const unreleasedMatch = changelog.match(
      /## \[Unreleased\]\n([\s\S]*?)(?=\n## \[|\n*$)/,
    );
    const unreleasedContent = unreleasedMatch?.[1]?.trim() ?? "";

    if (unreleasedContent) {
      // Promote [Unreleased] content to the new version
      changelog = changelog.replace(
        /## \[Unreleased\]\n[\s\S]*?(?=\n## \[|\n*$)/,
        `## [Unreleased]\n\n## [${newVersion}] - ${today}\n${unreleasedMatch[1]}`,
      );
      console.log(
        `✓  CHANGELOG.md         [Unreleased] → [${newVersion}] - ${today}`,
      );
    } else {
      // No [Unreleased] content — scaffold an empty section for the dev to fill
      const scaffold = [
        `## [${newVersion}] - ${today}`,
        `### Added`,
        `-`,
        ``,
        `### Fixed`,
        `-`,
        ``,
      ].join("\n");

      changelog = changelog.replace(
        /## \[Unreleased\]/,
        `## [Unreleased]\n\n${scaffold}`,
      );
      console.log(
        `✓  CHANGELOG.md         scaffolded section [${newVersion}] - ${today}`,
      );
      console.log(`⚠️   Fill in the changelog notes before committing!`);
    }
  }

  writeFileSync(changelogPath, changelog);
}

// ── Next steps ───────────────────────────────────────────────────────────────
console.log(`\n🚀  Done! Next steps:`);
console.log(`    1. Fill in CHANGELOG.md if a scaffold was created`);
console.log(`    2. git add package.json src-tauri/Cargo.toml CHANGELOG.md`);
console.log(`    3. git commit -m "chore: bump version to ${newVersion}"`);
console.log(`    4. git tag v${newVersion} && git push origin v${newVersion}`);
