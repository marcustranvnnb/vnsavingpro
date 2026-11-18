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
  updateBankRatesInFiles,
} from './_lib/rateUpdater.js';

export const CAKE_STANDARD_URL = 'https://cake.vn/tien-gui/tien-gui-tieu-chuan';
export const CAKE_ACCUMULATE_URL = 'https://cake.vn/tien-gui/tien-gui-co-ky-han-tich-luy';

const BASELINE_CAKE_RATES =
  INITIAL_BANKS_DATA.find((b) => b.id === 'cake')?.rates || {
    '1W': 0.5,
    '2W': 0.5,
    '3W': 0.5,
    '1M': 4.75,
    '3M': 4.75,
    '6M': 6.9,
    '9M': 6.9,
    '12M': 6.9,
    '18M': 6.9,
    '24M': 6.9,
    '36M': 6.3,
  };

// Official payout-method reference rates from Cake Standard Deposit (21/10/2026)
const CAKE_STANDARD_PAYOUT_META = {
  1: { startRate: 4.70, monthlyRate: null, quarterlyRate: null },
  2: { startRate: 4.70, monthlyRate: null, quarterlyRate: null },
  3: { startRate: 4.67, monthlyRate: 4.72, quarterlyRate: null },
  4: { startRate: 4.63, monthlyRate: null, quarterlyRate: null },
  5: { startRate: 4.59, monthlyRate: null, quarterlyRate: null },
  6: { startRate: 6.78, monthlyRate: 7.02, quarterlyRate: 7.09 },
  7: { startRate: 6.71, monthlyRate: null, quarterlyRate: null },
  8: { startRate: 6.64, monthlyRate: null, quarterlyRate: null },
  9: { startRate: 6.58, monthlyRate: 6.92, quarterlyRate: 6.99 },
  10: { startRate: 6.71, monthlyRate: null, quarterlyRate: null },
  11: { startRate: 6.65, monthlyRate: null, quarterlyRate: null },
  12: { startRate: 6.59, monthlyRate: 7.02, quarterlyRate: 7.08 },
  13: { startRate: 6.52, monthlyRate: null, quarterlyRate: null },
  15: { startRate: 6.46, monthlyRate: null, quarterlyRate: null },
  18: { startRate: 6.30, monthlyRate: 6.86, quarterlyRate: 6.92 },
  24: { startRate: 5.99, monthlyRate: 6.68, quarterlyRate: 6.74 },
  36: { startRate: 5.01, monthlyRate: 5.63, quarterlyRate: 5.67 },
};

const BASELINE_ACCUMULATE_RATES = {
  6: { endRate: 4.50, listedRate: 4.50, note: 'Lãi suất cơ bản' },
  9: { endRate: 6.70, listedRate: 6.70, note: 'Đã gồm ưu đãi tích lũy (cơ bản 4.50%)' },
  12: { endRate: 6.70, listedRate: 6.70, note: 'Đã gồm ưu đãi tích lũy (cơ bản 4.50%)' },
  15: { endRate: 6.70, listedRate: 6.70, note: 'Đã gồm ưu đãi tích lũy (cơ bản 4.50%)' },
  18: { endRate: 6.70, listedRate: 6.70, note: 'Đã gồm ưu đãi tích lũy (cơ bản 4.50%)' },
  24: { endRate: 6.70, listedRate: 6.70, note: 'Đã gồm ưu đãi tích lũy (cơ bản 4.50%)' },
  36: { endRate: 6.70, listedRate: 6.70, note: 'Đã gồm ưu đãi tích lũy (cơ bản 4.50%)' },
};

