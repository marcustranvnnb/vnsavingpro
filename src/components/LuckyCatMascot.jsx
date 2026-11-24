import React, { useMemo, useState } from 'react';
import { ArrowRight, Heart, Sparkles, Trees } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { href, useToast } from '../state.jsx';
import { loadWealthTrees } from '../utils/apiClient.js';
import { Badge, Button, Modal, cx } from './ui.jsx';

const CAT_PATS_KEY = 'vnsaving_lucky_cat_pats_v1';
const CAT_FORTUNE_KEY = 'vnsaving_lucky_cat_fortune_v1';

const FORTUNE_CARDS = [
  {
    id: 'dai_cat_lai_kep',
    tier: { vi: 'Đại Cát ✨', en: 'Grand Fortune ✨', ja: '大吉 ✨' },
    title: {
      vi: 'Quẻ Song Hỷ Lãi Kép',
      en: 'Double Compound Blossom',
      ja: '複利満開の大吉',
    },
    message: {
      vi: 'Meow~ Tiền gửi đều đặn hôm nay sẽ âm thầm đẻ lãi qua đêm! Thử kiểm tra ngay kỳ hạn 12T đang có lãi cao nhất nhé.',
      en: 'Meow~ Steady savings planted today bloom silently into compound interest! Check the top 12M digital bank rate now.',
      ja: 'ニャー！今日のコツコツ積立が静かに複利の花を咲かせます。12ヶ月最高金利チェックがおすすめ！',
    },
    route: 'rates',
    cta: { vi: 'Xem Bảng Lãi Suất', en: 'Open Rates Board', ja: '金利比較を見る' },
  },
  {
    id: 'vuon_cay_xanh_tot',
    tier: { vi: 'Thượng Cát 🌱', en: 'Flourishing Luck 🌱', ja: '中吉・成長 🌱' },
    title: {
      vi: 'Quẻ Mầm Xanh Tăng Tốc',
      en: 'Accelerated Orchard Sprout',
      ja: '資産ツリー急成長の吉',
    },
    message: {
      vi: 'Miu Vàng vừa tưới nước cho vườn cây của bạn! Nếu tháng này dư thêm một khoản nhỏ, cây tài sản sẽ lớn nhanh gấp 1.25x–2x đấy.',
      en: 'Miu Vang just watered your orchard! Even a small extra verified deposit speeds up your Wealth Tree up to 1.25x–2x.',
      ja: 'ミウちゃんが資産ツリーにお水をあげました！少しの追加積立で最大2倍速で実が育ちますよ。',
    },
    route: 'garden',
    cta: { vi: 'Thăm Vườn Cây', en: 'Visit Tree Garden', ja: 'ツリーガーデンへ' },
  },
  {
    id: 'quy_du_phong_vung_vang',
    tier: { vi: 'Bình An 🛡️', en: 'Shielded Peace 🛡️', ja: '安泰・守護 🛡️' },
    title: {
      vi: 'Quẻ Khiên Vàng Dự Phòng',
      en: 'Golden Safety Cushion',
      ja: '黄金の防衛資金守り',
    },
    message: {
      vi: 'Có Quỹ dự phòng 4–6 tháng trong tay, ngủ ngon như mèo cuộn tròn trên nệm ấm! Đừng quên chia bậc thang kỳ hạn ngắn.',
      en: 'With a 4–6 month emergency buffer, you sleep as soundly as a cat on a warm pillow! Keep short-term ladder rungs ready.',
      ja: '4〜6ヶ月分の緊急資金があれば、毛布の猫のようにぐっすり安心！短期ラダーも活用しましょう。',
    },
    route: 'ladder',
    cta: { vi: 'Chia Sổ Bậc Thang', en: 'Open Ladder Tool', ja: 'ラダー預金へ' },
  },
  {
    id: 'qua_bi_an_cho_no',
    tier: { vi: 'Hoàng Kim 🎁', en: 'Golden Harvest 🎁', ja: '金運満願 🎁' },
    title: {
      vi: 'Quẻ Trái Ngọt Bí Ẩn',
      en: 'Mystery Fruit Awakening',
      ja: '神秘の実・開花予報',
    },
    message: {
      vi: 'Trên ngọn cây tài sản đang lấp lánh nụ vàng! Gửi đúng kỷ luật mỗi tháng để mở khóa Quả Bí Ẩn cực hiếm nhé.',
      en: 'A golden bud sparkles at your treetop! Stay consistent each month to unbox your rare Vietnamese Mystery Fruit.',
      ja: '木のてっぺんに金色のつぼみが光っています！毎月の積立認証でレアな神秘の実を収穫しよう。',
    },
    route: 'garden',
    cta: { vi: 'Xem Tiến Độ Quả', en: 'Check Fruit Progress', ja: '収穫進捗を見る' },
  },
  {
    id: 'toi_uu_thue_luong',
    tier: { vi: 'Thông Thái 🎓', en: 'Wise Wealth 🎓', ja: '知恵の吉 🎓' },
    title: {
      vi: 'Quẻ Tinh Gọn Thuế 2026',
      en: '2026 Net Salary Spark',
      ja: '2026年手取りアップ吉',
    },
    message: {
      vi: 'Miu Vàng đeo kính soi sổ giúp bạn: giảm trừ mới 15,5tr & thuế 5 bậc 2026 có thể giúp bạn giữ lại thêm tiền bỏ ống heo mỗi tháng!',
      en: 'Scholar Miu Vang spotted a tip: Vietnam’s 2026 15.5M deduction & 5 tax brackets may free up extra monthly savings!',
      ja: 'メガネ先生ミウちゃんの豆知識：2026年の新基礎控除・5段階税率で増えた手取りをそのまま貯金箱へ！',
    },
    route: 'salary',
    cta: { vi: 'Tính Lương & Thuế 2026', en: 'Open 2026 Salary', ja: '2026年給与計算へ' },
  },
  {
    id: 'ty_gia_hoa_von',
    tier: { vi: 'Linh Hoạt 💱', en: 'Agile Balance 💱', ja: '機転の吉 💱' },
    title: {
      vi: 'Quẻ Cân Bằng Ngoại Tệ',
      en: 'Balanced FX Harmony',
      ja: '外貨バランス良好の吉',
    },
    message: {
      vi: 'Đừng để ngoại tệ nằm im không kiểm tra tỷ giá hòa vốn! So ngay với lãi tiết kiệm VND để chọn kênh sinh lời êm ái nhất.',
      en: 'Don’t let foreign currency sit unchecked — compare FX break-even points against VND term deposits in 1 click.',
      ja: '外貨資産の損益分岐点をチェックして、VND定期預金との有利・不利をサクッと比較しようニャ。',
    },
    route: 'fx',
    cta: { vi: 'Mở Ngoại Tệ FX', en: 'Open FX Manager', ja: '外貨FX管理へ' },
  },
  {
    id: 'cap_doi_dong_long',
    tier: { vi: 'Hòa Hợp 💞', en: 'Harmony Luck 💞', ja: '良縁・協調 💞' },
    title: {
      vi: 'Quẻ Đồng Tâm Chiêu Tài',
      en: 'Harmony Co-Saving',
      ja: 'ふたりで招福の吉',
    },
    message: {
      vi: 'Hai người cùng góp, hai bàn tay mèo cùng vẫy — mục tiêu mua nhà & tự do tài chính rút ngắn nhanh bất ngờ!',
      en: 'Two paws waving together double the charm — shared couple & family plans cut goal timelines dramatically!',
      ja: '2人で力を合わせれば招き猫もダブルパワー！目標達成までの年数がグッと縮まります。',
    },
    route: 'plan',
    cta: { vi: 'Lập Kế Hoạch Chung', en: 'Open Roadmap Planner', ja: 'ライフプランへ' },
  },
  {
    id: 'bao_mat_chuan_2345',
    tier: { vi: 'An Toàn 🔐', en: 'Fortress Luck 🔐', ja: '鉄壁守護 🔐' },
    title: {
      vi: 'Quẻ Két Sắt Bất Khả Xâm Phạm',
      en: 'Vault Guardian Charm',
      ja: '鉄壁セキュリティ守り',
    },
    message: {
      vi: 'Tiền nhiều phải đi đôi với khóa chắc! Kiểm tra sinh trắc học NFC & ưu đãi mở thẻ mới của 4 ngân hàng số ngay nào.',
      en: 'Growing wealth deserves strong locks! Review NFC biometric safety and official bank-opening perks today.',
      ja: '増えた資産はしっかり守ろう！生体認証と公式口座開設特典を今すぐチェック。',
    },
    route: 'referral',
    cta: { vi: 'Xem Bảo Mật & Ưu Đãi', en: 'Security & Perks', ja: '安全性・特典を見る' },
  },
];

