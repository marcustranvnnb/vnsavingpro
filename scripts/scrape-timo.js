import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { INITIAL_BANKS_DATA } from '../src/data/banksData.js';
import {
  PROJECT_ROOT,
  fetchHtmlWithRetry,
  getVietnamDateFormatted,
  getVietnamIsoTimestamp,
  mergeWithBaseline,
  parseRateTableFromHtml,
  updateBankRatesInFiles,
} from './_lib/rateUpdater.js';

export const TIMO_SAVINGS_URL = 'https://timo.vn/tiet-kiem-co-ky-han/';

const BASELINE_TIMO_RATES =
  INITIAL_BANKS_DATA.find((b) => b.id === 'timo')?.rates || {
    '1W': 0.5,
    '2W': 0.5,
    '3W': 0.5,
    '1M': 4.75,
    '3M': 4.75,
    '6M': 6.7,
    '9M': 6.7,
    '12M': 6.9,
    '18M': 6.7,
    '24M': 6.7,
    '36M': 6.7,
  };

/**
 * Fetches and parses Timo Term Deposit rates from https://timo.vn/tiet-kiem-co-ky-han/
 */
export async function fetchTimoRates() {
  const scrapedAt = getVietnamIsoTimestamp();
  const updatedDate = getVietnamDateFormatted();

  let parsed = {};
  let fetchedUrl = TIMO_SAVINGS_URL;
  let liveFetchSucceeded = false;
  let note = 'Fetched directly from Timo Term Deposit page.';

  try {
    const res = await fetchHtmlWithRetry(TIMO_SAVINGS_URL);
    fetchedUrl = res.finalUrl;
    const extracted = parseRateTableFromHtml(res.html);
    parsed = extracted.parsed;
    liveFetchSucceeded = true;

    if (Object.keys(parsed).length === 0) {
      note = 'Timo page fetched live; no static <table> matched, retained verified baseline rates.';
    }
  } catch (err) {
    note = `Live fetch unavailable (${err.message}); preserved verified baseline rates.`;
  }

  const rates = mergeWithBaseline(parsed, BASELINE_TIMO_RATES);

  return {
    bankId: 'timo',
    sourceUrl: TIMO_SAVINGS_URL,
    fetchedUrl,
    scrapedAt,
    updatedDate,
    liveFetchSucceeded,
    parsedTenuresCount: Object.keys(parsed).length,
    parsedRaw: parsed,
    rates,
    note,
  };
}

async function syncTimoPackageRates(rates, updatedDate) {
  const pkgPath = path.join(PROJECT_ROOT, 'src/data/bankPackagesData.js');
  let source = await fs.readFile(pkgPath, 'utf8');

  const timoRatesBlock = [
    `          { term: '1 tháng', termMonths: 1, endRate: ${Number(rates['1M']).toFixed(2)}, note: 'Trần lãi suất <6 tháng NHNN' },`,
    `          { term: '3 tháng', termMonths: 3, endRate: ${Number(rates['3M']).toFixed(2)}, note: 'Trần lãi suất <6 tháng NHNN' },`,
    `          { term: '6 tháng', termMonths: 6, endRate: ${Number(rates['6M']).toFixed(2)} },`,
    `          { term: '9 tháng', termMonths: 9, endRate: ${Number(rates['9M']).toFixed(2)} },`,
    `          { term: '12 tháng', termMonths: 12, endRate: ${Number(rates['12M']).toFixed(2)} },`,
    `          { term: '18 tháng', termMonths: 18, endRate: ${Number(rates['18M']).toFixed(2)} },`,
    `          { term: '24 tháng', termMonths: 24, endRate: ${Number(rates['24M']).toFixed(2)} },`,
  ].join('\n');

  const peak = Math.max(
    rates['1M'],
    rates['3M'],
    rates['6M'],
    rates['9M'],
    rates['12M'],
    rates['18M'],
    rates['24M']
  );

  source = source.replace(
    /(id:\s*'timo-term'[\s\S]*?lastUpdated:\s*')[^']*(')/,
    `$1${updatedDate}$2`
  );
  source = source.replace(
    /(id:\s*'timo-term'[\s\S]*?rates:\s*\[)[\s\S]*?(\n\s*\],\s*\n\s*bestRate:\s*)[\d.]+/,
    `$1\n${timoRatesBlock}$2${peak.toFixed(2)}`
  );

  await fs.writeFile(pkgPath, source, 'utf8');
  return pkgPath;
}

export async function runTimoScraper({ writeFiles = true } = {}) {
  const result = await fetchTimoRates();
  if (writeFiles) {
    const paths = await updateBankRatesInFiles('timo', result.rates, result);
    await syncTimoPackageRates(result.rates, result.updatedDate);
    return { ...result, ...paths };
  }
  return result;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  runTimoScraper({ writeFiles: true })
    .then((res) => {
      console.log(`[TIMO Scraper @ ${res.scrapedAt}]`);
      console.log(`  Source: ${res.sourceUrl} (Live: ${res.liveFetchSucceeded}, Parsed: ${res.parsedTenuresCount} tenures)`);
      console.log(`  Note: ${res.note}`);
      console.log('  Rates:', JSON.stringify(res.rates));
    })
    .catch((err) => {
      console.error('[TIMO Scraper ERROR]', err);
      process.exitCode = 1;
    });
}
