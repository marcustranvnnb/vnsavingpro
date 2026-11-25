/**
 * Hardened Client Storage Utility with:
 * 1. Strict key allowlist & foreign/junk key auto-purge
 * 2. Circular-reference & Infinity-safe serialization
 * 3. CSPRNG device seed (crypto.getRandomValues) + stream cipher + integrity tag (`v2.` envelope)
 * 4. Strict per-key schema validation & XSS payload sanitization
 * 5. Self-healing automatic removal of corrupted or tampered entries
 */

const STORAGE_KEY_PREFIX = 'VNSAVING_SECURE_';
const ENTROPY_KEY = 'VNSAVING_DEVICE_SEED';
const ALLOWED_KEYS = new Set([
  'CUSTOM_RATES',
  'CUSTOM_REFERRAL_CODES',
  'PLANNER_STATE',
  'USER_FEEDBACK_LOG',
  'CALC_HISTORY_LOG',
  'TOOL_RESTORE_STATE',
  'ONBOARDING_STATE',
  'FX_PORTFOLIO_STATE',
  'SALARY_STATE',
  'ACTIVE_PASSBOOKS_STATE',
  'CIC_LOAN_STATE',
  'WEALTH_TREES_STATE',
]);

const ALLOWED_BANKS = new Set(['cake', 'tnex', 'timo', 'liobank']);
const ALLOWED_TENURES = new Set(['1W', '2W', '3W', '1M', '3M', '6M', '9M', '12M', '18M', '24M', '36M']);
const RATE_KEY_RE = /^(cake|tnex|timo|liobank)_(1W|2W|3W|1M|3M|6M|9M|12M|18M|24M|36M)$/;

const MAX_PAYLOAD_CHARS = 65_536;
const MAX_TOTAL_STORAGE_KEYS = 50;

const utf8Encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
const utf8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;

function getStorage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function isPlainObject(val) {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export function clampNum(val, fallback = 0, min = -1e15, max = 1e15) {
  if (val === null || val === undefined || val === '') return fallback;
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeText(input, maxLen = 400) {
  if (input === null || input === undefined) return '';
  let clean = String(input).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  let prev;
  do {
    prev = clean;
    clean = clean.replace(/<[^>]*>?/g, '');
  } while (clean !== prev);
  clean = clean
    .replace(/[<>]/g, '')
    .replace(/(?:javascript|vbscript|data)\s*:/gi, '')
    .replace(/\bon[a-z]+\s*=/gi, '')
    .trim();
  return clean.slice(0, maxLen);
}

export function sanitizeReferralCode(input) {
  return sanitizeText(input, 128)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32);
}

export function safeExternalUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return '#';
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' ? parsed.href : '#';
  } catch {
    return '#';
  }
}

function cloneDefault(defaultValue) {
  if (Array.isArray(defaultValue)) return [...defaultValue];
  if (isPlainObject(defaultValue)) return { ...defaultValue };
  return defaultValue;
}

/* ── Device Seed & Cryptographic Stream Cipher + Signature ── */

function getDeviceSeed() {
  const storage = getStorage();
  if (!storage) return 'vnsavingpro-memory-seed-2026';

  const existing = storage.getItem(ENTROPY_KEY);
  if (existing && /^[a-f0-9]{64}$/.test(existing)) {
    return existing;
  }

  let seed = '';
  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      const bytes = new Uint8Array(32);
      globalThis.crypto.getRandomValues(bytes);
      seed = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback entropy below
  }
  if (!seed) {
    seed = `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`.padEnd(64, '0').slice(0, 64);
  }
  try {
    storage.setItem(ENTROPY_KEY, seed);
  } catch {
    // Ignore storage quota failure on seed creation
  }
  return seed;
}

function toBytes(str) {
  if (utf8Encoder) return utf8Encoder.encode(str);
  return Buffer.from(str, 'utf8');
}

