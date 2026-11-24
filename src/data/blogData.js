// ============================================================
// CẨM NANG & BLOG KIẾN THỨC TÀI CHÍNH VNSAVINGPRO (VI / EN / JA)
// ============================================================

export const BLOG_CATEGORIES = [
  {
    id: 'all',
    label: { vi: 'Tất cả bài viết', en: 'All Articles', ja: 'すべて' },
  },
  {
    id: 'savings',
    label: { vi: 'Ngân hàng số & Bảo mật', en: 'Digital Banks & Security', ja: 'ネット銀行・安全性' },
  },
  {
    id: 'tax_bhxh',
    label: { vi: 'Lương, Thuế & BHXH 2026', en: '2026 Tax & BHXH', ja: '2026年給与・税・社保' },
  },
  {
    id: 'fx_macro',
    label: { vi: 'Ngoại tệ FX & Lạm phát', en: 'FX & Inflation', ja: '外貨FX・インフレ' },
  },
  {
    id: 'family_wealth',
    label: { vi: 'Tài chính Cặp đôi & Gia đình', en: 'Couple & Family Wealth', ja: 'カップル・家族資産' },
  },
];

export const BLOG_POSTS = [
  {
    slug: 'bao-mat-ngan-hang-so-2026',
    category: 'savings',
    featured: true,
    isBotCreated: true,
    isDummyReference: true,
    readMinutes: 6,
    publishedAt: '24/11/2026',
    author: '🤖 VnSavingPro AI Bot (Nội dung & kịch bản mẫu tham khảo)',
    authorRole: 'Bot-Generated Reference Guide',
    badge: { vi: 'An toàn & Pháp lý', en: 'Legal & Security', ja: '法務・セキュリティ' },
    title: {
      vi: 'Giải mã độ an toàn của 4 Ngân hàng số (Cake, Timo, LioBank, TNEX): Pháp lý ngân hàng mẹ, Bảo hiểm tiền gửi & QĐ 2345',
      en: 'Inside Vietnam Digital Bank Security (Cake, Timo, LioBank, TNEX): Parent Licenses, Deposit Insurance & SBV Decision 2345',
      ja: 'ベトナム主要4ネット銀行の安全性を徹底解説：母体銀行認可・預金保険・SBV生体認証決定2345号',
    },
    excerpt: {
      vi: 'Tiền gửi ở ngân hàng số có được Nhà nước bảo vệ như ngân hàng truyền thống? Tìm hiểu cơ chế Core Banking ngân hàng mẹ, khóa vòng chính chủ và 5 bước tự kiểm tra an toàn.',
      en: 'Are digital bank deposits protected like traditional banks? Explore parent bank Core Banking custody, closed-loop settlement, and a 5-point personal security audit.',
      ja: 'ネット銀行の定期預金は従来型銀行と同じ保護を受けられるのか？母体商業銀行のコアバンキング保管、本人返還ルール、5つの点検項目を解説します。',
    },
    keyTakeaways: {
      vi: [
        'Cả 4 ngân hàng số đều thuộc các NHTM được NHNN cấp phép (VPBank, BVBank, OCB, MSB) — không phải ví điện tử hay app vay P2P.',
        'Sổ tiết kiệm online không thể chuyển trực tiếp sang người khác; tiền gốc/lãi chỉ tất toán về đúng tài khoản thanh toán chính chủ.',
        'Quyết định 2345/QĐ-NHNN & TT 17/2024 bắt buộc đối chiếu khuôn mặt + chip CCCD (C06) cho giao dịch > 10 triệu đồng.',
      ],
      en: [
        'All 4 platforms operate directly under SBV-licensed commercial banks (VPBank, BVBank, OCB, MSB), never standalone e-wallets.',
        'Online term passbooks use closed-loop settlement — principal & interest can only settle back to your own primary account.',
        'SBV Decision 2345 mandates NFC chip-ID + live facial biometrics against C06 databases for transfers above 10M VND.',
      ],
      ja: [
        '4行とも国家銀行認可の商業銀行（VPBank・BVBank・OCB・MSB）が直接運営しています。',
        '定期預金は必ず同一名義の普通預金口座へ戻る閉鎖ループ構造により第三者への直接送金が防がれます。',
        '1,000万VND超の取引ではSBV決定2345号によるNFC国民ID＋顔認証が必須です。',
      ],
    },
    sections: {
      vi: [
        {
          heading: '1. Bản chất pháp lý: Không phải "ứng dụng tài chính độc lập"',
          paragraphs: [
            'Nhiều người dùng mới băn khoăn khi thấy lãi suất kỳ hạn 12 tháng tại TNEX đạt 8.6%/năm hoặc Cake + ưu đãi lên tới 9.1%/năm. Điểm mấu chốt cần phân biệt là: đây là các phân khu Ngân hàng số (Digital Banking Division) trực thuộc 100% giấy phép của ngân hàng thương mại mẹ.',
            'Khi bạn mở sổ tiết kiệm trên Cake, hợp đồng tiền gửi điện tử được hạch toán thẳng vào Core Banking của VPBank; tương tự với Timo tại BVBank, LioBank tại OCB và TNEX tại MSB. Toàn bộ tiền gửi VND của cá nhân đều nằm trong phạm vi điều chỉnh của Bảo hiểm tiền gửi Việt Nam (DIV) và quy chế an toàn vốn NHNN.',
          ],
          bullets: [
            'Cake by VPBank: Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)',
            'Timo by BVBank: Ngân hàng TMCP Bản Việt (BVBank)',
            'Liobank by OCB: Ngân hàng TMCP Phương Đông (OCB)',
            'TNEX by MSB: Ngân hàng TMCP Hàng Hải Việt Nam (MSB)',
          ],
        },
        {
          heading: '2. Cơ chế Khóa Vòng Tiền Gửi Chính Chủ & Sinh trắc học C06',
          paragraphs: [
            'Ngay cả trong tình huống xấu nhất khi điện thoại bị thất lạc hoặc bị đánh cắp, kẻ gian không thể rút thẳng tiền từ sổ tiết kiệm ra tài khoản lạ. Tiền bắt buộc phải tất toán về tài khoản thanh toán cùng tên, sau đó mọi lệnh chuyển ra ngoài trên 10 triệu đồng (hoặc lũy kế > 20 triệu/ngày) đều bị chặn bởi bước quét khuôn mặt đối chiếu chip CCCD (QĐ 2345/QĐ-NHNN).',
          ],
          callout: {
            tone: 'brand',
            text: 'Mẹo thực chiến: Bạn nên xuất file PDF Xác nhận số dư điện tử (có chữ ký số CA) ngay sau khi mở sổ lớn và chia tiền vượt hạn mức sang 2–3 ngân hàng số khác nhau để vừa tối ưu lãi suất, vừa phân tán rủi ro vận hành.',
          },
        },
      ],
      en: [
        {
          heading: '1. Legal Custody Under Licensed Parent Commercial Banks',
          paragraphs: [
            'Each digital bank featured in VnSavingPro operates inside the banking license of an established Vietnamese commercial bank. Deposits are recorded directly on the parent bank’s Core Banking ledger and covered by Deposit Insurance of Vietnam (DIV) rules for individual VND accounts.',
          ],
          bullets: [
            'Cake by VPBank -> Vietnam Prosperity Bank (VPBank)',
            'Timo by BVBank -> Viet Capital Bank (BVBank)',
            'Liobank by OCB -> Orient Commercial Bank (OCB)',
            'TNEX by MSB -> Maritime Bank (MSB)',
          ],
        },
        {
          heading: '2. Closed-Loop Passbooks & Biometric Safeguards',
          paragraphs: [
            'A term passbook cannot be wired externally. Funds must first return to your same-name checking account, where SBV Decision 2345 enforces device-bound Smart OTP and 3D liveness facial checks against Ministry of Public Security chip-ID records.',
          ],
          callout: {
            tone: 'brand',
            text: 'Best practice: Download your CA-signed electronic deposit certificate right after opening a passbook, and diversify large balances across 2–3 banks.',
          },
        },
      ],
      ja: [
        {
          heading: '1. 国家銀行認可の商業銀行による直接管理',
          paragraphs: [
            'VnSavingProに掲載されている4つのネット銀行は、いずれもベトナム国家銀行（SBV）から認可を受けた大手商業銀行の公式デジタルバンキング部門です。個人のVND定期預金は母体銀行のコアシステムに記録され、ベトナム預金保険制度（DIV）の対象となります。',
          ],
          bullets: [
            'Cake by VPBank（VPBank傘下）',
            'Timo by BVBank（BVBank傘下）',
            'Liobank by OCB（OCB傘下）',
            'TNEX by MSB（MSB傘下）',
          ],
        },
        {
          heading: '2. 本人帰属ルールとQĐ 2345生体認証',
          paragraphs: [
            '定期預金は第三者口座へ直接送金できず、必ず本人名義の普通預金へ一度戻ります。さらに1,000万VND以上の出金時にはSmart OTPと国民IDチップ照合付きの顔認証が必須となり、二重の防衛線が確保されています。',
          ],
          callout: {
            tone: 'brand',
            text: '運用のコツ：高額預入時は電子署名付き預金確認書PDFを保存し、2〜3行に分散預入してリスクと金利のバランスを最適化しましょう。',
          },
        },
      ],
    },
    cta: {
      route: 'rates',
      params: { tab: 'security' },
      label: {
        vi: 'Kiểm tra Bảo mật & Nhận mã ưu đãi 4 Ngân hàng số →',
        en: 'Audit Bank Security & Claim Account Perks →',
        ja: '安全性チェック＆口座開設特典を見る →',
      },
    },
  },
  {
    slug: 'san-uu-dai-mo-tai-khoan-lai-suat-cao',
    category: 'savings',
    featured: false,
    isBotCreated: true,
    isDummyReference: true,
    readMinutes: 5,
    publishedAt: '24/11/2026',
    author: '🤖 VnSavingPro AI Bot (Nội dung & kịch bản mẫu tham khảo)',
    authorRole: 'Bot-Generated Reference Guide',
    badge: { vi: 'Ưu đãi mở TK 2026', en: 'Welcome Offers 2026', ja: '口座開設特典' },
    title: {
      vi: 'Cách săn lãi suất 8.2%–9.1%/năm & ưu đãi mở tài khoản ngân hàng số 2026: Mã giới thiệu và mẹo tách 4 sổ',
      en: 'How to Capture 8.2%–9.1% Digital Bank Yields & 2026 Account-Opening Bonuses Smartly',
      ja: '2026年ネット銀行で年利8.2%〜9.1%と新規口座開設ボーナスを賢く獲得する方法',
    },
    excerpt: {
      vi: 'Tổng hợp mức thưởng chào mừng (20k–50k), điều kiện cộng lãi +2.2% của Cake, CTKM 8.2% của LioBank, trần 8.6% của TNEX và chiến lược tách 4 sổ của Timo.',
      en: 'Compare 20k–50k referral rewards, Cake’s +2.2% boost vouchers, LioBank’s 8.2% promo PDF terms, TNEX’s 8.6% rate, and Timo’s 4-passbook split.',
      ja: '紹介ボーナス（2万〜5万VND）、Cakeの+2.2%金利ブースター、LioBankの8.2%キャンペーン、TNEXの8.6%固定金利、Timoの4分割術を比較します。',
    },
    keyTakeaways: {
      vi: [
        'Luôn nhập mã giới thiệu ngay ở bước eKYC ban đầu — nhiều ngân hàng không cho nhập bổ sung sau khi kích hoạt tài khoản.',
        'Phân biệt lãi niêm yết chuẩn (như TNEX 8.6%) với lãi gồm CTKM có điều kiện (như Cake +2.2% tối đa 9.1% hoặc LioBank 8.2%).',
        'Dùng tính năng tách 4 sổ (Timo) hoặc rút gốc từng phần (Cake) cho khoản tiền có khả năng cần dùng gấp trong 3–6 tháng.',
      ],
      en: [
        'Enter your referral code during initial eKYC registration — most banks do not allow retroactive code claims.',
        'Distinguish base tariff rates (e.g., TNEX 8.6%) from conditional promo boosts (Cake up to 9.1%, LioBank 8.2%).',
        'Use Timo 4-passbook split or Cake partial withdrawal for cash that might be needed unexpectedly within 3–6 months.',
      ],
      ja: [
        '紹介コードは必ずeKYC登録時に入力してください（事後入力不可の銀行がほとんどです）。',
        '基本金利（TNEX 8.6%など）と条件付き上乗せ金利（Cake最大9.1%、LioBank 8.2%など）を明確に区別しましょう。',
        '3〜6ヶ月以内に使う可能性がある資金には、Timoの4分割またはCakeの一部解約機能を活用しましょう。',
      ],
    },
    sections: {
      vi: [
        {
          heading: '1. So sánh 4 gói ưu đãi chào bạn mới nổi bật nhất',
          paragraphs: [
            'Mở tài khoản trực tuyến qua eKYC hiện chỉ mất 2–3 phút nếu chuẩn bị sẵn CCCD gắn chip. Mỗi ngân hàng số hướng tới một thế mạnh riêng biệt:',
          ],
          metricTable: {
            headers: ['Ngân hàng số', 'Ưu đãi mở TK tiêu biểu', 'Lãi suất 12T / Trần CTKM', 'Điểm mạnh thanh khoản'],
            rows: [
              ['Cake by VPBank', 'Thưởng ~30.000đ + Voucher +2.2%', '6.90% · CTKM đến 9.10%', 'Rút gốc từng phần từ 100k'],
              ['TNEX by MSB', 'Thưởng 50.000đ + Miễn 5 loại phí', '8.60% niêm yết (6M: 8.40%)', 'Khóa lãi top đầu từ 100k'],
              ['LioBank by OCB', 'Thưởng 50.000đ kích hoạt thẻ 2in1', '6.20% · CTKM đến 8.20%', 'Auto-Savings 3.5% + Pigg 4.75%'],
              ['Timo by BVBank', 'STK đẹp miễn phí + Quà 20.000đ', '6.90% · Đặc quyền 8.20%', 'Tự tách 4 sổ bảo vệ lãi'],
            ],
          },
        },
        {
          heading: '2. Chiến lược kết hợp đa ngân hàng thực tế',
          paragraphs: [
            'Thay vì dồn toàn bộ 100% tiền vào 1 nơi, bạn có thể áp dụng cấu trúc 2 lớp: (1) Quỹ dự phòng 4–6 tháng đặt tại Timo (chia 4 sổ) hoặc Cake (rút từng phần), và (2) Vốn tích lũy trung-dài hạn 12M gửi tại TNEX (8.60%) hoặc gói CTKM LioBank/Cake.',
          ],
          callout: {
            tone: 'success',
            text: 'Bạn có thể lưu mã giới thiệu cá nhân của mình cho cả 4 ngân hàng ngay trong tab Bảo mật & Ưu đãi trên VnSavingPro để copy và chia sẻ lại cho bạn bè/người thân.',
          },
        },
      ],
      en: [
        {
          heading: '1. Comparing the 4 New-Account Bonus & Rate Boost Packages',
          paragraphs: [
            'Online eKYC onboarding takes just 2–3 minutes with a chip-ID. Each digital bank targets a specific saver priority:',
          ],
          metricTable: {
            headers: ['Digital Bank', 'Welcome Perk', '12M Standard / Promo Ceiling', 'Liquidity Advantage'],
            rows: [
              ['Cake by VPBank', '~30,000đ + Up to +2.2% boost voucher', '6.90% · Up to 9.10% promo', 'Partial withdrawal from 100k'],
              ['TNEX by MSB', '50,000đ bonus + 5-Zero Fees', '8.60% listed (6M: 8.40%)', 'Lock top yield from 100k'],
              ['LioBank by OCB', '50,000đ on 2-in-1 card activation', '6.20% · Up to 8.20% promo', '3.5% Auto-Save + 4.75% Pigg'],
              ['Timo by BVBank', 'Free vanity acct + 20,000đ gift', '6.90% · Up to 8.20% tier', 'Auto-split into 4 passbooks'],
            ],
          },
        },
        {
          heading: '2. Practical Dual-Layer Bank Allocation',
          paragraphs: [
            'Keep your 4–6 month Emergency Fund in Timo (auto-split) or Cake (partial withdrawal), and lock long-term surplus at TNEX (8.60%) or conditional Cake/LioBank promo boosts.',
          ],
          callout: {
            tone: 'success',
            text: 'Save your own personal referral codes inside VnSavingPro’s Security & Perks tab so they travel with your JSON backups.',
          },
        },
      ],
      ja: [
        {
          heading: '1. 4銀行の新規口座開設特典＆優遇金利比較',
          paragraphs: [
            'NFCチップ付き国民IDがあればオンラインeKYCは2〜3分で完了します。目的別に以下の特徴を使い分けるのが効果的です。',
          ],
          metricTable: {
            headers: ['ネット銀行', '主な開設特典', '12ヶ月基準 / 優遇上限', '流動性の強み'],
            rows: [
              ['Cake by VPBank', '3万VND〜 + 金利+2.2%券', '6.90%・最大9.10%', '10万VND〜一部解約可'],
              ['TNEX by MSB', '5万VND + 5大振込手数料無料', '基準8.60%（6M: 8.40%）', '10万VNDから高利回り確定'],
              ['LioBank by OCB', '2in1カード有効化で5万VND', '6.20%・CTKM最大8.20%', '自動運用3.5%＋Pigg 4.75%'],
              ['Timo by BVBank', '希望番号無料 + 2万VND特典', '6.90%・優遇最大8.20%', '自動4分割で利息保護'],
            ],
          },
        },
        {
          heading: '2. 二層構造の銀行分散戦略',
          paragraphs: [
            '4〜6ヶ月分の緊急防衛資金はTimo（4分割）またはCake（一部解約）に置き、余剰の中長期積立はTNEX（8.60%）や各社キャンペーン定期に振り分けることで収益と流動性を両立できます。',
          ],
          callout: {
            tone: 'success',
            text: 'VnSavingProの「安全性・開設特典」タブにご自身の紹介コードを登録・コピーしてご家族とも共有できます。',
          },
        },
      ],
    },
    cta: {
      route: 'rates',
      params: { tab: 'perks' },
      label: {
        vi: 'Lấy mã giới thiệu & xem chi tiết CTKM 4 Ngân hàng →',
        en: 'Grab Referral Codes & View All Bank Perks →',
        ja: '4銀行の紹介コード・開設手順を見る →',
      },
    },
  },
  {
    slug: 'chien-luoc-tiet-kiem-bac-thang-fund-first',
    category: 'savings',
    featured: false,
    isBotCreated: true,
    isDummyReference: true,
    readMinutes: 5,
    publishedAt: '23/11/2026',
    author: '🤖 VnSavingPro AI Bot (Nội dung & kịch bản mẫu tham khảo)',
    authorRole: 'Bot-Generated Reference Guide',
    badge: { vi: 'Tiết kiệm Bậc thang', en: 'Savings Ladder', ja: 'ラダー貯蓄戦略' },
    title: {
      vi: 'Chiến lược Tiết kiệm Bậc thang (Savings Ladder) & Quỹ dự phòng Fund-First: Không bao giờ mất lãi khi cần tiền gấp',
      en: 'Savings Ladder & Fund-First Emergency Buffers: Earn 12M Rates Without Locking Out Liquidity',
      ja: 'ラダー（階段式）定期預金と緊急資金優先（Fund-First）戦略：流動性を保ちつつ高金利を獲得',
    },
    excerpt: {
      vi: 'Vì sao việc gộp tất cả tiền vào 1 sổ 12 tháng dễ khiến bạn mất trắng lãi về 0.5%/năm? Khám phá công thức chia bậc thang 1T–3T–6T–12T.',
      en: 'Putting everything into a single 12-month passbook risks resetting your yield to 0.5% upon early withdrawal. Learn the 1M–3M–6M–12M ladder blueprint.',
      ja: '全額を1本の12ヶ月定期に入れると急な出金時に普通預金金利（0.5%）へ下がるリスクがあります。1M・3M・6M・12Mの階段式設計を解説します。',
    },
    keyTakeaways: {
      vi: [
        'Luôn lấp đầy Quỹ dự phòng (4T cho Cá nhân, 6T cho Cặp đôi, 6–12T cho Gia đình) trước khi khóa vốn dài hạn.',
        'Đặt lịch đáo hạn bậc thang giúp tháng/quý nào cũng có một khoản tiền gốc + lãi sẵn sàng xoay vòng.',
        'Theo Thông tư 14/NHNN, rút trước hạn bị hạ về trần không kỳ hạn (0.1%–0.5%/năm) — chia nhỏ sổ là lá chắn rẻ nhất.',
      ],
      en: [
        'Fill your Emergency Fund first (4M solo, 6M couple, 6–12M family) before chasing long-duration yields.',
        'Staggered maturity dates ensure regular liquidity windows without breaking long-term interest.',
        'Under SBV Circular 14, breaking a deposit early drops yield to 0.1%–0.5% p.a. — laddering prevents that penalty.',
      ],
      ja: [
        '長期定期に固定する前に、必ず世帯別緊急資金（個人4ヶ月・夫婦6ヶ月・家族6〜12ヶ月）を確保します。',
        '満期日をずらして積立てることで、定期的な現金化タイミングを確保できます。',
        '途中解約時の大幅な金利低下を防ぐ最もシンプルな防衛策が小口ラダー分割です。',
      ],
    },
    sections: {
      vi: [
        {
          heading: '1. Nguyên tắc Fund-First trong quản trị tài sản hiện đại',
          paragraphs: [
            'Trước khi tối ưu lãi suất kép, điều đầu tiên bảo vệ kế hoạch tài chính khỏi sụp đổ là Quỹ dự phòng. Nếu bất ngờ cần 30 triệu chi phí y tế mà bạn phải tất toán sổ 200 triệu đang gửi tháng thứ 10, bạn sẽ mất gần như toàn bộ tiền lãi tích lũy.',
            'Với chế độ Fund-First trên VnSavingPro, hệ thống ưu tiên rót toàn bộ khoản tiết kiệm hàng tháng vào Quỹ dự phòng kỳ hạn 1M–3M trước, sau khi chạm ngưỡng an toàn mới chuyển sang tích lũy kỳ hạn 6M–12M.',
          ],
        },
        {
          heading: '2. Cách chia 4 bậc thang kỳ hạn tối ưu',
          paragraphs: [
            'Thay vì mở 1 sổ 240 triệu kỳ hạn 12M, bạn chia thành 4 phần: 1M (30tr), 3M (50tr), 6M (70tr) và 12M (90tr). Khi mỗi sổ ngắn hạn đáo hạn, bạn quyết định tái tục thẳng lên 12M nếu không phát sinh chi tiêu đột xuất.',
          ],
          callout: {
            tone: 'brand',
            text: 'Công cụ Tiết kiệm Bậc thang của VnSavingPro tự tính sẵn tỷ lệ phủ Quỹ dự phòng và chia mức đóng góp cho cả 2 vợ chồng/cặp đôi.',
          },
        },
      ],
      en: [
        {
          heading: '1. Why Fund-First Comes Before Compounding',
          paragraphs: [
            'Breaking a 200M VND 12-month passbook in month 10 for an unexpected 30M expense wipes out most of your accrued interest. Filling a liquid 1M–3M emergency buffer first protects your long-term compounding.',
          ],
        },
        {
          heading: '2. The 4-Rung Ladder Structure',
          paragraphs: [
            'Split 240M VND across 1M (30M), 3M (50M), 6M (70M), and 12M (90M). As each short rung matures, roll it into 12M if no emergency occurred — turning liquidity into high long-term yield.',
          ],
          callout: {
            tone: 'brand',
            text: 'VnSavingPro’s Savings Ladder tool automatically checks your 1M–3M emergency coverage ratio.',
          },
        },
      ],
      ja: [
        {
          heading: '1. なぜ緊急資金優先（Fund-First）なのか',
          paragraphs: [
            '12ヶ月定期の途中で急な出費により全額解約すると受取利息が大きく減少します。まず1〜3ヶ月満期の緊急防衛資金を完成させることで長期複利を守れます。',
          ],
        },
        {
          heading: '2. 4段階ラダーの作り方',
          paragraphs: [
            '資金を1M・3M・6M・12Mの4段階に分けて預け入れ、満期を迎えた短期口を不要なら順次12Mへロールオーバーしていきます。',
          ],
          callout: {
            tone: 'brand',
            text: 'ラダー貯蓄ツールを使えば緊急資金カバー率と夫婦の拠出配分を自動計算できます。',
          },
        },
      ],
    },
    cta: {
      route: 'ladder',
      label: {
        vi: 'Mở công cụ Tiết kiệm Bậc thang ngay →',
        en: 'Open Savings Ladder Calculator →',
        ja: 'ラダー貯蓄ツールを開く →',
      },
    },
  },
  {
    slug: 'thue-tncn-5-bac-giam-tru-gia-canh-2026',
    category: 'tax_bhxh',
    featured: true,
    isBotCreated: true,
    isDummyReference: true,
    readMinutes: 6,
    publishedAt: '23/11/2026',
    author: '🤖 VnSavingPro AI Bot (Nội dung & kịch bản mẫu tham khảo)',
    authorRole: 'Bot-Generated Reference Guide',
    badge: { vi: 'Luật Thuế 2026', en: '2026 PIT Law', ja: '2026年所得税改正' },
    title: {
      vi: 'Toàn cảnh Thuế TNCN 5 bậc (Luật 109/2025) & Giảm trừ 15,5 triệu / 6,2 triệu (NQ 110): Lương bao nhiêu mới nộp thuế?',
      en: 'Vietnam 2026 5-Bracket PIT (Law 109/2025) & 15.5M / 6.2M Deductions (NQ 110): How Much More Take-Home Pay Do You Keep?',
      ja: 'ベトナム2026年新5段階個人所得税（法109/2025）＆基礎控除1,550万/620万VND完全解説',
    },
    excerpt: {
      vi: 'Nghị quyết 110/2025 và Luật Thuế TNCN 109/2025 nâng mức giảm trừ bản thân lên 15,5 triệu đồng/tháng và rút gọn biểu thuế còn 5 bậc giúp người đi làm tiết kiệm hàng chục triệu đồng mỗi năm.',
      en: 'Resolution 110 and Law 109/2025 lift personal deductions to 15.5M VND/month (6.2M/dependent) and streamline progressive tax to 5 brackets.',
      ja: '決議110号・法109/2025により本人控除が月1,550万VND、扶養控除が620万VNDへ引き上げられ、5段階累進税率へと簡素化されました。',
    },
    keyTakeaways: {
      vi: [
        'Giảm trừ bản thân tăng từ 11 triệu -> 15,5 triệu đồng/tháng (+40,9%); người phụ thuộc tăng từ 4,4 triệu -> 6,2 triệu đồng/tháng.',
        'Người không có người phụ thuộc có lương Gross ~17,3 triệu/tháng (sau trừ 10,5% bảo hiểm) gần như chưa phải nộp thuế TNCN.',
        'Biểu lũy tiến rút từ 7 bậc xuống 5 bậc (5% · 10% · 20% · 30% · 35%), nới rộng mạnh khoảng cách các bậc giữa.',
      ],
      en: [
        'Personal deduction increases from 11M to 15.5M VND/month (+40.9%); dependent allowance jumps from 4.4M to 6.2M VND/month.',
        'With 0 dependents, an employee earning ~17.3M Gross pays near-zero PIT after mandatory 10.5% social insurance deductions.',
        'Progressive brackets shrink from 7 tiers down to 5 tiers (5%, 10%, 20%, 30%, 35%) with wider middle thresholds.',
      ],
      ja: [
        '本人控除が1,100万→1,550万VND（+40.9%）、扶養控除が440万→620万VNDへ引き上げられました。',
        '扶養家族なしの場合、社会保険料控除後の月額Gross約1,730万VND前後まで個人所得税がほぼ発生しません。',
        '税率区分が7段階から5段階（5%・10%・20%・30%・35%）に統合され、中間層の負担が軽減されます。',
      ],
    },
    sections: {
      vi: [
        {
          heading: '1. So sánh ngưỡng giảm trừ 2025 cũ và 2026 mới',
          paragraphs: [
            'Sau 6 năm giữ mức 11 triệu đồng, Nghị quyết 110/2025/UBTVQH15 chính thức điều chỉnh mức giảm trừ gia cảnh áp dụng từ kỳ tính thuế năm 2026 nhằm phản ánh đúng chi phí sinh hoạt tại đô thị:',
          ],
          metricTable: {
            headers: ['Khoản giảm trừ', 'Quy định 2025 cũ', 'Quy định 2026 mới (NQ 110)', 'Mức tăng'],
            rows: [
              ['Giảm trừ bản thân', '11.000.000 đ/tháng', '15.500.000 đ/tháng', '+4.500.000 đ (+40,9%)'],
              ['Mỗi người phụ thuộc', '4.400.000 đ/tháng', '6.200.000 đ/tháng', '+1.800.000 đ (+40,9%)'],
              ['Số bậc biểu thuế', '7 bậc (5% – 35%)', '5 bậc (5% – 35%)', 'Nới giãn bậc 10% & 20%'],
            ],
          },
        },
        {
          heading: '2. Biểu thuế 5 bậc mới tính như thế nào trên thực tế?',
          paragraphs: [
            'Bậc 1 (5%) áp dụng tới 10 triệu đồng thu nhập tính thuế/tháng (thay vì chỉ 5 triệu như trước). Bậc 2 (10%) kéo dài tới 30 triệu đồng. Nhờ đó, một nhân sự có lương Gross 30 triệu/tháng (độc thân) tiết kiệm được khoảng 992.500 đồng tiền thuế mỗi tháng — tương đương gần 12 triệu đồng/năm có thể chuyển thẳng vào quỹ tiết kiệm lãi kép.',
          ],
          callout: {
            tone: 'success',
            text: 'Thử ngay bộ tính Lương Gross ↔ Net 2026 trên VnSavingPro để thấy bảng đối chiếu số tiền thuế tiết kiệm từng tháng và từng năm so với luật cũ 2025.',
          },
        },
      ],
      en: [
        {
          heading: '1. Deduction Threshold Jump: 2025 vs 2026',
          paragraphs: [
            'Under NQ 110/2025 and Law 109/2025, personal and dependent deductions rise by nearly 41% for the 2026 tax year:',
          ],
          metricTable: {
            headers: ['Deduction Item', 'Old 2025 Rule', 'New 2026 Rule (NQ 110)', 'Increase'],
            rows: [
              ['Personal Allowance', '11,000,000 VND/mo', '15,500,000 VND/mo', '+4,500,000 (+40.9%)'],
              ['Per Dependent', '4,400,000 VND/mo', '6,200,000 VND/mo', '+1,800,000 (+40.9%)'],
              ['Tax Tiers', '7 Brackets (5%–35%)', '5 Brackets (5%–35%)', 'Wider 10% & 20% bands'],
            ],
          },
        },
        {
          heading: '2. Real Take-Home Savings You Can Redirect Into Savings',
          paragraphs: [
            'Because Tier 1 (5%) now extends to 10M taxable income and Tier 2 (10%) reaches 30M, a single earner on 30M VND Gross saves ~992,500 VND/month (~11.91M VND/year) in income tax compared to 2025.',
          ],
          callout: {
            tone: 'success',
            text: 'Run your exact Gross or Net salary in VnSavingPro’s 2026 Payroll suite to see side-by-side 2025 vs 2026 tax savings.',
          },
        },
      ],
      ja: [
        {
          heading: '1. 2025年と2026年の控除額比較',
          paragraphs: [
            '都市部の生活費上昇を反映し、2026年課税年度から人的控除額が約41%引き上げられました。',
          ],
          metricTable: {
            headers: ['控除項目', '2025年旧規定', '2026年新規定', '増加額'],
            rows: [
              ['本人基礎控除', '1,100万 VND/月', '1,550万 VND/月', '+450万 VND (+40.9%)'],
              ['扶養家族1名あたり', '440万 VND/月', '620万 VND/月', '+180万 VND (+40.9%)'],
              ['税率区分', '7段階 (5%〜35%)', '5段階 (5%〜35%)', '中間層帯を拡大'],
            ],
          },
        },
        {
          heading: '2. 手取り増加分を資産形成へ回す',
          paragraphs: [
            '月収3,000万VND（扶養なし）の例では、旧2025年比で毎月約99万VND（年間約1,191万VND）の減税となり、そのまま定期預金積立へ上乗せできます。',
          ],
          callout: {
            tone: 'success',
            text: 'VnSavingProの「給与・所得税・社会保険 2026」ツールで2025年比較を自動計算できます。',
          },
        },
      ],
    },
    cta: {
      route: 'salary',
      label: {
        vi: 'Tính Lương Gross–Net & Thuế 5 bậc 2026 ngay →',
        en: 'Calculate 2026 5-Bracket Salary & PIT →',
        ja: '2026年新法 給与・所得税を試算する →',
      },
    },
  },
  {
    slug: 'luat-bhxh-2024-thai-san-that-nghiep-2026',
    category: 'tax_bhxh',
    featured: false,
    isBotCreated: true,
    isDummyReference: true,
    readMinutes: 6,
    publishedAt: '23/11/2026',
    author: '🤖 VnSavingPro AI Bot (Nội dung & kịch bản mẫu tham khảo)',
    authorRole: 'Bot-Generated Reference Guide',
    badge: { vi: 'BHXH 41/2024', en: 'Social Ins. 2026', ja: '社会保険法41/2024' },
    title: {
      vi: 'Luật BHXH 41/2024 & Luật Việc làm 74/2025: Trần đóng 46,8 triệu, điều kiện BHXH 1 lần và trợ cấp Thai sản – Thất nghiệp',
      en: 'Vietnam Social Insurance Law 41/2024 & Employment Law 74/2025: 46.8M Cap, One-Time Payout & Maternity / BHTN Rules',
      ja: 'ベトナム新社会保険法41/2024＆雇用法74/2025：上限4,680万VND・一時金要件・出産＆失業給付解説',
    },
    excerpt: {
      vi: 'Hiểu đúng quy định mới về lương tham chiếu 2.340.000đ (trần 46,8 triệu), phân biệt người tham gia BHXH trước & sau 01/07/2025 và cách tính mức hưởng BHTN tối đa.',
      en: 'Master the 2.34M reference level (46.8M cap), pre/post July 2025 one-time BHXH rules, and exact unemployment & maternity benefit formulas.',
      ja: '基準額234万VND（上限4,680万VND）の仕組み、2025年7月1日前後での一時金ルール違い、出産・失業給付の算定式をわかりやすく解説します。',
    },
    keyTakeaways: {
      vi: [
        'Mức tham chiếu hiện hành 2.340.000đ/tháng tạo trần đóng BHXH & BHYT là 20 × 2.340.000 = 46.800.000đ/tháng.',
        'Trần đóng Bảo hiểm thất nghiệp (BHTN) tính theo 20 × Lương tối thiểu vùng (Vùng 1 từ 2026 là 5.310.000 × 20 = 106.200.000đ/tháng).',
        'Trợ cấp thất nghiệp bằng 60% bình quân 6 tháng đóng BHTN gần nhất, tối đa không quá 5 × Lương tối thiểu vùng.',
      ],
      en: [
        'With a 2,340,000 VND reference base, mandatory BHXH/BHYT salary caps at 20× = 46,800,000 VND/month.',
        'Unemployment Insurance (BHTN) caps at 20× Regional Minimum Wage (Region 1 from 2026: 5.31M × 20 = 106.2M VND/month).',
        'Monthly BHTN payout equals 60% of your 6-month average insured wage, capped at 5× Regional Minimum Wage.',
      ],
      ja: [
        '基準額234万VNDに基づき、社会保険・健康保険の算定上限は20倍の4,680万VND/月です。',
        '失業保険の上限は地域別最低賃金の20倍（地域1で1億620万VND/月）となります。',
        '失業給付月額は直近6ヶ月平均の60%（上限：地域別最低賃金の5倍）で算定されます。',
      ],
    },
    sections: {
      vi: [
        {
          heading: '1. Phân biệt 2 trần đóng bảo hiểm bắt buộc trong doanh nghiệp',
          paragraphs: [
            'Người lao động thu nhập cao thường nhầm lẫn giữa trần BHXH/BHYT và trần BHTN. Theo Luật BHXH 41/2024/QH15 và Luật Việc làm 74/2025/QH15, doanh nghiệp và người lao động đóng BHXH (8%) + BHYT (1.5%) trên tối đa 46,8 triệu đồng/tháng, nhưng riêng 1% BHTN lại áp dụng trần theo 20 lần lương tối thiểu vùng.',
          ],
        },
        {
          heading: '2. BHXH 1 lần & Quyền lợi Thai sản 6 tháng',
          paragraphs: [
            'Người tham gia BHXH trước ngày 01/07/2025 vẫn giữ quyền rút BHXH 1 lần nếu nghỉ việc đủ 12 tháng không đóng tiếp (tính 1,5 tháng lương bình quân cho năm trước 2014 và 2 tháng cho năm từ 2014 trở đi). Trong khi đó, lao động nữ đóng đủ 6 tháng trong 12 tháng trước sinh được hưởng 6 tháng lương bình quân cộng 2 tháng mức tham chiếu trợ cấp một lần cho mỗi con.',
          ],
          callout: {
            tone: 'warning',
            text: 'Lưu ý: Rút BHXH 1 lần sẽ mất thâm niên tích lũy lương hưu và quyền lợi BHYT miễn phí khi về già — hãy tính kỹ trước khi quyết định.',
          },
        },
      ],
      en: [
        {
          heading: '1. Two Distinct Salary Caps in Mandatory Payroll Insurance',
          paragraphs: [
            'High earners contribute 8% BHXH + 1.5% BHYT capped at 46.8M VND, while the 1% BHTN unemployment contribution caps separately at 20× Regional Minimum Wage (106.2M in Region 1).',
          ],
        },
        {
          heading: '2. One-Time Withdrawal & 6-Month Maternity Benefits',
          paragraphs: [
            'Employees enrolled before July 1, 2025 retain the 12-month-gap one-time withdrawal option (1.5× pre-2014 years, 2× from 2014+). Eligible mothers receive 6 months of average insured salary plus 2× reference level birth allowance per newborn.',
          ],
          callout: {
            tone: 'warning',
            text: 'Note: Withdrawing BHXH in a lump sum resets your pension seniority and retiree health card eligibility.',
          },
        },
      ],
      ja: [
        {
          heading: '1. 2つの保険料算定上限の違い',
          paragraphs: [
            '社会保険（8%）と健康保険（1.5%）は月額4,680万VNDが上限ですが、失業保険（1%）のみ地域別最低賃金の20倍（地域1で1億620万VND）まで課税対象となります。',
          ],
        },
        {
          heading: '2. 一時金引き出しと6ヶ月出産給付',
          paragraphs: [
            '2025年7月1日より前の加入者は離職後12ヶ月経過による一時金請求資格を維持しています。出産給付は産前12ヶ月のうち6ヶ月以上加入で平均給与6ヶ月分＋出産一時金が支給されます。',
          ],
          callout: {
            tone: 'warning',
            text: '注意：一時金を引き出すと将来の年金受給年数と退職後健康保険の権利がリセットされます。',
          },
        },
      ],
    },
    cta: {
      route: 'salary',
      label: {
        vi: 'Ước tính Trợ cấp Thai sản, BHTN & BHXH 1 lần →',
        en: 'Estimate Maternity, Unemployment & BHXH Payouts →',
        ja: '出産・失業・一時金給付を試算する →',
      },
    },
  },
  {
    slug: 'giu-ngoai-te-usd-jpy-hay-gui-tiet-kiem-vnd',
    category: 'fx_macro',
    featured: true,
    isBotCreated: true,
    isDummyReference: true,
    readMinutes: 5,
    publishedAt: '23/11/2026',
    author: '🤖 VnSavingPro AI Bot (Nội dung & kịch bản mẫu tham khảo)',
    authorRole: 'Bot-Generated Reference Guide',
    badge: { vi: 'FX vs VND Hurdle', en: 'FX Break-Even', ja: '為替損益分岐点' },
    title: {
      vi: 'Nên giữ USD, EUR, JPY hay gửi tiết kiệm VND lãi 8.6%/năm? Công thức tính Điểm hòa vốn Tỷ giá (FX Break-Even)',
      en: 'Hold USD / JPY / EUR or Lock 8.6% VND Deposits? The FX Interest-Rate Hurdle Formula Explained',
      ja: 'USD・JPY・EUR保有 vs VND定期預金8.6%：どちらが得か為替損益分岐点（ハードルレート）で判断',
    },
    excerpt: {
      vi: 'Khi lãi suất tiền gửi USD tại Việt Nam ở mức 0%/năm còn tiết kiệm VND đạt 6.9%–8.6%/năm, ngoại tệ phải tăng giá ít nhất bao nhiêu % mỗi năm để bù đắp chi phí cơ hội?',
      en: 'With onshore USD deposits earning 0% p.a. while VND deposits yield 6.9%–8.6%, how much must an FX currency appreciate annually just to break even?',
      ja: 'ベトナム国内の外貨預金金利が0%である中、年利6.9%〜8.6%のVND定期預金に勝つために外貨は何％上昇する必要があるのか解説します。',
    },
    keyTakeaways: {
      vi: [
        'Điểm hòa vốn = (Lãi VND%/năm) + (Chênh lệch giá Mua–Bán Spread ~1.2%–2.5%).',
        'Nếu gửi VND lãi 6.9%/năm và spread USD ~1.3%, tỷ giá USD/VND cần tăng trên ~8.2% ngay trong năm đầu mới có lãi ròng cao hơn.',
        'Giữ ngoại tệ vẫn rất hợp lý nếu bạn có nhu cầu chi tiêu trực tiếp bằng USD/EUR/JPY (du học, định cư, nhập hàng) để phòng vệ rủi ro tỷ giá.',
      ],
      en: [
        'Break-even FX appreciation = VND Savings Rate (%) + Buy–Sell Spread Drag (~1.2%–2.5%).',
        'Against a 6.9% VND deposit and ~1.3% USD spread, USD/VND must climb ~8.2% in Year 1 simply to match VND returns.',
        'FX allocation still makes strong sense as a natural hedge when future liabilities (tuition, travel, imports) are priced in foreign currency.',
      ],
      ja: [
        '損益分岐点 ＝ VND定期金利（%）＋ 為替売買スプレッド（約1.2%〜2.5%）。',
        '年利6.9%のVND預金と比較すると、USD/VNDが初年度約8.2%以上上昇しないと外貨保有が上回りません。',
        'ただし留学費・輸入決済・外貨収入など将来の外貨支出がある場合は為替ヘッジ資産として極めて有効です。',
      ],
    },
    sections: {
      vi: [
        {
          heading: '1. Cái bẫy tâm lý khi chỉ nhìn biểu đồ tỷ giá tăng',
          paragraphs: [
            'Nhiều nhà đầu tư thấy USD/VND tăng 3%–4%/năm và nghĩ rằng giữ USD luôn có lời. Tuy nhiên, ngoài việc không có lãi suất tiền gửi tại Việt Nam (0%/năm), bạn còn chịu 2 lần chênh lệch tỷ giá Mua – Bán (Spread) khi quy đổi ra vào.',
            'Cùng số tiền đó, nếu gửi tiết kiệm số kỳ hạn 12M ở mức 6.9%–8.6%/năm, lãi suất thực tế vượt xa mức mất giá trung bình dài hạn của VND (~2.5%–4%/năm).',
          ],
        },
        {
          heading: '2. Khi nào nên nắm giữ danh mục đa ngoại tệ?',
          paragraphs: [
            'Ngoại tệ phát huy sức mạnh khi bạn xây dựng "Giỏ phòng vệ tài sản" (ví dụ giữ 15%–25% danh mục bằng USD/SGD/EUR/JPY để đối ứng chi phí du học con cái hoặc nguồn thu nhập ngoại tệ từ làm việc remote).',
          ],
          callout: {
            tone: 'brand',
            text: 'Công cụ Quản trị Ngoại tệ FX trên VnSavingPro tự động lấy tỷ giá Vietcombank trực tiếp, quy đổi tổng giá trị danh mục sang VND và chạy Stress-test ±2%, ±5%, ±10% so với lãi ngân hàng số.',
          },
        },
      ],
      en: [
        {
          heading: '1. Why Headline FX Appreciation Overstates Real Returns',
          paragraphs: [
            'Seeing USD/VND climb 3%–4% per year feels profitable, but onshore USD deposits earn 0% and round-trip Vietcombank buy–sell spreads cost ~1.2%–2.5%. Meanwhile, top VND digital bank deposits pay 6.9%–8.6% p.a.',
          ],
        },
        {
          heading: '2. Smart Currency Diversification',
          paragraphs: [
            'Holding 15%–25% in hard currencies remains a smart hedging layer when you earn remote income or expect overseas tuition and travel bills.',
          ],
          callout: {
            tone: 'brand',
            text: 'Open VnSavingPro’s FX Manager to convert multi-currency holdings at live Vietcombank rates and stress-test ±2% to ±10% moves.',
          },
        },
      ],
      ja: [
        {
          heading: '1. 為替チャート上昇の錯覚に注意',
          paragraphs: [
            'USD/VNDが年3〜4%上昇しても、国内銀行の外貨金利0%＋売買スプレッド（約1.2〜2.5%）を考慮すると、6.9%〜8.6%のVND定期預金との機会費用差は大きくなります。',
          ],
        },
        {
          heading: '2. 資産バスケットにおける外貨の適正比率',
          paragraphs: [
            '資産の15%〜25%程度をUSD・JPY・EUR等に分散し、将来の外貨支出やインフレリスクへの保険として組み込む運用が理想的です。',
          ],
          callout: {
            tone: 'brand',
            text: '外貨FX管理ツールでVietcombankリアルタイムレートを用いた資産評価と±10%ストレステストを試せます。',
          },
        },
      ],
    },
    cta: {
      route: 'fx',
      label: {
        vi: 'Mở Bộ Quản trị Tỷ giá Ngoại tệ FX (Live VCB) →',
        en: 'Open FX Currency & VCB Rate Manager →',
        ja: '外貨FX管理ツールを開く →',
      },
    },
  },
  {
    slug: 'tai-chinh-cap-doi-gia-dinh-uy-quyen-quan-tri',
    category: 'family_wealth',
    featured: false,
    isBotCreated: true,
    isDummyReference: true,
    readMinutes: 5,
    publishedAt: '23/11/2026',
    author: '🤖 VnSavingPro AI Bot (Nội dung & kịch bản mẫu tham khảo)',
    authorRole: 'Bot-Generated Reference Guide',
    badge: { vi: 'Cặp đôi & Gia đình', en: 'Couple & Family', ja: '夫婦・家族設計' },
    title: {
      vi: '3 Mô hình gộp tài chính cho Cặp đôi & Gia đình trẻ: Chia theo tỷ lệ thu nhập, Stress-test mất việc và Ủy quyền Quản trị viên',
      en: '3 Financial Pooling Models for Couples & Young Families: Proportional Splits, Breadwinner Stress-Tests & Stewardship',
      ja: 'カップル・共働き家族のための3つの家計統合モデル：収入比例配分・ストレス耐性・資産管理委任',
    },
    excerpt: {
      vi: 'Tiền bạc là chủ đề nhạy cảm nhất khi sống chung hoặc kết hôn. Làm thế nào để cả hai công bằng, giữ tự chủ cá nhân và bảo vệ gia đình khi nâng cấp từ Cặp đôi lên Gia đình?',
      en: 'How couples split savings fairly, protect against single-earner concentration risk, and upgrade smoothly into Family planning with optional Steward oversight.',
      ja: '共働きカップル・子育て家族が公平に貯蓄分担を決め、大黒柱リスクをテストし、スムーズに家族プランへ移行する設計手法を解説します。',
    },
    keyTakeaways: {
      vi: [
        'Chia góp theo tỷ lệ thu nhập (Proportional) thường công bằng và bền vững hơn chia cứng 50/50 khi thu nhập hai người chênh lệch.',
        'Nếu 1 người đóng góp >= 75% tổng thu nhập gia đình, cần bật cảnh báo rủi ro trụ cột và nâng Quỹ dự phòng lên tối thiểu 6–9 tháng.',
        'VnSavingPro cho phép nâng cấp thẳng từ Không gian Cặp đôi lên Gia đình giữ nguyên toàn bộ vốn gốc & lịch sử.',
      ],
      en: [
        'Proportional income splits feel fairer and stay sustainable longer than strict 50/50 rules when earnings differ.',
        'When one partner contributes >= 75% of household income, raise the Emergency Fund target to 6–9 months minimum.',
        'VnSavingPro lets you upgrade a Couple space directly into a Family space while carrying forward capital and history.',
      ],
      ja: [
        '収入差がある場合、単純な50/50折半よりも収入比例配分（Proportional）が長期的に公平感を保てます。',
        '1人の収入比率が75%以上の世帯は、緊急防衛資金を最低6〜9ヶ月分へ引き上げるべきです。',
        'VnSavingProではカップル空間の資産を引き継いだままワンクリックで家族空間へアップグレードできます。',
      ],
    },
    sections: {
      vi: [
        {
          heading: '1. So sánh 3 quy tắc góp quỹ tiết kiệm chung',
          paragraphs: [
            'Không có một công thức duy nhất cho mọi cặp đôi, nhưng 3 cơ chế phổ biến nhất gồm: (a) Đóng góp tỷ lệ theo thu nhập ròng, (b) 50/50 cho mục tiêu cố định như mua nhà/cưới, và (c) Tùy chỉnh tỷ lệ % riêng khi một bên đang gánh chi phí chăm sóc gia đình.',
          ],
        },
        {
          heading: '2. Vòng đời Cặp đôi -> Gia đình & Ủy quyền Quản trị (Steward)',
          paragraphs: [
            'Khi gia đình đón thêm thành viên mới, nhu cầu chi phí phụ thuộc tăng mạnh. VnSavingPro hỗ trợ chuyển đổi linh hoạt (từ Cá nhân -> Cặp đôi, đổi Cặp đôi hoặc nâng cấp Cặp đôi -> Gia đình), đồng thời cho phép cấp mã Ủy quyền Quản trị có giới hạn cho chuyên gia hoặc người thân tin cậy hỗ trợ theo dõi.',
          ],
        },
      ],
      en: [
        {
          heading: '1. Choosing Between Proportional, 50/50, and Custom Splits',
          paragraphs: [
            'Pick Proportional when salaries diverge, 50/50 for equal fixed milestones, or Custom % when one spouse covers non-financial caregiving duties.',
          ],
        },
        {
          heading: '2. Couple-to-Family Lifecycle & Revocable Stewardship',
          paragraphs: [
            'Upgrade your Couple roadmap into a Family space as dependents arrive without losing past milestones, or issue a revocable Steward Mandate in Ecosystem for supervised co-management.',
          ],
        },
      ],
      ja: [
        {
          heading: '1. 収入比例・50/50・自由設定の使い分け',
          paragraphs: [
            '収入差がある場合は収入比例、均等目標には50/50、育児・介護等の無償ケア分担がある場合はカスタム比率が有効です。',
          ],
        },
        {
          heading: '2. カップルから家族への昇格＆スチュワード委任',
          paragraphs: [
            '扶養家族が増えたタイミングでも既存資本を引き継いで家族プランへ移行でき、必要に応じて信頼できるパートナーや管理者に委任コードを発行可能です。',
          ],
        },
      ],
    },
    cta: {
      route: 'ecosystem',
      label: {
        vi: 'Clone mẫu Cặp đôi / Gia đình được cộng đồng bình chọn →',
        en: 'Clone Community-Voted Couple & Family Blueprints →',
        ja: '人気のカップル・家族プランを複製する →',
      },
    },
  },
  {
    slug: 'quy-tac-4-phan-tram-lam-phat-tu-do-tai-chinh',
    category: 'fx_macro',
    featured: false,
    isBotCreated: true,
    isDummyReference: true,
    readMinutes: 5,
    publishedAt: '22/11/2026',
    author: '🤖 VnSavingPro AI Bot (Nội dung & kịch bản mẫu tham khảo)',
    authorRole: 'Bot-Generated Reference Guide',
    badge: { vi: 'Lạm phát & FIRE', en: 'Inflation & FIRE', ja: 'インフレ・FIRE' },
    title: {
      vi: 'Quy tắc 4% tại Việt Nam và bài toán Lạm phát 3.5%/năm: Cần bao nhiêu vốn tiết kiệm để tự do tài chính?',
      en: 'Inflation & The 4% Safe Withdrawal Rule in Vietnam: How Real Purchasing Power Shapes Financial Freedom',
      ja: 'ベトナムにおけるインフレ年3.5%と4%ルール：経済的自立に必要な実質資産額とは',
    },
    excerpt: {
      vi: 'Lãi suất danh nghĩa 7.5%/năm trừ lạm phát 3.5%/năm còn lại lãi suất thực theo phương trình Fisher là bao nhiêu? Cách tính số vốn mục tiêu không bị hụt sức mua.',
      en: 'How does 3.5% annual inflation erode a 7.5% nominal bank deposit via the Fisher equation? Learn how to size your real purchasing-power target.',
      ja: '名目金利7.5%・インフレ3.5%の環境下でフィッシャー方程式に基づく実質利回りは何％か、購買力を目減りさせない目標資産の算定法を解説します。',
    },
    keyTakeaways: {
      vi: [
        'Lãi suất thực (Fisher) = ((1 + Lãi danh nghĩa) / (1 + Lạm phát)) - 1. Ví dụ 7.5% danh nghĩa và 3.5% lạm phát -> thực dương ~3.86%/năm.',
        '20 triệu đồng chi tiêu hôm nay tương đương ~28,2 triệu đồng sau 10 năm nếu lạm phát duy trì ở mức 3.5%/năm.',
        'Tăng đều mức tiết kiệm hàng năm theo tỷ lệ tăng lương (Annual Step-Up 5–8%) là cách hiệu quả nhất để đánh bại lạm phát.',
      ],
      en: [
        'Fisher Real Yield = ((1 + Nominal Rate) / (1 + Inflation)) - 1. At 7.5% vs 3.5% inflation, real return is ~3.86% p.a.',
        '20M VND monthly living expenses today require ~28.2M VND/month in 10 years at 3.5% annual inflation.',
        'Stepping up your monthly deposit by 5%–8% annually with salary raises keeps your savings target inflation-proof.',
      ],
      ja: [
        'フィッシャーの実質利回り ＝ (1+名目金利)/(1+インフレ率) - 1。名目7.5%・物価3.5%なら実質約3.86%です。',
        '年3.5%のインフレが続くと、現在の月2,000万VNDの生活費は10年後に約2,820万VND必要になります。',
        '昇給に合わせて毎月の積立額を年5〜8%増額するステップアップ積立がインフレ対策の鍵です。',
      ],
    },
    sections: {
      vi: [
        {
          heading: '1. Đừng nhầm lẫn Lãi danh nghĩa với Sức mua tương lai',
          paragraphs: [
            'Mục tiêu nhận 15 triệu đồng tiền lãi mỗi tháng nghe rất hấp dẫn ở thời điểm năm 2026, nhưng 12 năm nữa sức mua của 15 triệu đồng sẽ bị bào mòn đáng kể bởi chi phí y tế, giáo dục và thực phẩm.',
            'VnSavingPro tích hợp trực tiếp công thức Lạm phát Fisher vào cả trang Kế hoạch Nâng cao (/plan) lẫn công cụ Lạm phát (/inflation) để bạn biết chính xác số vốn thực tế cần đạt.',
          ],
        },
      ],
      en: [
        {
          heading: '1. Nominal Returns vs. Future Purchasing Power',
          paragraphs: [
            '15M VND/month in passive interest feels comfortable today, yet healthcare and education inflation gradually shrinks future purchasing power. Use Fisher-adjusted projections inside /plan and /inflation to set an inflation-proof goal.',
          ],
        },
      ],
      ja: [
        {
          heading: '1. 名目利回りと将来の購買力のギャップ',
          paragraphs: [
            '現在十分な月額1,500万VNDの受取利息も、医療・教育費インフレにより10〜15年後には購買力が低下します。実質金利モードで目標額を補正しましょう。',
          ],
        },
      ],
    },
    cta: {
      route: 'inflation',
      label: {
        vi: 'Tính Lãi thực & Sức mua sau Lạm phát →',
        en: 'Compute Fisher Real Yield & Purchasing Power →',
        ja: 'インフレ実質利回り・購買力を試算する →',
      },
    },
  },
];

export function getBlogPostBySlug(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug) || null;
}
