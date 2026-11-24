// ============================================================
// CÂY KẾ HOẠCH TÀI SẢN VIỆT NAM (14 LOÀI) & QUẢ BÍ ẨN (VI / EN / JA)
// Thuộc tính & chu kỳ sinh trưởng gắn liền với số năm mục tiêu
// ============================================================

export const VIETNAM_WEALTH_TREES = [
  {
    id: 'sen_dong_thap',
    emoji: '🪷',
    minYears: 0.25,
    maxYears: 1,
    idealYears: 0.5,
    name: {
      vi: 'Sen Hồng Tháp Mười — Đồng Tháp',
      en: 'Dong Thap Pink Lotus',
      ja: 'ドンタップ産ピンク蓮の花',
    },
    region: {
      vi: 'Đồng Tháp Mười · Miền Tây',
      en: 'Dong Thap Wetland (Mekong)',
      ja: 'ドンタップ省（メコン湿地帯）',
    },
    horizonBadge: {
      vi: 'Siêu ngắn 3 – 12 tháng',
      en: 'Sprint 3 – 12 Months',
      ja: '超短期 3〜12ヶ月',
    },
    attributes: {
      vi: {
        rhythm: 'Vươn mầm từ bùn, bung nở cực nhanh trong 1 mùa nước',
        resilience: 'Giữ tiền mặt sạch sẽ, không vương bận nợ ngắn hạn',
        fitGoal: 'Quỹ đệm 3–6 tháng, quỹ du lịch hoặc khóa học mới',
      },
      en: {
        rhythm: 'Rises fast from water, blooms within one harvest season',
        resilience: 'Clean liquid buffer free from short-term consumer debt',
        fitGoal: '3–6 Month Starter Cushion, Trip or Upskilling Fund',
      },
      ja: {
        rhythm: '水中から一気に花を咲かせる最短サイクル',
        resilience: '短期負債のないクリーンな流動性資金を確保',
        fitGoal: '3〜6ヶ月分の初期クッション・旅行・スキル投資',
      },
    },
    description: {
      vi: 'Loài hoa thuần khiết vươn mình nhanh chóng chỉ trong 3–12 tháng — hoàn hảo cho những mục tiêu tiết kiệm cấp tốc đầu tiên.',
      en: 'Pure blooming lotus thriving in just 3–12 months — built for rapid starter savings sprints and liquid cushions.',
      ja: 'わずか3〜12ヶ月で美しい蓮華を咲かせる、短期集中の貯蓄スタートに最適な品種です。',
    },
    visual: {
      style: 'lotus',
      trunkColor: '#15803d',
      canopyColor: '#22c55e',
      canopyDark: '#14532d',
      flowerColor: '#f472b6',
      fruitColor: '#fb7185',
      glowColor: 'rgba(244, 114, 182, 0.5)',
    },
    mysteryFruitId: 'fruit_lien_hoa_ngoc',
  },
  {
    id: 'quat_tu_lien',
    emoji: '🍊',
    minYears: 0.5,
    maxYears: 1.5,
    idealYears: 1,
    name: {
      vi: 'Quất (Tắc) Cảnh Tứ Liên — Hà Nội',
      en: 'Tu Lien Golden Kumquat — Hanoi',
      ja: 'ハノイ・トゥーリエン金柑',
    },
    region: {
      vi: 'Tứ Liên · Tây Hồ · Hà Nội',
      en: 'West Lake, Hanoi',
      ja: 'ハノイ市タイ湖（西湖）',
    },
    horizonBadge: {
      vi: 'Ngắn hạn 0.5 – 1.5 năm',
      en: 'Short-Term 0.5 – 1.5 Yrs',
      ja: '短期 0.5〜1.5年',
    },
    attributes: {
      vi: {
        rhythm: 'Lá xanh, hoa trắng, quả chín vàng rực đón Tết sum vầy',
        resilience: 'Tạo dòng tiền gối đầu liên tục qua các kỳ hạn 6T–12T',
        fitGoal: 'Quỹ Tết sung túc, trả hết thẻ tín dụng hoặc mua laptop/xe máy',
      },
      en: {
        rhythm: 'Evergreen foliage bursting with clusters of golden citrus',
        resilience: 'Ideal for 6M–12M rotating digital bank passbooks',
        fitGoal: 'Tet Holiday Reserve, Device Upgrade or Motorbike Fund',
      },
      ja: {
        rhythm: '緑の葉と黄金色の果実が同時に実る縁起木',
        resilience: '6ヶ月〜12ヶ月定期預金の回転運用にぴったり',
        fitGoal: 'テト賞与防衛・家電購入・バイク資金',
      },
    },
    description: {
      vi: 'Tượng trưng cho tài lộc sum suê quanh năm: quả vàng chen chúc trên từng cành nhỏ sau 12 tháng chăm góp đều đặn.',
      en: 'Symbol of year-round abundance: dozens of golden kumquats pack every branch once your 12-month goal finishes.',
      ja: '1年の堅実な積立のあとに枝いっぱいの黄金の実がなる招福の木です。',
    },
    visual: {
      style: 'bushy',
      trunkColor: '#78350f',
      canopyColor: '#16a34a',
      canopyDark: '#14532d',
      flowerColor: '#ffffff',
      fruitColor: '#fb923c',
      glowColor: 'rgba(251, 146, 60, 0.5)',
    },
    mysteryFruitId: 'fruit_kim_quat_cat_tuong',
  },
  {
    id: 'thanh_long',
    emoji: '🌵',
    minYears: 0.5,
    maxYears: 2,
    idealYears: 1.5,
    name: {
      vi: 'Cây Thanh Long Bình Thuận',
      en: 'Binh Thuan Dragon Fruit',
      ja: 'ビントゥアン産ドラゴンフルーツ',
    },
    region: {
      vi: 'Duyên hải Nam Trung Bộ (Bình Thuận)',
      en: 'Binh Thuan Coast',
      ja: 'ビントゥアン沿岸部',
    },
    horizonBadge: {
      vi: 'Ngắn hạn 1 – 2 năm',
      en: 'Short-Term 1 – 2 Yrs',
      ja: '短期 1〜2年',
    },
    attributes: {
      vi: {
        rhythm: 'Ra hoa & kết trái cực nhanh',
        resilience: 'Chịu hạn tốt · Giữ thanh khoản cao',
        fitGoal: 'Quỹ dự phòng khẩn cấp 4–12 tháng',
      },
      en: {
        rhythm: 'Rapid bloom & early fruit cycle',
        resilience: 'Drought-proof · High liquidity buffer',
        fitGoal: '4–12 Month Emergency Fund',
      },
      ja: {
        rhythm: '開花・結実が極めて早い',
        resilience: '乾燥に強く高い流動性を維持',
        fitGoal: '4〜12ヶ月分の緊急防衛資金',
      },
    },
    description: {
      vi: 'Giống cây vươn mầm nhanh, cho trái chỉ sau 1–2 năm chăm tưới đều đặn — biểu tượng cho Quỹ dự phòng hoặc mục tiêu tiết kiệm ngắn hạn.',
      en: 'Fast-sprouting heritage cactus bearing fruit in just 1–2 years — ideal for Emergency Funds and agile short-term goals.',
      ja: '1〜2年で結実する成長の早い品種で、緊急資金や短期目標の達成に最適です。',
    },
    visual: {
      style: 'pillar',
      trunkColor: '#3f7d44',
      canopyColor: '#4ade80',
      canopyDark: '#166534',
      flowerColor: '#fef9c3',
      fruitColor: '#fb7185',
      glowColor: 'rgba(251, 113, 133, 0.45)',
    },
    mysteryFruitId: 'fruit_ngoc_thanh_long',
  },
  {
    id: 'dao_nhat_tan',
    emoji: '🌸',
    minYears: 1,
    maxYears: 2.5,
    idealYears: 2,
    name: {
      vi: 'Đào Bích Nhật Tân — Sông Hồng',
      en: 'Nhat Tan Crimson Peach Blossom',
      ja: '紅河デルタ・ニャッタン桃の木',
    },
    region: {
      vi: 'Nhật Tân · Bãi bồi Sông Hồng',
      en: 'Red River Alluvial Plain',
      ja: 'ハノイ・ニャッタン花村',
    },
    horizonBadge: {
      vi: 'Ngắn hạn 1 – 2.5 năm',
      en: 'Short-Term 1 – 2.5 Yrs',
      ja: '短期 1〜2.5年',
    },
    attributes: {
      vi: {
        rhythm: 'Cành thế thanh thoát · Nở hoa bích hồng báo khởi đầu mới',
        resilience: 'Vững vàng qua mùa đông lạnh để bung nở rực rỡ đúng hẹn',
        fitGoal: 'Quỹ lễ cưới, tuần trăng mật hoặc vốn khởi nghiệp nhỏ',
      },
      en: {
        rhythm: 'Graceful branches bursting into vivid crimson spring blooms',
        resilience: 'Endures quiet winter accumulation to bloom right on time',
        fitGoal: 'Wedding Plan, Honeymoon or Seed Side-Project Capital',
      },
      ja: {
        rhythm: '美しい枝ぶりに濃紅色の桃の花が咲き誇る',
        resilience: '冬の地道な積立を経て春に満開を迎える忍耐強さ',
        fitGoal: '結婚資金・新婚旅行・副業初期投資',
      },
    },
    description: {
      vi: 'Sắc đào thắm bên phù sa sông Hồng: thích hợp cho cặp đôi hoặc người trẻ tích lũy 1–2.5 năm cho bước ngoặt mới.',
      en: 'Iconic Red River peach tree symbolizing fresh beginnings and romantic milestones across a 1–2.5 year plan.',
      ja: '紅河の肥沃な土壌に育つ桃の木。カップルの結婚や新生活スタート（1〜2.5年計画）を祝います。',
    },
    visual: {
      style: 'bonsai',
      trunkColor: '#5c3a21',
      canopyColor: '#f472b6',
      canopyDark: '#be185d',
      flowerColor: '#fbcfe8',
      fruitColor: '#fb7185',
      glowColor: 'rgba(244, 114, 182, 0.55)',
    },
    mysteryFruitId: 'fruit_dao_tien_truong_tho',
  },
  {
    id: 'dua_xiem_ben_tre',
    emoji: '🥥',
    minYears: 2,
    maxYears: 3.5,
    idealYears: 2.5,
    name: {
      vi: 'Dừa Xiêm Xanh Bến Tre',
      en: 'Ben Tre Sweet Siam Coconut',
      ja: 'ベンチェ産グリーンココナッツ',
    },
    region: {
      vi: 'Cù lao Bảo · Bến Tre',
      en: 'Ben Tre River Islands',
      ja: 'ベンチェ省メコン中洲',
    },
    horizonBadge: {
      vi: 'Ngắn–Trung hạn 2 – 3.5 năm',
      en: 'Short-Med 2 – 3.5 Yrs',
      ja: '短中期 2〜3.5年',
    },
    attributes: {
      vi: {
        rhythm: 'Thân dẻo dai uốn theo gió biển · Cho buồng trái ngọt liên tiếp',
        resilience: 'Chống chọi biến động thu nhập nhờ bộ rễ chùm bám sâu',
        fitGoal: 'Quỹ mua ô tô gia đình hoặc nâng cấp bậc thang 24M–36M',
      },
      en: {
        rhythm: 'Supple tall trunk yielding sweet clusters month after month',
        resilience: 'Fibrous root network resists windstorms & income shocks',
        fitGoal: 'Family Car Fund or 24M–36M Ladder Upgrade',
      },
      ja: {
        rhythm: '潮風にしなやかに耐え、甘い実を連続して実らせる',
        resilience: '収入変動にも揺るがない強靭な根張り',
        fitGoal: 'マイカー資金・24〜36ヶ月定期ラダー拡張',
      },
    },
    description: {
      vi: 'Dáng dừa miền Tây vươn cao đón nắng gió sông Cửu Long, mang lại nguồn quả ngọt mát đều đặn trong 2–3.5 năm.',
      en: 'Breezy Mekong coconut palm built for flexible 2–3.5 year plans with reliable quarterly compound returns.',
      ja: 'メコン川の風を受けて育つヤシの木。2〜3.5年の中期目標を爽やかにサポートします。',
    },
    visual: {
      style: 'palm',
      trunkColor: '#785233',
      canopyColor: '#22c55e',
      canopyDark: '#15803d',
      flowerColor: '#fef3c7',
      fruitColor: '#4ade80',
      glowColor: 'rgba(74, 222, 128, 0.5)',
    },
    mysteryFruitId: 'fruit_dua_ngoc_bich',
  },
  {
    id: 'ca_phe',
    emoji: '☕',
    minYears: 2,
    maxYears: 4,
    idealYears: 3,
    name: {
      vi: 'Cây Cà Phê Robusta Tây Nguyên',
      en: 'Central Highlands Robusta Coffee',
      ja: '中部高原ロブスタコーヒーの木',
    },
    region: {
      vi: 'Đắk Lắk · Lâm Đồng (Đất đỏ bazan)',
      en: 'Central Highlands Basalt',
      ja: '中部高原（ダクラク）',
    },
    horizonBadge: {
      vi: 'Ngắn–Trung hạn 2 – 4 năm',
      en: 'Short-Med 2 – 4 Yrs',
      ja: '短中期 2〜4年',
    },
    attributes: {
      vi: {
        rhythm: 'Rễ cọc cắm sâu · Hoa trắng nở rộ theo mùa',
        resilience: 'Bền bỉ kỷ luật gửi góp hàng tháng',
        fitGoal: 'Quỹ cưới, mua xe, dự phòng nhảy việc',
      },
      en: {
        rhythm: 'Deep taproot · Seasonal white blossom burst',
        resilience: 'Thrives on steady monthly contributions',
        fitGoal: 'Wedding, motorbike/car, career buffer',
      },
      ja: {
        rhythm: '深い直根と白い花の開花サイクル',
        resilience: '毎月のコツコツ積立で安定成長',
        fitGoal: '結婚・車両購入・キャリア資金',
      },
    },
    description: {
      vi: 'Bám rễ sâu trên đất đỏ bazan Tây Nguyên, nở hoa trắng tinh khôi vào năm 2–3 trước khi kết chùm quả đỏ mọng.',
      en: 'Anchors deep in red basalt soil, bursting into fragrant white blossoms before yielding rich ruby cherries by Year 3–4.',
      ja: '赤土に根を張り2〜3年目で白い花を咲かせ、3〜4年目で豊かな実を結びます。',
    },
    visual: {
      style: 'bushy',
      trunkColor: '#78350f',
      canopyColor: '#22c55e',
      canopyDark: '#14532d',
      flowerColor: '#ffffff',
      fruitColor: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.45)',
    },
    mysteryFruitId: 'fruit_hat_ngoc_bazan',
  },
  {
    id: 'vai_thieu_luc_ngan',
    emoji: '🍒',
    minYears: 3,
    maxYears: 5,
    idealYears: 3.8,
    name: {
      vi: 'Vải Thiều Lục Ngạn — Bắc Giang',
      en: 'Luc Ngan Crimson Lychee — Bac Giang',
      ja: 'バクザン産ルックガンライチ',
    },
    region: {
      vi: 'Đồi sỏi Lục Ngạn · Bắc Giang',
      en: 'Luc Ngan Hills (Northern VN)',
      ja: 'バクザン省丘陵地',
    },
    horizonBadge: {
      vi: 'Trung hạn 3 – 5 năm',
      en: 'Medium-Term 3 – 5 Yrs',
      ja: '中期 3〜5年',
    },
    attributes: {
      vi: {
        rhythm: 'Tán tròn xanh sẫm · Chín rộ đỏ tươi mỗi đầu hạ',
        resilience: 'Sinh trưởng khỏe trên đồi dốc · Rất nhạy với gửi tăng tốc',
        fitGoal: 'Quỹ học thạc sĩ, nâng cấp nhà ở hoặc tài sản đầu tay 400tr–1 tỷ',
      },
      en: {
        rhythm: 'Lush dome canopy bursting into vivid scarlet lychee clusters',
        resilience: 'Resilient hillside roots · High reward for bonus check-ins',
        fitGoal: 'Master’s Degree, Home Upgrade or 400M–1B Milestone',
      },
      ja: {
        rhythm: '濃い緑の丸い樹冠に真紅のライチが鈴なりに実る',
        resilience: '追加積立ボーナスへの成長感度が非常に高い品種',
        fitGoal: '進学・住まいアップグレード・4億〜10億VND目標',
      },
    },
    description: {
      vi: 'Vùng đồi Bắc Giang trù phú: mỗi khi bạn gửi kèm tiền thưởng Tết vào cây vải thiều, cả tán cây bật chùm quả đỏ rực.',
      en: 'Northern Vietnam’s prized scarlet orchard tree — adding annual bonuses makes its canopy burst with crimson fruit.',
      ja: '北部名産のライチの樹。賞与などの臨時入金を加えると真っ赤な実が一斉に実ります。',
    },
    visual: {
      style: 'broad',
      trunkColor: '#5c3a21',
      canopyColor: '#16a34a',
      canopyDark: '#14532d',
      flowerColor: '#fef9c3',
      fruitColor: '#e11d48',
      glowColor: 'rgba(225, 29, 72, 0.5)',
    },
    mysteryFruitId: 'fruit_vai_rong_do',
  },
  {
    id: 'xoai_hoa_loc',
    emoji: '🥭',
    minYears: 3,
    maxYears: 5,
    idealYears: 4,
    name: {
      vi: 'Cây Xoài Cát Hòa Lộc — Tiền Giang',
      en: 'Hoa Loc Sweet Mango — Tien Giang',
      ja: 'ティエンザン産ホアロックマンゴー',
    },
    region: {
      vi: 'Đồng bằng Sông Cửu Long (Tiền Giang)',
      en: 'Mekong Delta (Tien Giang)',
      ja: 'メコンデルタ（ティエンザン省）',
    },
    horizonBadge: {
      vi: 'Trung hạn 3 – 5 năm',
      en: 'Medium-Term 3 – 5 Yrs',
      ja: '中期 3〜5年',
    },
    attributes: {
      vi: {
        rhythm: 'Tán rộng sum suê · Sai trĩu quả vàng',
        resilience: 'Tích lũy lãi kép bắt đầu tăng tốc mạnh',
        fitGoal: 'Vốn đối ứng mua nhà 500tr – 1.5 tỷ',
      },
      en: {
        rhythm: 'Broad canopy · Golden sweet harvest',
        resilience: 'Compound interest visibly accelerates',
        fitGoal: '500M – 1.5B Home Down Payment',
      },
      ja: {
        rhythm: '豊かな樹冠と黄金色の果実',
        resilience: '複利効果が加速し始める時期',
        fitGoal: '住宅頭金 5億〜15億VND目標',
      },
    },
    description: {
      vi: 'Đặc sản trứ danh phù sa sông Tiền: cây càng được chăm tưới vượt mức, tán càng xòe rộng và đơm chùm xoài vàng óng.',
      en: 'Iconic Mekong River orchard tree whose golden canopy expands rapidly whenever you top up beyond your plan.',
      ja: 'メコン川流域の名木。計画以上の積立で樹冠が大きく広がり、黄金の果実が実ります。',
    },
    visual: {
      style: 'broad',
      trunkColor: '#713f12',
      canopyColor: '#16a34a',
      canopyDark: '#14532d',
      flowerColor: '#fde047',
      fruitColor: '#facc15',
      glowColor: 'rgba(250, 204, 21, 0.5)',
    },
    mysteryFruitId: 'fruit_xoai_kim_cuong',
  },
  {
    id: 'vusua_lo_ren',
    emoji: '🟣',
    minYears: 4,
    maxYears: 6,
    idealYears: 5,
    name: {
      vi: 'Vú Sữa Lò Rèn Vĩnh Kim — Tiền Giang',
      en: 'Vinh Kim Star Apple — Tien Giang',
      ja: 'ヴィンキム産スターアップル',
    },
    region: {
      vi: 'Vĩnh Kim · Châu Thành · Tiền Giang',
      en: 'Vinh Kim, Mekong Delta',
      ja: 'ティエンザン省ヴィンキム',
    },
    horizonBadge: {
      vi: 'Trung–Dài hạn 4 – 6 năm',
      en: 'Mid-Term 4 – 6 Yrs',
      ja: '中長期 4〜6年',
    },
    attributes: {
      vi: {
        rhythm: 'Lá óng ánh sắc đồng · Trái tròn mọng ngọt lành như dòng sữa',
        resilience: 'Bảo bọc che chở cho quỹ sinh con & giáo dục mầm non',
        fitGoal: 'Quỹ nuôi con & học vấn tiểu học 5 năm',
      },
      en: {
        rhythm: 'Silky bronze-green leaves · Milky-sweet round fruits',
        resilience: 'Nurturing canopy protecting early parenting & family funds',
        fitGoal: 'Child-Rearing & 5-Year Family Education Reserve',
      },
      ja: {
        rhythm: '葉の裏が金色に輝く優美な樹冠と甘い丸い果実',
        resilience: '子育て・初期教育資金を優しく守り育てる木',
        fitGoal: '子育て・5年間の教育積立プラン',
      },
    },
    description: {
      vi: 'Biểu tượng của sự chở che và tình thân gia đình miền Tây, thích hợp cho cha mẹ nuôi dưỡng quỹ học vấn 4–6 năm.',
      en: 'Symbol of maternal care in Southern Vietnam, built for parents steadily nurturing a 4–6 year family nest egg.',
      ja: '家族への深い愛情の象徴であり、4〜6年かけて子どもや家族の未来を育てるプランに最適です。',
    },
    visual: {
      style: 'broad',
      trunkColor: '#5c4033',
      canopyColor: '#0d9488',
      canopyDark: '#115e59',
      flowerColor: '#e0e7ff',
      fruitColor: '#a855f7',
      glowColor: 'rgba(168, 85, 247, 0.5)',
    },
    mysteryFruitId: 'fruit_vusua_ngan_ha',
  },
  {
    id: 'buoi_da_xanh',
    emoji: '🍏',
    minYears: 4,
    maxYears: 7,
    idealYears: 5.5,
    name: {
      vi: 'Cây Bưởi Da Xanh Bến Tre',
      en: 'Ben Tre Green Pomelo',
      ja: 'ベンチェ産グリーンポメロ（文旦）',
    },
    region: {
      vi: 'Xứ dừa Bến Tre · Miền Tây',
      en: 'Ben Tre Mekong',
      ja: 'ベンチェ省',
    },
    horizonBadge: {
      vi: 'Trung–Dài hạn 4 – 7 năm',
      en: 'Mid-Long 4 – 7 Yrs',
      ja: '中長期 4〜7年',
    },
    attributes: {
      vi: {
        rhythm: 'Hoa bưởi thơm ngát · Cho trái quanh năm',
        resilience: 'Cân bằng hoàn hảo cho kế hoạch Cặp đôi & Gia đình',
        fitGoal: 'Quỹ giáo dục con cái & mở rộng tổ ấm',
      },
      en: {
        rhythm: 'Fragrant blossoms · Year-round fruiting',
        resilience: 'Balanced resilience for Couples & Families',
        fitGoal: 'Child Education & Family Milestone',
      },
      ja: {
        rhythm: '香り高い花と通年の安定した実り',
        resilience: 'カップル・家族の長期バランス運用に最適',
        fitGoal: '教育資金・家族のマイルストーン',
      },
    },
    description: {
      vi: 'Loài cây biểu tượng cho sự sung túc của gia đình miền Tây, thích hợp cho cặp đôi và gia đình tích sản bậc thang 4–7 năm.',
      en: 'Symbol of family prosperity in the Mekong Delta, built for disciplined 4–7 year couple and family wealth ladders.',
      ja: '家族の繁栄の象徴であり、4〜7年の堅実な世帯資産形成に寄り添う樹木です。',
    },
    visual: {
      style: 'broad',
      trunkColor: '#5c4033',
      canopyColor: '#10b981',
      canopyDark: '#065f46',
      flowerColor: '#f8fafc',
      fruitColor: '#4ade80',
      glowColor: 'rgba(52, 211, 153, 0.5)',
    },
    mysteryFruitId: 'fruit_ngoc_xanh_ben_tre',
  },
  {
    id: 'sau_rieng_ri6',
    emoji: '🍈',
    minYears: 5,
    maxYears: 10,
    idealYears: 7.5,
    name: {
      vi: 'Cây Sầu Riêng Ri6 Vĩnh Long',
      en: 'Vinh Long Ri6 Durian',
      ja: 'ヴィンロン産Ri6ドリアンの大樹',
    },
    region: {
      vi: 'Vĩnh Long · Cái Mơn · Đông Nam Bộ',
      en: 'Vinh Long & Southeast VN',
      ja: 'ヴィンロン省・東南部',
    },
    horizonBadge: {
      vi: 'Dài hạn 5 – 10 năm ("Cây tiền tỷ")',
      en: 'Long-Term 5 – 10 Yrs',
      ja: '長期 5〜10年',
    },
    attributes: {
      vi: {
        rhythm: 'Kiến thiết lâu năm · Giá trị thu hoạch cực lớn',
        resilience: 'Đòi hỏi kiên trì 5+ năm trước khi bứt phá ngoạn mục',
        fitGoal: 'Thu nhập thụ động 15–30tr/tháng · Cây tiền tỷ',
      },
      en: {
        rhythm: 'Patient early growth · Massive harvest value',
        resilience: 'Rewards 5+ years of steady compounding discipline',
        fitGoal: '15–30M/mo Passive Income Engine',
      },
      ja: {
        rhythm: '初期育成は堅実・収穫価値は特大',
        resilience: '5年以上の継続積立で複利が爆発的に拡大',
        fitGoal: '月1,500万〜3,000万VNDの不労所得基盤',
      },
    },
    description: {
      vi: 'Mệnh danh "Vua trái cây" cần sự kiên nhẫn chăm bẵm qua nhiều mùa mưa nắng, nhưng khi kết trái sẽ mang lại mùa vàng rực rỡ.',
      en: 'Known as Vietnam’s King of Fruits: slow and steady during years 1–3, then exploding into high-value golden yields.',
      ja: '果物の王様と呼ばれ、序盤の忍耐強い育成の後に圧倒的な果実をもたらす長期資産樹です。',
    },
    visual: {
      style: 'tall',
      trunkColor: '#52341e',
      canopyColor: '#15803d',
      canopyDark: '#052e16',
      flowerColor: '#fef08a',
      fruitColor: '#eab308',
      glowColor: 'rgba(234, 179, 8, 0.55)',
    },
    mysteryFruitId: 'fruit_hoang_kim_ri6',
  },
  {
    id: 'che_shan_tuyet',
    emoji: '🍵',
    minYears: 6,
    maxYears: 12,
    idealYears: 8.5,
    name: {
      vi: 'Chè Shan Tuyết Cổ Thụ — Hà Giang',
      en: 'Ancient Shan Tuyet Tea — Ha Giang',
      ja: 'ハザン省・古樹シャントゥエット茶',
    },
    region: {
      vi: 'Tây Côn Lĩnh · Suối Giàng · Tây Bắc',
      en: 'Northern Cloud Mountains (1,400m+)',
      ja: '北部高山地帯（ハザン・イエンバイ）',
    },
    horizonBadge: {
      vi: 'Dài hạn 6 – 12 năm',
      en: 'Long-Term 6 – 12 Yrs',
      ja: '長期 6〜12年',
    },
    attributes: {
      vi: {
        rhythm: 'Thân mốc trắng cổ thụ sừng sững giữa mây mù Tây Bắc',
        resilience: 'Bất chấp sương giá và biến động lãi suất ngắn hạn',
        fitGoal: 'Tích sản dài hạn 6–12 năm · An tâm trước biến cố kinh tế',
      },
      en: {
        rhythm: 'Snow-white moss-clad trunk thriving above the clouds',
        resilience: 'Unaffected by frost or short-term rate fluctuations',
        fitGoal: '6–12 Year Inflation-Beating Wealth Sanctuary',
      },
      ja: {
        rhythm: '雲上の高山で白雪のような新芽を芽吹かせる百年の古茶樹',
        resilience: '短期金利の波に動じない鉄壁の長期分散資産',
        fitGoal: '6〜12年のインフレ対抗・長期資産保全',
      },
    },
    description: {
      vi: 'Sống ở độ cao trên 1.400m giữa núi rừng Hà Giang, càng lâu năm búp chè phủ tuyết càng đượm hương thanh khiết và giá trị.',
      en: 'Growing above 1,400m in Ha Giang’s misty peaks, its silver-tipped buds gain deeper value with every passing year.',
      ja: '標高1,400m以上の雲海で育ち、年を重ねるほど希少な白茶の芽を増やす高山古樹です。',
    },
    visual: {
      style: 'bonsai',
      trunkColor: '#78716c',
      canopyColor: '#34d399',
      canopyDark: '#065f46',
      flowerColor: '#f8fafc',
      fruitColor: '#e2e8f0',
      glowColor: 'rgba(226, 232, 240, 0.5)',
    },
    mysteryFruitId: 'fruit_bach_tra_van_nam',
  },
  {
    id: 'tre_nga_thanh_giong',
    emoji: '🎋',
    minYears: 8,
    maxYears: 25,
    idealYears: 12,
    name: {
      vi: 'Tre Ngà Thánh Gióng — Phù Đổng',
      en: 'Phu Dong Golden Ivory Bamboo',
      ja: 'フードン聖ギオンの黄金竹',
    },
    region: {
      vi: 'Đền Sóc · Phù Đổng · Đồng bằng Bắc Bộ',
      en: 'Soc Son & Red River Heritage',
      ja: '北部伝統文化圏（ソクソン）',
    },
    horizonBadge: {
      vi: 'Trường tồn 8 – 25 năm',
      en: 'Enduring 8 – 25 Yrs',
      ja: '超長期 8〜25年',
    },
    attributes: {
      vi: {
        rhythm: '4 năm đầu bén rễ ngầm sâu thẳm, từ năm 5 vươn đốt thần tốc',
        resilience: 'Dẻo dai không gãy trước bão giông tài chính',
        fitGoal: 'Hành trình Bán Tự Do Tài Chính (Coast FIRE 10–15 năm)',
      },
      en: {
        rhythm: 'Builds deep underground rhizomes first, then shoots skyward fast',
        resilience: 'Bends with economic storms without ever snapping',
        fitGoal: '10–15 Year Coast FIRE & Self-Reliance Fortress',
      },
      ja: {
        rhythm: '最初の数年で地下茎を広げ、その後驚異的な速度で空へ伸びる',
        resilience: '嵐にしなっても決して折れない強靭な家計基盤',
        fitGoal: '10〜15年のセミリタイア（Coast FIRE）設計',
      },
    },
    description: {
      vi: 'Giống tre vàng óng gắn với truyền thuyết giữ nước: âm thầm đan rễ những năm đầu rồi bứt tốc vươn cao không gì cản nổi.',
      en: 'Legendary golden bamboo: quietly weaves deep roots in early years before shooting upward with unstoppable compound momentum.',
      ja: '伝説に彩られた黄金の竹。序盤の根張り期を超えると複利の力で一気に空へ突き抜けます。',
    },
    visual: {
      style: 'bamboo',
      trunkColor: '#eab308',
      canopyColor: '#22c55e',
      canopyDark: '#15803d',
      flowerColor: '#fef08a',
      fruitColor: '#facc15',
      glowColor: 'rgba(250, 204, 21, 0.55)',
    },
    mysteryFruitId: 'fruit_mang_vang_phu_dong',
  },
  {
    id: 'mai_tram_huong',
    emoji: '🌼',
    minYears: 10,
    maxYears: 40,
    idealYears: 15,
    name: {
      vi: 'Cây Mai Vàng & Trầm Hương Di Sản',
      en: 'Golden Apricot & Heritage Agarwood',
      ja: '黄金の梅（ホアマイ）＆沈香の遺産樹',
    },
    region: {
      vi: 'Huế · Quảng Nam · Yên Tử',
      en: 'Central Heritage Highlands',
      ja: 'フエ・クアンナム・イエントゥ',
    },
    horizonBadge: {
      vi: 'Di sản & FIRE 10 – 40 năm',
      en: 'Legacy & FIRE 10+ Yrs',
      ja: '超長期・FIRE 10年+',
    },
    attributes: {
      vi: {
        rhythm: 'Thân cổ thụ vững chãi · Tích tụ trầm quý theo thập kỷ',
        resilience: 'Sức mạnh lãi kép hàng thập kỷ vượt mọi lạm phát',
        fitGoal: 'Tự do tài chính FIRE & Quỹ di sản gia đình',
      },
      en: {
        rhythm: 'Ancient trunk · Value deepens across decades',
        resilience: 'Multi-decade compounding beats long-term inflation',
        fitGoal: 'Financial Independence (FIRE) & Legacy',
      },
      ja: {
        rhythm: '数十年の歳月をかけて価値が深まる名木',
        resilience: '長期複利がインフレを超越する盤石な資産形成',
        fitGoal: '経済的自立（FIRE）・世代継承資産',
      },
    },
    description: {
      vi: 'Càng tích lũy dài lâu, lõi gỗ càng kết trầm quý giá và cành nhánh trổ hoa vàng rực rỡ — biểu tượng cho tự do tài chính bền vững.',
      en: 'A multi-decade Vietnamese heritage tree whose golden blossoms and prized heartwood reward lifelong financial discipline.',
      ja: '歳月を重ねるほど黄金の花と貴重な香木を宿す、永続的な経済的自立の象徴です。',
    },
    visual: {
      style: 'bonsai',
      trunkColor: '#451a03',
      canopyColor: '#22c55e',
      canopyDark: '#064e3b',
      flowerColor: '#fbbf24',
      fruitColor: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.6)',
    },
    mysteryFruitId: 'fruit_ky_nam_truyen_doi',
  },
];