function fromBytes(bytes) {
  if (utf8Decoder) return utf8Decoder.decode(bytes);
  return Buffer.from(bytes).toString('utf8');
}

function bytesToBase64Url(bytes) {
  if (typeof btoa === 'function') {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return Buffer.from(bytes).toString('base64url');
}

function base64UrlToBytes(b64) {
  const norm = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = norm + '='.repeat((4 - (norm.length % 4)) % 4);
  if (typeof atob === 'function') {
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(padded, 'base64'));
}

function computeIntegrityTag(data, seed) {
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  const input = `${seed}:${data}`;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (Math.imul(h2 ^ c, 0x85ebca6b) ^ (h1 >>> 13)) >>> 0;
  }
  return `${h1.toString(36)}-${h2.toString(36)}`;
}

function xorKeystream(bytes, seed, nonceHex) {
  const keyBytes = toBytes(`${seed}:${nonceHex}`);
  const out = new Uint8Array(bytes.length);
  let state = 0x9e3779b9;
  for (let i = 0; i < bytes.length; i++) {
    const k = keyBytes[i % keyBytes.length];
    state = (Math.imul(state ^ k ^ (i & 0xff), 0x45d9f3b) + 0x27d4eb2f) >>> 0;
    out[i] = bytes[i] ^ ((k + (state >>> 16)) & 0xff);
  }
  return out;
}

function createNonceHex() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      const b = new Uint8Array(8);
      globalThis.crypto.getRandomValues(b);
      return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback below
  }
  return Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, '0');
}

function sealPayload(jsonStr) {
  const seed = getDeviceSeed();
  const nonce = createNonceHex();
  const sig = computeIntegrityTag(`${nonce}:${jsonStr}`, seed);
  const cipherBytes = xorKeystream(toBytes(jsonStr), seed, nonce);
  return `v2.${nonce}.${sig}.${bytesToBase64Url(cipherBytes)}`;
}

function unsealPayload(raw) {
  if (typeof raw !== 'string' || !raw.startsWith('v2.') || raw.length > MAX_PAYLOAD_CHARS) {
    return null;
  }
  const parts = raw.split('.');
  if (parts.length !== 4) return null;
  const [, nonce, sig, cipherB64] = parts;
  if (!nonce || !sig || !cipherB64) return null;
  try {
    const seed = getDeviceSeed();
    const plainBytes = xorKeystream(base64UrlToBytes(cipherB64), seed, nonce);
    const jsonStr = fromBytes(plainBytes);
    const expectedSig = computeIntegrityTag(`${nonce}:${jsonStr}`, seed);
    if (sig !== expectedSig) return null;
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/* ── Circular-Safe Serialization & Schema Validators ──────── */

function safeStringify(data) {
  const seen = new WeakSet();
  return JSON.stringify(data, (key, value) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return undefined;
    if (typeof value === 'number' && !Number.isFinite(value)) return null;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'function' || typeof value === 'symbol') return undefined;
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return undefined;
      seen.add(value);
    }
    return value;
  });
}

function validateSnapshot(snap) {
  if (!isPlainObject(snap)) return null;
  const clean = {};
  let count = 0;
  for (const [k, v] of Object.entries(snap)) {
    if (count >= 16) break;
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    const safeKey = sanitizeReferralCode(k) || sanitizeText(k, 32);
    if (!safeKey) continue;
    if (typeof v === 'number') {
      clean[safeKey] = Number.isFinite(v) ? v : 0;
    } else if (typeof v === 'boolean') {
      clean[safeKey] = v;
    } else if (typeof v === 'string') {
      clean[safeKey] = sanitizeText(v, 80);
    }
    count++;
  }
  return clean;
}

