import { INITIAL_BANKS_DATA, RATES_UPDATED_AT } from '../../src/data/banksData.js';

let cachedSnapshot = null;

export function setLiveRatesSnapshot(banks, updatedAt, syncMeta = null) {
  cachedSnapshot = {
    banks,
    updatedAt,
    syncMeta,
    cachedAt: new Date().toISOString(),
  };
  return cachedSnapshot;
}

export function getLiveRatesSnapshot() {
  if (cachedSnapshot) {
    return cachedSnapshot;
  }
  return {
    banks: INITIAL_BANKS_DATA,
    updatedAt: RATES_UPDATED_AT,
    syncMeta: null,
    cachedAt: null,
  };
}