export const MYSTERY_FRUITS = {
  fruit_lien_hoa_ngoc: {
    id: 'fruit_lien_hoa_ngoc',
    emoji: '🪷',
    rarity: { vi: 'Tinh Khôi · Mùa Hoa Đầu', en: 'Pure · First Bloom', ja: '清純・初開花' },
    name: {
      vi: 'Đài Sen Ngọc Liên Hoa',
      en: 'Jade Lotus Crown Seed',
      ja: '翡翠蓮華の宝冠',
    },
    lore: {
      vi: 'Phần thưởng cho người hoàn thành mục tiêu tiết kiệm ngắn hạn đầu tiên sạch sẽ, đúng hẹn!',
      en: 'Awarded to savers who conquer their very first short-term liquid sprint cleanly!',
      ja: '最初の短期積立スプリントを完璧に完走した記念の純白な蓮の宝冠です。',
    },
  },
  fruit_kim_quat_cat_tuong: {
    id: 'fruit_kim_quat_cat_tuong',
    emoji: '🧧',
    rarity: { vi: 'Cát Tường · Đón Lộc Tết', en: 'Auspicious · Golden Harvest', ja: '吉祥・新春招福' },
    name: {
      vi: 'Quả Kim Quất Cát Tường',
      en: 'Auspicious Golden Kumquat',
      ja: '吉祥黄金キンカンの実',
    },
    lore: {
      vi: 'Kết tinh từ kỷ luật gửi đều mỗi tháng suốt trọn 1 vòng xoay 12 tháng!',
      en: 'Ripened across 12 uninterrupted months of cheerful monthly saving.',
      ja: '12ヶ月間の絶え間ない積立規律から生まれた新春を祝う黄金の果実です。',
    },
  },
  fruit_ngoc_thanh_long: {
    id: 'fruit_ngoc_thanh_long',
    emoji: '💎',
    rarity: { vi: 'Hiếm · Thanh Khoản Vàng', en: 'Rare · Liquid Ruby', ja: 'レア・流動性の宝石' },
    name: {
      vi: 'Quả Hồng Ngọc Thanh Long',
      en: 'Ruby Dragon Mystery Fruit',
      ja: '紅玉ドラゴンフルーツ（神秘の実）',
    },
    lore: {
      vi: 'Chỉ kết tinh khi bạn hoàn thành Quỹ dự phòng hoặc mục tiêu ngắn hạn đúng/vượt kỷ luật!',
      en: 'Blooms exclusively when a saver completes a short-term reserve goal with verified deposits!',
      ja: '短期防衛目標を規律正しく達成したときにのみ実る秘宝の果実です。',
    },
  },
  fruit_dao_tien_truong_tho: {
    id: 'fruit_dao_tien_truong_tho',
    emoji: '🍑',
    rarity: { vi: 'Ngọt Ngào · Bích Đào Xuân', en: 'Radiant · Spring Peach', ja: '華麗・春桃の宝実' },
    name: {
      vi: 'Quả Đào Tiên Hồng Ngọc',
      en: 'Crimson Immortal Peach',
      ja: '紅玉仙桃の実',
    },
    lore: {
      vi: 'Nở rộ khi bước ngoặt đầu đời (kết hôn, khởi đầu mới) được bảo chứng bởi quỹ tiết kiệm vững chắc.',
      en: 'Blooms when your pivotal life milestone opens backed by a rock-solid savings cushion.',
      ja: '人生の新たな門出を盤石な貯蓄で迎えたときに実る祝福の桃です。',
    },
  },
  fruit_dua_ngoc_bich: {
    id: 'fruit_dua_ngoc_bich',
    emoji: '🥥',
    rarity: { vi: 'Thanh Mát · Miền Tây Ngọc', en: 'Refreshing · Emerald Palm', ja: '爽快・翡翠ヤシ' },
    name: {
      vi: 'Quả Dừa Ngọc Bích Minh Châu',
      en: 'Emerald Pearl Coconut',
      ja: '翡翠真珠ココナッツ',
    },
    lore: {
      vi: 'Giọt nước ngọt lành kết tụ qua 2–3 năm chăm chỉ tích lũy không gián đoạn.',
      en: 'Sweet emerald nectar distilled from 2–3 years of unwavering savings momentum.',
      ja: '2〜3年間の揺るがない積立が生んだ澄み切った翡翠色の果実です。',
    },
  },
  fruit_hat_ngoc_bazan: {
    id: 'fruit_hat_ngoc_bazan',
    emoji: '🫘',
    rarity: { vi: 'Quý · Đất Đỏ Tây Nguyên', en: 'Precious · Basalt Gold', ja: '希少・高原の恵み' },
    name: {
      vi: 'Quả Hạt Ngọc Bazan',
      en: 'Basalt Pearl Coffee Berry',
      ja: '高原真珠コーヒーの実',
    },
    lore: {
      vi: 'Biểu tượng của kỷ luật gửi góp hàng tháng không bỏ cuộc suốt 2–4 năm.',
      en: 'Born from unbroken monthly deposit discipline across 2–4 years of growth.',
      ja: '2〜4年間にわたる毎月の堅実な積立継続の証です。',
    },
  },
  fruit_vai_rong_do: {
    id: 'fruit_vai_rong_do',
    emoji: '🍒',
    rarity: { vi: 'Sử thi · Lệ Chi Tiến Vua', en: 'Epic · Imperial Lychee', ja: 'エピック・皇帝ライチ' },
    name: {
      vi: 'Quả Lệ Chi Rồng Đỏ',
      en: 'Scarlet Dragon Imperial Lychee',
      ja: '紅龍皇帝ライチ',
    },
    lore: {
      vi: 'Màu đỏ may mắn kết trái khi những khoản thưởng bất ngờ đều được đưa thẳng vào mục tiêu.',
      en: 'Ripens in crimson glory when bonuses and raises flow faithfully straight into your plan.',
      ja: '臨時賞与を迷わず目標へ注ぎ込んだ規律が生む真紅の果実です。',
    },
  },
  fruit_xoai_kim_cuong: {
    id: 'fruit_xoai_kim_cuong',
    emoji: '🌟',
    rarity: { vi: 'Sử thi · Phù Sa Cửu Long', en: 'Epic · Mekong Amber', ja: 'エピック・メコン琥珀' },
    name: {
      vi: 'Quả Xoài Kim Cương Hòa Lộc',
      en: 'Golden Hoa Loc Diamond Mango',
      ja: '黄金ダイヤモンドマンゴー',
    },
    lore: {
      vi: 'Đơm trái vàng óng khi khối vốn trung hạn đạt mốc mục tiêu an toàn!',
      en: 'Ripens in pure gold once your 3–5 year target capital stands fully funded.',
      ja: '3〜5年の中期目標元本を完全達成した瞬間に輝く黄金の果実です。',
    },
  },
  fruit_vusua_ngan_ha: {
    id: 'fruit_vusua_ngan_ha',
    emoji: '🔮',
    rarity: { vi: 'Sử thi · Tím Mơ Vĩnh Kim', en: 'Epic · Velvet Nebula', ja: 'エピック・銀河星実' },
    name: {
      vi: 'Quả Vú Sữa Ngân Hà Tím',
      en: 'Velvet Star-Apple Orb',
      ja: '銀河紫スターアップル',
    },
    lore: {
      vi: 'Ngọt dịu sâu lắng khi gia đình hoàn thành trọn vẹn quỹ bảo vệ và học vấn cho con nhỏ.',
      en: 'Luminous purple orb harvested when family and child education milestones reach 100%.',
      ja: '家族の安心と教育積立が100%に到達した夜に輝く紫紺の果実です。',
    },
  },
  fruit_ngoc_xanh_ben_tre: {
    id: 'fruit_ngoc_xanh_ben_tre',
    emoji: '💚',
    rarity: { vi: 'Sử thi · Đồng Lòng Gia Đình', en: 'Epic · Family Harmony', ja: 'エピック・家族の調和' },
    name: {
      vi: 'Quả Bưởi Ngọc Bến Tre',
      en: 'Ben Tre Emerald Pomelo',
      ja: 'ベンチェ翡翠ポメロ',
    },
    lore: {
      vi: 'Kết tinh từ sự đồng lòng góp sức của Cặp đôi & Gia đình qua nhiều năm bền bỉ.',
      en: 'Grown from shared Couple & Family commitment across 4–7 steady years.',
      ja: '夫婦・家族が長年力を合わせて育て上げた調和の果実です。',
    },
  },
  fruit_hoang_kim_ri6: {
    id: 'fruit_hoang_kim_ri6',
    emoji: '👑',
    rarity: { vi: 'Huyền thoại · Vương Giả Tiền Tỷ', en: 'Legendary · Sovereign Gold', ja: '伝説・黄金の王冠' },
    name: {
      vi: 'Quả Sầu Riêng Hoàng Kim Ri6',
      en: 'Imperial Golden Ri6 Fruit',
      ja: '皇帝黄金Ri6フルーツ',
    },
    lore: {
      vi: 'Phần thưởng tối thượng cho kế hoạch dài hạn 5–10 năm đạt tự chủ thu nhập thụ động.',
      en: 'The supreme trophy of a 5–10 year compounding plan reaching passive income scale.',
      ja: '5〜10年の長期複利計画を完遂した者に贈られる伝説の果実です。',
    },
  },
  fruit_bach_tra_van_nam: {
    id: 'fruit_bach_tra_van_nam',
    emoji: '❄️',
    rarity: { vi: 'Huyền thoại · Bạch Trà Tuyết Sơn', en: 'Legendary · Silver Cloud Bud', ja: '伝説・白雲古茶' },
    name: {
      vi: 'Tinh Hoa Bạch Trà Tuyết Sơn',
      en: 'Crystal Mountain White Tea',
      ja: '雲海白茶の結晶芽',
    },
    lore: {
      vi: 'Đỉnh cao tĩnh tại của người giữ kỷ luật tài sản 6–12 năm không xao động trước sóng gió.',
      en: 'Harvested by long-horizon savers who held steady through 6–12 years of economic seasons.',
      ja: '6〜12年間にわたり相場や金利変動に動じず守り抜いた資産家に贈られる雪芽です。',
    },
  },
  fruit_mang_vang_phu_dong: {
    id: 'fruit_mang_vang_phu_dong',
    emoji: '🎋',
    rarity: { vi: 'Thần thoại · Phù Đổng Bất Khuất', en: 'Mythic · Golden Rhizome', ja: '神話・黄金筍' },
    name: {
      vi: 'Búp Măng Vàng Phù Đổng',
      en: 'Golden Phu Dong Bamboo Shoot',
      ja: '聖ギオンの黄金筍',
    },
    lore: {
      vi: 'Mọc lên khi bộ rễ lãi kép vươn qua ngưỡng Coast FIRE — tự do khỏi âu lo tài chính!',
      en: 'Springs forth when your compounding rhizomes power your journey to Coast FIRE.',
      ja: '複利の地下茎が完成し、経済的自立への道を駆け上がった証の黄金筍です。',
    },
  },
  fruit_ky_nam_truyen_doi: {
    id: 'fruit_ky_nam_truyen_doi',
    emoji: '✨',
    rarity: { vi: 'Bất hủ · Trầm Hương Kỳ Nam', en: 'Mythic · Eternal Agarwood', ja: '神話級・永遠の伽羅' },
    name: {
      vi: 'Quả Kỳ Nam Truyền Đời',
      en: 'Eternal Ky Nam Heritage Fruit',
      ja: '伝承伽羅の秘宝果',
    },
    lore: {
      vi: 'Ánh sáng di sản nở hoa trên cây cổ thụ FIRE khi tài sản đủ bảo vệ nhiều thế hệ.',
      en: 'Radiant legacy fruit earned when long-horizon wealth secures lifelong financial freedom.',
      ja: '世代を超えた経済的自由を確立した大樹にのみ咲く究極の秘宝です。',
    },
  },
};

