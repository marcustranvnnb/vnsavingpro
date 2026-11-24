// ============================================================
// BẢO MẬT PHÁP LÝ, CÔNG NGHỆ & ƯU ĐÃI MỞ TÀI KHOẢN NGÂN HÀNG SỐ
// Áp dụng cho: Cake by VPBank, Timo by BVBank, LioBank by OCB, TNEX by MSB
// ============================================================

export const BANK_SECURITY_PILLARS = [
  {
    id: 'sbv-license',
    badge: {
      vi: 'Giấy phép NHNN',
      en: 'SBV Licensed Parent',
      ja: '国家銀行認可母体',
    },
    title: {
      vi: 'Bảo chứng Pháp lý bởi Ngân hàng Thương mại Mẹ',
      en: 'Backed by Licensed Parent Commercial Banks',
      ja: '認可商業銀行による法的保護と裏付け',
    },
    summary: {
      vi: 'Cake (VPBank), Timo (BVBank), LioBank (OCB) và TNEX (MSB) đều là thương hiệu ngân hàng số trực thuộc các ngân hàng thương mại Việt Nam được NHNN cấp phép, không phải ứng dụng P2P hay ví điện tử độc lập.',
      en: 'Cake (VPBank), Timo (BVBank), LioBank (OCB), and TNEX (MSB) operate directly under licensed Vietnamese commercial banks regulated by the State Bank of Vietnam (SBV) — not unregulated lending or e-wallet apps.',
      ja: 'Cake（VPBank）、Timo（BVBank）、LioBank（OCB）、TNEX（MSB）はいずれもベトナム国家銀行（SBV）認可の大手商業銀行が直接運営するデジタルバンクであり、無認可P2Pアプリではありません。',
    },
    highlights: {
      vi: [
        'Tuân thủ tỷ lệ an toàn vốn CAR và thanh khoản bắt buộc của NHNN',
        'Sổ tiết kiệm online ghi nhận trực tiếp trên hệ thống Core Banking ngân hàng mẹ',
      ],
      en: [
        'Subject to mandatory SBV capital adequacy (CAR) and reserve ratios',
        'Every term passbook is booked directly onto the parent bank’s Core Banking ledger',
      ],
      ja: [
        'SBVの自己資本比率（CAR）および法定準備率規制の適用対象',
        'オンライン定期預金は母体銀行のコアバンキング台帳へ直接記録',
      ],
    },
  },
  {
    id: 'div-insurance',
    badge: {
      vi: 'Bảo hiểm tiền gửi VN',
      en: 'Deposit Insurance (DIV)',
      ja: 'ベトナム預金保険対象',
    },
    title: {
      vi: 'Bảo hiểm Tiền gửi & Chứng nhận Sổ Chữ ký số',
      en: 'Deposit Insurance Coverage & Digitally Signed Certificates',
      ja: '預金保険制度（DIV）＆電子署名入り預金証書',
    },
    summary: {
      vi: 'Tiền gửi VND của cá nhân tại các ngân hàng số trực thuộc NHTM được tham gia Bảo hiểm tiền gửi Việt Nam (DIV) và có thể tải Giấy xác nhận số dư / Sổ tiết kiệm điện tử có chữ ký số đối chiếu công khai.',
      en: 'Individual VND deposits held at digital divisions of licensed banks participate in Deposit Insurance of Vietnam (DIV) and issue digitally signed passbook certificates verifiable online.',
      ja: '個人のVND預金はベトナム預金保険機構（DIV）の保護対象となり、公的検証可能な電子署名付き残高証明・預金証書をアプリから発行できます。',
    },
    highlights: {
      vi: [
        'Bảo vệ tiền gửi cá nhân bằng đồng Việt Nam theo quy định pháp luật',
        'Xuất PDF Xác nhận mở sổ tiết kiệm có chữ ký số (CA) để chứng minh tài chính',
      ],
      en: [
        'Statutory VND individual deposit protection under Vietnamese law',
        'Export CA-signed electronic deposit confirmations accepted for financial proof',
      ],
      ja: [
        'ベトナム法令に基づく個人VND預金の保護枠組みを適用',
        '電子認証（CA）署名付きPDF預金証明書をいつでも出力可能',
      ],
    },
  },
  {
    id: 'biometric-2345',
    badge: {
      vi: 'QĐ 2345 & TT 17/2024',
      en: 'SBV Decision 2345 NFC',
      ja: 'SBV決定2345 生体認証',
    },
    title: {
      vi: 'Sinh trắc học CCCD gắn chip & Smart OTP gắn thiết bị',
      en: 'NFC Chip-ID Biometrics & Device-Bound Smart OTP',
      ja: 'NFCチップ付き国民ID生体認証＆端末紐付けOTP',
    },
    summary: {
      vi: 'Áp dụng bắt buộc xác thực khuôn mặt đối chiếu dữ liệu Bộ Công an (C06) qua NFC CCCD gắn chip cho giao dịch chuyển tiền > 10 triệu đồng/lần hoặc > 20 triệu đồng/ngày theo QĐ 2345/QĐ-NHNN.',
      en: 'Enforces 3D liveness facial biometrics cross-checked against Ministry of Public Security C06 chip-ID data for transfers above 10M VND/tx or 20M VND/day under SBV Decision 2345.',
      ja: 'SBV決定2345号に基づき、1回1,000万VND超または1日2,000万VND超の送金時はNFC国民ID照合と3D顔認証が必須化されています。',
    },
    highlights: {
      vi: [
        'Khóa giao dịch giá trị lớn nếu đổi thiết bị lạ hoặc chưa quét khuôn mặt chính chủ',
        'Smart OTP mã hoá cục bộ thay cho SMS OTP chống giả mạo trạm BTS / SIM swap',
      ],
      en: [
        'Blocks high-value transfers on unrecognized devices without live owner face match',
        'Encrypted Smart OTP eliminates SMS interception and SIM-swap attack vectors',
      ],
      ja: [
        '未登録端末からの高額送金をリアルタイムの生体照合で遮断',
        '端末暗号化Smart OTPによりSMS乗っ取り（SIMスワップ）を防止',
      ],
    },
  },
  {
    id: 'closed-loop',
    badge: {
      vi: 'Khóa vòng chính chủ',
      en: 'Closed-Loop Settlement',
      ja: '本人口座限定償還',
    },
    title: {
      vi: 'Tất toán sổ tiết kiệm chỉ về Tài khoản Chính chủ',
      en: 'Term Deposits Settle Strictly to Owner Account',
      ja: '定期預金は本人の普通預金口座へのみ払戻し',
    },
    summary: {
      vi: 'Tiền gốc và lãi của sổ tiết kiệm không thể chuyển thẳng ra tài khoản ngân hàng khác; bắt buộc tất toán về tài khoản thanh toán cùng tên chính chủ trước khi thực hiện giao dịch tiếp theo.',
      en: 'Savings principal and interest cannot be wired directly from a passbook to any third party — funds must always settle into your verified same-name primary checking account first.',
      ja: '定期預金の元本および利息を第三者口座へ直接出金することは構造上不可能であり、必ず同一名義の普通預金口座を経由します。',
    },
    highlights: {
      vi: [
        'Lớp chặn bảo vệ kép: Smart OTP tách PIN riêng & sinh trắc học khi chuyển khoản',
        'Có thể khóa thẻ/tài khoản 1 chạm 24/7 trong app nếu nghi ngờ lộ thông tin',
      ],
      en: [
        'Double defense: separate Smart OTP PIN plus mandatory biometric check on transfer out',
        '1-tap instant card & digital banking lock inside each app 24/7',
      ],
      ja: [
        'Smart OTP専用PIN＋出金時顔認証の二段階防衛ライン',
        '不審時は各アプリ内から24時間365日1タップで口座・カード即時停止可能',
      ],
    },
  },
];

