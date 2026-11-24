export const UNIKORN_PRODUCT_URL = 'https://unikorn.vn/p/vnsavingpro';
export const UNIKORN_EMBED_URL = 'https://unikorn.vn/p/vnsavingpro?ref=embed-vnsavingpro';
export const UNIKORN_BADGE_IMG_URL = 'https://unikorn.vn/api/widgets/badge/vnsavingpro?theme=light';

/**
 * Curated founding community recognitions.
 * Owner can add named Unikorn reviewers, bug hunters, or sponsors here directly anytime.
 */
export const VERIFIED_CONTRIBUTORS = [
  {
    id: 'unikorn-explorers',
    isDummyReference: true,
    name: {
      vi: '🤖 [Nhóm mẫu tham khảo] Cộng đồng Unikorn Explorers',
      en: '🤖 [Dummy Group Reference] Unikorn Explorers Community',
      ja: '🤖 [参考プレースホルダー] Unikorn Explorers コミュニティ',
    },
    role: {
      vi: 'Đồng hành ra mắt & góp ý sản phẩm',
      en: 'Launch Partners & Feedback Contributors',
      ja: 'ローンチ支援・フィードバック協力',
    },
    badgeTone: 'brand',
    tag: {
      vi: 'Nền tảng Unikorn.vn',
      en: 'Unikorn.vn Platform',
      ja: 'Unikorn.vn プラットフォーム',
    },
    impact: {
      vi: 'Đề xuất cải thiện giao diện trang chủ, trải nghiệm đa ngôn ngữ VI/EN/JA, bảng vinh danh cộng đồng và khả năng vuốt xem lộ trình theo năm.',
      en: 'Inspired our refreshed Homepage, VI/EN/JA localization, Hall of Fame page, and swipeable stage timeline explorer.',
      ja: 'トップページ刷新、3言語対応、コントリビューター表彰ページ、年次スワイプ操作の改善提案に貢献。',
    },
    link: UNIKORN_PRODUCT_URL,
  },
  {
    id: 'early-adopters-vn',
    isDummyReference: true,
    name: {
      vi: '🤖 [Nhóm mẫu tham khảo] Early Adopters & Beta Testers',
      en: '🤖 [Dummy Group Reference] Early Adopters & Beta Testers',
      ja: '🤖 [参考プレースホルダー] アーリーアダプター・βテスター',
    },
    role: {
      vi: 'Kiểm thử công thức lãi suất & đa thiết bị',
      en: 'Rate Formulas & Multi-Screen QA',
      ja: '金利計算ロジック・マルチ画面検証',
    },
    badgeTone: 'success',
    tag: {
      vi: 'Phản hồi thực chiến',
      en: 'Hands-on QA',
      ja: '実運用テスト',
    },
    impact: {
      vi: 'Đóng góp kịch bản thực tế cho Cá nhân / Cặp đôi / Gia đình, chế độ lấp Quỹ dự phòng trước (Fund-First), ngày thực tế TT14 NHNN và tối ưu màn hình gập Duo/Fold.',
      en: 'Contributed real-world scenarios for Individual/Couple/Family profiles, Fund-First Emergency Fund mode, SBV Circ. 14 day-count math, and Duo/Foldable layouts.',
      ja: '個人・カップル・家族モデル、緊急資金優先積立、中銀通達14号計算、折りたたみ端末対応の実践シナリオを提供。',
    },
    link: null,
  },
];

/**
 * Transparent ledger showing how community feedback turned into live releases.
 */