const MEOW_QUOTES = {
  vi: [
    'Meow~ Tiền đẻ ra tiền, lộc về đầy hũ! 🐾✨',
    'Gừ gừ~ Chăm tiết kiệm là vườn cây mau ra trái lắm đó! 🌱🪙',
    'Meow meow~ Hôm nay xoa đầu Miu Vàng, cả tuần tiền vô như nước! 💖',
    'Miu~ Đừng quên xác thực tiền đóng tháng này để cây lớn vù vù nha! 🚀',
  ],
  en: [
    'Meow~ Compound luck is purring into your jar! 🐾✨',
    'Purr~ Every verified deposit helps your Wealth Tree bloom faster! 🌱🪙',
    'Meow meow~ One head pat gives +100% cozy saving motivation! 💖',
    'Miu~ Keep that steady streak and watch your Mystery Fruit glow! 🚀',
  ],
  ja: [
    'ニャ〜！複利のご利益で貯金箱がいっぱいになりますように！🐾✨',
    'ゴロゴロ〜 毎日のコツコツ積立で木がすくすく育つニャ！🌱🪙',
    'ニャン♪ ミウちゃんを撫でて金運パワーをチャージしました！💖',
    'ミウ〜 神秘の実が実る日を楽しみに頑張ろうニャ！🚀',
  ],
};