export function validateBySchema(key, raw) {
  if (!ALLOWED_KEYS.has(key)) return null;

  switch (key) {
    case 'CUSTOM_RATES': {
      if (!isPlainObject(raw)) return null;
      const clean = {};
      for (const [k, v] of Object.entries(raw)) {
        if (!RATE_KEY_RE.test(k)) continue;
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0.1 && n <= 25) {
          clean[k] = Number(n.toFixed(2));
        }
      }
      return clean;
    }

    case 'CUSTOM_REFERRAL_CODES': {
      if (!isPlainObject(raw)) return null;
      const clean = {};
      for (const [bankId, code] of Object.entries(raw)) {
        if (!ALLOWED_BANKS.has(bankId)) continue;
        const sanitized = sanitizeReferralCode(code);
        if (sanitized.length >= 2) {
          clean[bankId] = sanitized;
        }
      }
      return clean;
    }

    case 'PLANNER_STATE': {
      if (!isPlainObject(raw)) return null;
      return {
        inputMode: raw.inputMode === 'advanced' ? 'advanced' : 'basic',
        goalType: raw.goalType === 'TARGET_AMOUNT' ? 'TARGET_AMOUNT' : 'PASSIVE_INCOME',
        target: clampNum(raw.target, 10_000_000, 100_000, 1_000_000_000),
        targetAmount: clampNum(raw.targetAmount, 500_000_000, 1_000_000, 500_000_000_000),
        solveMode: raw.solveMode === 'SAVING' ? 'SAVING' : 'TIME',
        targetYears: Math.round(clampNum(raw.targetYears, 5, 1, 50)),
        capital: clampNum(raw.capital, 50_000_000, 0, 100_000_000_000),
        saving: clampNum(raw.saving, 5_000_000, 0, 1_000_000_000),
        salaryFullTime: clampNum(raw.salaryFullTime ?? raw.salary, 25_000_000, 0, 10_000_000_000),
        freelanceIncomeMin: clampNum(raw.freelanceIncomeMin, 0, 0, 10_000_000_000),
        freelanceIncomeMax: clampNum(raw.freelanceIncomeMax, 0, 0, 10_000_000_000),
        investIncomeMin: clampNum(raw.investIncomeMin, 0, 0, 10_000_000_000),
        investIncomeMax: clampNum(raw.investIncomeMax, 0, 0, 10_000_000_000),
        salary: clampNum(raw.salary, 25_000_000, 0, 30_000_000_000),
        bankId: ALLOWED_BANKS.has(raw.bankId) ? raw.bankId : 'cake',
        tenure: ALLOWED_TENURES.has(raw.tenure) ? raw.tenure : '12M',
        customRate:
          raw.customRate === '' || raw.customRate === undefined || raw.customRate === null
            ? ''
            : clampNum(raw.customRate, '', 0.1, 25),
        calcMode: raw.calcMode === 'ACTUAL_DAYS' ? 'ACTUAL_DAYS' : 'NOMINAL_MONTHS',
        annualStepUpPct: clampNum(raw.annualStepUpPct, 0, 0, 50),
        annualBonusAmount: clampNum(raw.annualBonusAmount, 0, 0, 5_000_000_000),
        inflationRatePct: clampNum(raw.inflationRatePct, 0, 0, 20),
        householdMode: ['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(raw.householdMode)
          ? raw.householdMode
          : 'INDIVIDUAL',
        dependentsCount: Math.round(clampNum(raw.dependentsCount, 0, 0, 10)),
        partnerSalaryFullTime: clampNum(raw.partnerSalaryFullTime, 0, 0, 10_000_000_000),
        partnerFreelanceMin: clampNum(raw.partnerFreelanceMin, 0, 0, 10_000_000_000),
        partnerFreelanceMax: clampNum(raw.partnerFreelanceMax, 0, 0, 10_000_000_000),
        partnerInvestMin: clampNum(raw.partnerInvestMin, 0, 0, 10_000_000_000),
        partnerInvestMax: clampNum(raw.partnerInvestMax, 0, 0, 10_000_000_000),
        monthlyFixedExpense: clampNum(raw.monthlyFixedExpense, 12_000_000, 0, 10_000_000_000),
        monthlyDependentsCost: clampNum(raw.monthlyDependentsCost, 0, 0, 10_000_000_000),
        contributionRule: ['PROPORTIONAL', 'SPLIT_50_50', 'CUSTOM'].includes(raw.contributionRule)
          ? raw.contributionRule
          : 'PROPORTIONAL',
        earner1SharePct: Math.round(clampNum(raw.earner1SharePct, 50, 0, 100)),
        prioritizeEmergencyFund: Boolean(raw.prioritizeEmergencyFund),
        emergencyFundMonths: Math.round(clampNum(raw.emergencyFundMonths, 0, 0, 18)),
      };
    }

    case 'USER_FEEDBACK_LOG': {
      if (!Array.isArray(raw)) return null;
      const clean = [];
      for (const item of raw.slice(0, 200)) {
        if (!isPlainObject(item)) continue;
        const rating = Math.round(clampNum(item.rating, 0, 1, 5));
        if (rating < 1 || rating > 5) continue;
        const cleanTags = Array.isArray(item.tags)
          ? item.tags
              .slice(0, 10)
              .map((t) => sanitizeText(t, 60))
              .filter(Boolean)
          : [];
        clean.push({
          id: sanitizeText(item.id || `${Date.now()}`, 40),
          tool: sanitizeText(item.tool || 'plan', 32),
          toolLabel: sanitizeText(item.toolLabel || 'VnSavingPro', 100),
          rating,
          tags: cleanTags,
          comment: sanitizeText(item.comment || '', 800),
          contributorName: sanitizeText(item.contributorName || '', 60),
          contributorUrl: item.contributorUrl ? safeExternalUrl(item.contributorUrl) : '',
          showPublicly: Boolean(item.showPublicly),
          snapshot: validateSnapshot(item.snapshot),
          createdAt: sanitizeText(item.createdAt || new Date().toISOString(), 40),
        });
      }
      return clean;
    }

    case 'CALC_HISTORY_LOG': {
      if (!Array.isArray(raw)) return null;
      const validTools = new Set(['plan', 'calculator', 'ladder', 'career', 'inflation', 'fx', 'salary', 'cic']);
      const validModes = new Set(['INDIVIDUAL', 'COUPLE', 'FAMILY']);
      const validTones = new Set(['default', 'emerald', 'indigo', 'amber']);
      return raw
        .filter((item) => isPlainObject(item) && validTools.has(item.tool))
        .slice(0, 40)
        .map((item) => ({
          id: sanitizeText(item.id || item.clientRunId, 64) || `run_${Date.now().toString(36)}`,
          clientRunId: sanitizeText(item.clientRunId || item.id, 64),
          tool: item.tool,
          title: sanitizeText(item.title, 140),
          householdMode: validModes.has(item.householdMode) ? item.householdMode : 'INDIVIDUAL',
          summary: sanitizeText(item.summary, 240),
          metrics: Array.isArray(item.metrics)
            ? item.metrics
                .filter((m) => isPlainObject(m))
                .slice(0, 6)
                .map((m) => ({
                  label: sanitizeText(m.label, 60),
                  value: sanitizeText(m.value, 60),
                  tone: validTones.has(m.tone) ? m.tone : 'default',
                }))
            : [],
          inputs: isPlainObject(item.inputs) ? item.inputs : {},
          createdAt: sanitizeText(item.createdAt, 40) || new Date().toISOString(),
        }));
    }

    case 'TOOL_RESTORE_STATE': {
      if (!isPlainObject(raw)) return null;
      const validTools = new Set(['plan', 'calculator', 'ladder', 'career', 'inflation', 'fx', 'salary', 'cic']);
      if (!validTools.has(raw.tool) || !isPlainObject(raw.inputs)) return null;
      return {
        tool: raw.tool,
        inputs: raw.inputs,
        restoredAt: sanitizeText(raw.restoredAt, 40) || new Date().toISOString(),
      };
    }

    case 'ONBOARDING_STATE': {
      if (!isPlainObject(raw)) return null;
      const validModes = new Set(['INDIVIDUAL', 'COUPLE', 'FAMILY']);
      const validGoals = new Set(['PASSIVE_INCOME', 'TARGET_AMOUNT', 'RATES_COMPARE', 'FX_MANAGER', 'SALARY_2026']);
      return {
        completed: Boolean(raw.completed),
        dismissed: Boolean(raw.dismissed),
        householdMode: validModes.has(raw.householdMode) ? raw.householdMode : 'INDIVIDUAL',
        goalFocus: validGoals.has(raw.goalFocus) ? raw.goalFocus : 'PASSIVE_INCOME',
        completedAt: sanitizeText(raw.completedAt || new Date().toISOString(), 40),
      };
    }

    case 'FX_PORTFOLIO_STATE': {
      if (!isPlainObject(raw)) return null;
      const cleanHoldings = Array.isArray(raw.holdings)
        ? raw.holdings
            .filter((h) => isPlainObject(h) && /^[A-Z]{3}$/.test(String(h.code || '').toUpperCase()))
            .slice(0, 20)
            .map((h) => ({
              code: String(h.code).toUpperCase(),
              amount: clampNum(h.amount, 0, 0, 100_000_000_000),
              note: sanitizeText(h.note || '', 60),
            }))
        : [];
      const cleanTargets = Array.isArray(raw.targetRates)
        ? raw.targetRates
            .filter((t) => isPlainObject(t) && /^[A-Z]{3}$/.test(String(t.code || '').toUpperCase()))
            .slice(0, 12)
            .map((t) => ({
              code: String(t.code).toUpperCase(),
              targetRate: clampNum(t.targetRate, 0, 0, 10_000_000),
              direction: t.direction === 'below' ? 'below' : 'above',
            }))
        : [];
      return {
        convertFrom: /^[A-Z]{3}$/.test(String(raw.convertFrom || '')) ? String(raw.convertFrom) : 'USD',
        convertTo: /^[A-Z]{3}$/.test(String(raw.convertTo || '')) ? String(raw.convertTo) : 'VND',
        convertAmount: clampNum(raw.convertAmount, 1000, 0, 100_000_000_000),
        rateType: raw.rateType === 'cash' ? 'cash' : 'transfer',
        benchmarkVndRate: clampNum(raw.benchmarkVndRate, 6.9, 0, 25),
        holdings: cleanHoldings,
        targetRates: cleanTargets,
      };
    }

    case 'SALARY_STATE': {
      if (!isPlainObject(raw)) return null;
      return {
        mode: raw.mode === 'NET_TO_GROSS' ? 'NET_TO_GROSS' : 'GROSS_TO_NET',
        amount: clampNum(raw.amount, 30_000_000, 0, 10_000_000_000),
        partnerAmount: clampNum(raw.partnerAmount, 0, 0, 10_000_000_000),
        householdMode: ['INDIVIDUAL', 'COUPLE', 'FAMILY'].includes(raw.householdMode)
          ? raw.householdMode
          : 'INDIVIDUAL',
        region: [1, 2, 3, 4].includes(Number(raw.region)) ? Number(raw.region) : 1,
        dependents: Math.round(clampNum(raw.dependents, 0, 0, 20)),
        regime: ['2026_H2', '2027', '2025'].includes(raw.regime) ? raw.regime : '2026_H2',
        insuranceBaseMode: ['FULL', 'MIN_WAGE', 'CUSTOM'].includes(raw.insuranceBaseMode)
          ? raw.insuranceBaseMode
          : 'FULL',
        customInsuranceBase: clampNum(raw.customInsuranceBase, 15_000_000, 0, 10_000_000_000),
        taxExemptAllowance: clampNum(raw.taxExemptAllowance, 0, 0, 500_000_000),
        includeUnionFee: Boolean(raw.includeUnionFee),
      };
    }

    case 'ACTIVE_PASSBOOKS_STATE': {
      if (!Array.isArray(raw)) return null;
      const validOwners = new Set(['SELF', 'PARTNER', 'JOINT']);
      const validTags = new Set(['EMERGENCY', 'GOAL']);
      const validRenew = new Set(['PRINCIPAL_AND_INTEREST', 'PRINCIPAL_ONLY', 'CLOSE']);
      const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
      return raw
        .filter((item) => isPlainObject(item))
        .slice(0, 30)
        .map((item, idx) => ({
          id: sanitizeReferralCode(item.id || '') || `pb_${idx}_${Date.now().toString(36)}`,
          bankId: ALLOWED_BANKS.has(item.bankId) ? item.bankId : 'cake',
          label: sanitizeText(item.label || 'Sổ tiết kiệm', 80),
          owner: validOwners.has(item.owner) ? item.owner : 'SELF',
          fundTag: validTags.has(item.fundTag) ? item.fundTag : 'GOAL',
          principal: clampNum(item.principal, 10_000_000, 50_000, 500_000_000_000),
          ratePct: clampNum(item.ratePct, 6.9, 0.1, 25),
          tenureMonths: Math.round(clampNum(item.tenureMonths, 12, 1, 36)),
          openDate: DATE_RE.test(String(item.openDate || '')) ? String(item.openDate) : '2026-10-01',
          renewMode: validRenew.has(item.renewMode) ? item.renewMode : 'PRINCIPAL_AND_INTEREST',
        }));
    }

    case 'CIC_LOAN_STATE': {
      if (!isPlainObject(raw)) return null;
      return {
        debtGroup: Math.round(clampNum(raw.debtGroup, 1, 1, 5)),
        lateCount24m: Math.round(clampNum(raw.lateCount24m, 0, 0, 24)),
        monthlyNetIncome: clampNum(raw.monthlyNetIncome, 28_000_000, 1_000_000, 10_000_000_000),
        existingMonthlyDebtPayment: clampNum(raw.existingMonthlyDebtPayment, 3_000_000, 0, 5_000_000_000),
        creditCardLimit: clampNum(raw.creditCardLimit, 50_000_000, 0, 10_000_000_000),
        creditCardBalance: clampNum(raw.creditCardBalance, 10_000_000, 0, 10_000_000_000),
        creditAgeYears: clampNum(raw.creditAgeYears, 3, 0, 50),
        newInquiries6m: Math.round(clampNum(raw.newInquiries6m, 1, 0, 20)),
        hasCreditCard: raw.hasCreditCard !== false,
        hasSecuredLoan: Boolean(raw.hasSecuredLoan),
        hasConsumerCashLoan: Boolean(raw.hasConsumerCashLoan),
        hasSavingsCollateral: raw.hasSavingsCollateral !== false,
        passbookPrincipal: clampNum(raw.passbookPrincipal, 200_000_000, 1_000_000, 500_000_000_000),
        passbookRatePct: clampNum(raw.passbookRatePct, 8.6, 0.5, 20),
        passbookTenureMonths: Math.round(clampNum(raw.passbookTenureMonths, 12, 1, 36)),
        monthsAlreadyHeld: clampNum(raw.monthsAlreadyHeld, 8, 0, 35),
        urgentCashNeeded: clampNum(raw.urgentCashNeeded, 40_000_000, 1_000_000, 500_000_000_000),
        urgentDaysNeeded: Math.round(clampNum(raw.urgentDaysNeeded, 45, 7, 365)),
        pledgeSpreadPct: clampNum(raw.pledgeSpreadPct, 1.8, 0.5, 10),
        assetPrice: clampNum(raw.assetPrice, 2_400_000_000, 50_000_000, 500_000_000_000),
        downPayment: clampNum(raw.downPayment, 720_000_000, 0, 500_000_000_000),
        preferentialRatePct: clampNum(raw.preferentialRatePct, 6.8, 0.5, 25),
        preferentialMonths: Math.round(clampNum(raw.preferentialMonths, 24, 3, 120)),
        floatingRatePct: clampNum(raw.floatingRatePct, 10.5, 1, 30),
        loanYears: Math.round(clampNum(raw.loanYears, 20, 1, 35)),
        repaymentMethod: raw.repaymentMethod === 'ANNUITY' ? 'ANNUITY' : 'DECLINING_BALANCE',
        annualPrepaymentAmount: clampNum(raw.annualPrepaymentAmount, 50_000_000, 0, 50_000_000_000),
        earlyRepayPenaltyPct: clampNum(raw.earlyRepayPenaltyPct, 1.5, 0, 10),
        currentMonthlyRent: clampNum(raw.currentMonthlyRent, 12_000_000, 0, 500_000_000),
        rentGrowthPct: clampNum(raw.rentGrowthPct, 3.5, 0, 20),
        assetAppreciationPct: clampNum(raw.assetAppreciationPct, 5.5, -10, 30),
        savingsYieldPct: clampNum(raw.savingsYieldPct, 8.6, 0.5, 20),
        compareHorizonYears: Math.round(clampNum(raw.compareHorizonYears, 5, 1, 20)),
      };
    }

    case 'WEALTH_TREES_STATE': {
      if (!Array.isArray(raw)) return null;
      const validSpecies = new Set([
        'sen_dong_thap',
        'quat_tu_lien',
        'thanh_long',
        'dao_nhat_tan',
        'dua_xiem_ben_tre',
        'ca_phe',
        'vai_thieu_luc_ngan',
        'xoai_hoa_loc',
        'vusua_lo_ren',
        'buoi_da_xanh',
        'sau_rieng_ri6',
        'che_shan_tuyet',
        'tre_nga_thanh_giong',
        'mai_tram_huong',
      ]);
      const validModes = new Set(['INDIVIDUAL', 'COUPLE', 'FAMILY']);
      const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
      return raw
        .filter((item) => isPlainObject(item))
        .slice(0, 30)
        .map((item, idx) => ({
          id: sanitizeReferralCode(item.id || '') || `tree_${idx}_${Date.now().toString(36)}`,
          title: sanitizeText(item.title || 'Kế hoạch gieo mầm', 100),
          speciesId: validSpecies.has(item.speciesId) ? item.speciesId : 'xoai_hoa_loc',
          householdMode: validModes.has(item.householdMode) ? item.householdMode : 'INDIVIDUAL',
          targetCapital: clampNum(item.targetCapital, 500_000_000, 1_000_000, 500_000_000_000),
          initialCapital: clampNum(item.initialCapital, 50_000_000, 0, 500_000_000_000),
          monthlyPlanned: clampNum(item.monthlyPlanned, 10_000_000, 100_000, 10_000_000_000),
          expectedYears: clampNum(item.expectedYears, 4, 0.5, 40),
          createdAt: DATE_RE.test(String(item.createdAt || '')) ? String(item.createdAt) : new Date().toISOString().slice(0, 10),
          mysteryUnlocked: Boolean(item.mysteryUnlocked),
          mysteryFruitId: sanitizeReferralCode(item.mysteryFruitId || ''),
          isDummy: Boolean(item.isDummy),
          plotIndex:
            Number.isInteger(Number(item.plotIndex)) && Number(item.plotIndex) >= 0 && Number(item.plotIndex) <= 11
              ? Number(item.plotIndex)
              : idx % 12,
          checkIns: Array.isArray(item.checkIns)
            ? item.checkIns
                .filter((c) => isPlainObject(c))
                .slice(0, 60)
                .map((c, cIdx) => ({
                  id: sanitizeReferralCode(c.id || '') || `chk_${cIdx}_${Date.now().toString(36)}`,
                  amount: clampNum(c.amount, 5_000_000, 50_000, 100_000_000_000),
                  date: DATE_RE.test(String(c.date || '')) ? String(c.date) : new Date().toISOString().slice(0, 10),
                  bankId: ALLOWED_BANKS.has(c.bankId) ? c.bankId : 'cake',
                  proofCode: sanitizeText(c.proofCode || '', 48),
                  verified: c.verified !== false,
                  isOverTarget: Boolean(c.isOverTarget),
                }))
            : [],
        }));
    }

    default:
      return null;
  }
}

