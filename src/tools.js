import {
  ArrowLeftRight,
  Award,
  BarChart3,
  Briefcase,
  Calculator,
  Gift,
  Layers,
  Receipt,
  Target,
  TrendingDown,
  Users,
} from 'lucide-react';
import versionInfo from './version.json';

export const APP_VERSION = versionInfo.displayVersion;
export const APP_VERSION_RAW = versionInfo.version;
export const APP_VERSION_DATE = versionInfo.releaseDate;
export const APP_VERSION_LABEL = versionInfo.label;

export const VERSION_HIGHLIGHTS = [
  {
    version: 'v2.0.0.0',
    date: '23/11/2026',
    title: 'VnSavingPro v2.0: Nền tảng Quản lý Tài sản 4 Vai trò, Ngoại tệ FX & Lương–BHXH 2026',
    items: [
      'Định vị nền tảng quản lý tài sản cho Cá nhân, Cặp đôi & Gia đình với vòng đời linh hoạt (đổi Cặp đôi, nâng cấp Cặp đôi -> Gia đình, hoặc tạo Gia đình từ đầu).',
      'Hệ sinh thái 4 Vai trò mới: Cá nhân, Chuyên gia tài chính xác thực, Người lập kế hoạch được cộng đồng bình chọn (kèm tính năng Clone mẫu thực tế 1 chạm) và Người quản trị tài chính.',
      'Ra mắt Bộ công cụ Tỷ giá Ngoại tệ FX (Vietcombank trực tiếp + so sánh lãi tiết kiệm VND) và Bộ Lương–Thuế TNCN 5 bậc (NQ 110 & Luật 109/2025)–BHXH–Trợ cấp theo Luật 2026.',
    ],
  },
  {
    version: 'v1.12.0.0',
    date: '23/11/2026',
    title: 'Tinh gọn Header, Màn hình mở đầu, Onboarding 3 bước & Mời lập kế hoạch chung',
    items: [
      'Ẩn nút chuyển chế độ màn hình thủ công để giao diện tự động tối ưu âm thầm trên Mobile, Tablet, Foldable Duo và Desktop.',
      'Tinh gọn thanh Header với spotlight nổi bật cho Lập kế hoạch & Lãi suất, thêm màn hình mở đầu thương hiệu và làm mới CTA Trang chủ theo từng ngữ cảnh.',
      'Ra mắt luồng Onboarding 3 bước (Hồ sơ -> Mục tiêu -> Con số mẫu) cùng tính năng mời bạn đời/gia đình lập kế hoạch chung trong Profile.',
    ],
  },
  {
    version: 'v1.11.0.0',
    date: '23/11/2026',
    title: 'Tối ưu Free-Tier 0đ, Giảm 40%+ JS Trang chủ, Siết RLS & Chống Auto-Pause',
    items: [
      'Cắt ~80% Vercel invocations trên Trang chủ bằng CDN Edge Cache 24h cho lãi suất, pre-seed Ước tính nhanh và gom batch telemetry Supabase Free-Tier.',
      'Lazy-load Supabase Auth SDK ra chunk riêng (-40%+ JS tải đầu cho khách), tối ưu tải GTM theo đồng thuận cookie & thêm cache bất biến cho /assets/*.',
      'Siết chặt RLS bảng saved_plans/user_feedback, thêm cron giữ ấm Supabase mỗi 5 ngày, nâng chuẩn Node 24 LTS và dọn cấu hình dư thừa.',
    ],
  },
  {
    version: 'v1.10.0.0',
    date: '23/11/2026',
    title: 'Đồng bộ lãi suất đầu tháng, Nút chạy mô hình + Lazy Loading & Lịch sử kết quả Profile',
    items: [
      'Chuyển lịch tự động đồng bộ lãi suất ngân hàng số sang định kỳ đầu mỗi tháng (mùng 1 hàng tháng lúc 09:00 UTC+7).',
      'Bổ sung nút bấm thực hiện mô hình khi chỉnh sửa thông số trên mọi công cụ kèm hiệu ứng Lazy Loading & skeleton trực quan.',
      'Lưu lại lịch sử các lần lập kế hoạch & chạy công cụ ngay trong Hồ sơ cá nhân (đồng bộ Cloud khi đăng nhập) và hiển thị CTA mời lưu kế hoạch cho khách.',
    ],
  },
  {
    version: 'v1.9.0.0',
    date: '20/11/2026',
    title: 'Vuốt/Slide lộ trình năm, Trang Vinh Danh Cộng Đồng & Unikorn Showcase',
    items: [
      'Nâng cấp Chi tiết lộ trình & Kệ sổ bậc thang cho phép vuốt trái/phải, kéo chuột ngang hoặc kéo thanh trượt năm để duyệt nhanh qua mọi giai đoạn.',
      'Ra mắt trang Vinh Danh Cộng Đồng (/contributors), tích hợp Unikorn Badge tại Footer và khu vực Unikorn Showcase ngay trên Trang chủ.',
    ],
  },
  {
    version: 'v1.8.0.0',
    date: '20/11/2026',
    title: 'Hệ thống Layout đa màn hình đồng nhất (Mobile · Tablet · Duo/Fold · Desktop)',
    items: [
      'Chuẩn hoá kiến trúc layout Adaptive dùng chung cho toàn bộ trang (PageContainer, WorkspaceSplit, DualPaneSection, AdaptiveGrid): chỉnh sửa 1 nơi tự động đồng bộ khắp mọi màn hình.',
      'Thêm tuỳ chọn chế độ màn hình Auto / Mobile / Tablet / Duo & Fold / PC cùng 2 tư thế Book (2 cột né nếp gấp) và Flex / Tabletop (trên-dưới) cho Galaxy Fold, iPhone Duo, Pixel Fold và Surface Duo (hỗ trợ chuẩn W3C Viewport Segments).',
    ],
  },
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
  pageTitle: 'VnSavingPro v2.0 — Nền Tảng Quản Lý Tài Sản Cá Nhân, Cặp Đôi & Gia Đình',
};

