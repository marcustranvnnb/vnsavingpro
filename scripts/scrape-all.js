import { runTnexScraper } from './scrape-tnex.js';
import { runTimoScraper } from './scrape-timo.js';
import { runLiobankScraper } from './scrape-liobank.js';
import { runCakeScraper } from './scrape-cake.js';

async function main() {
  console.log('=== VnSavingPro Daily Rate Sync (ALL 4 BANKS) ===');
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
}

main().catch((err) => {
  console.error('Rate sync failed:', err);
  process.exitCode = 1;
});