export const BANK_SECURITY_PROFILES = {
  cake: {
    id: 'cake',
    parentBankFull: {
      vi: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)',
      en: 'Vietnam Prosperity Joint Stock Commercial Bank (VPBank)',
      ja: 'ベトナム繁栄商業銀行（VPBank）',
    },
    licenseRef: 'NHNN License · Trực thuộc VPBank',
    securityCerts: ['PCI-DSS Level 1', 'ISO/IEC 27001', 'NFC CCCD (QĐ 2345)', 'Smart OTP + FaceID'],
    depositVerification: {
      vi: 'Xuất Chứng nhận tiền gửi điện tử có chữ ký số VPBank/CAKE ngay trong chi tiết sổ trên app.',
      en: 'Download digitally signed deposit confirmation PDF directly inside each savings card on Cake.',
      ja: 'Cakeアプリ内の各定期預金詳細からVPBank/CAKE電子署名付き証書を発行可能。',
    },
    emergencyHotline: '1900 636 686 (24/7)',
    cardLockFeature: {
      vi: 'Khóa thẻ & tạm ngưng đăng nhập thiết bị mới tức thì trong Cài đặt bảo mật.',
      en: 'Instant card freeze & new-device sign-in lock inside Security Settings.',
      ja: 'セキュリティ設定からカード凍結・新規端末ログイン遮断を即時実行可能。',
    },
    welcomeOffer: {
      badge: {
        vi: 'Thưởng 30.000đ + Cộng lãi đến +2.2%/năm',
        en: '30,000đ Bonus + Up to +2.2%/yr Rate Boost',
        ja: '3万VND特典＋最大年利+2.2%上乗せ',
      },
      title: {
        vi: 'Gói Chào Bạn Mới Cake by VPBank',
        en: 'Cake by VPBank New Account & Savings Boost',
        ja: 'Cake by VPBank 新規口座開設＆定期金利ブースト特典',
      },
      highlights: {
        vi: [
          'Nhập mã giới thiệu khi mở tài khoản online nhận ngay thưởng tiền mặt (từ 30.000đ theo từng đợt CTKM)',
          'Cơ hội nhận voucher cộng thêm đến +2.2%/năm cho khoản tiền gửi Tiêu chuẩn kỳ hạn 6–18 tháng (tối đa tới 9.1%/năm)',
          'Rút gốc từng phần từ 100.000đ hoặc 10% giá trị sổ mà vẫn giữ nguyên lãi suất phần còn lại',
        ],
        en: [
          'Apply referral code during eKYC signup to unlock welcome cashback (typically 30,000 VND per active campaign)',
          'Eligible for promo rate-boost vouchers up to +2.2% p.a. on 6–18M Standard deposits (up to 9.1% p.a.)',
          'Partial principal withdrawal from 100,000 VND without forfeiting full-term interest on remaining balance',
        ],
        ja: [
          'オンライン口座開設時に紹介コード入力で新規キャッシュバック特典（キャンペーン時3万VND〜）',
          '6〜18ヶ月定期への最大+2.2%金利上乗せクーポン対象（最大年利9.1%相当）',
          '10万VND以上の一部解約時も残高部分の約定金利を維持可能',
        ],
      },
      steps: {
        vi: [
          'Tải app Cake từ App Store / Google Play chính chủ',
          'Chọn Đăng ký mới & nhập mã giới thiệu ở bước thông tin',
          'Quét CCCD gắn chip (NFC) + khuôn mặt eKYC trong 2 phút',
          'Mở sổ tiết kiệm từ 100.000đ để kích hoạt cộng lãi ưu đãi',
        ],
        en: [
          'Install official Cake app from App Store / Google Play',
          'Tap Sign Up & enter the referral code during onboarding',
          'Complete NFC chip-ID & 3D face eKYC in ~2 minutes',
          'Open a term deposit from 100,000 VND to claim boost perks',
        ],
        ja: [
          '公式ストアからCakeアプリをインストール',
          '新規登録画面で紹介コードを入力',
          'NFCチップID読取＋顔認証eKYCを約2分で完了',
          '10万VNDから定期預金を開設し優遇特典を有効化',
        ],
      },
    },
  },
  timo: {
    id: 'timo',
    parentBankFull: {
      vi: 'Ngân hàng TMCP Bản Việt (BVBank)',
      en: 'Viet Capital Commercial Joint Stock Bank (BVBank)',
      ja: 'ベトキャピタル商業銀行（BVBank）',
    },
    licenseRef: 'NHNN License · Trực thuộc BVBank',
    securityCerts: ['PCI-DSS Compliant', 'FIDO / Sinh trắc học C06', 'iOTP nội bộ app', 'Tách 4 sổ bảo vệ lãi'],
    depositVerification: {
      vi: 'Tài khoản Term Deposit đồng bộ Core Banking BVBank; hỗ trợ cấp Giấy xác nhận số dư có dấu/chữ ký điện tử.',
      en: 'Term Deposits sync directly with BVBank Core Banking; electronic balance & passbook confirmation supported.',
      ja: 'BVBankのコアバンキングと直結し、電子残高証明・定期預金確認書の発行に対応。',
    },
    emergencyHotline: '1800 6788 (Miễn phí 24/7)',
    cardLockFeature: {
      vi: 'Khóa thẻ NAPAS/Visa & cài hạn mức chi tiêu ngày/giao dịch ngay trong Timo.',
      en: 'Toggle NAPAS/Visa card locks and daily spending caps right inside Timo.',
      ja: 'Timoアプリ内でNAPAS/Visaカード即時ロックと日次利用上限を設定可能。',
    },
    welcomeOffer: {
      badge: {
        vi: 'STK đẹp miễn phí + Quà 20k + Đặc quyền 8.2%/năm',
        en: 'Free Vanity Account + 20k Gift + 8.2% Tier',
        ja: '番号選択無料＋2万VND特典＋優遇8.2%',
      },
      title: {
        vi: 'Ưu đãi Mở Tài Khoản Timo by BVBank',
        en: 'Timo by BVBank Welcome & Smart Split Savings Offer',
        ja: 'Timo by BVBank 新規口座＆自動4分割定期特典',
      },
      highlights: {
        vi: [
          'Miễn phí chọn Số tài khoản đẹp (ngày sinh/số phong thủy) & miễn phí giao thẻ vật lý tận nhà (theo đợt ưu đãi)',
          'Quà tặng chào mừng 20.000đ+ khi nhập mã giới thiệu & phát sinh giao dịch/mở hũ Goal Save đầu tiên',
          'Tính năng thông minh tự động chia nhỏ 1 khoản gửi thành 4 sổ riêng biệt giúp chỉ mất lãi 1 phần nhỏ nếu cần rút gấp',
        ],
        en: [
          'Free custom/vanity account number selection & zero-fee physical card delivery on eligible campaigns',
          '20,000+ VND welcome reward when applying referral code & activating your first Goal Save or deposit',
          'Smart 4-passbook auto-split protects full interest on 75% of principal if you need an early partial exit',
        ],
        ja: [
          '希望口座番号の無料選択および物理カードの無料郵送キャンペーン対象',
          '紹介コード利用＆初回積立・Goal Save開始で2万VND〜のウェルカム特典',
          '1回の預入を4口へ自動分割する仕組みにより、緊急解約時も残余分の高金利を保護',
        ],
      },
      steps: {
        vi: [
          'Tải app Timo Digital Bank chính thức',
          'Chọn mở tài khoản bằng CCCD gắn chip & nhập mã mời',
          'Xác thực NFC + khuôn mặt theo QĐ 2345/QĐ-NHNN',
          'Chọn số tài khoản ưng ý và tạo sổ Term Deposit từ 50.000đ',
        ],
        en: [
          'Download official Timo Digital Bank app',
          'Register with chip-ID & enter referral invite code',
          'Pass NFC biometric verification under SBV Decision 2345',
          'Pick your account number & start Term Deposit from 50,000 VND',
        ],
        ja: [
          '公式Timo Digital Bankアプリをダウンロード',
          'NFCチップIDで登録し紹介コードを入力',
          'SBV決定2345準拠のNFC＋顔認証を実施',
          '希望の口座番号を選び5万VNDから定期預金を開設',
        ],
      },
    },
  },
  liobank: {
    id: 'liobank',
    parentBankFull: {
      vi: 'Ngân hàng TMCP Phương Đông (OCB)',
      en: 'Orient Commercial Joint Stock Bank (OCB)',
      ja: 'オリエント商業銀行（OCB）',
    },
    licenseRef: 'NHNN License · Trực thuộc OCB',
    securityCerts: ['PCI-DSS Level 1', 'ISO 27001 OCB Core', 'Sinh trắc học C06', '3D Secure 2.0 Thẻ 2in1'],
    depositVerification: {
      vi: 'Hợp đồng tiền gửi & CTKM công bố công khai PDF chính thức từ Liobank/OCB; tra cứu trực tiếp trên app.',
      en: 'Official savings tariffs & promo PDF terms published transparently by Liobank/OCB inside app & portal.',
      ja: 'Liobank/OCB公式PDF規約およびアプリ明細で預入条件・金利を透明に確認可能。',
    },
    emergencyHotline: '1800 558 818 (24/7)',
    cardLockFeature: {
      vi: 'Khóa thẻ vật lý/ảo, tắt thanh toán online hoặc quốc tế độc lập chỉ với 1 lần chạm.',
      en: 'Freeze physical/virtual card and toggle online/FX payments independently in 1 tap.',
      ja: '実カード・バーチャルカード・オンライン決済・外貨決済を1タップで個別にON/OFF可能。',
    },
    welcomeOffer: {
      badge: {
        vi: 'Thưởng 50.000đ thẻ 2in1 + CTKM lãi đến 8.2%/năm',
        en: '50,000đ 2-in-1 Card Bonus + Up to 8.2%/yr',
        ja: '5万VND特典＋キャンペーン最大年利8.2%',
      },
      title: {
        vi: 'Ưu đãi Thẻ 2in1 & Gửi Tiết Kiệm Liobank by OCB',
        en: 'Liobank by OCB Welcome Cashback & Savings Promo',
        ja: 'Liobank by OCB 新規カード特典＆定期優遇キャンペーン',
      },
      highlights: {
        vi: [
          'Nhận thưởng đến 50.000đ khi mở tài khoản qua mã giới thiệu & kích hoạt thẻ Liobank 2 trong 1 (ATM + Tín dụng)',
          'Hưởng CTKM cộng thêm lãi suất tiết kiệm có kỳ hạn lên đến 8.20%/năm (kỳ hạn 10–12T) & 8.00%/năm (6–9T)',
          'Tính năng tiết kiệm tự động Auto-Savings 3.5%/năm và Ống Heo Pigg 4.75%/năm làm tròn tiền lẻ từng giao dịch',
        ],
        en: [
          'Receive up to 50,000 VND welcome reward upon activating your referral account and 2-in-1 Liobank card',
          'Access promotional term deposit rates up to 8.20% p.a. (10–12M) and 8.00% p.a. (6–9M)',
          'Combine 3.5% Auto-Savings & 4.75% Pigg goal jars with automatic card spend round-ups',
        ],
        ja: [
          '紹介経由の口座開設＋2-in-1カード有効化で最大5万VNDのウェルカム特典',
          '定期預金優遇キャンペーンで10〜12ヶ月最大8.20%、6〜9ヶ月8.00%の金利適用対象',
          '3.5%自動運用＆4.75%貯金箱（Pigg）の端数自動積立機能を搭載',
        ],
      },
      steps: {
        vi: [
          'Tải app Liobank trên App Store / Google Play',
          'Nhập mã giới thiệu trước khi hoàn tất đăng ký tài khoản',
          'Định danh eKYC + quét NFC CCCD gắn chip trong 3 phút',
          'Kích hoạt thẻ Liobank hoặc gửi sổ từ 100.000đ để hưởng CTKM',
        ],
        en: [
          'Download Liobank from App Store / Google Play',
          'Enter referral code prior to finishing signup',
          'Verify NFC chip-ID & liveness selfie in ~3 minutes',
          'Activate card or open a 100,000+ VND deposit to unlock perks',
        ],
        ja: [
          '公式ストアからLiobankアプリをダウンロード',
          '登録完了前に紹介コードを入力',
          'NFCチップID＋セルフィー認証を約3分で実施',
          'カード有効化または10万VND以上の定期預金で特典獲得',
        ],
      },
    },
  },
  tnex: {
    id: 'tnex',
    parentBankFull: {
      vi: 'Ngân hàng TMCP Hàng Hải Việt Nam (MSB)',
      en: 'Vietnam Maritime Commercial Joint Stock Bank (MSB)',
      ja: 'ベトナム海事商業銀行（MSB）',
    },
    licenseRef: 'NHNN License · Hệ sinh thái MSB',
    securityCerts: ['PCI-DSS MSB Core', 'Smart OTP Nội bộ', 'NFC CCCD (QĐ 2345)', '5-No Free Banking'],
    depositVerification: {
      vi: 'Mỗi sổ tiết kiệm có mã hợp đồng điện tử lưu trên hệ thống MSB, cố định lãi suất suốt kỳ hạn từ ngày mở.',
      en: 'Each passbook receives a fixed-rate electronic contract ID anchored directly in MSB’s Core system.',
      ja: '開設時点でMSBコアシステム上に電子契約IDが付番され、満期まで金利が確定保証されます。',
    },
    emergencyHotline: '1800 599 982 (Miễn phí 24/7)',
    cardLockFeature: {
      vi: 'Quản lý giới hạn giao dịch & khóa thẻ/tài khoản 24/7 trực tiếp trên app TNEX.',
      en: 'Set transfer limits and lock card or account 24/7 right inside the TNEX app.',
      ja: 'TNEXアプリ内で送金上限設定およびカード・口座ロックを24時間即時管理可能。',
    },
    welcomeOffer: {
      badge: {
        vi: 'Thưởng 50.000đ mở TK + Khóa lãi Top 8.6%/năm',
        en: '50,000đ Welcome Bonus + 8.6%/yr Top Rate',
        ja: '5万VND特典＋業界トップ級8.6%固定',
      },
      title: {
        vi: 'Ưu đãi Bạn Mới & Tiết Kiệm Lãi Cao TNEX by MSB',
        en: 'TNEX by MSB Welcome Reward & Top-Yield Fixed Deposit',
        ja: 'TNEX by MSB 新規特典＆高利回り固定定期預金',
      },
      highlights: {
        vi: [
          'Nhận thưởng chào mừng 50.000đ vào tài khoản Energy/Thanh toán khi nhập mã giới thiệu & eKYC thành công',
          'Miễn trọn đời 5 loại phí (chuyển tiền, rút tiền ATM, thường niên, quản lý tài khoản, SMS/biến động app)',
          'Khóa ngay mức lãi suất niêm yết top đầu thị trường lên tới 8.40%/năm (6–9T) & 8.60%/năm (12–36T) từ chỉ 100.000đ',
        ],
        en: [
          'Earn a 50,000 VND welcome reward upon verified referral eKYC completion',
          'Zero fees across transfers, ATM withdrawals, card maintenance, and app alerts',
          'Lock market-leading fixed rates of 8.40% p.a. (6–9M) and 8.60% p.a. (12–36M) starting from 100,000 VND',
        ],
        ja: [
          '紹介コード＋eKYC完了で5万VNDのウェルカムボーナス付与',
          '振込手数料・ATM手数料・口座維持費など5つの基本手数料が完全無料',
          '10万VNDから6〜9ヶ月8.40%、12〜36ヶ月8.60%のトップクラス定期金利をロック可能',
        ],
      },
      steps: {
        vi: [
          'Tải app TNEX chính chủ (MSB) từ Store',
          'Đăng ký SĐT chính chủ & nhập mã giới thiệu TNEX',
          'Chụp CCCD + quét NFC & khuôn mặt sinh trắc học',
          'Nạp tối thiểu 100.000đ mở sổ 6M–12M khóa lãi suất cao',
        ],
        en: [
          'Install official TNEX app by MSB from your App Store',
          'Sign up with mobile number & enter TNEX referral code',
          'Scan chip-ID NFC & pass biometric facial verification',
          'Deposit from 100,000 VND into 6M–12M term to lock top yield',
        ],
        ja: [
          '公式ストアからTNEX（MSB）アプリをインストール',
          '携帯番号で登録しTNEX紹介コードを入力',
          'NFCチップIDスキャン＋顔認証を実施',
          '10万VND以上を入金し6〜12ヶ月定期で高金利を確定',
        ],
      },
    },
  },
};

