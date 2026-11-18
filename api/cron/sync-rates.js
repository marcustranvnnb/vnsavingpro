import { INITIAL_BANKS_DATA } from '../../src/data/banksData.js';
import { fetchTnexRates } from '../../scripts/scrape-tnex.js';
import { fetchTimoRates } from '../../scripts/scrape-timo.js';
import { setLiveRatesSnapshot } from '../_lib/liveRatesCache.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  if (secret && req.headers?.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const [tnex, timo] = await Promise.all([fetchTnexRates(), fetchTimoRates()]);

  const updatedBanks = INITIAL_BANKS_DATA.map((bank) => {
    if (bank.id === 'tnex') return { ...bank, rates: tnex.rates };
    if (bank.id === 'timo') return { ...bank, rates: timo.rates };
    return bank;
  });

  const updatedAt = tnex.updatedDate || timo.updatedDate;
  setLiveRatesSnapshot(updatedBanks, updatedAt, {
    tnex: { live: tnex.liveFetchSucceeded, parsed: tnex.parsedTenuresCount, note: tnex.note },
    timo: { live: timo.liveFetchSucceeded, parsed: timo.parsedTenuresCount, note: timo.note },
  });

  return res.status(200).json({
    ok: true,
    updatedAt,
    syncedAt: tnex.scrapedAt,
    sources: {
      tnex: {
        url: tnex.sourceUrl,
        liveFetchSucceeded: tnex.liveFetchSucceeded,
        parsedTenuresCount: tnex.parsedTenuresCount,
        rates: tnex.rates,
        note: tnex.note,
      },
      timo: {
        url: timo.sourceUrl,
        liveFetchSucceeded: timo.liveFetchSucceeded,
        parsedTenuresCount: timo.parsedTenuresCount,
        rates: timo.rates,
        note: timo.note,
      },
    },
  });
}
