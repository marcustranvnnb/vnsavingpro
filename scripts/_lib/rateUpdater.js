import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, '../..');
export const STANDARD_TENURES = ['1W', '2W', '3W', '1M', '3M', '6M', '9M', '12M', '18M', '24M', '36M'];
const MONTH_TENURES = [1, 3, 6, 9, 12, 18, 24, 36];

export function getVietnamDateFormatted(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.day}/${map.month}/${map.year}`;
}

export function getVietnamIsoTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(' ', 'T') + '+07:00';
}

export async function fetchHtmlWithRetry(url, { retries = 2, timeoutMs = 15000 } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
        },
      });
      clearTimeout(timer);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const html = await res.text();
      return { html, finalUrl: res.url || url, status: res.status };
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error(`Failed to fetch ${url}`);
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&ndash;|&#8211;/gi, '-')
    .replace(/&mdash;|&#8212;/gi, '-')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function cleanText(raw) {
  return decodeHtmlEntities(raw.replace(/<[^>]+>/g, ' '))
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractTableRowsAndLines(html) {
  const sanitized = String(html || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  const tableRows = [];
  const trMatches = sanitized.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const m of trMatches) {
    const cells = [];
    const cellMatches = m[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi);
    for (const c of cellMatches) {
      const txt = cleanText(c[1]);
      if (txt) cells.push(txt);
    }
    if (cells.length >= 2) {
      tableRows.push(cells);
    }
  }

  const blockSeparated = sanitized.replace(/<\/?(?:tr|p|div|li|h[1-6]|br|section|article|td|th)\b[^>]*>/gi, '\n');
  const textLines = blockSeparated
    .split('\n')
    .map((line) => cleanText(line))
    .filter((line) => line.length > 0 && line.length < 240);

  return { tableRows, textLines };
}

function extractValidRate(str) {
  const matches = [...String(str || '').matchAll(/(\d{1,2}(?:\.\d{1,2})?)\s*%/g)];
  for (const m of matches) {
    const val = Number(m[1]);
    if (Number.isFinite(val) && val >= 0.1 && val <= 15.0) {
      return Number(val.toFixed(2));
    }
  }
  return null;
}

function assignTenureRange(targetMap, startMonth, endMonth, rate) {
  for (const m of MONTH_TENURES) {
    if (m >= startMonth && m <= endMonth) {
      targetMap[`${m}M`] = rate;
    }
  }
  // If bank tops out at 24M (e.g., 18-24M), mirror 24M into 36M only when 36M is not explicitly set
  if (endMonth === 24 && targetMap['36M'] === undefined) {
    targetMap['36M'] = rate;
  }
}

export function parseRateTableFromHtml(html) {
  const { tableRows, textLines } = extractTableRowsAndLines(html);
  const parsed = {};

  // 1. Parse structured <tr> table rows first (highest accuracy)
  for (const cells of tableRows) {
    const label = cells[0];
    const rate = extractValidRate(cells.slice(1).join(' '));
    if (rate === null) continue;

    if (/không kỳ hạn|demand|flex/i.test(label)) {
      parsed['1W'] = Math.min(rate, 0.5);
      parsed['2W'] = Math.min(rate, 0.5);
      parsed['3W'] = Math.min(rate, 0.5);
      continue;
    }

    const rangeMatch = label.match(/(?:từ|from)?\s*(\d{1,2})\s*(?:-|đến|to)\s*(\d{1,2})\s*(?:tháng|t|months?)?/i);
    if (rangeMatch) {
      assignTenureRange(parsed, Number(rangeMatch[1]), Number(rangeMatch[2]), rate);
      continue;
    }

    const singleMatch = label.match(/^(?:kỳ hạn\s*)?(\d{1,2})(?:\s*(?:tháng|t|months?))?$/i);
    if (singleMatch) {
      const m = Number(singleMatch[1]);
      if (MONTH_TENURES.includes(m)) {
        parsed[`${m}M`] = rate;
      } else if (m === 15 && parsed['18M'] === undefined) {
        parsed['18M'] = rate;
      }
      continue;
    }
  }

  // 2. Fallback scan on plain text lines for div/grid layouts
  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i];
    const combined = `${line} ${textLines[i + 1] || ''}`;

    const rangeLine = line.match(/(?:từ|kỳ hạn)\s*(\d{1,2})\s*(?:-|đến)\s*(\d{1,2})\s*tháng.*?(\d{1,2}(?:\.\d{1,2})?)\s*%/i);
    if (rangeLine) {
      const r = Number(rangeLine[3]);
      if (r >= 0.1 && r <= 15.0) {
        assignTenureRange(parsed, Number(rangeLine[1]), Number(rangeLine[2]), Number(r.toFixed(2)));
      }
      continue;
    }

    const singleLine = combined.match(/kỳ hạn\s*(\d{1,2})\s*tháng[^%]{0,40}?(\d{1,2}(?:\.\d{1,2})?)\s*%/i);
    if (singleLine) {
      const m = Number(singleLine[1]);
      const r = Number(singleLine[2]);
      if (MONTH_TENURES.includes(m) && r >= 0.1 && r <= 15.0 && parsed[`${m}M`] === undefined) {
        parsed[`${m}M`] = Number(r.toFixed(2));
      }
    }
  }

  return { parsed, tableRowsFound: tableRows.length };
}

export function mergeWithBaseline(parsed, baselineRates) {
  const merged = {};
  for (const t of STANDARD_TENURES) {
    const candidate = parsed[t];
    merged[t] =
      typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0
        ? Number(candidate.toFixed(2))
        : baselineRates[t];
  }
  return merged;
}

export async function updateBankRatesInFiles(bankId, mergedRates, meta) {
  const banksDataPath = path.join(PROJECT_ROOT, 'src/data/banksData.js');
  let source = await fs.readFile(banksDataPath, 'utf8');

  // Update RATES_UPDATED_AT constant
  source = source.replace(
    /export const RATES_UPDATED_AT\s*=\s*"[^"]*";/,
    `export const RATES_UPDATED_AT = "${meta.updatedDate}";`
  );

  // Format new rates block cleanly matching existing indentation
  const rateLines = STANDARD_TENURES.map((k, idx) => {
    const val = Number(mergedRates[k]).toFixed(2);
    const comma = idx < STANDARD_TENURES.length - 1 ? ',' : '';
    return `      "${k}": ${val}${comma}`;
  }).join('\n');

  const bankBlockPattern = new RegExp(
    `(id:\\s*"${bankId}"[\\s\\S]*?rates:\\s*\\{)([\\s\\S]*?)(\\n\\s*\\})`,
    'm'
  );

  if (!bankBlockPattern.test(source)) {
    throw new Error(`Could not locate rates block for bank "${bankId}" in src/data/banksData.js`);
  }

  source = source.replace(bankBlockPattern, `$1\n${rateLines}$3`);
  await fs.writeFile(banksDataPath, source, 'utf8');

  // Save scraped JSON snapshot
  const scrapedDir = path.join(PROJECT_ROOT, 'src/data/scraped');
  await fs.mkdir(scrapedDir, { recursive: true });
  const snapshotPath = path.join(scrapedDir, `${bankId}-latest.json`);
  await fs.writeFile(
    snapshotPath,
    JSON.stringify(
      {
        bankId,
        sourceUrl: meta.sourceUrl,
        fetchedUrl: meta.fetchedUrl,
        scrapedAt: meta.scrapedAt,
        updatedDate: meta.updatedDate,
        liveFetchSucceeded: meta.liveFetchSucceeded,
        parsedTenuresCount: meta.parsedTenuresCount,
        rates: mergedRates,
        note: meta.note,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  return { banksDataPath, snapshotPath };
}
