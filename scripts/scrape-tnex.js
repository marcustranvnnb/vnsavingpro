import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { INITIAL_BANKS_DATA } from '../src/data/banksData.js';
import {
  PROJECT_ROOT,
  extractTableRowsAndLines,
  fetchHtmlWithRetry,
  getVietnamDateFormatted,
  getVietnamIsoTimestamp,
  mergeWithBaseline,
  parseRateTableFromHtml,
  updateBankRatesInFiles,
} from './_lib/rateUpdater.js';

export const TNEX_SAVINGS_URL = 'https://www.tnex.vn/san-pham/tiet-kiem';
const MONTH_TENURES = [1, 3, 6, 9, 12, 18, 24, 36];

const BASELINE_TNEX_RATES =
  INITIAL_BANKS_DATA.find((b) => b.id === 'tnex')?.rates || {
    '1W': 0.5,
    '2W': 0.5,
    '3W': 0.5,
    '1M': 4.75,
    '3M': 4.75,
    '6M': 8.4,
    '9M': 8.4,
    '12M': 8.6,
    '18M': 8.6,
    '24M': 8.6,
    '36M': 8.6,
  };

/**
 * Dedicated parser for TNEX's layout on https://www.tnex.vn/san-pham/tiet-kiem:
 * Handles both standard <table> rows and TNEX's dot-padded lines:
 *   "Từ 1 tháng - dưới 6 tháng ...." + next line "4.75%"
 *   "Từ 6 – dưới 12 tháng ...."     + next line "8.4%"
 *   "Từ 12 tháng – dưới 15 tháng ..." + next line "8.6%"
 *   "Từ 15 tháng trở lên ...."      + next line "8.6%"
 */
export function parseTnexHtml(html) {
  const { parsed: tableParsed } = parseRateTableFromHtml(html);
  const { textLines } = extractTableRowsAndLines(html);
  const parsed = { ...tableParsed };

  let effectiveDate = null;

  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i];

    const dateMatch = line.match(/Cập nhật mới nhất từ ngày\s+(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (dateMatch) {
      effectiveDate = dateMatch[1];
    }

    // Look for rate on same line or next line (TNEX puts label and "X.X%" in adjacent blocks)
    const nextLine = textLines[i + 1] || '';
    const rateMatchSame = line.match(/(\d{1,2}(?:\.\d{1,2})?)\s*%/);
    const rateMatchNext = nextLine.match(/^(\d{1,2}(?:\.\d{1,2})?)\s*%$/);
    const rateVal = rateMatchNext
      ? Number(rateMatchNext[1])
      : rateMatchSame && /từ\s+\d+|dưới\s+\d+|trở lên/i.test(line)
        ? Number(rateMatchSame[1])
        : null;

    if (rateVal === null || !Number.isFinite(rateVal) || rateVal < 0.1 || rateVal > 15.0) {
      continue;
    }

    // Pattern 1: "Từ A (tháng) - dưới B tháng" -> [A, B)
    const belowRange = line.match(/từ\s*(\d{1,2})\s*(?:tháng)?\s*[-–—]\s*dưới\s*(\d{1,2})\s*tháng/i);
    if (belowRange) {
      const start = Number(belowRange[1]);
      const endExclusive = Number(belowRange[2]);
      for (const m of MONTH_TENURES) {
        if (m >= start && m < endExclusive) {
          parsed[`${m}M`] = Number(rateVal.toFixed(2));
        }
      }
      continue;
    }

    // Pattern 2: "Từ A tháng trở lên" -> >= A
    const aboveRange = line.match(/từ\s*(\d{1,2})\s*tháng\s*trở\s*lên/i);
    if (aboveRange) {
      const start = Number(aboveRange[1]);
      for (const m of MONTH_TENURES) {
        if (m >= start) {
          parsed[`${m}M`] = Number(rateVal.toFixed(2));
        }
      }
      continue;
    }
  }

  return { parsed, effectiveDate };
}

/**
 * Fetches and parses the latest TNEX savings rates from https://www.tnex.vn/san-pham/tiet-kiem
 */
