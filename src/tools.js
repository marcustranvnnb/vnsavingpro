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

export const TOOLS = [
  {
    id: 'plan',
    label: 'Thu nhập thụ động',
    short: 'Kế hoạch',
    desc: 'Tính số vốn và thời gian cần để lãi tiết kiệm trả cho bạn một khoản cố định mỗi tháng.',
    icon: Target,
    primary: true,
  },
  {
    id: 'rates',
    label: 'So sánh lãi suất',
    short: 'Lãi suất',
    desc: 'Lãi suất mới nhất của TNEX, LioBank, Cake và Timo theo từng kỳ hạn.',
    icon: BarChart3,
    primary: true,
  },
  {
    id: 'calculator',
    label: 'Tính lãi tiết kiệm',
    short: 'Tính lãi',
    desc: 'So sánh 3 cách tính lãi: ngày thực tế, tháng tròn và lãi kép.',
    icon: Calculator,
    primary: true,
  },
  {
    id: 'ladder',
    label: 'Tiết kiệm bậc thang',
    short: 'Bậc thang',
    desc: 'Chia tiền gửi hàng tháng vào nhiều kỳ hạn để vừa lãi cao vừa linh hoạt.',
    icon: Layers,
    primary: true,
  },
  {
    id: 'career',
    label: 'Lộ trình tăng lương',
    short: 'Tăng lương',
    desc: 'Tăng lương hay nhảy việc giúp bạn về đích tài chính nhanh hơn bao lâu?',
    icon: Briefcase,
  },
  {
    id: 'inflation',
    label: 'Lạm phát & sức mua',
    short: 'Lạm phát',
    desc: 'Lãi suất thực sau lạm phát và sức mua của khoản thu nhập thụ động theo thời gian.',
    icon: TrendingDown,
  },
  {
    id: 'referral',
    label: 'Ưu đãi mở tài khoản',
    short: 'Ưu đãi',
    desc: 'Mã giới thiệu và quà tặng khi mở tài khoản ngân hàng số.',
    icon: Gift,
  },
];

export const toolById = (id) => TOOLS.find((t) => t.id === id);
