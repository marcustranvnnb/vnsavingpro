import React from 'react';
import { ArrowDown, Columns2, Loader2, Play, Rows2 } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { useDisplayMode } from '../layout/DisplayModeContext.jsx';
import { Badge, Button, Card, cx } from './ui.jsx';

const CONTAINER_CLASSES = {
  mobile: 'max-w-[460px]',
  tablet: 'max-w-[940px]',
  duo: 'max-w-[1360px]',
  desktop: 'max-w-[1280px]',
};

const COL_CLASS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

/**
 * Shared container tuned to active layout mode (`mobile`, `tablet`, `duo`, `desktop`).
 */
export function PageContainer({ as: Comp = 'div', children, className }) {
  const { mode, isCoverScreen } = useDisplayMode();
  const gutterClass =
    mode === 'mobile'
      ? isCoverScreen
        ? 'px-2.5'
        : 'px-3.5'
      : mode === 'tablet'
        ? 'px-5'
        : mode === 'duo'
          ? 'px-3.5 sm:px-5'
          : 'px-6 xl:px-8';

  return (
    <Comp className={cx('mx-auto w-full', CONTAINER_CLASSES[mode] || CONTAINER_CLASSES.desktop, gutterClass, className)}>
      {children}
    </Comp>
  );
}

/**
 * Floating live result jump bar shown only in stacked touch layouts (Mobile & Portrait Tablet).
 */
export function StickyResultBar({ targetId, eyebrow, value, ctaLabel, runAction }) {
  const { mode, isTabletSplit, isCoverScreen } = useDisplayMode();
  const { tx } = useI18n();

  const shouldShow = mode === 'mobile' || (mode === 'tablet' && !isTabletSplit);
  if (!shouldShow || !targetId) return null;

  const isDirty = Boolean(runAction?.isDirty);
  const isLoading = Boolean(runAction?.loading);
  const hasRunnable = Boolean(runAction?.onRun) && (isDirty || isLoading);

  const wrapperClass =
    mode === 'mobile'
      ? cx(
          'print-hidden fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-[460px]',
          isCoverScreen ? 'px-2' : 'px-3'
        )
      : 'print-hidden fixed inset-x-0 bottom-4 z-30 mx-auto max-w-lg px-4';

  const handleClick = () => {
    if (hasRunnable && !isLoading) {
      runAction.onRun();
    }
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={wrapperClass}>
      <button
        type="button"
        onClick={handleClick}
        className={cx(
          'flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-left shadow-2xl backdrop-blur transition active:scale-[0.99]',
          hasRunnable
            ? 'border-amber-400/45 bg-elevated/95 ring-1 ring-amber-400/20'
            : 'border-indigo-400/25 bg-elevated/95'
        )}
      >
        <div className="min-w-0">
          {eyebrow && (
            <div className={cx('truncate text-[11px]', isDirty ? 'text-amber-300' : 'text-zinc-400')}>
              {isDirty
                ? tx('Thông số vừa thay đổi · Bấm để cập nhật', 'Inputs changed · Tap to run', '入力変更あり・タップで再計算')
                : eyebrow}
            </div>
          )}
          <div className="truncate text-sm font-semibold tabular-nums text-white">{value}</div>
        </div>
        <span
          className={cx(
            'inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium',
            isLoading
              ? 'bg-indigo-500/25 text-indigo-200'
              : isDirty
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'bg-indigo-500/20 text-indigo-200'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              {tx('Đang chạy', 'Running', '実行中')}
            </>
          ) : isDirty ? (
            <>
              <Play className="size-3 fill-current" />
              {runAction?.label || tx('Chạy lại', 'Run', '実行')}
            </>
          ) : (
            <>
              {ctaLabel || tx('Kết quả', 'Results', '結果')} <ArrowDown className="size-3" />
            </>
          )}
        </span>
      </button>
    </div>
  );
}