function readPatCount() {
  try {
    return Number(localStorage.getItem(CAT_PATS_KEY)) || 0;
  } catch {
    return 0;
  }
}

function savePatCount(n) {
  try {
    localStorage.setItem(CAT_PATS_KEY, String(n));
  } catch {
    // ignore storage errors
  }
}

function readTodayFortune() {
  try {
    const raw = localStorage.getItem(CAT_FORTUNE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (parsed?.date !== today) return null;
    return FORTUNE_CARDS.find((c) => c.id === parsed.id) || FORTUNE_CARDS[0];
  } catch {
    return null;
  }
}

function saveTodayFortune(id) {
  try {
    localStorage.setItem(
      CAT_FORTUNE_KEY,
      JSON.stringify({ id, date: new Date().toISOString().slice(0, 10) })
    );
  } catch {
    // ignore storage errors
  }
}

const SIZE_CLASSES = {
  xs: 'size-8',
  sm: 'size-12',
  md: 'size-20',
  lg: 'size-28',
};

/**
 * Animated SVG Lucky Fortune Cat ("Miu Vang" / Maneki-neko) with 5 cute moods.
 */
export function LuckyCatMascot({
  mood = 'wave',
  size = 'md',
  interactive = false,
  onPet,
  className,
  ariaLabel,
}) {
  const { tx } = useI18n();
  const isGardener = mood === 'gardener';
  const isScholar = mood === 'scholar';
  const isCelebrate = mood === 'celebrate';
  const isCheer = mood === 'cheer';

  const body = (
    <svg
      viewBox="0 0 120 120"
      className={cx(
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        'animate-cat-float select-none drop-shadow-[0_6px_14px_rgba(251,191,36,0.28)]',
        className
      )}
      role="img"
      aria-label={ariaLabel || tx('Linh vật Mèo Chiêu Tài Miu Vàng', 'Miu Vang Lucky Cat Mascot', '招き猫ミウちゃんマスコット')}
    >
      <defs>
        <linearGradient id="miuCoat" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fffdf7" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
        <linearGradient id="miuGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="miuHat" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>

      {/* Ambient lucky sparkles */}
      <g className="animate-coin-sparkle">
        <path d="M18 26 L20 20 L22 26 L28 28 L22 30 L20 36 L18 30 L12 28 Z" fill="#fde047" opacity="0.85" />
        <path d="M100 20 L101.5 16 L103 20 L107 21.5 L103 23 L101.5 27 L100 23 L96 21.5 Z" fill="#f9a8d4" opacity="0.9" />
        {isCelebrate && (
          <>
            <circle cx="24" cy="54" r="3" fill="#34d399" />
            <circle cx="96" cy="50" r="3.2" fill="#fbbf24" />
            <circle cx="60" cy="10" r="2.5" fill="#fb7185" />
          </>
        )}
      </g>

      {/* Tail */}
      <path
        d="M84 96 Q106 94 104 75 Q102 66 95 70"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="96" cy="70" r="4" fill="#fffbeb" />

      {/* Ears */}
      <path d="M31 40 L26 16 L49 27 Z" fill="url(#miuCoat)" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M34 36 L31 22 L44 28 Z" fill="#fda4af" />
      <path d="M89 40 L94 16 L71 27 Z" fill="url(#miuCoat)" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M86 36 L89 22 L76 28 Z" fill="#fda4af" />

      {/* Calico forehead patches */}
      <ellipse cx="42" cy="34" rx="10" ry="6" transform="rotate(-18 42 34)" fill="#f59e0b" opacity="0.9" />
      <ellipse cx="77" cy="34" rx="9" ry="5.5" transform="rotate(18 77 34)" fill="#f59e0b" opacity="0.9" />

      {/* Body */}
      <path
        d="M32 68 Q28 106 60 107 Q92 106 88 68 Z"
        fill="url(#miuCoat)"
        stroke="#f59e0b"
        strokeWidth="2.5"
      />

      {/* Head */}
      <ellipse cx="60" cy="50" rx="31" ry="25" fill="url(#miuCoat)" stroke="#f59e0b" strokeWidth="2.5" />

      {/* Gardener Straw Cone Hat (Non La) */}
      {isGardener && (
        <g>
          <path d="M22 30 Q60 6 98 30 Q60 36 22 30 Z" fill="url(#miuHat)" stroke="#92400e" strokeWidth="1.8" />
          <path d="M38 25 Q60 15 82 25" fill="none" stroke="#fef08a" strokeWidth="1.2" opacity="0.7" />
        </g>
      )}

      {/* Forehead Lucky Coin / Sprout Accent */}
      {!isGardener && (
        <circle cx="60" cy="32" r="4" fill="url(#miuGold)" stroke="#fff" strokeWidth="1" />
      )}

      {/* Blushing Cheeks */}
      <ellipse cx="38" cy="54" rx="5.5" ry="3.2" fill="#fda4af" opacity="0.72" />
      <ellipse cx="82" cy="54" rx="5.5" ry="3.2" fill="#fda4af" opacity="0.72" />

      {/* Eyes */}
      {isCelebrate || isCheer ? (
        <g stroke="#292524" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M41 47 Q46 41 51 47" />
          <path d="M69 47 Q74 41 79 47" />
        </g>
      ) : (
        <g>
          <circle cx="46" cy="46" r="4.2" fill="#1c1917" />
          <circle cx="44.8" cy="44.5" r="1.4" fill="#ffffff" />
          <circle cx="74" cy="46" r="4.2" fill="#1c1917" />
          <circle cx="72.8" cy="44.5" r="1.4" fill="#ffffff" />
        </g>
      )}

      {/* Scholar Round Glasses */}
      {isScholar && (
        <g stroke="#6366f1" strokeWidth="2" fill="rgb(129 140 248 / 0.14)">
          <circle cx="46" cy="46" r="7.5" />
          <circle cx="74" cy="46" r="7.5" />
          <line x1="53.5" y1="46" x2="66.5" y2="46" />
        </g>
      )}

      {/* Cute Nose & Cat Smile ":3" */}
      <polygon points="60,52 57,49 63,49" fill="#fb7185" />
      <path d="M53 55 Q56.5 59 60 54 Q63.5 59 67 55" fill="none" stroke="#44403c" strokeWidth="2" strokeLinecap="round" />

      {/* Whiskers */}
      <g stroke="#a8a29e" strokeWidth="1.4" strokeLinecap="round">
        <line x1="25" y1="47" x2="34" y2="49" />
        <line x1="24" y1="53" x2="34" y2="53" />
        <line x1="86" y1="49" x2="95" y2="47" />
        <line x1="86" y1="53" x2="96" y2="53" />
      </g>

      {/* Red Lucky Collar + Golden Bell */}
      <path d="M36 70 Q60 77 84 70" fill="none" stroke="#e11d48" strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="60" cy="76" r="5.5" fill="url(#miuGold)" stroke="#92400e" strokeWidth="1.2" />
      <circle cx="60" cy="76.5" r="1.2" fill="#78350f" />

      {/* Raised Waving Left Paw */}
      <g className="animate-paw-wave">
        <path
          d="M28 73 Q16 58 21 38 Q25 32 31 37 Q37 52 38 71 Z"
          fill="url(#miuCoat)"
          stroke="#f59e0b"
          strokeWidth="2.3"
        />
        <circle cx="26" cy="43" r="3" fill="#fda4af" opacity="0.8" />
        {isCelebrate && (
          <circle cx="23" cy="30" r="5" fill="#34d399" stroke="#fff" strokeWidth="1.2" />
        )}
      </g>

      {/* Golden Koban Coin ("LOC") or Gardener Watering Can */}
      {isGardener ? (
        <g transform="translate(57, 78)">
          <rect x="6" y="8" width="22" height="16" rx="4" fill="#34d399" stroke="#065f46" strokeWidth="1.5" />
          <path d="M6 15 L-2 9 L0 13" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
          <path d="M28 11 Q34 11 34 17 Q34 22 28 22" fill="none" stroke="#059669" strokeWidth="2.5" />
          <circle cx="-4" cy="14" r="1.5" fill="#60a5fa" />
          <circle cx="-6" cy="18" r="1.5" fill="#60a5fa" />
        </g>
      ) : (
        <g transform="translate(57, 77)">
          <rect x="4" y="4" width="22" height="27" rx="9" fill="url(#miuGold)" stroke="#92400e" strokeWidth="1.5" />
          <text
            x="15"
            y="21"
            textAnchor="middle"
            fontSize="7.5"
            fontWeight="800"
            fill="#78350f"
          >
            LỘC
          </text>
        </g>
      )}

      {/* Right Paw */}
      <ellipse cx="84" cy="84" rx="8" ry="6.5" fill="url(#miuCoat)" stroke="#f59e0b" strokeWidth="2.2" />

      {/* Bottom Little Paws */}
      <ellipse cx="44" cy="107" rx="8.5" ry="5" fill="url(#miuCoat)" stroke="#f59e0b" strokeWidth="2" />
      <ellipse cx="76" cy="107" rx="8.5" ry="5" fill="url(#miuCoat)" stroke="#f59e0b" strokeWidth="2" />
    </svg>
  );

  if (!interactive) return body;

  return (
    <button
      type="button"
      onClick={onPet}
      title={tx('Chạm nhẹ để xoa đầu Mèo Chiêu Tài Miu Vàng', 'Tap to pet Miu Vang for good luck', 'ミウちゃんを撫でて金運アップ！')}
      className="group relative inline-flex cursor-pointer items-center justify-center rounded-2xl transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      {body}
    </button>
  );
}

/**
 * Interactive speech-bubble companion banner for Home, Planner, Garden & Onboarding.
 */
export function LuckyCatTipCard({
  mood = 'wave',
  title,
  message,
  actionLabel,
  actionHref,
  onAction,
  compact = false,
  className,
}) {
  const { lang, tx } = useI18n();
  const notify = useToast();
  const [pats, setPats] = useState(readPatCount);
  const [bubbleMood, setBubbleMood] = useState(mood);

  const handlePet = () => {
    const next = pats + 1;
    setPats(next);
    savePatCount(next);
    setBubbleMood('cheer');
    const pool = MEOW_QUOTES[lang] || MEOW_QUOTES.vi;
    notify(pool[next % pool.length]);
    window.setTimeout(() => setBubbleMood(mood), 1800);
  };

  return (
    <div
      className={cx(
        'cute-cat-card relative flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between',
        compact && 'p-3.5',
        className
      )}
    >
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0 rounded-2xl bg-amber-500/10 p-1.5 ring-1 ring-inset ring-amber-400/25">
          <LuckyCatMascot
            mood={bubbleMood}
            size={compact ? 'sm' : 'md'}
            interactive
            onPet={handlePet}
          />
          {pats > 0 && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
              🐾 {pats}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="warning">
              🐾 {tx('Mèo Chiêu Tài Miu Vàng', 'Miu Vang · Lucky Cat', '招き猫ミウちゃん')}
            </Badge>
            {title && <span className="text-xs font-semibold text-amber-200">{title}</span>}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-200 sm:text-[13px]">{message}</p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={handlePet}>
          <Heart className="size-3.5 text-rose-400" />
          {tx('Xoa đầu lấy hên', 'Pet for Luck', '撫でる')}
        </Button>
        {actionLabel && actionHref && (
          <Button as="a" href={actionHref} size="sm" variant="primary">
            {actionLabel} <ArrowRight className="size-3.5" />
          </Button>
        )}
        {actionLabel && onAction && !actionHref && (
          <Button type="button" size="sm" variant="primary" onClick={onAction}>
            {actionLabel} <ArrowRight className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Daily Fortune Drawer Modal triggered from Header, Footer, or Home.
 */
export function LuckyCatFortuneModal({ open, onClose }) {
  const { lang, tx } = useI18n();
  const notify = useToast();
  const [pats, setPats] = useState(readPatCount);
  const [fortune, setFortune] = useState(readTodayFortune);
  const [catMood, setCatMood] = useState('wave');

  const treesCount = useMemo(() => (open ? loadWealthTrees().length : 0), [open]);

  const handlePet = () => {
    const next = pats + 1;
    setPats(next);
    savePatCount(next);
    setCatMood('cheer');
    const pool = MEOW_QUOTES[lang] || MEOW_QUOTES.vi;
    notify(pool[next % pool.length]);
  };

  const handleDrawFortune = () => {
    const pick = FORTUNE_CARDS[Math.floor(Math.random() * FORTUNE_CARDS.length)];
    saveTodayFortune(pick.id);
    setFortune(pick);
    setCatMood('celebrate');
    notify(
      tx(
        `🎋 Đã rút quẻ: ${pick.title.vi} (${pick.tier.vi})!`,
        `🎋 Drawn fortune: ${pick.title.en}!`,
        `🎋 おみくじ結果：${pick.title.ja}！`
      )
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tx(
        '🐾 Mèo Chiêu Tài Miu Vàng · Quẻ Lộc Hôm Nay',
        '🐾 Miu Vang Lucky Cat · Daily Wealth Fortune',
        '🐾 招き猫ミウちゃん · 今日の金運おみくじ'
      )}
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="cute-cat-card flex flex-col items-center rounded-2xl border p-5 text-center">
          <LuckyCatMascot mood={catMood} size="lg" interactive onPet={handlePet} />
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Badge tone="warning">
              🪙 {tx(`${pats} lượt xoa đầu lấy hên`, `${pats} Lucky Pats`, `${pats} 回ナデナデ`)}
            </Badge>
            <Badge tone="success">
              <Trees className="size-3" />{' '}
              {tx(`${treesCount} cây đang trồng`, `${treesCount} Wealth Trees`, `${treesCount} 本育成中`)}
            </Badge>
          </div>
          <p className="mt-2.5 text-xs text-zinc-300">
            {tx(
              'Chạm trực tiếp vào Miu Vàng để nhận lời chúc tài lộc, hoặc rút một quẻ tiết kiệm may mắn cho hôm nay!',
              'Tap Miu Vang directly for a lucky purr, or draw your personalized wealth fortune card for today!',
              'ミウちゃんをタップして金運チャージ！今日のお得な貯蓄おみくじも引いてみようニャ。'
            )}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={handlePet}>
              <Heart className="size-3.5 text-rose-400" />
              {tx('Xoa đầu Miu Vàng', 'Pet Miu Vang', 'ミウちゃんを撫でる')}
            </Button>
            <Button type="button" size="sm" variant="primary" onClick={handleDrawFortune}>
              <Sparkles className="size-3.5" />
              {fortune
                ? tx('Rút lại Quẻ Lộc', 'Draw Another Fortune', 'おみくじを引き直す')
                : tx('Rút Quẻ Lộc Hôm Nay', 'Draw Daily Fortune', '今日のおみくじを引く')}
            </Button>
          </div>
        </div>

        {fortune && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/[0.08] p-4 space-y-2.5 animate-fade">
            <div className="flex items-center justify-between gap-2">
              <Badge tone="warning">{fortune.tier[lang] || fortune.tier.vi}</Badge>
              <span className="text-[11px] text-amber-200/80">
                {new Date().toISOString().slice(0, 10)}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">
              {fortune.title[lang] || fortune.title.vi}
            </h4>
            <p className="text-xs leading-relaxed text-zinc-200">
              {fortune.message[lang] || fortune.message.vi}
            </p>
            <div className="pt-1">
              <Button
                as="a"
                href={href(fortune.route)}
                size="sm"
                variant="primary"
                className="w-full"
                onClick={onClose}
              >
                {fortune.cta[lang] || fortune.cta.vi} <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * Compact Lucky Cat pill trigger placed in TopNav & Footer.
 */
export function LuckyCatHeaderButton({ compact = false, className }) {
  const { tx } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={tx(
          'Gõ Mèo Chiêu Tài Miu Vàng · Rút Quẻ Lộc Tiết Kiệm',
          'Miu Vang Lucky Cat · Draw Daily Wealth Fortune',
          '招き猫ミウちゃん・今日の金運おみくじ'
        )}
        aria-label={tx('Mở Mèo Chiêu Tài Miu Vàng', 'Open Miu Vang Lucky Cat', '招き猫ミウちゃんを開く')}
        className={cx(
          'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/[0.10] px-2.5 text-xs font-medium text-amber-200 transition hover:border-amber-300/60 hover:bg-amber-500/20 hover:text-white',
          className
        )}
      >
        <span aria-hidden="true" className="text-sm leading-none">🐱</span>
        {!compact && (
          <span className="hidden lg:inline">
            {tx('Miu Vàng', 'Miu Cat', 'ミウちゃん')}
          </span>
        )}
      </button>

      <LuckyCatFortuneModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