export function auditAndCleanStorage() {
  const storage = getStorage();
  if (!storage) return 0;

  let removed = 0;
  try {
    const keys = Object.keys(storage);
    const floodDetected = keys.length > MAX_TOTAL_STORAGE_KEYS;

    for (const fullKey of keys) {
      if (fullKey === ENTROPY_KEY) continue;
      if (fullKey.startsWith(STORAGE_KEY_PREFIX)) {
        const shortKey = fullKey.slice(STORAGE_KEY_PREFIX.length);
        const val = storage.getItem(fullKey);
        if (!ALLOWED_KEYS.has(shortKey) || typeof val !== 'string' || val.length > MAX_PAYLOAD_CHARS) {
          storage.removeItem(fullKey);
          removed++;
          continue;
        }
        const decoded = unsealPayload(val);
        if (decoded === null || validateBySchema(shortKey, decoded) === null) {
          storage.removeItem(fullKey);
          removed++;
        }
      } else if (floodDetected) {
        storage.removeItem(fullKey);
        removed++;
      }
    }
  } catch {
    // Ignore storage enumeration failure
  }
  return removed;
}

// Run startup storage hygiene immediately
auditAndCleanStorage();

export const cryptoStorage = {
  save: (key, data) => {
    if (!ALLOWED_KEYS.has(key)) return false;
    const storage = getStorage();
    if (!storage) return false;
    try {
      const normalizedJson = safeStringify(data);
      if (typeof normalizedJson !== 'string') return false;
      const parsedSafe = JSON.parse(normalizedJson);
      const validated = validateBySchema(key, parsedSafe);
      if (validated === null) return false;

      const finalJson = safeStringify(validated);
      if (!finalJson || finalJson.length > MAX_PAYLOAD_CHARS) return false;
      const sealed = sealPayload(finalJson);
      if (sealed.length > MAX_PAYLOAD_CHARS) return false;

      storage.setItem(`${STORAGE_KEY_PREFIX}${key}`, sealed);
      return true;
    } catch {
      return false;
    }
  },

  load: (key, defaultValue = null) => {
    if (!ALLOWED_KEYS.has(key)) return cloneDefault(defaultValue);
    const storage = getStorage();
    if (!storage) return cloneDefault(defaultValue);
    const fullKey = `${STORAGE_KEY_PREFIX}${key}`;
    try {
      const raw = storage.getItem(fullKey);
      if (!raw) return cloneDefault(defaultValue);

      const unsealed = unsealPayload(raw);
      if (unsealed === null) {
        storage.removeItem(fullKey);
        return cloneDefault(defaultValue);
      }

      const validated = validateBySchema(key, unsealed);
      if (validated === null) {
        storage.removeItem(fullKey);
        return cloneDefault(defaultValue);
      }
      return validated;
    } catch {
      try {
        storage.removeItem(fullKey);
      } catch {
        // Ignore cleanup failure
      }
      return cloneDefault(defaultValue);
    }
  },

  remove: (key) => {
    const storage = getStorage();
    if (!storage || !ALLOWED_KEYS.has(key)) return;
    storage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
  },

  clearAll: () => {
    const storage = getStorage();
    if (!storage) return;
    Object.keys(storage).forEach((k) => {
      if (k.startsWith(STORAGE_KEY_PREFIX) || k === ENTROPY_KEY) {
        storage.removeItem(k);
      }
    });
  },

  auditAndClean: auditAndCleanStorage,
};
