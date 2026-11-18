import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { INITIAL_BANKS_DATA } from '../src/data/banksData.js';
import {
  PROJECT_ROOT,
  STANDARD_TENURES,
  extractTableRowsAndLines,
  fetchHtmlWithRetry,
  getVietnamDateFormatted,
  getVietnamIsoTimestamp,
  mergeWithBaseline,
  updateBankRatesInFiles,
} from './_lib/rateUpdater.js';

export const LIOBANK_TARIFF_URL = 'https://liobank.vn/vn/deposit-tariffs';
export const LIOBANK_DEPOSIT_URL = 'https://liobank.vn/vn/deposit';
export const LIOBANK_LEGAL_URL = 'https://liobank.vn/vn/legal';
export const LIOBANK_DEFAULT_PROMO_PDF =
  'https://liobank.vn/doc/Liobank_The_Le_CTKM_Cong_Lai_suat_Tiet_kiem_11.11.2026.pdf';

const BASELINE_LIOBANK_RATES =
  INITIAL_BANKS_DATA.find((b) => b.id === 'liobank')?.rates || {
    '1W': 0.5,
    '2W': 0.5,
    '3W': 0.5,
    '1M': 4.75,
    '3M': 4.75,
    '6M': 5.9,
    '9M': 5.9,
    '12M': 6.2,
    '18M': 5.9,
    '24M': 5.9,
    '36M': 5.9,
  };

const BASELINE_LIOBANK_PROMO_RATES = {
  '1W': 0.5,
  '2W': 0.5,
  '3W': 0.5,
  '1M': 4.75,
  '3M': 4.75,
  '6M': 8.0,
  '9M': 8.0,
  '12M': 8.2,
  '18M': 7.7,
  '24M': 7.7,
  '36M': 7.7,
};

function toStandardTenureMap(monthlyMap) {
  const out = { '1W': 0.5, '2W': 0.5, '3W': 0.5 };
  for (const m of [1, 3, 6, 9, 12, 18, 24]) {
    if (typeof monthlyMap[m] === 'number') {
      out[`${m}M`] = Number(monthlyMap[m].toFixed(2));
    }
  }
  if (typeof out['24M'] === 'number') {
    out['36M'] = out['24M'];
  }
  return out;
}

export function extractPromoPdfUrlFromHtml(html) {
  const matches = [
    ...String(html || '').matchAll(
      /(?:https?:\/\/liobank\.vn)?(\/doc\/[^"'\s>]*?(?:CTKM|Cong_Lai_suat|Lai_suat_Tiet_kiem)[^"'\s>]*?\.pdf)/gi
    ),
  ];
  if (matches.length === 0) return null;
  const raw = matches[0][0];
  return raw.startsWith('http') ? raw : `https://liobank.vn${raw}`;
}

export function extractDateFromPdfUrl(pdfUrl) {
  const dotted = String(pdfUrl || '').match(/(\d{2})\.(\d{2})\.(\d{4})\.pdf/i);
  if (dotted) return `${dotted[1]}/${dotted[2]}/${dotted[3]}`;
  const compact = String(pdfUrl || '').match(/(\d{2})(\d{2})(\d{4})\.pdf/i);
  if (compact) return `${compact[1]}/${compact[2]}/${compact[3]}`;
  return null;
}

export function parseLiobankTariffHtml(html) {
  const { textLines } = extractTableRowsAndLines(html);
  const monthlyRates = {};
  let effectiveDate = null;

  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i];

    const dateMatch = line.match(/áp dụng từ:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (dateMatch) {
      effectiveDate = dateMatch[1];
    }

    const monthMatch = line.match(/^(\d{1,2})\s*tháng$/i);
    if (monthMatch) {
      const m = Number(monthMatch[1]);
      const nextLine = textLines[i + 1] || '';
      const rateMatch = nextLine.match(/^(\d{1,2}(?:\.\d{1,2})?)\s*%?$/);
      if (rateMatch) {
        const val = Number(rateMatch[1]);
        if (Number.isFinite(val) && val >= 0.1 && val <= 15.0) {
          monthlyRates[m] = Number(val.toFixed(2));
        }
      }
    }
  }

  return {
    monthlyRates,
    standardRates: toStandardTenureMap(monthlyRates),
    effectiveDate,
    discoveredPdfUrl: extractPromoPdfUrlFromHtml(html),
  };
}

export function parseLiobankPromoPdfBuffer(buf) {
  const rawLatin = buf.toString('latin1');
  const promoMonthlyRates = {};
  const pdfStandardMonthlyRates = {};

  for (const m of rawLatin.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)) {
    try {
      const inf = zlib.inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1');
      const text = [...inf.matchAll(/\(([^()]*)\)/g)]
        .map((x) => x[1])
        .join('')
        .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
        .replace(/\s+/g, ' ');

      if (!text.includes('%')) continue;

      for (const row of text.matchAll(/(\d{1,2})\s*tháng\s+(\d{1,2}(?:\.\d{1,2})?)\s*%\s+(\d{1,2}(?:\.\d{1,2})?)\s*%/gi)) {
        const months = Number(row[1]);
        const r1 = Number(row[2]);
        const r2 = Number(row[3]);
        if (months >= 1 && months <= 36 && r1 >= 0.1 && r1 <= 15.0 && r2 >= 0.1 && r2 <= 15.0) {
          promoMonthlyRates[months] = Math.max(r1, r2);
          pdfStandardMonthlyRates[months] = Math.min(r1, r2);
        }
      }
    } catch {
      // Non-deflate or image stream
    }
  }

  return {
    promoMonthlyRates,
    pdfStandardMonthlyRates,
    promoRates: toStandardTenureMap(promoMonthlyRates),
  };
}

