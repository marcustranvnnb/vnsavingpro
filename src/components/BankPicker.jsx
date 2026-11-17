import React from 'react';
import { useRates } from '../state.jsx';
import { TENURE_LABELS } from '../data/banksData.js';
import { pct } from '../utils/format.js';
import { BankMark, cx } from './ui.jsx';

export const TENURE_OPTIONS = ['1M', '3M', '6M', '9M', '12M', '18M', '24M', '36M'];

/** 2×2 bank selector + tenure select. Shows the (possibly user-overridden) rate per bank. */
export function BankPicker({ bankId, onBank, tenure, onTenure, label = 'Ngân hàng & kỳ hạn' }) {
  const { banks, getRate } = useRates();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-zinc-300">{label}</span>
        {onTenure && (
          <select
            value={tenure}
            onChange={(e) => onTenure(e.target.value)}
            aria-label="Kỳ hạn"
            className="select h-9 rounded-lg bg-black/30 pl-3 text-[13px] font-medium text-white ring-1 ring-inset ring-white/10 outline-none focus:ring-indigo-400/60"
          >
            {TENURE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TENURE_LABELS[t]}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {banks.map((b) => {
          const active = b.id === bankId;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onBank(b.id)}
              className={cx(
                'flex items-center gap-2.5 rounded-xl p-2.5 text-left ring-1 ring-inset transition-all',
                active
                  ? 'bg-indigo-500/10 ring-indigo-400/40'
                  : 'bg-white/[0.02] ring-white/[0.07] hover:bg-white/[0.05]'
              )}
            >
              <BankMark bank={b} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-white">{b.name}</span>
                <span className={cx('block text-xs tabular-nums', active ? 'text-indigo-300' : 'text-zinc-500')}>
                  {pct(getRate(b, tenure))}/năm
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