export const USER_SECURITY_CHECKLIST = [
  {
    id: 'nfc-cccd',
    label: {
      vi: 'Đã cập nhật Sinh trắc học CCCD gắn chip (QĐ 2345) trên tất cả app ngân hàng số',
      en: 'Synced NFC chip-ID biometrics (SBV Decision 2345) across all active digital bank apps',
      ja: '利用中の全ネット銀行アプリでNFC国民ID生体認証（決定2345号）を登録済み',
    },
  },
  {
    id: 'separate-pin',
    label: {
      vi: 'Đặt mã PIN Smart OTP khác hoàn toàn mật khẩu mở khóa điện thoại & ngày sinh',
      en: 'Smart OTP PIN differs completely from phone unlock passcode and birthday',
      ja: 'Smart OTPのPINコードを端末ロック解除や生年月日と完全に分けている',
    },
  },
  {
    id: 'closed-loop-rule',
    label: {
      vi: 'Hiểu rõ tiền sổ tiết kiệm chỉ tất toán về Tài khoản chính chủ — luôn giữ hạn mức chuyển khoản hợp lý',
      en: 'Checked closed-loop settlement rule & configured sensible daily outward transfer limits',
      ja: '定期預金は本人普通口座のみへ戻る仕様を確認し、1日の出金上限を適正値に設定している',
    },
  },
  {
    id: 'official-store',
    label: {
      vi: 'Chỉ tải app từ App Store / Google Play chính chủ — không bấm link lạ hoặc cài file APK',
      en: 'Installed banking apps solely from official App Store / Google Play (never APK sideloads)',
      ja: '公式App Store / Google Playのみから導入し、不審リンクや野良APKは一切使わない',
    },
  },
  {
    id: 'diversify-banks',
    label: {
      vi: 'Phân bổ tiền gửi lớn qua 2–3 ngân hàng số (kèm Quỹ dự phòng tách sổ nhỏ) để tối ưu an toàn & lãi suất',
      en: 'Diversified large deposits across 2–3 digital banks with separate small emergency passbooks',
      ja: '高額資産は2〜3行に分散し、緊急資金用の小口定期を別枠で管理している',
    },
  },
];