export const ALL_TOOLS = [
  {
    id: 'plan',
    path: '/plan',
    aliases: ['/ke-hoach', '/thu-nhap-thu-dong'],
    pageTitle: 'Kế Hoạch Tài Sản & Tiết Kiệm Số — VnSavingPro',
    label: 'Thu nhập thụ động',
    short: 'Kế hoạch',
    desc: 'Lập lộ trình thu nhập thụ động hoặc mục tiêu tài sản cho Cá nhân, Cặp đôi & Gia đình, kèm Quỹ dự phòng và Stress-test.',
    icon: Target,
    primary: true,
    suite: 'savings',
  },
  {
    id: 'fx',
    path: '/fx',
    aliases: ['/ngoai-te', '/ty-gia', '/currency'],
    pageTitle: 'Quản Trị Tỷ Giá Ngoại Tệ FX — VnSavingPro',
    label: 'Quản trị ngoại tệ',
    short: 'Ngoại tệ',
    desc: 'Theo dõi tỷ giá Vietcombank, quy đổi đa ngoại tệ, Stress-test biến động và so sánh với ngưỡng lãi tiết kiệm VND.',
    icon: ArrowLeftRight,
    primary: true,
    suite: 'fx',
  },
  {
    id: 'salary',
    path: '/salary',
    aliases: ['/luong', '/bhxh', '/thue-tncn', '/tro-cap'],
    pageTitle: 'Lương Gross–Net, Thuế TNCN 5 Bậc & BHXH 2026 — VnSavingPro',
    label: 'Lương, Thuế & BHXH 2026',
    short: 'Lương & BHXH',
    desc: 'Tính lương Gross–Net 2026 (giảm trừ 15,5tr/6,2tr, thuế 5 bậc), BHXH, BHTN, thai sản & BHXH 1 lần theo luật mới.',
    icon: Receipt,
    primary: true,
    suite: 'salary',
  },
  {
    id: 'ecosystem',
    path: '/ecosystem',
    aliases: ['/he-sinh-thai', '/chuyen-gia', '/mau-ke-hoach', '/quan-tri'],
    pageTitle: 'Hệ Sinh Thái 4 Vai Trò, Cộng Đồng & Chuyên Gia — VnSavingPro',
    label: 'Hệ sinh thái & Chuyên gia',
    short: 'Hệ sinh thái',
    desc: 'Clone mẫu kế hoạch thực tế được cộng đồng bình chọn, kết nối Chuyên gia xác thực và ủy quyền Quản trị tài chính.',
    icon: Users,
    primary: true,
    suite: 'ecosystem',
  },
  {
    id: 'rates',
    path: '/rates',
    aliases: ['/lai-suat', '/so-sanh-lai-suat'],
    pageTitle: 'So Sánh Lãi Suất Ngân Hàng Số — VnSavingPro',
    label: 'So sánh lãi suất',
    short: 'Lãi suất',
    desc: 'Lãi suất TNEX, LioBank, Cake và Timo tự động đồng bộ đầu mỗi tháng theo từng kỳ hạn.',
    icon: BarChart3,
    primary: true,
    suite: 'savings',
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
    suite: 'savings',
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
    suite: 'savings',
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
    suite: 'savings',
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
    suite: 'savings',
  },
  {
    id: 'contributors',
    path: '/contributors',
    aliases: ['/vinh-danh', '/cong-dong', '/dong-gop', '/hall-of-fame'],
    pageTitle: 'Vinh Danh Cộng Đồng Đóng Góp — VnSavingPro',
    label: 'Vinh danh cộng đồng',
    short: 'Vinh danh',
    desc: 'Tri ân người dùng và cộng đồng Unikorn đã góp ý, đánh giá & tiếp sức giúp VnSavingPro hoàn thiện qua từng phiên bản.',
    icon: Award,
    suite: 'ecosystem',
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
  fx: {
    en: {
      label: 'FX Currency Manager',
      short: 'FX Rates',
      pageTitle: 'Live FX Exchange Rates & Portfolio Manager — VnSavingPro',
      desc: 'Live Vietcombank FX table, multi-currency portfolio valuation, sensitivity stress-test & VND bank hurdle comparison.',
    },
    ja: {
      label: '外貨・為替管理',
      short: '外貨FX',
      pageTitle: '外貨為替レート・マルチ通貨資産管理 — VnSavingPro',
      desc: 'Vietcombankリアルタイムレート、多通貨評価、為替ストレステスト、VND定期預金との損益分岐比較。',
    },
  },
  salary: {
    en: {
      label: 'Salary, Tax & Social Ins. 2026',
      short: 'Salary 2026',
      pageTitle: 'Vietnam 2026 Salary Gross–Net, PIT & Social Insurance — VnSavingPro',
      desc: 'Calculate Gross/Net under 2026 5-bracket PIT & deductions (15.5M/6.2M), BHXH 41/2024 & Employment Law 74/2025 benefits.',
    },
    ja: {
      label: '給与・所得税・社会保険 2026',
      short: '給与2026',
      pageTitle: 'ベトナム2026年新法対応 給与・所得税・社会保険試算 — VnSavingPro',
      desc: '2026年5段階個人所得税・基礎控除15.5M/6.2M対応のGross⇔Net計算および失業・出産・一時金給付試算。',
    },
  },
  ecosystem: {
    en: {
      label: 'Ecosystem & Advisors',
      short: 'Ecosystem',
      pageTitle: '4-Role Ecosystem, Voted Templates & Experts — VnSavingPro',
      desc: 'Clone community-voted plan templates, connect with verified financial experts, and delegate to a Financial Steward.',
    },
    ja: {
      label: 'エコシステム・専門家',
      short: '専門家・型',
      pageTitle: '4役割エコシステム・人気プラン複製・専門家連携 — VnSavingPro',
      desc: 'コミュニティ選出の実証プラン複製、認定ファイナンシャル専門家検索、資産管理スチュワード委任。',
    },
  },
  rates: {
    en: {
      label: 'Bank Rates',
      short: 'Rates',
      pageTitle: 'Vietnam Digital Bank Savings Rates — VnSavingPro',
      desc: 'Monthly interest rates (auto-synced on the 1st of every month) across TNEX, LioBank, Cake and Timo for every tenure.',
    },
    ja: {
      label: '金利比較',
      short: '金利',
      pageTitle: 'ベトナム主要ネット銀行の金利比較 — VnSavingPro',
      desc: 'TNEX・LioBank・Cake・Timoの定期預金金利を毎月1日に自動同期し、期間別に比較できます。',
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
  contributors: {
    en: {
      label: 'Hall of Fame',
      short: 'Community',
      pageTitle: 'Contributors Hall of Fame & Unikorn — VnSavingPro',
      desc: 'Honoring users and the Unikorn community whose feedback, reviews, and support shape VnSavingPro.',
    },
    ja: {
      label: '貢献者・コミュニティ',
      short: '貢献者',
      pageTitle: 'コミュニティ貢献者表彰・Unikorn — VnSavingPro',
      desc: 'VnSavingProの改善に貢献くださった利用者とUnikornコミュニティの皆様をご紹介します。',
    },
  },
};

const EXTRA_TITLE_I18N = {
  home: {
    en: 'VnSavingPro v2.0 — Personal, Couple & Family Wealth Management Platform',
    ja: 'VnSavingPro v2.0 — 個人・カップル・家族向け総合資産管理プラットフォーム',
  },
  auth: {
    en: 'Sign In & Account — VnSavingPro',
    ja: 'ログイン・新規登録 — VnSavingPro',
  },
  profile: {
    en: 'Profile, Role Journey & Shared Spaces — VnSavingPro',
    ja: 'プロフィール・役割・世帯スペース管理 — VnSavingPro',
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
  if (lang === 'en') return 'Wealth Platform v2.0 · 4 User Roles · FX Manager · Vietnam 2026 Payroll & BHXH';
  if (lang === 'ja') return '資産管理プラットフォーム v2.0・4役割・外貨FX・ベトナム2026年給与/社会保険';
  return APP_VERSION_LABEL;
}

const HIGHLIGHTS_I18N = {
  'v2.0.0.0': {
    en: {
      title: 'VnSavingPro v2.0: 4-Role Wealth Ecosystem, FX Manager & Vietnam 2026 Payroll/BHXH',
      items: [
        'Evolved into a complete Personal, Couple & Family Wealth Platform with flexible household lifecycle actions (switch Couples, upgrade Couple -> Family, or create a Family space from scratch).',
        'Introduced 4 distinct User Roles: Individual, Verified Financial Expert, Community-Voted Planner (with 1-click plan template cloning — also open to Experts), and Financial Steward.',
        'Added the FX Currency & Exchange Rate Manager (live Vietcombank feed + VND bank yield hurdle) and Vietnam 2026 Salary/PIT (5-bracket Law 109/2025 + NQ 110)/BHXH 41/2024 Calculator.',
      ],
    },
    ja: {
      title: 'VnSavingPro v2.0：4役割エコシステム・外貨FX管理・2026年新法給与＆社会保険',
      items: [
        '個人・カップル・家族の総合資産管理へ進化し、パートナー変更やカップルから家族へのアップグレードに対応しました。',
        '個人、認定専門家、コミュニティ選出プランナー（実証プランの1クリック複製・専門家も取得可能）、資産管理スチュワードの4役割を新設。',
        'Vietcombank連動の外貨FX管理と、2026年新5段階所得税・社会保険・給付金シミュレーターを公開しました。',
      ],
    },
  },
  'v1.12.0.0': {
    en: {
      title: 'Streamlined Header, Branded Splash, 3-Step Onboarding & Shared Household Planning',
      items: [
        'Hid manual screen-mode toggles so the responsive layout adapts silently across Mobile, Tablet, Foldable Duo, and Desktop.',
        'Streamlined TopNav with highlighted Planning & Bank Rates spotlights, added a smooth branded Splash Screen, and replaced repetitive Homepage CTAs.',
        'Launched a 3-step Onboarding wizard plus Collaborative Household Planning invites for Couples & Families inside Profile.',
      ],
    },
    ja: {
      title: 'ヘッダー刷新・起動画面・3ステップ初期設定・家族共同プラン対応',
      items: [
        '手動の画面モード切替ボタンを非表示にし、Mobile・Tablet・折りたたみDuo・Desktopへ自動最適化しました。',
        'ヘッダーを整理してプラン作成と金利比較を強調し、起動画面と文脈別のトップページCTAを追加しました。',
        '3ステップの初期設定ウィザードと、プロフィールから家族・パートナーを招待できる共同プラン機能を追加しました。',
      ],
    },
  },
  'v1.11.0.0': {
    en: {
      title: 'Free-Tier Optimization, -40% Initial JS Bundle, Hardened RLS & Anti-Pause',
      items: [
        'Cut homepage serverless invocations via 24h Edge CDN caching for /api/rates, server-seeded QuickEstimate defaults, and batched 5-minute quota telemetry.',
        'Lazy-loaded Supabase Auth SDK into its own deferred chunk (-40%+ initial JS for guests), deferred GTM behind consent checks, and enabled immutable /assets/* caching.',
        'Tightened Postgres RLS policies on saved_plans & user_feedback, enforced row retention caps, added a 5-day free keepalive ping, and standardized on Node 24 LTS.',
      ],
    },
    ja: {
      title: 'Free-Tier極小化・初期JS約40%軽量化・RLSセキュリティ強化・休止防止',
      items: [
        '24時間CDNキャッシュ、初期クイック試算のサーバー事前同梱、5分バッチ計測によりトップページのServerless呼び出しを大幅削減しました。',
        'Supabase Auth SDKを別チャンクへ遅延読み込み化して未ログイン時の初期JSを約40%以上削減し、同意後GTM読込と不変アセットキャッシュを追加しました。',
        'saved_plans/user_feedbackのRLSを厳格化し、履歴件数上限管理・5日ごとの無料Keep-Alive・Node 24 LTS統一を適用しました。',
      ],
    },
  },
  'v1.10.0.0': {
    en: {
      title: 'Monthly 1st Rate Sync, Explicit Run CTA + Lazy Loading & Profile Run History',
      items: [
        'Switched automated digital bank rate syncing from daily to monthly on the 1st of every month (09:00 AM UTC+7).',
        'Added explicit "Run Model / Generate Plan" CTA buttons whenever tool inputs change, paired with smooth Lazy Loading & shimmer skeletons.',
        'Saved past Planner & Tool runs inside Profile (synced to Cloud when signed in) plus an interactive Save Prompt CTA for guest users.',
      ],
    },
    ja: {
      title: '毎月1日金利同期・実行ボタン＆遅延読み込み・計算履歴保存',
      items: [
        'ネット銀行金利の自動同期スケジュールを毎日から毎月1日（09:00 UTC+7）に変更しました。',
        '入力変更時に「プラン作成／シミュレーション実行」ボタンを表示し、待機中のローディングバー＆スケルトンを追加しました。',
        '過去の試算・プラン実行履歴をプロフィールに保存（ログイン時はクラウド同期）し、未ログイン向け保存案内CTAを追加しました。',
      ],
    },
  },
  'v1.9.0.0': {
    en: {
      title: 'Swipeable Stage Timeline, Contributors Showcase & Unikorn Integration',
      items: [
        'Added horizontal swipe, mouse drag-scroll, chevron controls, and continuous year scrubber to Planner & Ladder stage shelves.',
        'Launched the Community Hall of Fame (/contributors), embedded Unikorn badge in Footer, and added a Unikorn Showcase section on Home.',
      ],
    },
    ja: {
      title: 'スワイプ式年次タイムライン・コミュニティ表彰・Unikorn連携',
      items: [
        'プランナーとラダー貯蓄のステージ明細に横スワイプ・ドラッグ・年次スライダー操作を追加しました。',
        '貢献者表彰ページ (/contributors)、フッターのUnikorn公式バッジ、トップページのUnikorn特集セクションを公開しました。',
      ],
    },
  },
  'v1.8.0.0': {
    en: {
      title: 'Unified Multi-Screen Adaptive Layout (Mobile · Tablet · Duo/Fold · Desktop)',
      items: [
        'Unified PageContainer, WorkspaceSplit, DualPaneSection, and AdaptiveGrid primitives across every page so layout updates propagate consistently to all screen types.',
        'Added Auto / Mobile / Tablet / Duo & Fold / Desktop switcher plus hinge-safe Book (side-by-side) and Flex/Tabletop (top-bottom) postures for Galaxy Fold, iPhone Duo, Pixel Fold & W3C Viewport Segments.',
      ],
    },
    ja: {
      title: 'マルチ画面統合レイアウト（Mobile · Tablet · Duo/Fold · Desktop）',
      items: [
        '全ページ共通の PageContainer / WorkspaceSplit / DualPaneSection / AdaptiveGrid を導入し、どの画面サイズでも一貫したレイアウト更新を実現しました。',
        'Auto / Mobile / Tablet / Duo・Fold / PC 切替および Galaxy Fold・iPhone Duo 等向けのヒンジ回避 Book（左右2画面）・Flex/Tabletop（上下2画面）モードに対応しました。',
      ],
    },
  },
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
