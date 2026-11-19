import { Target, BarChart3, Calculator, Layers, Briefcase, TrendingDown, Gift } from 'lucide-react';
import versionInfo from './version.json';

export const APP_VERSION = versionInfo.displayVersion;
export const APP_VERSION_RAW = versionInfo.version;
export const APP_VERSION_DATE = versionInfo.releaseDate;
export const APP_VERSION_LABEL = versionInfo.label;

export const VERSION_HIGHLIGHTS = [
  {
    version: 'v1.7.0.0',
    date: '19/11/2026',
    title: 'Đa ngôn ngữ Việt · Anh · Nhật (VI · EN · JA)',
    items: [
      'Bổ sung chuyển đổi nhanh 3 ngôn ngữ Tiếng Việt, English và 日本語 trên thanh điều hướng, chân trang và menu di động.',
      'Bản địa hoá đồng bộ từ giao diện, định dạng số/tiền tệ (tỷ/triệu · B/M/K · 億/万), kỳ hạn, điểm khả thi phía Server API cho tới báo cáo Google Docs & CSV.',
    ],
  },
  {
    version: 'v1.6.0.0',
    date: '19/11/2026',
    title: 'Làm mới Trang chủ, tối ưu Responsive Mobile/Tablet/PC & Chuẩn phiên bản 4 số',
    items: [
      'Cập nhật Trang chủ với bộ chọn Cá nhân / Cặp đôi / Gia đình ngay trên Ước tính nhanh, thẻ giới thiệu 3 mô hình tài chính và thông tin đồng bộ Cloud & Google.',
      'Tối ưu UI/UX Responsive toàn trang cho Mobile, Tablet và PC/Desktop (thanh chạm mượt, bảng không tràn ngang, sticky bar không che footer).',
      'Chuẩn hoá quản lý phiên bản 4 chữ số (v1.6.0.0) và tự động tăng build sau mỗi lần cập nhật nhỏ.',
    ],
  },
  {
    version: 'v1.5.5',
    date: '19/11/2026',
    title: 'Tài chính Cá nhân / Cặp đôi / Gia đình, Google OAuth & Supabase Cloud',
    items: [
      'Hỗ trợ 3 mô hình tài chính (Cá nhân, Cặp đôi, Gia đình) với lấp Quỹ dự phòng trước (Fund-First), chia đóng góp 2 người và Stress-test thu nhập.',
      'Đăng nhập Google OAuth / Email + Hồ sơ cá nhân + lưu nhiều kịch bản tiết kiệm trên Supabase Cloud.',
      'Kích hoạt bảo vệ hạn mức Free-Tier Quota Guard & cảnh báo Resend Email tự động.',
    ],
  },
  {
    version: 'v1.5.2',
    date: '18/11/2026',
    title: 'Đồng bộ tự động lãi suất 4 Ngân hàng số hằng ngày (09:00 AM)',
    items: [
      'Scraper chuyên biệt cho Cake by VPBank (Tiêu chuẩn & Tích lũy), LioBank (biểu lãi suất mặc định + tự động phát hiện PDF CTKM mới nhất), TIMO và TNEX.',
      'Hiển thị trực tiếp phiên bản web tool & nhật ký cập nhật ngay trên thanh điều hướng và chân trang.',
    ],
  },
  {
    version: 'v1.4.0',
    date: '17/11/2026',
    title: 'Chế độ Cơ bản / Nâng cao, Google Docs & Đánh giá kết quả',
    items: [
      'Tách giao diện nhập liệu thành 2 chế độ: Cơ bản (gọn nhanh) và Nâng cao (lạm phát, gửi bù hàng tháng).',
      'Xuất báo cáo trực tiếp sang Google Docs (hoặc tải file .doc / .html) và sao lưu đánh giá, góp ý JSON/CSV.',
    ],
  },
  {
    version: 'v1.3.0',
    date: '16/11/2026',
    title: 'Kiến trúc Tier 1 Serverless & Bảo mật thuật toán',
    items: [
      'Chuyển toàn bộ công thức tính tích lũy, điểm khả thi (Feasibility Score) và tối ưu phân bổ ngân hàng lên Vercel Serverless API (/api/calculate).',
      'Tự động đồng bộ lãi suất qua API /api/rates kèm cache server 24h.',
    ],
  },
];

