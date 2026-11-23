import React, { useEffect, useState } from 'react';
import { BookmarkPlus, CheckCircle2, History, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useI18n } from '../i18n/index.jsx';
import { href } from '../state.jsx';
import {
  CALC_HISTORY_UPDATED_EVENT,
  loadLocalCalculationHistory,
  openAuthPrompt,
} from '../utils/apiClient.js';
import { Badge, Button, Card } from './ui.jsx';

export function SavePlanPromptCard() {
  const { user } = useAuth();
  const { tx } = useI18n();
  const [localCount, setLocalCount] = useState(() => loadLocalCalculationHistory().length);

  useEffect(() => {
    const syncCount = () => setLocalCount(loadLocalCalculationHistory().length);
    window.addEventListener(CALC_HISTORY_UPDATED_EVENT, syncCount);
    return () => window.removeEventListener(CALC_HISTORY_UPDATED_EVENT, syncCount);
  }, []);

  if (user) {
    return (
      <Card className="print-hidden border-emerald-400/20 bg-emerald-500/[0.04] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25">
              <CheckCircle2 className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">
                {tx(
                  'Kết quả chạy mô hình được lưu trong Hồ sơ của bạn',
                  'Calculation runs are saved inside your Profile',
                  'シミュレーション結果はプロフィール履歴に保存されます'
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">
                {tx(
                  'Mở lại bất kỳ bản tính hoặc kế hoạch nào trước đây để so sánh và chỉnh tiếp.',
                  'Reopen any past roadmap or calculator run anytime to compare or adjust.',
                  '過去のプランや試算結果をいつでも開いて再編集・比較できます。'
                )}
              </p>
            </div>
          </div>
          <Button as="a" href={href('profile')} size="sm" variant="secondary">
            <History className="size-3.5 text-emerald-300" />
            {tx('Xem lịch sử trong Hồ sơ', 'View Profile History', '履歴をプロフィールで見る')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="print-hidden relative overflow-hidden border-indigo-400/25 bg-gradient-to-br from-indigo-500/[0.08] via-surface to-emerald-500/[0.05] p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 ring-1 ring-inset ring-indigo-400/30">
              <BookmarkPlus className="size-4" />
            </span>
            <h3 className="text-sm font-semibold text-white">
              {tx(
                'Bạn muốn lưu và xem lại các kế hoạch & kết quả tính toán không?',
                'Want to save and revisit your plans & calculation results?',
                '作成したプランや計算結果を保存して後から見返しますか？'
              )}
            </h3>
            {localCount > 0 && (
              <Badge tone="brand">
                {tx(
                  `${localCount} lần chạy tạm trên trình duyệt`,
                  `${localCount} local runs cached`,
                  `ブラウザ一時履歴 ${localCount}件`
                )}
              </Badge>
            )}
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">
            {tx(
              'Đăng nhập bằng Google hoặc Email để lưu vĩnh viễn lịch sử các lần lập kế hoạch & chạy công cụ vào Hồ sơ cá nhân, mở lại chỉ bằng 1 chạm.',
              'Sign in with Google or Email to persist all your past planning & tool runs inside Profile Cloud History and restore them in one click.',
              'Googleまたはメールでログインすると、過去の試算・プラン実行履歴をプロフィールのクラウドに永続保存し、ワンクリックで復元できます。'
            )}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button type="button" variant="primary" size="sm" onClick={() => openAuthPrompt('login')}>
            <LogIn className="size-3.5" />
            {tx('Có, vào đây để lưu & xem lại', 'Yes, save & review here', 'はい、保存・閲覧する')}
          </Button>
          <Button as="a" href={href('profile')} variant="secondary" size="sm">
            <History className="size-3.5" />
            {tx('Xem Hồ sơ', 'Open Profile', 'プロフィール')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
