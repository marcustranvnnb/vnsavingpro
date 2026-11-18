import { Target, BarChart3, Calculator, Layers, Briefcase, TrendingDown, Gift } from 'lucide-react';

export const APP_VERSION = 'v1.5.2';
export const APP_VERSION_DATE = '18/11/2026';
export const APP_VERSION_LABEL = 'Tier 1 Serverless · Auto Sync 4 Ngân hàng số';

export const VERSION_HIGHLIGHTS = [
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

export const TOOLS = [
  {
    id: 'plan',
    path: '/plan',
    aliases: ['/ke-hoach', '/thu-nhap-thu-dong'],
    pageTitle: 'Kế Hoạch Thu Nhập Thụ Động — VnSavingPro',
    label: 'Thu nhập thụ động',
    short: 'Kế hoạch',
    desc: 'Tính số vốn và thời gian cần để lãi tiết kiệm trả cho bạn một khoản cố định mỗi tháng.',
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
    desc: 'Chia tiền gửi hàng tháng vào nhiều kỳ hạn để vừa lãi cao vừa linh hoạt.',
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
    desc: 'Tăng lương hay nhảy việc giúp bạn về đích tài chính nhanh hơn bao lâu?',
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
  },
];

export const toolById = (id) => TOOLS.find((t) => t.id === id);

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
  const matched = TOOLS.find(
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
