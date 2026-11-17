import { Target, BarChart3, Calculator, Layers, Briefcase, TrendingDown, Gift } from 'lucide-react';

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
