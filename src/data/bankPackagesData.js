// ============================================================
// NGUỒN DỮ LIỆU THỰC TỪ CÁC TRANG NGÂN HÀNG SỐ
// Cập nhật: 18/11/2026
// ============================================================

export const DIGITAL_BANKS = {
  cake: {
    id: 'cake',
    name: 'Cake by VPBank',
    shortName: 'Cake',
    color: '#FF0048',
    bgColor: '#FFF0F4',
    logo: '🎂',
    partner: 'VPBank',
    description: 'Ngân hàng số thuộc hệ sinh thái VPBank',
    openMethod: 'eKYC 100% online qua app',
    minAge: 18,
    website: 'https://cake.vn',
    appDownload: 'https://cake.vn/onboarding',
    packages: [
      {
        id: 'cake-standard',
        name: 'Tiền gửi tiêu chuẩn',
        type: 'term',
        description: 'Gửi tiết kiệm kỳ hạn cố định, lãi suất cạnh tranh',
        sourceUrl: 'https://cake.vn/tien-gui/tien-gui-tieu-chuan',
        lastUpdated: '22/11/2026',
        rates: [
          { term: '1 tháng', termMonths: 1, endRate: 4.75, startRate: 4.70, monthlyRate: null, quarterlyRate: null },
          { term: '2 tháng', termMonths: 2, endRate: 4.75, startRate: 4.70, monthlyRate: null, quarterlyRate: null },
          { term: '3 tháng', termMonths: 3, endRate: 4.75, startRate: 4.67, monthlyRate: 4.72, quarterlyRate: null },
          { term: '4 tháng', termMonths: 4, endRate: 4.75, startRate: 4.63, monthlyRate: null, quarterlyRate: null },
          { term: '6 tháng', termMonths: 6, endRate: 6.90, startRate: 6.78, monthlyRate: 7.02, quarterlyRate: 7.09 },
          { term: '9 tháng', termMonths: 9, endRate: 6.90, startRate: 6.58, monthlyRate: 6.92, quarterlyRate: 6.99 },
          { term: '12 tháng', termMonths: 12, endRate: 6.90, startRate: 6.59, monthlyRate: 7.02, quarterlyRate: 7.08 },
          { term: '18 tháng', termMonths: 18, endRate: 6.90, startRate: 6.30, monthlyRate: 6.86, quarterlyRate: 6.92 },
          { term: '24 tháng', termMonths: 24, endRate: 6.90, startRate: 5.99, monthlyRate: 6.68, quarterlyRate: 6.74 },
          { term: '36 tháng', termMonths: 36, endRate: 6.30, startRate: 5.01, monthlyRate: 5.63, quarterlyRate: 5.67 },
        ],
        bestRate: 6.90,
        note: 'Thường có ưu đãi cộng thêm đến +2.2%/năm (tổng đạt tới 9.1%/năm cho 6–18 tháng tùy điều kiện chương trình).',
        minDeposit: 100000,
        features: [
          'Gửi từ chỉ 100.000 VNĐ',
          'Kỳ hạn đa dạng từ 1-36 tháng',
          'Nhận lãi: đầu kỳ, cuối kỳ, theo tháng hoặc theo quý',
          'Rút trước hạn một phần (tối thiểu 100k hoặc 10% giá trị sổ)',
          'Xác nhận số dư điện tử ngay trên app',
          'Bảo hiểm tiền gửi theo pháp luật Việt Nam',
          'Cơ hội nhận thưởng khi mở sổ',
        ],
        conditions: [
          'Công dân Việt Nam từ 18 tuổi',
          'Có tài khoản Cake Bank',
          'Đăng ký eKYC xác minh danh tính',
          'Số điện thoại đang hoạt động',
        ],
        earlyWithdrawal: 'Được rút trước hạn một phần hoặc toàn bộ. Lãi suất rút trước hạn theo mức không kỳ hạn',
      },
      {
        id: 'cake-accumulate',
        name: 'Tiền gửi tích lũy',
        type: 'accumulate',
        description: 'Gửi góp nhiều lần, tích lũy dần từng bước',
        sourceUrl: 'https://cake.vn/tien-gui/tien-gui-co-ky-han-tich-luy',
        lastUpdated: '22/11/2026',
        rates: [
          { term: '6 tháng', termMonths: 6, endRate: 4.50, listedRate: 4.50, note: 'Lãi suất cơ bản' },
          { term: '9 tháng', termMonths: 9, endRate: 6.70, listedRate: 6.70, note: 'Đã gồm ưu đãi tích lũy (cơ bản 4.50%)' },
          { term: '12 tháng', termMonths: 12, endRate: 6.70, listedRate: 6.70, note: 'Đã gồm ưu đãi tích lũy (cơ bản 4.50%)' },
          { term: '15 tháng', termMonths: 15, endRate: 6.70, listedRate: 6.70, note: 'Đã gồm ưu đãi tích lũy (cơ bản 4.50%)' },
          { term: '18 tháng', termMonths: 18, endRate: 6.70, listedRate: 6.70, note: 'Đã gồm ưu đãi tích lũy (cơ bản 4.50%)' },
          { term: '24 tháng', termMonths: 24, endRate: 6.70, listedRate: 6.70, note: 'Đã gồm ưu đãi tích lũy (cơ bản 4.50%)' },
          { term: '36 tháng', termMonths: 36, endRate: 6.70, listedRate: 6.70, note: 'Đã gồm ưu đãi tích lũy (cơ bản 4.50%)' },
        ],
        bestRate: 6.70,
        minDeposit: 100000,
        features: [
          'Gửi góp nhiều lần từ 100K',
          'Quản lý dễ dàng chỉ với một sổ tiết kiệm',
          'Nhận lãi cuối kỳ',
          'Bật/tắt gửi tiền định kỳ theo ngày/tuần/tháng',
          'Đa dạng kỳ hạn từ 6-36 tháng',
          'Được rút trước hạn toàn bộ khi có nhu cầu',
          'Nhận tiền thưởng lớn khi mở sổ',
        ],
        conditions: [
          'Công dân Việt Nam từ 18 tuổi',
          'Có tài khoản Cake Bank đã xác minh',
          'Không giới hạn số lần góp thêm',
        ],
        earlyWithdrawal: 'Được rút trước hạn toàn bộ tiền gửi',
        note: 'Lãi suất niêm yết cao hơn lãi suất cơ bản. Áp dụng chương trình khuyến mãi đặc biệt.',
      },
    ],
  },

  liobank: {
    id: 'liobank',
    name: 'Liobank by OCB',
    shortName: 'Liobank',
    color: '#1A73E8',
    bgColor: '#EEF4FF',
    logo: '🦁',
    partner: 'OCB (Ngân hàng Phương Đông)',
    description: 'Ngân hàng số thương hiệu của OCB, thiết kế hiện đại',
    openMethod: 'eKYC 100% online qua app',
    minAge: 18,
    website: 'https://liobank.vn',
    appDownload: 'https://liobank.go.link/app',
    packages: [
      {
        id: 'liobank-savings',
        name: 'Tiết kiệm tự động',
        type: 'auto-savings',
        description: 'Sinh lời thụ động từ số dư tài khoản, tự động mỗi tháng',
        sourceUrl: 'https://liobank.vn/vn/savings',
        lastUpdated: '30/09/2026',
        rates: [
          { term: 'Không kỳ hạn (tự động)', termMonths: 1, endRate: 3.5, note: 'Tự động tái tục mỗi tháng' },
          { term: 'Rút trước hạn', termMonths: 0, endRate: 0, note: 'Mất lãi nếu rút trước 30 ngày' },
        ],
        bestRate: 3.5,
        minDeposit: 500000,
        features: [
          'Lãi suất 3.5%/năm trên số dư từ 500K',
          'Tự động tạo tài khoản tiết kiệm cuối mỗi ngày',
          'Tiền vẫn có thể sử dụng bình thường',
          'Lãi được trả vào đầu tháng tiếp theo',
          'Kỳ hạn 1 tháng tự động tái tục',
          'Không cần thao tác thủ công',
          'Dễ dàng kích hoạt/tắt trên app',
        ],
        conditions: [
          'Có tài khoản Liobank đang hoạt động',
          'Số dư tối thiểu 500.000đ cuối ngày',
          'Kích hoạt tính năng trong app',
        ],
        earlyWithdrawal: 'Lãi suất rút trước hạn: 0%/năm',
        howItWorks: [
          'Nạp tiền vào tài khoản Liobank từ 500.000đ',
          'Cuối ngày, Liobank tự tạo khoản tiết kiệm tương ứng số dư',
          'Sau 1 tháng đủ, nhận lãi suất 3.5%/năm vào đầu tháng tiếp theo',
          'Kỳ hạn tự động tái tục liên tục',
        ],
      },
      {
        id: 'liobank-pigg',
        name: 'Ống Heo (Pigg)',
        type: 'goal-savings',
        description: 'Tiết kiệm theo mục tiêu, sinh lãi từ chi tiêu hàng ngày',
        sourceUrl: 'https://liobank.vn/vn/pigg',
        lastUpdated: '18/11/2026',
        rates: [
          { term: 'Kỳ hạn 1 tháng (Ống heo)', termMonths: 1, endRate: 4.75, note: 'Áp dụng khi duy trì đủ kỳ hạn 1 tháng' },
        ],
        bestRate: 4.75,
        minDeposit: 1000,
        features: [
          'Lãi suất 4.75%/năm cho kỳ hạn 1 tháng, trả lãi vào tài khoản Ống Heo',
          'Mở tối đa 10 tài khoản Ống Heo cho các mục tiêu khác nhau',
          'Rút tiền linh hoạt khi có nhu cầu (rút trước 1 tháng tính lãi không kỳ hạn)',
          'Tiết kiệm thụ động từ chi tiêu hàng ngày',
          'Đặt mục tiêu và theo dõi tiến độ',
          'Tích hợp tính năng round-up từ giao dịch',
        ],
        conditions: [
          'Có tài khoản Liobank đang hoạt động',
          'Mở trong app, không cần đến ngân hàng',
        ],
        earlyWithdrawal: 'Nếu rút trước hạn khi chưa đủ 1 tháng, áp dụng lãi suất không kỳ hạn (0.50%/năm)',
      },
      {
        id: 'liobank-deposit',
        name: 'Tiết kiệm có kỳ hạn',
        type: 'term',
        description: 'Gửi cố định kỳ hạn qua Liobank, mặc định 6.2% · CTKM đến 8.2%/năm',
        sourceUrl: 'https://liobank.vn/vn/deposit',
        ratesSourceUrl: 'https://liobank.vn/vn/deposit-tariffs',
        lastUpdated: '22/11/2026',
        rates: [
          { term: '1 tháng', termMonths: 1, endRate: 4.75 },
          { term: '2 tháng', termMonths: 2, endRate: 4.75 },
          { term: '3 tháng', termMonths: 3, endRate: 4.75 },
          { term: '4 tháng', termMonths: 4, endRate: 4.75 },
          { term: '5 tháng', termMonths: 5, endRate: 4.75 },
          { term: '6 tháng', termMonths: 6, endRate: 5.90, promoRate: 8.00, note: 'CTKM: 8.00%' },
          { term: '7 tháng', termMonths: 7, endRate: 5.90, promoRate: 8.00, note: 'CTKM: 8.00%' },
          { term: '8 tháng', termMonths: 8, endRate: 5.90, promoRate: 8.00, note: 'CTKM: 8.00%' },
          { term: '9 tháng', termMonths: 9, endRate: 5.90, promoRate: 8.00, note: 'CTKM: 8.00%' },
          { term: '10 tháng', termMonths: 10, endRate: 5.90, promoRate: 8.20, note: 'CTKM: 8.20%' },
          { term: '11 tháng', termMonths: 11, endRate: 5.90, promoRate: 8.20, note: 'CTKM: 8.20%' },
          { term: '12 tháng', termMonths: 12, endRate: 6.20, promoRate: 8.20, note: 'CTKM: 8.20%' },
          { term: '15 tháng', termMonths: 15, endRate: 5.90, promoRate: 7.70, note: 'CTKM: 7.70%' },
          { term: '18 tháng', termMonths: 18, endRate: 5.90, promoRate: 7.70, note: 'CTKM: 7.70%' },
          { term: '24 tháng', termMonths: 24, endRate: 5.90, promoRate: 7.70, note: 'CTKM: 7.70%' },
        ],
        bestRate: 8.20,
        minDeposit: 100000,
        features: [
          'Lãi suất Liobank 6.20% (12T) và OCB Online đến 6.70%/năm (24T)',
          'Kỳ hạn linh hoạt từ 1-24 tháng',
          'Mở hoàn toàn online trên app',
          'Nhiều phương thức tất toán',
          'Lịch sử lãi suất minh bạch',
          'Chương trình khuyến mãi cộng lãi suất',
        ],
        conditions: [
          'Công dân Việt Nam từ 18 tuổi',
          'Có tài khoản Liobank đã eKYC',
          'Nộp tiền qua app',
        ],
        earlyWithdrawal: 'Lãi suất rút trước hạn: 0.50%/năm (không kỳ hạn)',
        promotionUrl: 'https://liobank.vn/doc/Liobank_The_Le_CTKM_Cong_Lai_suat_Tiet_kiem_11.11.2026.pdf',
        promotion: 'CTKM cộng thêm lãi suất tiết kiệm đến 8.20%/năm (Hiệu lực 11/11/2026)',
      },
    ],
  },

  tnex: {
    id: 'tnex',
    name: 'TNEX by MSB',
    shortName: 'TNEX',
    color: '#00C896',
    bgColor: '#EDFAF5',
    logo: '⚡',
    partner: 'MSB (Ngân hàng Hàng Hải)',
    description: 'Ngân hàng số thế hệ mới của MSB, lãi suất top đầu',
    openMethod: 'eKYC 100% online qua app',
    minAge: 18,
    website: 'https://www.tnex.vn',
    appDownload: 'https://www.tnex.vn',
    packages: [
      {
        id: 'tnex-savings',
        name: 'Tiết kiệm TNEX (by MSB)',
        type: 'mixed',
        description: 'Gửi tiết kiệm trực tuyến từ 100K, lãi suất đến 8.6%/năm',
        sourceUrl: 'https://www.tnex.vn/san-pham/tiet-kiem',
        lastUpdated: '22/11/2026',
        rates: [
          { term: 'Không kỳ hạn (Flex)', termMonths: 0, endRate: 0.50, note: 'Theo trần không kỳ hạn NHNN' },
          { term: '1 tháng', termMonths: 1, endRate: 4.75, note: 'Từ 1 đến dưới 6 tháng' },
          { term: '3 tháng', termMonths: 3, endRate: 4.75, note: 'Từ 1 đến dưới 6 tháng' },
          { term: '6 tháng', termMonths: 6, endRate: 8.40, note: 'Từ 6 đến dưới 12 tháng' },
          { term: '9 tháng', termMonths: 9, endRate: 8.40, note: 'Từ 6 đến dưới 12 tháng' },
          { term: '12 tháng', termMonths: 12, endRate: 8.60, note: 'Từ 12 tháng trở lên' },
          { term: '18 tháng', termMonths: 18, endRate: 8.60, note: 'Từ 15 tháng trở lên' },
          { term: '24 tháng', termMonths: 24, endRate: 8.60, note: 'Từ 15 tháng trở lên' },
        ],
        bestRate: 8.60,
        minDeposit: 100000,
        features: [
          'Lãi suất cập nhật từ trang chính thức TNEX (8.40% 6M+, 8.60% 12M+)',
          'Gửi từ 100.000đ hoàn toàn online trên app TNEX',
          'Khóa lãi suất cố định ngay khi mở sổ',
          'Đa dạng kỳ hạn từ 1–24 tháng',
          'Không mất phí mở và quản lý sổ',
        ],
        conditions: [
          'Công dân Việt Nam từ 18 tuổi',
          'Có tài khoản TNEX đã xác minh eKYC',
          'Số điện thoại đăng ký hợp lệ',
        ],
        earlyWithdrawal: 'Rút trước hạn áp dụng lãi suất không kỳ hạn (0.50%/năm)',
        highlight: 'Lãi suất niêm yết trên tnex.vn lên đến 8.60%/năm (12M+)',
      },
    ],
  },

  timo: {
    id: 'timo',
    name: 'Timo by BVBank',
    shortName: 'Timo',
    color: '#563D82',
    bgColor: '#F5F0FF',
    logo: '🕐',
    partner: 'BVBank (Ngân hàng Bản Việt)',
    description: 'Ngân hàng số tiên phong tại Việt Nam',
    openMethod: 'eKYC 100% online qua app',
    minAge: 18,
    website: 'https://timo.vn',
    appDownload: 'https://timo.vn',
    packages: [
      {
        id: 'timo-term',
        name: 'Gửi tiết kiệm có kỳ hạn',
        type: 'term',
        description: 'Tiết kiệm kỳ hạn, chia nhỏ sổ thông minh, ưu đãi đến 8.2%/năm',
        sourceUrl: 'https://timo.vn/tiet-kiem-co-ky-han/',
        lastUpdated: '22/11/2026',
        rates: [
          { term: '1 tháng', termMonths: 1, endRate: 4.75, note: 'Trần lãi suất <6 tháng NHNN' },
          { term: '3 tháng', termMonths: 3, endRate: 4.75, note: 'Trần lãi suất <6 tháng NHNN' },
          { term: '6 tháng', termMonths: 6, endRate: 6.70 },
          { term: '9 tháng', termMonths: 9, endRate: 6.70 },
          { term: '12 tháng', termMonths: 12, endRate: 6.90 },
          { term: '18 tháng', termMonths: 18, endRate: 6.70 },
          { term: '24 tháng', termMonths: 24, endRate: 6.70 },
        ],
        bestRate: 6.90,
        note: 'Gói ưu đãi đặc quyền lên đến 8.20%/năm cho kỳ hạn từ 6 tháng trở lên (kèm điều kiện không tất toán trước hạn).',
        minDeposit: 50000,
        features: [
          'Gửi từ 50.000đ',
          'Tính năng tự động chia nhỏ thành 4 sổ khi mở để bảo vệ lãi khi cần rút gấp',
          'Mở online qua app Timo',
          'Theo dõi tiến độ tích lũy',
          'Nhận thông báo khi đến hạn',
        ],
        conditions: [
          'Công dân Việt Nam từ 18 tuổi',
          'Tài khoản Timo đã eKYC',
        ],
        earlyWithdrawal: 'Áp dụng lãi suất không kỳ hạn (0.50%/năm) cho phần sổ rút sớm',
      },
      {
        id: 'timo-demand',
        name: 'Gửi không kỳ hạn',
        type: 'demand',
        description: 'Gửi tiết kiệm không kỳ hạn, rút bất cứ lúc nào',
        sourceUrl: 'https://timo.vn/tai-khoan-tiet-kiem/gui-tiet-kiem-khong-ky-han-timo/',
        lastUpdated: '18/11/2026',
        rates: [
          { term: 'Không kỳ hạn', termMonths: 0, endRate: 0.50, note: 'Trần không kỳ hạn NHNN, trả lãi hàng tháng' },
        ],
        bestRate: 0.50,
        minDeposit: 50000,
        features: [
          'Rút tiền bất kỳ lúc nào',
          'Lãi suất cạnh tranh nhất trong phân khúc không kỳ hạn',
          'Lãi được trả hàng tháng',
          'Không có kỳ hạn tối thiểu',
          'Linh hoạt quản lý dòng tiền',
        ],
        conditions: [
          'Công dân Việt Nam từ 18 tuổi',
          'Có tài khoản Timo đang hoạt động',
        ],
        earlyWithdrawal: 'Rút tự do, không phạt',
      },
    ],
  },
};