export const TREE_GROWTH_STAGES = [
  { id: 'SEED', minPct: 0, maxPct: 9.99, label: { vi: 'Gieo hạt giống', en: 'Planted Seed', ja: '種まき' } },
  { id: 'SPROUT', minPct: 10, maxPct: 24.99, label: { vi: 'Nảy mầm xanh', en: 'Fresh Sprout', ja: '発芽・若葉' } },
  { id: 'SAPLING', minPct: 25, maxPct: 49.99, label: { vi: 'Cây non vươn nhánh', en: 'Young Sapling', ja: '若木・枝張り' } },
  { id: 'MATURE', minPct: 50, maxPct: 74.99, label: { vi: 'Cây trưởng thành', en: 'Mature Canopy', ja: '成木・茂み' } },
  { id: 'FLOWERING', minPct: 75, maxPct: 99.99, label: { vi: 'Đơm hoa rực rỡ', en: 'Full Blossom', ja: '満開・開花' } },
  { id: 'HARVEST', minPct: 100, maxPct: 999, label: { vi: 'Kết trái & Quả Bí Ẩn', en: 'Harvest & Mystery Fruit', ja: '結実＆神秘の実' } },
];

export const ORCHARD_THEMES = [
  {
    id: 'SUNNY_MORNING',
    emoji: '☀️',
    label: { vi: 'Ban mai nắng ấm', en: 'Sunny Morning', ja: '穏やかな朝晴れ' },
  },
  {
    id: 'NOURISHING_RAIN',
    emoji: '🌧️',
    label: { vi: 'Mưa rào tưới mát', en: 'Nourishing Rain', ja: '恵みの慈雨' },
  },
  {
    id: 'STARRY_FIREFLY',
    emoji: '🌙',
    label: { vi: 'Đêm trăng đom đóm', en: 'Firefly Night', ja: '蛍と月夜' },
  },
];

