import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const versionJsonPath = path.join(rootDir, 'src', 'version.json');
const packageJsonPath = path.join(rootDir, 'package.json');

function getTodayDDMMYYYY() {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date());
  const d = parts.find((p) => p.type === 'day')?.value || '01';
  const m = parts.find((p) => p.type === 'month')?.value || '01';
  const y = parts.find((p) => p.type === 'year')?.value || '2026';
  return `${d}/${m}/${y}`;
}

function parseVersion4(raw) {
  const m = String(raw || '').trim().match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) {
    throw new Error(`Invalid 4-part version "${raw}". Expected MAJOR.MINOR.PATCH.BUILD (e.g. 1.6.0.0).`);
  }
  return [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
}

const args = process.argv.slice(2);
let bumpType = 'build';
let nextLabel = null;
let dryRun = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--dry-run') {
    dryRun = true;
  } else if (arg === '--label' && args[i + 1]) {
    nextLabel = args[i + 1];
    i += 1;
  } else if (['build', 'patch', 'minor', 'major'].includes(arg)) {
    bumpType = arg;
  }
}

const currentMeta = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const [major, minor, patch, build] = parseVersion4(currentMeta.version);
let nextParts;
if (bumpType === 'major') {
  nextParts = [major + 1, 0, 0, 0];
} else if (bumpType === 'minor') {
  nextParts = [major, minor + 1, 0, 0];
} else if (bumpType === 'patch') {
  nextParts = [major, minor, patch + 1, 0];
} else {
  nextParts = [major, minor, patch, build + 1];
}

const nextVersion = nextParts.join('.');
const nextDisplay = `v${nextVersion}`;
const nextSemver = `${nextParts[0]}.${nextParts[1]}.${nextParts[2]}`;
const releaseDate = getTodayDDMMYYYY();

const nextMeta = {
  version: nextVersion,
  displayVersion: nextDisplay,
  releaseDate,
  label: nextLabel ?? currentMeta.label,
};

if (dryRun) {
  console.log(`[dry-run] ${currentMeta.version} -> ${nextVersion} (${nextDisplay}) | semver=${nextSemver} | date=${releaseDate}`);
  process.exit(0);
}

fs.writeFileSync(versionJsonPath, `${JSON.stringify(nextMeta, null, 2)}\n`, 'utf8');

pkgJson.version = nextSemver;
pkgJson.appVersion = nextVersion;
fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkgJson, null, 2)}\n`, 'utf8');

console.log(`Bumped version: ${currentMeta.version} -> ${nextVersion} (${nextDisplay})`);
console.log(`Updated src/version.json and package.json (version=${nextSemver}, appVersion=${nextVersion}, releaseDate=${releaseDate})`);
