import { runTnexScraper } from './scrape-tnex.js';
import { runTimoScraper } from './scrape-timo.js';

async function main() {
  console.log('=== VnSavingPro Daily Rate Sync (TNEX & TIMO) ===');
  const tnex = await runTnexScraper({ writeFiles: true });
  console.log(`✔ TNEX: 1M=${tnex.rates['1M']}% | 6M=${tnex.rates['6M']}% | 12M=${tnex.rates['12M']}% (${tnex.note})`);

  const timo = await runTimoScraper({ writeFiles: true });
  console.log(`✔ TIMO: 1M=${timo.rates['1M']}% | 6M=${timo.rates['6M']}% | 12M=${timo.rates['12M']}% (${timo.note})`);
}

main().catch((err) => {
  console.error('Rate sync failed:', err);
  process.exitCode = 1;
});