export function getTreeSpeciesById(id) {
  return VIETNAM_WEALTH_TREES.find((s) => s.id === id) || VIETNAM_WEALTH_TREES[7];
}

export function recommendTreeSpecies(yearsNeeded = 4) {
  const y = Number(yearsNeeded) || 4;
  if (y <= 0.75) return getTreeSpeciesById('sen_dong_thap');
  if (y <= 1.2) return getTreeSpeciesById('quat_tu_lien');
  if (y <= 1.75) return getTreeSpeciesById('thanh_long');
  if (y <= 2.3) return getTreeSpeciesById('dao_nhat_tan');
  if (y <= 2.8) return getTreeSpeciesById('dua_xiem_ben_tre');
  if (y <= 3.5) return getTreeSpeciesById('ca_phe');
  if (y <= 4.0) return getTreeSpeciesById('vai_thieu_luc_ngan');
  if (y <= 4.8) return getTreeSpeciesById('xoai_hoa_loc');
  if (y <= 5.5) return getTreeSpeciesById('vusua_lo_ren');
  if (y <= 7.0) return getTreeSpeciesById('buoi_da_xanh');
  if (y <= 9.0) return getTreeSpeciesById('sau_rieng_ri6');
  if (y <= 11.5) return getTreeSpeciesById('che_shan_tuyet');
  if (y <= 15.0) return getTreeSpeciesById('tre_nga_thanh_giong');
  return getTreeSpeciesById('mai_tram_huong');
}