/**
 * Fetches default tariffs from https://liobank.vn/vn/deposit-tariffs
 * and discovers/parses the latest CTKM promo PDF from LioBank.
 */
export async function fetchLiobankRates() {
  const scrapedAt = getVietnamIsoTimestamp();
  const updatedDate = getVietnamDateFormatted();

  let standardMonthly = {};
  let parsedStandard = {};
  let effectiveDate = null;
  let promoPdfUrl = LIOBANK_DEFAULT_PROMO_PDF;
  let liveTariffSucceeded = false;

  try {
    const tariffRes = await fetchHtmlWithRetry(LIOBANK_TARIFF_URL);
    const extracted = parseLiobankTariffHtml(tariffRes.html);
    standardMonthly = extracted.monthlyRates;
    parsedStandard = extracted.standardRates;
    effectiveDate = extracted.effectiveDate;
    if (extracted.discoveredPdfUrl) {
      promoPdfUrl = extracted.discoveredPdfUrl;
    }
    liveTariffSucceeded = Object.keys(standardMonthly).length > 0;
  } catch {
    // Fallback check on /vn/deposit or /vn/legal below if needed
  }

  // If no PDF discovered from tariff page, check /vn/deposit and /vn/legal
  if (promoPdfUrl === LIOBANK_DEFAULT_PROMO_PDF) {
    for (const pageUrl of [LIOBANK_DEPOSIT_URL, LIOBANK_LEGAL_URL]) {
      try {
        const res = await fetchHtmlWithRetry(pageUrl, { retries: 1, timeoutMs: 10000 });
        const found = extractPromoPdfUrlFromHtml(res.html);
        if (found) {
          promoPdfUrl = found;
          break;
        }
      } catch {
        // Ignore secondary discovery failure
      }
    }
  }

  let promoMonthly = {};
  let parsedPromo = {};
  let livePromoPdfSucceeded = false;
  let promoDate = extractDateFromPdfUrl(promoPdfUrl) || effectiveDate || updatedDate;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const pdfRes = await fetch(promoPdfUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });
    clearTimeout(timer);
    if (pdfRes.ok) {
      const buf = Buffer.from(await pdfRes.arrayBuffer());
      const parsedPdf = parseLiobankPromoPdfBuffer(buf);
      promoMonthly = parsedPdf.promoMonthlyRates;
      parsedPromo = parsedPdf.promoRates;
      livePromoPdfSucceeded = Object.keys(promoMonthly).length > 0;
    }
  } catch {
    // Fallback to baseline promo rates when offline
  }

  const rates = mergeWithBaseline(parsedStandard, BASELINE_LIOBANK_RATES);
  const promoRates = mergeWithBaseline(parsedPromo, BASELINE_LIOBANK_PROMO_RATES);
  const peakPromo = Math.max(...Object.values(promoRates));
  const peakStandard = Math.max(...Object.values(rates));

  const note =
    liveTariffSucceeded && livePromoPdfSucceeded
      ? `Synced tariff (${Object.keys(standardMonthly).length} terms, effective ${effectiveDate || updatedDate}) + promo PDF (${Object.keys(promoMonthly).length} terms up to ${peakPromo.toFixed(2)}%).`
      : liveTariffSucceeded
        ? `Synced tariff (${Object.keys(standardMonthly).length} terms); promo PDF parsed with baseline fallback.`
        : `Live fetch unavailable; preserved verified tariff & CTKM promo (${promoDate}) rates.`;

  return {
    bankId: 'liobank',
    sourceUrl: LIOBANK_TARIFF_URL,
    fetchedUrl: LIOBANK_TARIFF_URL,
    promoPdfUrl,
    promoDate,
    effectiveDate,
    scrapedAt,
    updatedDate,
    liveFetchSucceeded: liveTariffSucceeded || livePromoPdfSucceeded,
    liveTariffSucceeded,
    livePromoPdfSucceeded,
    parsedTenuresCount: Object.keys(standardMonthly).length,
    parsedPromoTenuresCount: Object.keys(promoMonthly).length,
    standardMonthly,
    promoMonthly,
    rates,
    promoRates,
    peakStandard,
    peakPromo,
    note,
  };
}