export async function fetchTnexRates() {
  const scrapedAt = getVietnamIsoTimestamp();
  const updatedDate = getVietnamDateFormatted();

  let parsed = {};
  let effectiveDate = null;
  let fetchedUrl = TNEX_SAVINGS_URL;
  let liveFetchSucceeded = false;
  let note = 'Fetched directly from TNEX savings page.';

  try {
    const res = await fetchHtmlWithRetry(TNEX_SAVINGS_URL);
    fetchedUrl = res.finalUrl;
    const extracted = parseTnexHtml(res.html);
    parsed = extracted.parsed;
    effectiveDate = extracted.effectiveDate;
    liveFetchSucceeded = true;

    if (Object.keys(parsed).length === 0) {
      note = 'TNEX page fetched live; no rate lines matched, retained verified baseline rates.';
    } else if (effectiveDate) {
      note = `Parsed live from TNEX page (effective date on site: ${effectiveDate}).`;
    }
  } catch (err) {
    note = `Live fetch unavailable (${err.message}); preserved verified baseline rates.`;
  }

  const rates = mergeWithBaseline(parsed, BASELINE_TNEX_RATES);

  return {
    bankId: 'tnex',
    sourceUrl: TNEX_SAVINGS_URL,
    fetchedUrl,
    scrapedAt,
    updatedDate,
    effectiveDate,
    liveFetchSucceeded,
    parsedTenuresCount: Object.keys(parsed).length,
    parsedRaw: parsed,
    rates,
    note,
  };
}

async function syncTnexPackageRates(rates, updatedDate) {
  const pkgPath = path.join(PROJECT_ROOT, 'src/data/bankPackagesData.js');
  let source = await fs.readFile(pkgPath, 'utf8');

  const tnexRatesBlock = [
    `          { term: 'Không kỳ hạn (Flex)', termMonths: 0, endRate: ${Number(rates['1W']).toFixed(2)}, note: 'Theo trần không kỳ hạn NHNN' },`,
    `          { term: '1 tháng', termMonths: 1, endRate: ${Number(rates['1M']).toFixed(2)}, note: 'Từ 1 đến dưới 6 tháng' },`,
    `          { term: '3 tháng', termMonths: 3, endRate: ${Number(rates['3M']).toFixed(2)}, note: 'Từ 1 đến dưới 6 tháng' },`,
    `          { term: '6 tháng', termMonths: 6, endRate: ${Number(rates['6M']).toFixed(2)}, note: 'Từ 6 đến dưới 12 tháng' },`,
    `          { term: '9 tháng', termMonths: 9, endRate: ${Number(rates['9M']).toFixed(2)}, note: 'Từ 6 đến dưới 12 tháng' },`,
    `          { term: '12 tháng', termMonths: 12, endRate: ${Number(rates['12M']).toFixed(2)}, note: 'Từ 12 tháng trở lên' },`,
    `          { term: '18 tháng', termMonths: 18, endRate: ${Number(rates['18M']).toFixed(2)}, note: 'Từ 15 tháng trở lên' },`,
    `          { term: '24 tháng', termMonths: 24, endRate: ${Number(rates['24M']).toFixed(2)}, note: 'Từ 15 tháng trở lên' },`,
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
    /(id:\s*'tnex-savings'[\s\S]*?lastUpdated:\s*')[^']*(')/,
    `$1${updatedDate}$2`
  );
  source = source.replace(
    /(id:\s*'tnex-savings'[\s\S]*?rates:\s*\[)[\s\S]*?(\n\s*\],\s*\n\s*bestRate:\s*)[\d.]+/,
    `$1\n${tnexRatesBlock}$2${peak.toFixed(2)}`
  );

  await fs.writeFile(pkgPath, source, 'utf8');
  return pkgPath;
}

export async function runTnexScraper({ writeFiles = true } = {}) {
  const result = await fetchTnexRates();
  if (writeFiles) {
    const paths = await updateBankRatesInFiles('tnex', result.rates, result);
    await syncTnexPackageRates(result.rates, result.updatedDate);
    return { ...result, ...paths };
  }
  return result;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  runTnexScraper({ writeFiles: true })
    .then((res) => {
      console.log(`[TNEX Scraper @ ${res.scrapedAt}]`);
      console.log(`  Source: ${res.sourceUrl} (Live: ${res.liveFetchSucceeded}, Parsed: ${res.parsedTenuresCount} tenures)`);
      console.log(`  Note: ${res.note}`);
      console.log('  Rates:', JSON.stringify(res.rates));
    })
    .catch((err) => {
      console.error('[TNEX Scraper ERROR]', err);
      process.exitCode = 1;
    });
}