export function computeTreeStatus(tree) {
  const species = getTreeSpeciesById(tree?.speciesId);
  const checkIns = Array.isArray(tree?.checkIns) ? tree.checkIns : [];
  const targetCapital = Math.max(1_000_000, Number(tree?.targetCapital) || 500_000_000);
  const initialCapital = Math.max(0, Number(tree?.initialCapital) || 0);
  const monthlyPlanned = Math.max(100_000, Number(tree?.monthlyPlanned) || 10_000_000);

  let verifiedDepositsTotal = 0;
  let overDepositBonusVnd = 0;
  let overTargetCount = 0;

  for (const c of checkIns) {
    if (c.verified === false) continue;
    const amt = Math.max(0, Number(c.amount) || 0);
    verifiedDepositsTotal += amt;
    if (amt > monthlyPlanned) {
      overDepositBonusVnd += amt - monthlyPlanned;
      overTargetCount += 1;
    }
  }

  const currentCapital = initialCapital + verifiedDepositsTotal;
  const rawProgressPct = Math.min(100, Number(((currentCapital / targetCapital) * 100).toFixed(1)));

  // Accelerated visual growth boost when users consistently over-deposit beyond plan
  const avgDeposit = checkIns.length > 0 ? verifiedDepositsTotal / checkIns.length : monthlyPlanned;
  const rawMultiplier = checkIns.length > 0 ? avgDeposit / monthlyPlanned : 1;
  const growthMultiplier = Number(Math.min(2.0, Math.max(1.0, rawMultiplier)).toFixed(2));
  const bonusPct = Math.min(18, (overDepositBonusVnd / targetCapital) * 100 * 0.6);
  const acceleratedProgressPct = Math.min(100, Number((rawProgressPct + bonusPct).toFixed(1)));

  const monthsSavedByOverDeposit = Math.floor(overDepositBonusVnd / monthlyPlanned);

  const effectivePct = rawProgressPct >= 100 ? 100 : acceleratedProgressPct;
  const stage =
    TREE_GROWTH_STAGES.find((s) => effectivePct >= s.minPct && effectivePct <= s.maxPct) ||
    TREE_GROWTH_STAGES[0];

  const flowersCount = effectivePct >= 75 ? Math.min(12, Math.max(4, Math.floor((effectivePct - 65) / 3))) : effectivePct >= 50 ? 2 : 0;
  const fruitsCount = rawProgressPct >= 100 ? 6 : effectivePct >= 85 ? Math.floor((effectivePct - 80) / 5) : 0;
  const canHarvestMystery = rawProgressPct >= 100;
  const mysteryFruit = MYSTERY_FRUITS[species.mysteryFruitId] || MYSTERY_FRUITS.fruit_xoai_kim_cuong;

  return {
    species,
    mysteryFruit,
    checkInsCount: checkIns.length,
    verifiedDepositsTotal,
    overDepositBonusVnd,
    overTargetCount,
    currentCapital,
    targetCapital,
    remainingCapital: Math.max(0, targetCapital - currentCapital),
    rawProgressPct,
    acceleratedProgressPct: effectivePct,
    growthMultiplier,
    monthsSavedByOverDeposit,
    stage,
    flowersCount,
    fruitsCount,
    canHarvestMystery,
  };
}