function RunActionFooter({ runAction, scrollTargetId }) {
  const { tx } = useI18n();
  if (!runAction?.onRun) return null;

  const isDirty = Boolean(runAction.isDirty);
  const isLoading = Boolean(runAction.loading);
  const runLabel = runAction.label || tx('Chạy mô hình', 'Run Model', 'モデルを実行');
  const loadingLabel = runAction.loadingLabel || tx('Đang tính toán...', 'Calculating...', '計算中...');
  const dirtyText =
    runAction.dirtyLabel ||
    tx(
      'Bạn vừa chỉnh sửa thông số — bấm nút bên dưới để chạy mô hình với dữ liệu mới.',
      'Parameters updated — click below to generate fresh results.',
      '条件が変更されました — 下のボタンで新しい結果を作成してください。'
    );

  const handleTrigger = () => {
    if (isLoading) return;
    runAction.onRun();
    if (scrollTargetId) {
      setTimeout(() => {
        document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  return (
    <div
      className={cx(
        'sticky bottom-0 z-10 -mx-1 mt-2 border-t px-1 pt-3.5 pb-1 backdrop-blur transition-colors',
        isDirty ? 'border-amber-400/35 bg-surface/95' : 'border-white/[0.08] bg-surface/90'
      )}
    >
      {isDirty && !isLoading && (
        <div className="mb-2 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-200">
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-400" />
          <span>{dirtyText}</span>
        </div>
      )}
      <Button
        type="button"
        variant="primary"
        className={cx('w-full', isDirty && !isLoading && 'ring-2 ring-amber-400/40')}
        disabled={isLoading}
        onClick={handleTrigger}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          <>
            <Play className="size-4 fill-current" />
            {runLabel}
          </>
        )}
      </Button>
    </div>
  );
}

function DirtyResultsBanner({ runAction }) {
  const { tx } = useI18n();
  if (!runAction?.onRun || !runAction?.isDirty || runAction?.loading) return null;

  const runLabel = runAction.label || tx('Chạy mô hình', 'Run Model', 'モデルを実行');
  return (
    <div className="print-hidden mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/[0.08] px-4 py-3 text-xs">
      <div className="min-w-0 flex-1 text-amber-100">
        <span className="font-semibold">
          {tx('Thông số đầu vào đã thay đổi.', 'Input parameters changed.', '入力条件が変更されました。')}
        </span>{' '}
        <span className="text-amber-200/80">
          {tx(
            'Kết quả bên dưới đang giữ phiên chạy trước cho tới khi bạn bấm thực hiện.',
            'Results below reflect your previous run until you execute the updated inputs.',
            '新しい条件を反映するには実行ボタンを押してください。'
          )}
        </span>
      </div>
      <Button type="button" size="sm" variant="primary" onClick={runAction.onRun}>
        <Play className="size-3.5 fill-current" />
        {runLabel}
      </Button>
    </div>
  );
}

/**
 * Unified adaptive workspace for all calculation tools:
 * - Mobile: clean single-column stack + floating summary bar
 * - Tablet: portrait stack + sticky bar OR landscape side-by-side (`>=768px`)
 * - Duo / Fold: Book (2 independent hinge-safe screens) OR Flex/Tabletop (top results / bottom inputs)
 * - Desktop: widescreen sticky sidebar + flowing results pane
 */
export function WorkspaceSplit({
  controls,
  results,
  resultsId = 'tool-results',
  mobileSummary,
  runAction,
  controlsClassName,
  resultsClassName,
}) {
  const { mode, duoPosture, width, isTabletSplit, setDuoPosture } = useDisplayMode();
  const { tx } = useI18n();

  const renderControls = (cardClass, scrollOnRun = false) => (
    <Card className={cardClass}>
      {controls}
      <RunActionFooter runAction={runAction} scrollTargetId={scrollOnRun ? resultsId : undefined} />
    </Card>
  );

  const renderResultsPane = () => (
    <>
      <DirtyResultsBanner runAction={runAction} />
      {results}
    </>
  );

  if (mode === 'duo') {
    const canBook = width >= 560;
    const activePosture = duoPosture === 'book' && canBook ? 'book' : 'tabletop';

    if (activePosture === 'book') {
      return (
        <div>
          <div className="print-hidden mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/[0.06] px-3 py-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-zinc-300">
              <Badge tone="brand">Duo · Book Mode</Badge>
              <span>
                {tx(
                  'Trái: Thiết lập · Phải: Kết quả (né rãnh gập giữa)',
                  'Left: Controls · Right: Results (hinge-safe)',
                  '左画面：入力｜右画面：結果（ヒンジ回避）'
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDuoPosture('tabletop')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition hover:bg-white/[0.1] hover:text-white"
            >
              <Rows2 className="size-3.5 text-indigo-300" />
              {tx('Chuyển Flex (Trên/Dưới)', 'Flex (Top/Bottom)', 'Flex (上下) へ')}
            </button>
          </div>

          <div className="duo-book-grid">
            {renderControls(
              cx('duo-pane-scroll max-h-[calc(100dvh-7.75rem)] space-y-5 overflow-y-auto p-4 sm:p-5', controlsClassName),
              false
            )}
            <div className="duo-hinge-vertical print-hidden" aria-hidden="true" />
            <div
              id={resultsId}
              className={cx(
                'duo-pane-scroll min-w-0 max-h-[calc(100dvh-7.75rem)] overflow-y-auto pr-0.5',
                resultsClassName
              )}
            >
              {renderResultsPane()}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="print-hidden mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/[0.06] px-3 py-1.5 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-zinc-300">
            <Badge tone="brand">Duo · Flex / Tabletop</Badge>
            <span>
              {tx(
                'Màn hình trên: Kết quả · Màn hình dưới: Nhập liệu',
                'Top Screen: Results · Bottom Screen: Controls',
                '上画面：結果固定｜下画面：コントロール'
              )}
            </span>
          </div>
          {canBook && (
            <button
              type="button"
              onClick={() => setDuoPosture('book')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-zinc-200 transition hover:bg-white/[0.1] hover:text-white"
            >
              <Columns2 className="size-3.5 text-indigo-300" />
              {tx('Chuyển Book (Trái/Phải)', 'Book (Left/Right)', 'Book (左右) へ')}
            </button>
          )}
        </div>

        <div className="flex flex-col">
          <div
            id={resultsId}
            className={cx(
              'duo-pane-scroll min-w-0 max-h-[var(--duo-top-pane,44dvh)] overflow-y-auto rounded-2xl border border-indigo-400/20 bg-surface/50 p-3 sm:p-4',
              resultsClassName
            )}
          >
            {renderResultsPane()}
          </div>
          <div className="duo-hinge-horizontal print-hidden" aria-hidden="true">
            <span className="relative z-10 rounded-full border border-indigo-400/25 bg-canvas px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-indigo-300/80">
              {tx('Nếp gấp bản lề · Hinge Safe', 'Hinge Safe Seam', 'ヒンジ安全ゾーン')}
            </span>
          </div>
          {renderControls(
            cx('duo-pane-scroll max-h-[42dvh] space-y-4 overflow-y-auto p-4 sm:p-5', controlsClassName),
            false
          )}
        </div>
      </div>
    );
  }

  if (mode === 'desktop') {
    return (
      <div className="grid grid-cols-[380px_minmax(0,1fr)] items-start gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        {renderControls(
          cx('sticky top-20 max-h-[calc(100dvh-6rem)] space-y-5 overflow-y-auto p-6', controlsClassName),
          false
        )}
        <div id={resultsId} className={cx('min-w-0', resultsClassName)}>
          {renderResultsPane()}
        </div>
      </div>
    );
  }

  if (mode === 'tablet' && isTabletSplit) {
    return (
      <div className="grid grid-cols-[336px_minmax(0,1fr)] items-start gap-5">
        {renderControls(
          cx('sticky top-28 max-h-[calc(100dvh-8rem)] space-y-5 overflow-y-auto p-5', controlsClassName),
          false
        )}
        <div id={resultsId} className={cx('min-w-0', resultsClassName)}>
          {renderResultsPane()}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={mode === 'mobile' ? 'space-y-4' : 'space-y-5'}>
        {renderControls(cx(mode === 'mobile' ? 'space-y-4 p-4' : 'space-y-5 p-5', controlsClassName), true)}
        <div id={resultsId} className={cx('min-w-0', resultsClassName)}>
          {renderResultsPane()}
        </div>
      </div>
      {mobileSummary && (
        <StickyResultBar
          targetId={resultsId}
          eyebrow={mobileSummary.eyebrow}
          value={mobileSummary.value}
          ctaLabel={mobileSummary.ctaLabel}
          runAction={runAction}
        />
      )}
    </>
  );
}

/**
 * Unified two-zone section (`Home` Hero, `Home` Rates+Cloud, `Profile`) respecting hinge seam on Duo/Fold.
 */
export function DualPaneSection({ left, right, ratio = 'balanced', align = 'start', className }) {
  const { mode, duoPosture, width, isTabletSplit } = useDisplayMode();
  const alignClass = align === 'center' ? 'items-center' : 'items-start';

  if (mode === 'duo' && duoPosture === 'book' && width >= 560) {
    return (
      <div className={cx('duo-book-grid', align === 'center' && '!items-center', className)}>
        <div className="min-w-0">{left}</div>
        <div className="duo-hinge-vertical print-hidden" aria-hidden="true" />
        <div className="min-w-0">{right}</div>
      </div>
    );
  }

  if (mode === 'duo') {
    return (
      <div className={cx('flex flex-col', className)}>
        <div className="min-w-0">{left}</div>
        <div className="duo-hinge-horizontal print-hidden" aria-hidden="true" />
        <div className="min-w-0">{right}</div>
      </div>
    );
  }

  if (mode === 'desktop') {
    const colTemplate =
      ratio === 'wide-left'
        ? 'grid-cols-[1.2fr_1fr] gap-8 xl:gap-12'
        : ratio === 'wide-right'
          ? 'grid-cols-[5fr_7fr] gap-6'
          : 'grid-cols-2 gap-6';
    return (
      <div className={cx('grid', colTemplate, alignClass, className)}>
        <div className="min-w-0">{left}</div>
        <div className="min-w-0">{right}</div>
      </div>
    );
  }

  if (mode === 'tablet' && isTabletSplit) {
    const colTemplate = ratio === 'wide-left' ? 'grid-cols-[1.1fr_1fr] gap-6' : 'grid-cols-2 gap-5';
    return (
      <div className={cx('grid', colTemplate, alignClass, className)}>
        <div className="min-w-0">{left}</div>
        <div className="min-w-0">{right}</div>
      </div>
    );
  }

  return (
    <div className={cx(mode === 'mobile' ? 'space-y-6' : 'space-y-6', className)}>
      <div className="min-w-0">{left}</div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}

/**
 * Mode-driven grid replacing scattered responsive grid classes.
 * When `hingeAligned` is set in Duo Book posture, splits cards across left & right screens with hinge gap.
 */
export function AdaptiveGrid({
  cols = { mobile: 1, tablet: 2, duo: 2, desktop: 4 },
  hingeAligned = false,
  gap = 'gap-3',
  children,
  className,
}) {
  const { mode, duoPosture, width } = useDisplayMode();

  if (hingeAligned && mode === 'duo' && duoPosture === 'book' && width >= 560) {
    return (
      <div className={cx('grid grid-cols-2 gap-y-3', className)} style={{ columnGap: 'var(--duo-hinge-gap, 28px)' }}>
        {children}
      </div>
    );
  }

  const colCount = cols[mode] ?? cols.desktop ?? 1;
  return <div className={cx('grid', COL_CLASS[colCount] || 'grid-cols-1', gap, className)}>{children}</div>;
}
