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
          'Khu Vườn Ảo 3 Thời Tiết · 14 Loài Cây Đặc Sản 3 Miền · Miu Vàng Trông Vườn',
          '3-Weather Virtual Orchard · 14 Native Vietnamese Trees · Mystery Fruits',
          '3天候バーチャル果樹園 · ベトナム名木14種 · ミウちゃん園長'
        )}
        title={tx('Khu Vườn Ảo Kế Hoạch Tài Sản Việt Nam', 'Vietnamese Virtual Wealth Orchard', 'ベトナム・バーチャル資産果樹園')}
        description={tx(
          'Dạo bước trong khu vườn ảo của riêng bạn dưới ánh nắng ban mai, cơn mưa dinh dưỡng hoặc đêm trăng đom đóm. Nhìn tất cả cây kế hoạch cùng phát triển theo số năm, xác thực tiền đóng để bứt tốc và thu hoạch 14 Quả Bí Ẩn hiếm!',
          'Walk through your personal living Virtual Orchard under Sunny Morning, Nourishing Rain, or Firefly Night. Watch every financial plan bloom into one of 14 native Vietnamese trees alongside Miu Vang and harvest 14 rare Mystery Fruits!',
          '朝晴れ・恵みの雨・蛍の夜空が切り替わる仮想果樹園で、あなたの全プランの木々を一覧！14種のベトナム在来樹を選び、入金認証で成長を加速し、14種類の神秘の実を収穫しましょう。'
        )}
      />

      <WealthTreeGarden />

      <FeedbackWidget tool="garden" toolLabel={tx('Khu Vườn Ảo Kế Hoạch', 'Virtual Wealth Orchard', 'バーチャル資産果樹園')} />
    </div>
  );
}
