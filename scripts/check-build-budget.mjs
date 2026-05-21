import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const DIST_DIR = 'dist';
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

const budgets = {
  maxJavaScriptChunkGzipBytes: 125 * 1024,
  maxCssAssetGzipBytes: 20 * 1024,
  maxTotalJavaScriptGzipBytes: 500 * 1024,
};

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

async function readAssetEntries() {
  try {
    const entries = await readdir(ASSETS_DIR);
    return entries.filter((entry) => entry.endsWith('.js') || entry.endsWith('.css'));
  } catch {
    throw new Error(`Build assets not found in ${ASSETS_DIR}. Run npm run build before npm run budget:web.`);
  }
}

async function getAssetMetrics(fileName) {
  const filePath = path.join(ASSETS_DIR, fileName);
  const [fileStat, fileContent] = await Promise.all([
    stat(filePath),
    readFile(filePath),
  ]);

  return {
    fileName,
    rawBytes: fileStat.size,
    gzipBytes: gzipSync(fileContent).byteLength,
    type: fileName.endsWith('.js') ? 'js' : 'css',
  };
}

function assertBudget(condition, failures, message) {
  if (!condition) {
    failures.push(message);
  }
}

const assets = await Promise.all((await readAssetEntries()).map(getAssetMetrics));
const jsAssets = assets.filter((asset) => asset.type === 'js');
const cssAssets = assets.filter((asset) => asset.type === 'css');
const failures = [];
const totalJavaScriptGzipBytes = jsAssets.reduce((total, asset) => total + asset.gzipBytes, 0);

for (const asset of jsAssets) {
  assertBudget(
    asset.gzipBytes <= budgets.maxJavaScriptChunkGzipBytes,
    failures,
    `${asset.fileName} gzip ${formatKiB(asset.gzipBytes)} exceeds JS chunk budget ${formatKiB(budgets.maxJavaScriptChunkGzipBytes)}`,
  );
}

for (const asset of cssAssets) {
  assertBudget(
    asset.gzipBytes <= budgets.maxCssAssetGzipBytes,
    failures,
    `${asset.fileName} gzip ${formatKiB(asset.gzipBytes)} exceeds CSS asset budget ${formatKiB(budgets.maxCssAssetGzipBytes)}`,
  );
}

assertBudget(
  totalJavaScriptGzipBytes <= budgets.maxTotalJavaScriptGzipBytes,
  failures,
  `Total JS gzip ${formatKiB(totalJavaScriptGzipBytes)} exceeds budget ${formatKiB(budgets.maxTotalJavaScriptGzipBytes)}`,
);

console.log('Build budget report:');
console.log(`- JS chunks: ${jsAssets.length}`);
console.log(`- CSS assets: ${cssAssets.length}`);
console.log(`- Total JS gzip: ${formatKiB(totalJavaScriptGzipBytes)} / ${formatKiB(budgets.maxTotalJavaScriptGzipBytes)}`);

const largestAssets = [...assets]
  .sort((a, b) => b.gzipBytes - a.gzipBytes)
  .slice(0, 8);

for (const asset of largestAssets) {
  console.log(`- ${asset.fileName}: ${formatKiB(asset.gzipBytes)} gzip (${formatKiB(asset.rawBytes)} raw)`);
}

if (failures.length) {
  console.error('\nBuild budget failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Build budget passed.');
