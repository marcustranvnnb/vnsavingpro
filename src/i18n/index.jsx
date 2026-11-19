import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCookie, PREFS_COOKIE, syncUserPrefCookie } from '../utils/cookieManager.js';
import { formatTenure as formatTenureByLang, setFormatLang } from '../utils/format.js';

export const LANG_STORAGE_KEY = 'vnsaving_lang';

export const SUPPORTED_LANGS = [
  { code: 'vi', short: 'VI', label: 'Tiếng Việt', nativeLabel: 'Tiếng Việt' },
  { code: 'en', short: 'EN', label: 'English', nativeLabel: 'English' },
  { code: 'ja', short: 'JA', label: '日本語', nativeLabel: '日本語' },
];

export function normalizeLang(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'en' || v.startsWith('en-')) return 'en';
  if (v === 'ja' || v.startsWith('ja-')) return 'ja';
  return 'vi';
}

export function detectInitialLang() {
  if (typeof window !== 'undefined') {
    try {
      const urlLang = new URLSearchParams(window.location.search).get('lang');
      if (urlLang && ['vi', 'en', 'ja'].includes(urlLang.trim().toLowerCase())) {
        return urlLang.trim().toLowerCase();
      }
    } catch {
      // Ignore query parse error
    }
    try {
      const stored = window.localStorage?.getItem(LANG_STORAGE_KEY);
      if (stored === 'vi' || stored === 'en' || stored === 'ja') return stored;
    } catch {
      // Ignore localStorage error
    }
  }
  try {
    const rawCookie = getCookie(PREFS_COOKIE);
    if (rawCookie) {
      const parsed = JSON.parse(rawCookie);
      if (parsed?.lang === 'vi' || parsed?.lang === 'en' || parsed?.lang === 'ja') {
        return parsed.lang;
      }
    }
  } catch {
    // Ignore cookie parse error
  }
  return 'vi';
}

export const BANK_I18N = {
  cake: {
    en: {
      fullName: 'CakeBank Digital Bank (by VPBank)',
      rateTierNote: 'Standard 6.90% (21/10/2026) · Bonus up to +2.2% (max 9.1%/yr)',
      notes: 'Standard 6–24M deposits earn 6.90%/yr; Accumulative up to 6.70%. Supports partial principal withdrawal without losing interest on the remaining balance.',
    },
    ja: {
      fullName: 'CakeBank デジタルバンク (by VPBank)',
      rateTierNote: '通常 6.90% (21/10/2026) · 特典上乗せ最大 +2.2%（上限 9.1%/年）',
      notes: '6〜24ヶ月定期は年6.90%、積立定期は最大6.70%。一部解約しても残高の定期金利が維持されます。',
    },
  },
  timo: {
    en: {
      fullName: 'Timo Digital Bank (by BVBank)',
      rateTierNote: 'SBV cap compliant 4.75% (<6M) · Privilege tiers up to 8.20%/yr',
      notes: 'Smart passbook auto-splitting (splits into 4 passbooks automatically) and Goal Save jars.',
    },
    ja: {
      fullName: 'Timo デジタルバンク (by BVBank)',
      rateTierNote: '中銀上限準拠 4.75%（6ヶ月未満） · 特別優遇プラン最大 8.20%/年',
      notes: '定期預金の自動4分割機能と目的別貯蓄（Goal Save）に対応しています。',
    },
  },
  liobank: {
    en: {
      fullName: 'LioBank Digital Bank (by OCB)',
      rateTierNote: 'Default tariff (11/11/2026) · Promo bonus up to 8.20%/yr',
      notes: 'Default 12M rate 6.20%/yr; promotional rate boost up to 8.20%/yr (Pigg savings jar 4.75%).',
    },
    ja: {
      fullName: 'LioBank デジタルバンク (by OCB)',
      rateTierNote: '基本金利表 (11/11/2026) · キャンペーン上乗せ最大 8.20%/年',
      notes: '12ヶ月基本金利は年6.20%、金利上乗せキャンペーン利用で最大年8.20%（Pigg貯金箱は4.75%）。',
    },
  },
  tnex: {
    en: {
      fullName: 'TNEX Digital Bank (by MSB)',
      rateTierNote: 'Top promotional rates on 6–12M tenures (including +1.6% promo boost)',
      notes: 'Leading 12M+ rate up to 8.60%/yr and 6M up to 8.40%/yr (with promotional boost), fast 100% online opening.',
    },
    ja: {
      fullName: 'TNEX デジタルバンク (by MSB)',
      rateTierNote: '6〜12ヶ月でトップクラスの優遇金利（+1.6%キャンペーン込み）',
      notes: '12ヶ月以上は最大年8.60%、6ヶ月は最大年8.40%（特典込み）。オンライン完結でスピーディーに開設可能。',
    },
  },
};

export function getBankCopy(bank, lang = 'vi') {
  if (!bank) return { fullName: '', rateTierNote: '', notes: '' };
  if (lang === 'en' || lang === 'ja') {
    const t = BANK_I18N[bank.id]?.[lang];
    if (t) return t;
  }
  return {
    fullName: bank.fullName || bank.name,
    rateTierNote: bank.rateTierNote || '',
    notes: bank.notes || '',
  };
}

const I18nCtx = createContext({
  lang: 'vi',
  setLang: () => {},
  tx: (vi) => vi,
  formatTenure: (code) => formatTenureByLang(code, 'vi'),
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const initial = detectInitialLang();
    setFormatLang(initial);
    return initial;
  });

  const setLang = useCallback((next) => {
    const clean = normalizeLang(next);
    setFormatLang(clean);
    setLangState(clean);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem(LANG_STORAGE_KEY, clean);
      } catch {
        // Ignore storage restriction
      }
      syncUserPrefCookie({ lang: clean });
    }
  }, []);

  // Keep format.js synchronously in sync before child render
  setFormatLang(lang);

  useEffect(() => {
    setFormatLang(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem(LANG_STORAGE_KEY, lang);
      } catch {
        // Ignore storage error
      }
      syncUserPrefCookie({ lang });
    }
  }, [lang]);

  const value = useMemo(() => {
    const tx = (vi, en, ja) => {
      if (lang === 'en') return en !== undefined ? en : vi;
      if (lang === 'ja') return ja !== undefined ? ja : en !== undefined ? en : vi;
      return vi;
    };
    const formatTenure = (code) => formatTenureByLang(code, lang);
    return { lang, setLang, tx, formatTenure };
  }, [lang, setLang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
