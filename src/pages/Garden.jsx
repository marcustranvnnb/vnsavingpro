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
          'Đảo Mây 2.5D Isometric · 14 Loài Cây Đặc Sản · 3 Thời Tiết · Miu Vàng Trông Vườn',
          '2.5D Isometric Sky Island · 14 Native Vietnamese Trees · Mystery Fruits',
          '2.5Dアイソメトリック天空島 · ベトナム名木14種 · ミウちゃん園長'
        )}
        title={tx('Đảo Mây Khu Vườn Tài Sản Cá Nhân', 'Personal Sky Island Wealth Garden', 'マイ天空資産ガーデン')}
        description={tx(
          'Trải nghiệm khu vườn trên mây 2.5D của riêng bạn với 12 ô đất trồng 14 giống cây Việt Nam, thác nước, chòi tranh, đài phun nước & Mèo Chiêu Tài Miu Vàng. Chạm vào từng ô đất để trồng cây, dời vị trí, xác thực tiền đóng và thu hoạch Quả Bí Ẩn!',
          'Step onto your personal 2.5D Isometric Sky Island featuring 12 garden plots for 14 Vietnamese trees, cascading waterfall, thatched hut, crystal fountain & Miu Vang. Tap plots to plant, move trees freely, verify deposits & unbox Mystery Fruits!',
          '自分だけの2.5D天空ガーデン（12区画・ベトナム名木14種・滝・あずまや・噴水・招き猫ミウちゃん）。空き区画への植樹、自由な配置変更、入金認証、神秘の実の収穫を楽しめます！'
        )}
      />

      <WealthTreeGarden />

      <FeedbackWidget tool="garden" toolLabel={tx('Khu Vườn Ảo Kế Hoạch', 'Virtual Wealth Orchard', 'バーチャル資産果樹園')} />
    </div>
  );
}