export function parseCakeStandardHtml(html) {
  const { tableRows, textLines } = extractTableRowsAndLines(html);
  const monthlyRates = {};
  let effectiveDate = null;
  let maxBonusPercent = null;

  for (const cells of tableRows) {
    const label = cells[0];
    const mMatch = label.match(/^(\d{1,2})\s*(?:tháng)?$/i);
    const rateMatch = cells[1]?.match(/(\d{1,2}(?:\.\d{1,2})?)/);
    if (mMatch && rateMatch) {
      const m = Number(mMatch[1]);
      const r = Number(rateMatch[1]);
      if (m >= 1 && m <= 36 && r >= 0.1 && r <= 15.0) {
        monthlyRates[m] = Number(r.toFixed(2));
      }
    }
  }

  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i];

    const dateMatch = line.match(/Áp dụng chính thức[^0-9]*?(?:\d{1,2}h\d{2}\s+ngày\s+)?(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (dateMatch && !effectiveDate) {
      effectiveDate = dateMatch[1];
    }

    const bonusMatch = line.match(/Tặng\s*(?:đến\s*)?(\d{1,2}(?:\.\d{1,2})?)\s*%/i);
    if (bonusMatch) {
      const b = Number(bonusMatch[1]);
      if (b > 0 && b <= 5) {
        maxBonusPercent = Math.max(maxBonusPercent || 0, b);
      }
    }

    // Cake renders SSR term dropdown options as: "12 Tháng 6.9 %"
    const termRateMatch = line.match(/^(\d{1,2})\s*Tháng\s+(\d{1,2}(?:\.\d{1,2})?)\s*%$/i);
    if (termRateMatch) {
      const m = Number(termRateMatch[1]);
      const r = Number(termRateMatch[2]);
      if (m >= 1 && m <= 36 && r >= 0.1 && r <= 15.0) {
        monthlyRates[m] = Number(r.toFixed(2));
      }
    }
  }

  const standardRates = { '1W': 0.5, '2W': 0.5, '3W': 0.5 };
  for (const m of [1, 3, 6, 9, 12, 18, 24, 36]) {
    if (typeof monthlyRates[m] === 'number') {
      standardRates[`${m}M`] = monthlyRates[m];
    }
  }

  return {
    monthlyRates,
    standardRates,
    effectiveDate,
    maxBonusPercent,
  };
}

