import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { useI18n } from '../i18n/index.jsx';
import { cx } from './ui.jsx';

/**
 * Interactive horizontal timeline selector supporting:
 * - Touch horizontal swipe + snap
 * - Mouse drag-to-scroll on Desktop
 * - Left / Right chevron buttons
 * - Continuous interactive milestone scrubber slider
 * - Keyboard Left / Right arrow navigation
 */
export function StageCarousel({ items = [], activeIndex = 0, onSelectIndex, renderItem, getLabel, className }) {
  const { tx } = useI18n();
  const trackRef = useRef(null);
  const itemRefs = useRef([]);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const suppressClickRef = useRef(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const safeIndex = Math.max(0, Math.min(items.length - 1, Number(activeIndex) || 0));

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateEdges();
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('resize', updateEdges, { passive: true });
    return () => window.removeEventListener('resize', updateEdges);
  }, [items.length, updateEdges]);

  useEffect(() => {
    const track = trackRef.current;
    const activeEl = itemRefs.current[safeIndex];
    if (!track || !activeEl) return;
    const targetLeft = activeEl.offsetLeft - (track.clientWidth - activeEl.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    const id = setTimeout(updateEdges, 260);
    return () => clearTimeout(id);
  }, [safeIndex, items.length, updateEdges]);

  const scrollTrackBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(200, Math.round(el.clientWidth * 0.65));
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const handlePointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 6) {
      dragRef.current.moved = true;
    }
    if (dragRef.current.moved) {
      el.scrollLeft = dragRef.current.startScroll - dx;
    }
  };

  const endDrag = () => {
    if (!dragRef.current.active) return;
    if (dragRef.current.moved) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 60);
    }
    dragRef.current.active = false;
  };

  const handleKeyDown = (e) => {
    if (items.length <= 1) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSelectIndex(Math.min(items.length - 1, safeIndex + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSelectIndex(Math.max(0, safeIndex - 1));
    }
  };

  const pctScrub = items.length > 1 ? (safeIndex / (items.length - 1)) * 100 : 100;
  const activeLabel = getLabel ? getLabel(items[safeIndex]) : '';

  return (
    <div className={cx('space-y-2.5', className)} onKeyDown={handleKeyDown}>
      {/* Horizontal Snap + Drag Track with Navigation Chevrons */}
      <div className="relative">
        {canLeft && (
          <button
            type="button"
            onClick={() => scrollTrackBy(-1)}
            aria-label={tx('Cuộn xem các năm trước', 'Scroll earlier stages', '前の年へスクロール')}
            className="absolute left-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-elevated/95 text-zinc-200 shadow-lg backdrop-blur transition hover:border-indigo-400/40 hover:bg-indigo-500/25 hover:text-white"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}

        <div
          ref={trackRef}
          onScroll={updateEdges}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          onClickCapture={(e) => {
            if (suppressClickRef.current) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          className={cx(
            'no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-1 pt-0.5 touch-pan-x select-none cursor-grab active:cursor-grabbing',
            canLeft && 'pl-8',
            canRight && 'pr-8'
          )}
        >
          {items.map((item, idx) => (
            <div
              key={item?.month ?? item?.monthIndex ?? idx}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
              className="shrink-0 snap-start"
            >
              {renderItem(item, idx, idx === safeIndex, () => onSelectIndex(idx))}
            </div>
          ))}
        </div>

        {canRight && (
          <button
            type="button"
            onClick={() => scrollTrackBy(1)}
            aria-label={tx('Cuộn xem các năm tiếp theo', 'Scroll later stages', '次の年へスクロール')}
            className="absolute right-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-elevated/95 text-zinc-200 shadow-lg backdrop-blur transition hover:border-indigo-400/40 hover:bg-indigo-500/25 hover:text-white"
          >
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>

      {/* Interactive Year Scrubber + Stepper Controls */}
      {items.length > 1 && (
        <div className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2 sm:flex-1">
            <button
              type="button"
              disabled={safeIndex <= 0}
              onClick={() => onSelectIndex(Math.max(0, safeIndex - 1))}
              aria-label={tx('Mốc trước', 'Previous stage', '前のステージ')}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.1] hover:text-white disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft className="size-3.5" />
            </button>

            <input
              type="range"
              min={0}
              max={items.length - 1}
              step={1}
              value={safeIndex}
              onChange={(e) => onSelectIndex(Number(e.target.value))}
              aria-label={tx('Thanh trượt chọn mốc năm', 'Scrub timeline stage', 'ステージ選択スライダー')}
              className="range flex-1"
              style={{ '--p': `${pctScrub}%` }}
            />

            <button
              type="button"
              disabled={safeIndex >= items.length - 1}
              onClick={() => onSelectIndex(Math.min(items.length - 1, safeIndex + 1))}
              aria-label={tx('Mốc tiếp theo', 'Next stage', '次のステージ')}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/[0.1] hover:text-white disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400 sm:justify-end">
            <span className="inline-flex items-center gap-1 text-zinc-500">
              <Hand className="size-3 text-indigo-300" />
              {tx('Vuốt / kéo trượt các năm', 'Swipe or slide years', 'スワイプ／スライドで年移動')}
            </span>
            <span className="shrink-0 rounded-md bg-indigo-500/15 px-2 py-0.5 font-medium tabular-nums text-indigo-200 ring-1 ring-inset ring-indigo-400/25">
              {safeIndex + 1}/{items.length}
              {activeLabel ? ` · ${activeLabel}` : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Touch swipe gesture wrapper around stage details so users can swipe left/right directly
 * on the detail panel to step between milestone years without interfering with inner scroll tables.
 */
export function SwipeableStageBody({ activeIndex = 0, totalCount = 0, onChangeIndex, children, className }) {
  const touchRef = useRef(null);

  const handleTouchStart = (e) => {
    if (totalCount <= 1 || e.touches.length !== 1) return;
    if (e.target?.closest?.('table, input[type="range"], .overscroll-x-contain, .no-scrollbar')) {
      touchRef.current = null;
      return;
    }
    touchRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    const elapsed = Date.now() - start.time;

    if (elapsed < 750 && Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.35) {
      if (dx < 0 && activeIndex + 1 < totalCount) {
        onChangeIndex(activeIndex + 1);
      } else if (dx > 0 && activeIndex - 1 >= 0) {
        onChangeIndex(activeIndex - 1);
      }
    }
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} className={className}>
      {children}
    </div>
  );
}
