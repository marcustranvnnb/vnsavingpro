import React from 'react';
import { Trees } from 'lucide-react';
import { FeedbackWidget } from '../components/FeedbackWidget.jsx';
import { WealthTreeGarden } from '../components/WealthTreeGarden.jsx';
import { PageHeader } from '../components/ui.jsx';
import { useI18n } from '../i18n/index.jsx';

export default function Garden() {
  const { tx } = useI18n();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Trees}
        eyebrow={tx(
          'Bộ Asset Đảo Mây 2.5D · 8 Chu Kỳ Cây · 5 Cấp Nhà Gắn Kế Hoạch Core',
          '2.5D Sky Island Assets · 8 Growth Stages · 5-Level Evolving Home',
          '2.5D天空島アセット · 8段階成長 · プラン連動の進化ハウス'
        )}
        title={tx('Đảo Mây Tài Sản Cá Nhân — Khu Vườn Của Tôi', 'Personal Sky Island Wealth Garden', 'マイ天空資産ガーデン')}
        description={tx(
          'Ngôi nhà & Đảo Mây phát triển trực tiếp theo Kế Hoạch Core (/plan, Kệ Sổ, FX, CIC). Chăm tưới 14 giống cây Việt Nam qua 8 chu kỳ từ lúc gieo hạt đến kết trái, dời vị trí cây trên 12 ô đất và thu hoạch Quả Bí Ẩn!',
          'Your personal Sky Island Home evolves directly with your Core Wealth Plan (/plan, Passbooks, FX, CIC). Nurture 14 Vietnamese trees across 8 growth stages from seed to harvest, move plots freely, and unlock Mystery Fruits!',
          'ライフプラン・保有預金・FX・CICの進捗に応じて天空島の住まいが5段階で進化！14種のベトナム名木を8段階（種まき〜結実）で育て、区画を自由に配置して神秘の実を収穫できます。'
        )}
      />

      <WealthTreeGarden />

      <FeedbackWidget tool="garden" toolLabel={tx('Khu Vườn Ảo Kế Hoạch', 'Virtual Wealth Orchard', 'バーチャル資産果樹園')} />
    </div>
  );
}