export const HOME_PAGE = {
  id: 'home',
  path: '/',
  aliases: ['/trang-chu'],
  label: 'Trang chủ',
  pageTitle: 'VnSavingPro — Lập Kế Hoạch Thu Nhập Thụ Động & So Sánh Lãi Suất Ngân Hàng Số 2026',
};

export const ALL_TOOLS = [
  {
    id: 'plan',
    path: '/plan',
    aliases: ['/ke-hoach', '/thu-nhap-thu-dong'],
    pageTitle: 'Kế Hoạch Thu Nhập Thụ Động — VnSavingPro',
    label: 'Thu nhập thụ động',
    short: 'Kế hoạch',
    desc: 'Lập lộ trình thu nhập thụ động hoặc mục tiêu tài sản cho Cá nhân, Cặp đôi & Gia đình, kèm Quỹ dự phòng và Stress-test.',
    icon: Target,
    primary: true,
  },
  {
    id: 'rates',
    path: '/rates',
    aliases: ['/lai-suat', '/so-sanh-lai-suat'],
    pageTitle: 'So Sánh Lãi Suất Ngân Hàng Số — VnSavingPro',
    label: 'So sánh lãi suất',
    short: 'Lãi suất',
    desc: 'Lãi suất mới nhất của TNEX, LioBank, Cake và Timo theo từng kỳ hạn.',
    icon: BarChart3,
    primary: true,
  },
  {
    id: 'calculator',
    path: '/calculator',
    aliases: ['/tinh-lai', '/tinh-lai-tiet-kiem'],
    pageTitle: 'Tính Lãi Tiết Kiệm Chuẩn TT14 NHNN — VnSavingPro',
    label: 'Tính lãi tiết kiệm',
    short: 'Tính lãi',
    desc: 'So sánh 3 cách tính lãi: ngày thực tế, tháng tròn và lãi kép.',
    icon: Calculator,
    primary: true,
  },
  {
    id: 'ladder',
    path: '/ladder',
    aliases: ['/bac-thang', '/tiet-kiem-bac-thang'],
    pageTitle: 'Tiết Kiệm Bậc Thang — VnSavingPro',
    label: 'Tiết kiệm bậc thang',
    short: 'Bậc thang',
    desc: 'Chia tiền gửi bậc thang nhiều kỳ hạn, theo dõi mức phủ Quỹ dự phòng 1T–3T và chia khoản góp 2 người.',
    icon: Layers,
    primary: true,
  },
  {
    id: 'career',
    path: '/career',
    aliases: ['/tang-luong', '/lo-trinh-tang-luong'],
    pageTitle: 'Lộ Trình Tăng Lương & Tự Do Tài Chính — VnSavingPro',
    label: 'Lộ trình tăng lương',
    short: 'Tăng lương',
    desc: 'Mô phỏng tác động tăng lương & nhảy việc cho 1 hoặc 2 người đi làm để rút ngắn thời gian tự do tài chính.',
    icon: Briefcase,
  },
  {
    id: 'inflation',
    path: '/inflation',
    aliases: ['/lam-phat', '/lam-phat-suc-mua'],
    pageTitle: 'Lạm Phát & Sức Mua Thực Tế — VnSavingPro',
    label: 'Lạm phát & sức mua',
    short: 'Lạm phát',
    desc: 'Lãi suất thực sau lạm phát và sức mua của khoản thu nhập thụ động theo thời gian.',
    icon: TrendingDown,
  },
  {
    id: 'referral',
    path: '/referral',
    aliases: ['/uu-dai', '/uu-dai-mo-tai-khoan'],
    pageTitle: 'Ưu Đãi Mở Tài Khoản Ngân Hàng Số — VnSavingPro',
    label: 'Ưu đãi mở tài khoản',
    short: 'Ưu đãi',
    desc: 'Mã giới thiệu và quà tặng khi mở tài khoản ngân hàng số.',
    icon: Gift,
    hidden: true,
  },
];

export const TOOLS = ALL_TOOLS.filter((t) => !t.hidden);