async function syncLiobankExtendedFiles(result) {
  // 1. Update promoRates, promoUrl, badge, and rateTierNote in src/data/banksData.js
  const banksDataPath = path.join(PROJECT_ROOT, 'src/data/banksData.js');
  let banksSrc = await fs.readFile(banksDataPath, 'utf8');

  const promoLines = STANDARD_TENURES.map((k, idx) => {
    const val = Number(result.promoRates[k]).toFixed(2);
    const comma = idx < STANDARD_TENURES.length - 1 ? ',' : '';
    return `      "${k}": ${val}${comma}`;
  }).join('\n');

  banksSrc = banksSrc.replace(
    /(id:\s*"liobank"[\s\S]*?badge:\s*)"[^"]*"/,
    `$1"🦁 Mặc định ${result.peakStandard.toFixed(1)}% · CTKM đến ${result.peakPromo.toFixed(1)}%"`
  );
  banksSrc = banksSrc.replace(
    /(id:\s*"liobank"[\s\S]*?rateTierNote:\s*)"[^"]*"/,
    `$1"Mặc định từ deposit-tariffs (${result.effectiveDate || result.updatedDate}) · CTKM cộng lãi đến ${result.peakPromo.toFixed(2)}%/năm"`
  );
  banksSrc = banksSrc.replace(
    /(id:\s*"liobank"[\s\S]*?notes:\s*)"[^"]*"/,
    `$1"Biểu mặc định 12T ${result.rates['12M'].toFixed(2)}%/năm; gói CTKM cộng lãi lên đến ${result.peakPromo.toFixed(2)}%/năm (Ống heo Pigg 4.75%)."`
  );

  // Add or update promoRates & promoUrl fields on liobank block
  if (/(id:\s*"liobank"[\s\S]*?promoRates:\s*\{)/.test(banksSrc)) {
    banksSrc = banksSrc.replace(
      /(id:\s*"liobank"[\s\S]*?promoRates:\s*\{)([\s\S]*?)(\n\s*\})/,
      `$1\n${promoLines}$3`
    );
    banksSrc = banksSrc.replace(
      /(id:\s*"liobank"[\s\S]*?promoUrl:\s*)"[^"]*"/,
      `$1"${result.promoPdfUrl}"`
    );
  } else {
    banksSrc = banksSrc.replace(
      /(id:\s*"liobank"[\s\S]*?rates:\s*\{[\s\S]*?\n\s*\},)/,
      `$1\n    promoUrl: "${result.promoPdfUrl}",\n    promoRates: {\n${promoLines}\n    },`
    );
  }
  await fs.writeFile(banksDataPath, banksSrc, 'utf8');

  // 2. Update liobank-deposit in src/data/bankPackagesData.js
  const pkgPath = path.join(PROJECT_ROOT, 'src/data/bankPackagesData.js');
  let pkgSrc = await fs.readFile(pkgPath, 'utf8');

  const monthsList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24];
  const pkgRatesLines = monthsList
    .map((m) => {
      const std =
        result.standardMonthly[m] ??
        (m <= 5 ? result.rates['1M'] : m === 12 ? result.rates['12M'] : result.rates['6M']);
      const promo = result.promoMonthly[m];
      const promoPart = promo ? `, promoRate: ${Number(promo).toFixed(2)}, note: 'CTKM: ${Number(promo).toFixed(2)}%'` : '';
      return `          { term: '${m} tháng', termMonths: ${m}, endRate: ${Number(std).toFixed(2)}${promoPart} },`;
    })
    .join('\n');

  pkgSrc = pkgSrc.replace(
    /(id:\s*'liobank-deposit'[\s\S]*?description:\s*')[^']*(')/,
    `$1Gửi cố định kỳ hạn qua Liobank, mặc định ${result.peakStandard.toFixed(1)}% · CTKM đến ${result.peakPromo.toFixed(1)}%/năm$2`
  );
  pkgSrc = pkgSrc.replace(
    /(id:\s*'liobank-deposit'[\s\S]*?lastUpdated:\s*')[^']*(')/,
    `$1${result.updatedDate}$2`
  );
  pkgSrc = pkgSrc.replace(
    /(id:\s*'liobank-deposit'[\s\S]*?rates:\s*\[)[\s\S]*?(\n\s*\],\s*\n\s*bestRate:\s*)[\d.]+/,
    `$1\n${pkgRatesLines}$2${result.peakPromo.toFixed(2)}`
  );
  pkgSrc = pkgSrc.replace(
    /(id:\s*'liobank-deposit'[\s\S]*?promotionUrl:\s*')[^']*(')/,
    `$1${result.promoPdfUrl}$2`
  );
  pkgSrc = pkgSrc.replace(
    /(id:\s*'liobank-deposit'[\s\S]*?promotion:\s*')[^']*(')/,
    `$1CTKM cộng thêm lãi suất tiết kiệm đến ${result.peakPromo.toFixed(2)}%/năm (Hiệu lực ${result.promoDate})$2`
  );

  await fs.writeFile(pkgPath, pkgSrc, 'utf8');

  // 3. Rewrite liobank-latest.json with full promo PDF metadata
  const snapshotPath = path.join(PROJECT_ROOT, 'src/data/scraped/liobank-latest.json');
  await fs.writeFile(
    snapshotPath,
    JSON.stringify(
      {
        bankId: 'liobank',
        sourceUrl: result.sourceUrl,
        promoPdfUrl: result.promoPdfUrl,
        promoDate: result.promoDate,
        effectiveDate: result.effectiveDate,
        scrapedAt: result.scrapedAt,
        updatedDate: result.updatedDate,
        liveFetchSucceeded: result.liveFetchSucceeded,
        parsedTenuresCount: result.parsedTenuresCount,
        parsedPromoTenuresCount: result.parsedPromoTenuresCount,
        rates: result.rates,
        promoRates: result.promoRates,
        note: result.note,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  return { banksDataPath, pkgPath, snapshotPath };
}

export async function runLiobankScraper({ writeFiles = true } = {}) {
  const result = await fetchLiobankRates();
  if (writeFiles) {
    await updateBankRatesInFiles('liobank', result.rates, result);
    const paths = await syncLiobankExtendedFiles(result);
    return { ...result, ...paths };
  }
  return result;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  runLiobankScraper({ writeFiles: true })
    .then((res) => {
      console.log(`[LIOBANK Scraper @ ${res.scrapedAt}]`);
      console.log(`  Tariff: ${res.sourceUrl} (Live: ${res.liveTariffSucceeded}, Parsed: ${res.parsedTenuresCount} terms)`);
      console.log(`  Promo PDF: ${res.promoPdfUrl} (Live: ${res.livePromoPdfSucceeded}, Parsed: ${res.parsedPromoTenuresCount} terms)`);
      console.log(`  Note: ${res.note}`);
      console.log('  Default Rates:', JSON.stringify(res.rates));
      console.log('  Promo Rates:  ', JSON.stringify(res.promoRates));
    })
    .catch((err) => {
      console.error('[LIOBANK Scraper ERROR]', err);
      process.exitCode = 1;
    });
}
