import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_BANKS_DATA } from '../src/data/banksData.js';
import { isSupabaseConfigured } from '../api/_lib/supabase.js';
import { setLiveRatesSnapshotAsync } from '../api/_lib/liveRatesCache.js';
import { runTnexScraper } from './scrape-tnex.js';
import { runTimoScraper } from './scrape-timo.js';
import { runLiobankScraper } from './scrape-liobank.js';
import { runCakeScraper } from './scrape-cake.js';

function loadLocalEnvIfPresent() {
  for (const filename of ['.env.local', '.env']) {
    const filePath = path.resolve(process.cwd(), filename);
    if (!fs.existsSync(filePath)) continue;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function main() {
  loadLocalEnvIfPresent();

  console.log('=== VnSavingPro Monthly Day-1 Rate Sync (ALL 4 BANKS) ===');
  const tnex = await runTnexScraper({ writeFiles: true });
  console.log(`✔ TNEX: 1M=${tnex.rates['1M']}% | 6M=${tnex.rates['6M']}% | 12M=${tnex.rates['12M']}% (${tnex.note})`);

  const timo = await runTimoScraper({ writeFiles: true });
  console.log(`✔ TIMO: 1M=${timo.rates['1M']}% | 6M=${timo.rates['6M']}% | 12M=${timo.rates['12M']}% (${timo.note})`);

  const liobank = await runLiobankScraper({ writeFiles: true });
  console.log(
    `✔ LIOBANK: Default(6M=${liobank.rates['6M']}%, 12M=${liobank.rates['12M']}%) | Promo(6M=${liobank.promoRates['6M']}%, 12M=${liobank.promoRates['12M']}%) (${liobank.note})`
  );

  const cake = await runCakeScraper({ writeFiles: true });
  console.log(
    `✔ CAKE: 1M=${cake.rates['1M']}% | 6M=${cake.rates['6M']}% | 12M=${cake.rates['12M']}% | 36M=${cake.rates['36M']}% (${cake.note})`
  );

  if (isSupabaseConfigured()) {
    const updatedBanks = INITIAL_BANKS_DATA.map((bank) => {
      if (bank.id === 'tnex') return { ...bank, rates: tnex.rates };
      if (bank.id === 'timo') return { ...bank, rates: timo.rates };
      if (bank.id === 'liobank') {
        return {
          ...bank,
          rates: liobank.rates,
          promoRates: liobank.promoRates,
          promoUrl: liobank.promoPdfUrl,
        };
      }
      if (bank.id === 'cake') return { ...bank, rates: cake.rates };
      return bank;
    });
    const updatedAt = cake.updatedDate || liobank.updatedDate || tnex.updatedDate || timo.updatedDate;
    const res = await setLiveRatesSnapshotAsync(updatedBanks, updatedAt, {
      source: 'scripts/scrape-all.js',
      schedule: 'monthly_day_1',
      tnex: { live: tnex.liveFetchSucceeded, parsed: tnex.parsedTenuresCount, note: tnex.note },
      timo: { live: timo.liveFetchSucceeded, parsed: timo.parsedTenuresCount, note: timo.note },
      liobank: {
        live: liobank.liveFetchSucceeded,
        parsed: liobank.parsedTenuresCount,
        parsedPromo: liobank.parsedPromoTenuresCount,
        note: liobank.note,
      },
      cake: {
        live: cake.liveFetchSucceeded,
        parsed: cake.parsedTenuresCount,
        effectiveDate: cake.effectiveDate,
        note: cake.note,
      },
    });
    if (res.supabaseSaved) {
      console.log(`✔ SUPABASE: Saved monthly rate snapshot (${updatedAt}) to public.bank_rate_snapshots`);
    } else {
      console.warn(`! SUPABASE: Failed to push rate snapshot (${res.supabaseError || 'unknown error'})`);
    }
  } else {
    console.log('ℹ SUPABASE: Not configured yet — skipped remote Postgres sync (local JSON/JS updated).');
  }
}

main().catch((err) => {
  console.error('Rate sync failed:', err);
  process.exitCode = 1;
});