export const EXTRA_ROUTES = [
  {
    id: 'auth',
    path: '/auth',
    aliases: ['/login', '/dang-nhap', '/register', '/dang-ky'],
    pageTitle: 'Đăng nhập & Tài khoản — VnSavingPro',
  },
  {
    id: 'profile',
    path: '/profile',
    aliases: ['/ho-so', '/tai-khoan', '/account'],
    pageTitle: 'Hồ sơ cá nhân — VnSavingPro',
  },
];

const ROUTE_LOOKUP = [...TOOLS, ...EXTRA_ROUTES];

export const toolById = (id) => ROUTE_LOOKUP.find((t) => t.id === id);

/** Normalize URL pathname (leading slash, no trailing slash except root `/`). */
export function normalizePath(p = '/') {
  if (!p || typeof p !== 'string') return '/';
  const trimmed = p.trim();
  if (!trimmed || trimmed === '/') return '/';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const clean = withSlash.replace(/\/+$/, '');
  return (clean || '/').toLowerCase();
}

/** Resolve URL pathname (`/`, `/plan`, `/ke-hoach`, ...) to an internal route ID. */
export function resolveRouteId(pathname = '/') {
  const normalized = normalizePath(pathname);
  if (
    normalized === '/' ||
    normalized === normalizePath(HOME_PAGE.path) ||
    HOME_PAGE.aliases?.some((a) => normalizePath(a) === normalized)
  ) {
    return HOME_PAGE.id;
  }
  const matched = ROUTE_LOOKUP.find(
    (t) =>
      normalizePath(t.path) === normalized ||
      t.aliases?.some((a) => normalizePath(a) === normalized) ||
      `/${t.id}` === normalized
  );
  return matched ? matched.id : HOME_PAGE.id;
}

/** Return the canonical URL path configured for a route ID. */
export function getRoutePath(routeId) {
  if (!routeId || routeId === HOME_PAGE.id) return normalizePath(HOME_PAGE.path);
  const tool = toolById(routeId);
  return tool ? normalizePath(tool.path) : normalizePath(HOME_PAGE.path);
}

/** Return the browser document title configured for a route ID. */
export function getPageTitle(routeId) {
  if (!routeId || routeId === HOME_PAGE.id) return HOME_PAGE.pageTitle;
  return toolById(routeId)?.pageTitle || HOME_PAGE.pageTitle;
}

const TOOL_I18N = {
  plan: {
    en: {
      label: 'Passive Income',
      short: 'Plan',
      pageTitle: 'Passive Income & Household Roadmap — VnSavingPro',
      desc: 'Plan monthly passive income or target capital for Individuals, Couples & Families with Emergency Fund & Stress-tests.',
    },
    ja: {
      label: '不労所得プラン',
      short: 'プラン',
      pageTitle: '不労所得・世帯別ロードマップ — VnSavingPro',
      desc: '個人・カップル・家族向けに目標金額や毎月の不労所得、緊急資金、ストレステストを一括設計します。',
    },
  },
  rates: {
    en: {
      label: 'Bank Rates',
      short: 'Rates',
      pageTitle: 'Vietnam Digital Bank Savings Rates — VnSavingPro',
      desc: 'Daily auto-synced interest rates across TNEX, LioBank, Cake and Timo for every tenure.',
    },
    ja: {
      label: '金利比較',
      short: '金利',
      pageTitle: 'ベトナム主要ネット銀行の金利比較 — VnSavingPro',
      desc: 'TNEX・LioBank・Cake・Timoの最新定期預金金利を期間別に毎日自動同期して比較できます。',
    },
  },
  calculator: {
    en: {
      label: 'Interest Calculator',
      short: 'Calculator',
      pageTitle: 'Savings Interest Calculator (SBV Circ. 14) — VnSavingPro',
      desc: 'Compare 3 calculation methods: Actual Days/365, Nominal Months/12, and Monthly Compounding.',
    },
    ja: {
      label: '利息計算',
      short: '利息計算',
      pageTitle: '預金利息シミュレーター（中銀通達14号準拠） — VnSavingPro',
      desc: '実日数/365日・月割り・毎月複利の3通りの計算方法と一部解約メリットを比較します。',
    },
  },
  ladder: {
    en: {
      label: 'Savings Ladder',
      short: 'Ladder',
      pageTitle: 'Savings Ladder Simulator — VnSavingPro',
      desc: 'Split monthly deposits across tenures, track 1M–3M Emergency Fund liquidity, and split 2-earner contributions.',
    },
    ja: {
      label: 'ラダー貯蓄',
      short: 'ラダー',
      pageTitle: '階段式定期預金（ラダー）シミュレーション — VnSavingPro',
      desc: '毎月の積立を短期・長期に分散し、緊急資金カバー率や2人の拠出配分を最適化します。',
    },
  },
  career: {
    en: {
      label: 'Salary Growth',
      short: 'Career',
      pageTitle: 'Career Raise & Financial Freedom — VnSavingPro',
      desc: 'Simulate how annual raises or job hopping accelerate financial freedom for 1 or 2 earners.',
    },
    ja: {
      label: 'キャリア収入',
      short: '昇給',
      pageTitle: '昇給・転職ロードマップ — VnSavingPro',
      desc: '1人または2人分の昇給・転職シナリオが資産目標達成をどれだけ早めるか試算します。',
    },
  },
  inflation: {
    en: {
      label: 'Inflation & Power',
      short: 'Inflation',
      pageTitle: 'Inflation & Real Purchasing Power — VnSavingPro',
      desc: 'Calculate Fisher real yield after inflation and future purchasing power of passive income.',
    },
    ja: {
      label: 'インフレ実質値',
      short: 'インフレ',
      pageTitle: 'インフレ率と実質購買力 — VnSavingPro',
      desc: 'フィッシャー方程式による実質利回りと将来の不労所得の購買力目減りを試算します。',
    },
  },
};

