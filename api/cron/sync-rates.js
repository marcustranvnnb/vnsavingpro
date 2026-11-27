import { INITIAL_BANKS_DATA } from '../../src/data/banksData.js';
import { fetchTnexRates } from '../../scripts/scrape-tnex.js';
import { fetchTimoRates } from '../../scripts/scrape-timo.js';
import { fetchLiobankRates } from '../../scripts/scrape-liobank.js';
import { fetchCakeRates } from '../../scripts/scrape-cake.js';
import { setLiveRatesSnapshotAsync } from '../_lib/liveRatesCache.js';
import { checkAndTrackQuota, sendPocQuotaResponse } from '../_lib/quotaGuard.js';
import { applyApiSecurityHeaders, timingSafeBearerMatch } from '../_lib/security.js';

export default async function handler(req, res) {
  applyApiSecurityHeaders(res);
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!timingSafeBearerMatch(req.headers?.authorization, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.setHeader('Cache-Control', 'no-store');

  const quotaGuard = await checkAndTrackQuota({ trackApiHit: true, forceRefresh: true });
  if (quotaGuard.blocked) {
    return sendPocQuotaResponse(res, quotaGuard);
  }

  const [tnex, timo, liobank, cake] = await Promise.all([
    fetchTnexRates(),
    fetchTimoRates(),
    fetchLiobankRates(),
    fetchCakeRates(),
  ]);

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
  const savedSnapshot = await setLiveRatesSnapshotAsync(updatedBanks, updatedAt, {
    schedule: 'monthly_day_1',
    tnex: { live: tnex.liveFetchSucceeded, parsed: tnex.parsedTenuresCount, note: tnex.note },
    timo: { live: timo.liveFetchSucceeded, parsed: timo.parsedTenuresCount, note: timo.note },
    liobank: {
      live: liobank.liveFetchSucceeded,
      parsed: liobank.parsedTenuresCount,
      parsedPromo: liobank.parsedPromoTenuresCount,
      promoPdfUrl: liobank.promoPdfUrl,
      note: liobank.note,
    },
    cake: {
      live: cake.liveFetchSucceeded,
      parsed: cake.parsedTenuresCount,
      effectiveDate: cake.effectiveDate,
      note: cake.note,
    },
  });

  return res.status(200).json({
    ok: true,
    updatedAt,
    syncSchedule: 'monthly_day_1',
    syncedAt: cake.scrapedAt,
    supabaseSaved: savedSnapshot.supabaseSaved,
    storage: savedSnapshot.storage,
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
      liobank: {
        url: liobank.sourceUrl,
        promoPdfUrl: liobank.promoPdfUrl,
        promoDate: liobank.promoDate,
        liveTariffSucceeded: liobank.liveTariffSucceeded,
        livePromoPdfSucceeded: liobank.livePromoPdfSucceeded,
        parsedTenuresCount: liobank.parsedTenuresCount,
        parsedPromoTenuresCount: liobank.parsedPromoTenuresCount,
        rates: liobank.rates,
        promoRates: liobank.promoRates,
        note: liobank.note,
      },
      cake: {
        url: cake.sourceUrl,
        accumulateUrl: cake.accumulateUrl,
        effectiveDate: cake.effectiveDate,
        liveStandardSucceeded: cake.liveStandardSucceeded,
        liveAccumulateSucceeded: cake.liveAccumulateSucceeded,
        parsedTenuresCount: cake.parsedTenuresCount,
        rates: cake.rates,
        accumulateRates: cake.accumulateRates,
        note: cake.note,
      },
    },
  });
}