export const COMMUNITY_MILESTONES = [
  {
    version: 'v1.9.0.0',
    date: '20/11/2026',
    status: { vi: 'Mới phát hành', en: 'Just Shipped', ja: '最新リリース' },
    feedbackSource: {
      vi: 'Góp ý từ người dùng Kế hoạch & Cộng đồng Unikorn',
      en: 'Planner Users & Unikorn Community Requests',
      ja: 'プランナー利用者・Unikornコミュニティからの要望',
    },
    title: {
      vi: 'Vuốt/Slide lộ trình qua từng năm + Trang Vinh Danh & Unikorn Showcase',
      en: 'Swipe/Slide Stage Explorer + Contributors Showcase & Unikorn Integration',
      ja: 'スワイプ式年次スライダー＋コミュニティ表彰ページ・Unikorn連携',
    },
    detail: {
      vi: 'Thêm thanh trượt năm, nút mũi tên & vuốt trái/phải ngay trên Chi tiết lộ trình & Kệ sổ bậc thang; mở trang Vinh danh (/contributors) ghi nhận đóng góp thực tế.',
      en: 'Added year scrubber slider, chevron navigation, and horizontal touch/mouse swipe on Planner & Ladder stage shelves, plus public contributor recognition.',
      ja: '年次スライダー・左右スワイプ・マウスドラッグで証書明細をスムーズに移動でき、フィードバック協力者を表示する表彰ページを新設しました。',
    },
  },
  {
    version: 'v1.8.0.0',
    date: '20/11/2026',
    status: { vi: 'Đã phát hành', en: 'Shipped', ja: 'リリース済' },
    feedbackSource: {
      vi: 'Người dùng điện thoại gập & Tablet',
      en: 'Foldable & Tablet Feedback',
      ja: '折りたたみ端末・タブレット利用者からの要望',
    },
    title: {
      vi: 'Hệ thống Layout Đa Màn Hình (Mobile · Tablet · Duo / Fold · PC)',
      en: 'Unified Adaptive Layout with Duo / Foldable Book & Flex Postures',
      ja: 'マルチ画面統合レイアウト（Mobile・Tablet・Duo/折りたたみ・PC）',
    },
    detail: {
      vi: 'Hỗ trợ Galaxy Z Fold, iPhone Duo/Fold với tư thế Book 2 cột né bản lề và Flex Trên/Dưới.',
      en: 'Supports iPhone Duo/Fold, Galaxy Z Fold, and tablets with hinge-safe Book and Flex/Tabletop postures.',
      ja: 'Galaxy Fold・iPhone Duo向けにヒンジ回避のBook（左右）／Flex（上下）レイアウトを実装。',
    },
  },
  {
    version: 'v1.7.0.0',
    date: '19/11/2026',
    status: { vi: 'Đã phát hành', en: 'Shipped', ja: 'リリース済' },
    feedbackSource: {
      vi: 'Đề xuất mở rộng người dùng quốc tế & expats',
      en: 'Multilingual & Expat Requests',
      ja: '多言語・在住外国人からの要望',
    },
    title: {
      vi: 'Hỗ trợ đầy đủ 3 ngôn ngữ Việt · Anh · Nhật (VI · EN · JA)',
      en: 'Full 3-Language Localization (Vietnamese · English · Japanese)',
      ja: 'ベトナム語・英語・日本語の3言語完全対応',
    },
    detail: {
      vi: 'Bản địa hoá đồng bộ từ giao diện, đơn vị tiền tệ (tỷ/triệu · B/M/K · 億/万) đến phân tích phía Server API.',
      en: 'Synchronized UI, regional currency units, server API insights, and Google Docs/CSV exports across VI/EN/JA.',
      ja: 'UI、金額表記（億/万）、API診断コメント、帳票エクスポートまで3言語で統一。',
    },
  },
  {
    version: 'v1.5.5 – v1.6.0.0',
    date: '19/11/2026',
    status: { vi: 'Đã phát hành', en: 'Shipped', ja: 'リリース済' },
    feedbackSource: {
      vi: 'Người dùng gia đình trẻ & cặp đôi',
      en: 'Couples & Family Savers Feedback',
      ja: 'カップル・ファミリー世帯からの要望',
    },
    title: {
      vi: 'Tài chính Cá nhân / Cặp đôi / Gia đình & Đồng bộ Google Cloud',
      en: 'Individual / Couple / Family Planning & Google Cloud Sync',
      ja: '個人・カップル・家族別プラン設計＆Googleクラウド同期',
    },
    detail: {
      vi: 'Tách riêng thu nhập 2 người, lấp Quỹ dự phòng 4–12 tháng trước khi tích luỹ, Stress-test và lưu nhiều kịch bản.',
      en: 'Added 2-earner splits, 4–12M Emergency Fund Fund-First priority, breadwinner stress-tests, and Supabase Cloud save.',
      ja: '2人の収入配分、緊急防衛資金の先行積立、収入減少ストレステスト、クラウド保存を追加。',
    },
  },
];