const EXTRA_TITLE_I18N = {
  home: {
    en: 'VnSavingPro — Vietnam Digital Bank Passive Income Planner & Rate Comparator',
    ja: 'VnSavingPro — ベトナム定期預金・不労所得ロードマップ設計',
  },
  auth: {
    en: 'Sign In & Account — VnSavingPro',
    ja: 'ログイン・新規登録 — VnSavingPro',
  },
  profile: {
    en: 'Profile & Saved Plans — VnSavingPro',
    ja: 'プロフィール・保存済みプラン — VnSavingPro',
  },
};

export function getLocalizedTools(lang = 'vi') {
  if (lang !== 'en' && lang !== 'ja') return TOOLS;
  return TOOLS.map((t) => {
    const tr = TOOL_I18N[t.id]?.[lang];
    return tr ? { ...t, ...tr } : t;
  });
}

export function getLocalizedPageTitle(routeId, lang = 'vi') {
  if (lang === 'en' || lang === 'ja') {
    if (!routeId || routeId === HOME_PAGE.id) return EXTRA_TITLE_I18N.home[lang];
    if (TOOL_I18N[routeId]?.[lang]?.pageTitle) return TOOL_I18N[routeId][lang].pageTitle;
    if (EXTRA_TITLE_I18N[routeId]?.[lang]) return EXTRA_TITLE_I18N[routeId][lang];
  }
  return getPageTitle(routeId);
}

export function getLocalizedVersionLabel(lang = 'vi') {
  if (lang === 'en') return 'Multilingual (VI · EN · JA) · Household Planning · Daily Sync';
  if (lang === 'ja') return '多言語対応（VI · EN · JA）・世帯別設計・毎日金利自動同期';
  return APP_VERSION_LABEL;
}