export function parseCakeAccumulateHtml(html) {
  const { tableRows, textLines } = extractTableRowsAndLines(html);
  const accumMonthlyRates = {};
  let effectiveDate = null;
  const promoTitles = [];

  for (const cells of tableRows) {
    const label = cells[0];
    const mMatch = label.match(/^(\d{1,2})\s*(?:tháng)?$/i);
    const rateMatch = cells[1]?.match(/(\d{1,2}(?:\.\d{1,2})?)/);
    if (mMatch && rateMatch) {
      const m = Number(mMatch[1]);
      const r = Number(rateMatch[1]);
      if (m >= 1 && m <= 36 && r >= 0.1 && r <= 15.0) {
        accumMonthlyRates[m] = Number(r.toFixed(2));
      }
    }
  }

  for (const line of textLines) {
    const dateMatch = line.match(/Áp dụng chính thức[^0-9]*?(?:\d{1,2}h\d{2}\s+ngày\s+)?(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (dateMatch && !effectiveDate) {
      effectiveDate = dateMatch[1];
    }
    if (/cộng thêm lãi suất/i.test(line) && line.length < 140) {
      promoTitles.push(line);
    }
    const termRateMatch = line.match(/^(\d{1,2})\s*Tháng\s+(\d{1,2}(?:\.\d{1,2})?)\s*%$/i);
    if (termRateMatch) {
      const m = Number(termRateMatch[1]);
      const r = Number(termRateMatch[2]);
      if (m >= 1 && m <= 36 && r >= 0.1 && r <= 15.0) {
        accumMonthlyRates[m] = Number(r.toFixed(2));
      }
    }
  }

  return {
    accumMonthlyRates,
    effectiveDate,
    promoTitles: [...new Set(promoTitles)],
  };
}

/**
 * Fetches CakeBank Standard & Accumulative Deposit pages.
 */
export async function fetchCakeRates() {
  const scrapedAt = getVietnamIsoTimestamp();
  const updatedDate = getVietnamDateFormatted();

  let standardParsed = { monthlyRates: {}, standardRates: {}, effectiveDate: null, maxBonusPercent: 2.2 };
  let accumParsed = { accumMonthlyRates: {}, effectiveDate: null, promoTitles: [] };
  let liveStandardSucceeded = false;
  let liveAccumulateSucceeded = false;

  try {
    const stdRes = await fetchHtmlWithRetry(CAKE_STANDARD_URL);
    standardParsed = parseCakeStandardHtml(stdRes.html);
    liveStandardSucceeded = Object.keys(standardParsed.monthlyRates).length > 0;
  } catch {
    // Preserve baseline if offline
  }

  try {
    const accRes = await fetchHtmlWithRetry(CAKE_ACCUMULATE_URL);
    accumParsed = parseCakeAccumulateHtml(accRes.html);
    liveAccumulateSucceeded = Boolean(accumParsed.effectiveDate || accumParsed.promoTitles.length > 0);
  } catch {
    // Preserve baseline if offline
  }

  const rates = mergeWithBaseline(standardParsed.standardRates, BASELINE_CAKE_RATES);
  const peakStandard = Math.max(...Object.values(rates));
  const bonusPct = standardParsed.maxBonusPercent ?? 2.2;
  const maxPromoRate = Number((peakStandard + bonusPct).toFixed(2));

  const accumulateRates = {};
  for (const m of [6, 9, 12, 15, 18, 24, 36]) {
    const base = BASELINE_ACCUMULATE_RATES[m];
    const liveVal = accumParsed.accumMonthlyRates[m];
    accumulateRates[m] = {
      endRate: liveVal ?? base.endRate,
      listedRate: liveVal ?? base.listedRate,
      note: base.note,
    };
  }
  const peakAccumulate = Math.max(...Object.values(accumulateRates).map((x) => x.listedRate));

  const effectiveDate = standardParsed.effectiveDate || accumParsed.effectiveDate || '21/10/2026';

  const note =
    liveStandardSucceeded
      ? `Synced Cake Standard (${Object.keys(standardParsed.monthlyRates).length} terms, effective ${effectiveDate}, bonus +${bonusPct}%) + Accumulate page (${accumParsed.effectiveDate || effectiveDate}).`
      : `Live fetch unavailable; preserved verified Cake Standard & Accumulate rates (${effectiveDate}).`;

  return {
    bankId: 'cake',
    sourceUrl: CAKE_STANDARD_URL,
    accumulateUrl: CAKE_ACCUMULATE_URL,
    fetchedUrl: CAKE_STANDARD_URL,
    effectiveDate,
    scrapedAt,
    updatedDate,
    liveFetchSucceeded: liveStandardSucceeded || liveAccumulateSucceeded,
    liveStandardSucceeded,
    liveAccumulateSucceeded,
    parsedTenuresCount: Object.keys(standardParsed.monthlyRates).length,
    parsedAccumTenuresCount: Object.keys(accumParsed.accumMonthlyRates).length,
    standardMonthly: standardParsed.monthlyRates,
    accumulateRates,
    promoTitles: accumParsed.promoTitles,
    maxBonusPercent: bonusPct,
    peakStandard,
    peakAccumulate,
    maxPromoRate,
    rates,
    note,
  };
}

async function syncCakeExtendedFiles(result) {
  const banksDataPath = path.join(PROJECT_ROOT, 'src/data/banksData.js');
  let banksSrc = await fs.readFile(banksDataPath, 'utf8');

  banksSrc = banksSrc.replace(
    /(id:\s*"cake"[\s\S]*?badge:\s*)"[^"]*"/,
    `$1"🎂 Niêm yết ${result.peakStandard.toFixed(1)}% · Ưu đãi đến ${result.maxPromoRate.toFixed(1)}%"`
  );
  banksSrc = banksSrc.replace(
    /(id:\s*"cake"[\s\S]*?rateTierNote:\s*)"[^"]*"/,
    `$1"Tiêu chuẩn ${result.peakStandard.toFixed(2)}% (${result.effectiveDate}) · Cộng đến +${result.maxBonusPercent}% (tối đa ${result.maxPromoRate.toFixed(1)}%/năm)"`
  );
  banksSrc = banksSrc.replace(
    /(id:\s*"cake"[\s\S]*?notes:\s*)"[^"]*"/,
    `$1"Tiền gửi tiêu chuẩn 6–24M đạt ${result.rates['12M'].toFixed(2)}%/năm; Tích lũy đến ${result.peakAccumulate.toFixed(2)}%. Rút gốc từng phần không mất lãi phần còn lại."`
  );
  await fs.writeFile(banksDataPath, banksSrc, 'utf8');

  const pkgPath = path.join(PROJECT_ROOT, 'src/data/bankPackagesData.js');
  let pkgSrc = await fs.readFile(pkgPath, 'utf8');

  // 1. Update cake-standard
  const stdMonths = [1, 2, 3, 4, 6, 9, 12, 18, 24, 36];
  const stdLines = stdMonths
    .map((m) => {
      const endRate =
        result.standardMonthly[m] ??
        (m <= 5 ? result.rates['1M'] : m === 36 ? result.rates['36M'] : result.rates['12M']);
      const meta = CAKE_STANDARD_PAYOUT_META[m] || { startRate: null, monthlyRate: null, quarterlyRate: null };
      const fmtVal = (v) => (v === null ? 'null' : Number(v).toFixed(2));
      return `          { term: '${m} tháng', termMonths: ${m}, endRate: ${Number(endRate).toFixed(2)}, startRate: ${fmtVal(meta.startRate)}, monthlyRate: ${fmtVal(meta.monthlyRate)}, quarterlyRate: ${fmtVal(meta.quarterlyRate)} },`;
    })
    .join('\n');

  pkgSrc = pkgSrc.replace(
    /(id:\s*'cake-standard'[\s\S]*?lastUpdated:\s*')[^']*(')/,
    `$1${result.updatedDate}$2`
  );
  pkgSrc = pkgSrc.replace(
    /(id:\s*'cake-standard'[\s\S]*?rates:\s*\[)[\s\S]*?(\n\s*\],\s*\n\s*bestRate:\s*)[\d.]+/,
    `$1\n${stdLines}$2${result.peakStandard.toFixed(2)}`
  );

  // 2. Update cake-accumulate
  const accLines = [6, 9, 12, 15, 18, 24, 36]
    .map((m) => {
      const row = result.accumulateRates[m];
      return `          { term: '${m} tháng', termMonths: ${m}, endRate: ${Number(row.endRate).toFixed(2)}, listedRate: ${Number(row.listedRate).toFixed(2)}, note: '${row.note}' },`;
    })
    .join('\n');

  pkgSrc = pkgSrc.replace(
    /(id:\s*'cake-accumulate'[\s\S]*?lastUpdated:\s*')[^']*(')/,
    `$1${result.updatedDate}$2`
  );
  pkgSrc = pkgSrc.replace(
    /(id:\s*'cake-accumulate'[\s\S]*?rates:\s*\[)[\s\S]*?(\n\s*\],\s*\n\s*bestRate:\s*)[\d.]+/,
    `$1\n${accLines}$2${result.peakAccumulate.toFixed(2)}`
  );

  await fs.writeFile(pkgPath, pkgSrc, 'utf8');

  const snapshotPath = path.join(PROJECT_ROOT, 'src/data/scraped/cake-latest.json');
  await fs.writeFile(
    snapshotPath,
    JSON.stringify(
      {
        bankId: 'cake',
        sourceUrl: result.sourceUrl,
        accumulateUrl: result.accumulateUrl,
        effectiveDate: result.effectiveDate,
        scrapedAt: result.scrapedAt,
        updatedDate: result.updatedDate,
        liveFetchSucceeded: result.liveFetchSucceeded,
        parsedTenuresCount: result.parsedTenuresCount,
        parsedAccumTenuresCount: result.parsedAccumTenuresCount,
        maxBonusPercent: result.maxBonusPercent,
        maxPromoRate: result.maxPromoRate,
        rates: result.rates,
        standardMonthly: result.standardMonthly,
        accumulateRates: result.accumulateRates,
        promoTitles: result.promoTitles,
        note: result.note,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  return { banksDataPath, pkgPath, snapshotPath };
}

export async function runCakeScraper({ writeFiles = true } = {}) {
  const result = await fetchCakeRates();
  if (writeFiles) {
    await updateBankRatesInFiles('cake', result.rates, result);
    const paths = await syncCakeExtendedFiles(result);
    return { ...result, ...paths };
  }
  return result;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  runCakeScraper({ writeFiles: true })
    .then((res) => {
      console.log(`[CAKE Scraper @ ${res.scrapedAt}]`);
      console.log(`  Standard:   ${res.sourceUrl} (Live: ${res.liveStandardSucceeded}, Parsed: ${res.parsedTenuresCount} terms)`);
      console.log(`  Accumulate: ${res.accumulateUrl} (Live: ${res.liveAccumulateSucceeded})`);
      console.log(`  Note: ${res.note}`);
      console.log('  Standard Rates:', JSON.stringify(res.rates));
    })
    .catch((err) => {
      console.error('[CAKE Scraper ERROR]', err);
      process.exitCode = 1;
    });
}