// Tổng hợp lãi suất tốt nhất theo kỳ hạn từ tất cả ngân hàng số
export function getBestRatesByTerm() {
  const termMap = {};

  Object.values(DIGITAL_BANKS).forEach(bank => {
    bank.packages.forEach(pkg => {
      if (pkg.rates) {
        pkg.rates.forEach(rate => {
          const key = rate.termMonths;
          const rateValue = rate.endRate;
          if (rateValue > 0) {
            if (!termMap[key] || rateValue > termMap[key].rate) {
              termMap[key] = {
                termMonths: key,
                term: rate.term,
                rate: rateValue,
                bank: bank.name,
                bankId: bank.id,
                package: pkg.name,
              };
            }
          }
        });
      }
    });
  });

  return Object.values(termMap).sort((a, b) => a.termMonths - b.termMonths);
}

// So sánh lãi suất tất cả ngân hàng theo kỳ hạn cụ thể
export function compareRatesByTerm(termMonths) {
  const results = [];

  Object.values(DIGITAL_BANKS).forEach(bank => {
    bank.packages.forEach(pkg => {
      if (pkg.rates) {
        const matchRate = pkg.rates.find(r => r.termMonths === termMonths);
        if (matchRate && matchRate.endRate > 0) {
          results.push({
            bank: bank.name,
            bankId: bank.id,
            package: pkg.name,
            rate: matchRate.endRate,
            minDeposit: pkg.minDeposit,
            sourceUrl: pkg.sourceUrl,
          });
        }
      }
    });
  });

  return results.sort((a, b) => b.rate - a.rate);
}