const HIGHLIGHTS_I18N = {
  'v1.7.0.0': {
    en: {
      title: 'Full 3-Language Support (Vietnamese · English · Japanese)',
      items: [
        'Added instant VI / EN / JA language switcher across navigation, footer, and mobile tool drawer.',
        'End-to-end localization spanning number/tenure formatting, server API calculations, feasibility scoring, and Google Docs / CSV exports.',
      ],
    },
    ja: {
      title: '3言語フル対応（ベトナム語・英語・日本語）',
      items: [
        'ヘッダー・フッター・モバイルメニューに VI / EN / JA の即時切り替え機能を追加しました。',
        'UI・通貨/期間フォーマット（億/万・ヶ月）・サーバー計算・診断コメント・エクスポート帳票まで全面多言語化しました。',
      ],
    },
  },
  'v1.6.0.0': {
    en: {
      title: 'Refreshed Homepage, Responsive Mobile/Tablet/PC UX & 4-Part Versioning',
      items: [
        'Updated Homepage with compact Individual/Couple/Family switch in Quick Estimate, 3 household cards, and Google/Cloud sync guide.',
        'Polished responsive layout across Mobile, Tablet, and Desktop (touch targets, horizontal-scroll safe tables, non-overlapping sticky bars).',
        'Adopted 4-part versioning (v1.6.0.0+) auto-incremented on every update.',
      ],
    },
    ja: {
      title: 'トップページ刷新・マルチデバイス対応・4桁バージョン管理導入',
      items: [
        'トップページに「個人・カップル・家族」別クイック試算とGoogle/Cloud連携案内を追加しました。',
        'スマホ・タブレット・PC向けにタッチ操作性・テーブル表示・下部バーの重なりを最適化しました。',
        'アップデートごとに自動更新される4桁バージョン管理（v1.6.0.0〜）を導入しました。',
      ],
    },
  },
  'v1.5.5': {
    en: {
      title: 'Individual / Couple / Family Planning, Google OAuth & Supabase Cloud',
      items: [
        'Supports Individual, Couple, and Family profiles with Fund-First Emergency Fund mode, 2-earner contribution splits, and stress tests.',
        'Google OAuth / Email Sign-In, Personal Profile, and multi-scenario Cloud persistence on Supabase.',
        'Free-Tier Quota Guardian and automated Resend email alerts.',
      ],
    },
    ja: {
      title: '個人/カップル/家族モード・Google認証・Supabaseクラウド保存',
      items: [
        '個人・カップル・家族の3モデルに対応し、緊急資金優先積立や2人の負担比率、収入停止ストレステストを実装しました。',
        'Google OAuth / メール認証、プロフィール設定、複数プランのクラウド保存に対応しました。',
        '無料枠クォータ監視とResend自動通知アラートを導入しました。',
      ],
    },
  },
  'v1.5.2': {
    en: {
      title: 'Automated Daily Rate Sync for 4 Digital Banks (09:00 AM UTC+7)',
      items: [
        'Dedicated scrapers for Cake by VPBank, LioBank (with dynamic CTKM promo PDF parsing), Timo, and TNEX.',
        'Displays live web app version & changelog in navigation and footer.',
      ],
    },
    ja: {
      title: 'ベトナム主要4ネット銀行の金利毎日自動同期（09:00 AM）',
      items: [
        'Cake by VPBank、LioBank（優遇PDF自動解析）、Timo、TNEX専用スクレイパーを毎日自動実行します。',
        'ナビゲーションとフッターから最新バージョンと更新履歴を直接確認できます。',
      ],
    },
  },
  'v1.4.0': {
    en: {
      title: 'Basic/Pro Modes, Google Docs Export & Feedback Backup',
      items: [
        'Split planner inputs into Basic (fast) and Pro (inflation, step-up deposits, multi-source income).',
        'Direct Google Docs / .DOC report export and local JSON/CSV feedback backup.',
      ],
    },
    ja: {
      title: '基本/詳細モード・Googleドキュメント出力・フィードバック保存',
      items: [
        '入力画面を基本モード（簡易）と詳細モード（インフレ・昇給・副収入）に分割しました。',
        'Googleドキュメント / .DOC形式でのレポート出力とJSON/CSVバックアップを追加しました。',
      ],
    },
  },
  'v1.3.0': {
    en: {
      title: 'Tier 1 Serverless Architecture & Proprietary Algorithm Protection',
      items: [
        'Moved compounding, Feasibility Score, and bank optimization math exclusively to Vercel Serverless API (/api/calculate).',
        'Automatic live rate delivery via /api/rates with 24h cache.',
      ],
    },
    ja: {
      title: 'サーバーレス構成（Tier 1）＆独自計算ロジックのサーバー保護',
      items: [
        '複利・達成可能性スコア・銀行最適化ロジックをすべてVercelサーバーレスAPI（/api/calculate）へ移行しました。',
        '/api/rates経由で最新金利と24時間キャッシュを自動配信します。',
      ],
    },
  },
};

export function getLocalizedVersionHighlights(lang = 'vi') {
  if (lang !== 'en' && lang !== 'ja') return VERSION_HIGHLIGHTS;
  return VERSION_HIGHLIGHTS.map((r) => {
    const tr = HIGHLIGHTS_I18N[r.version]?.[lang];
    return tr ? { ...r, title: tr.title, items: tr.items } : r;
  });
}
