import React from 'react';
import { Home, User, Users } from 'lucide-react';
import { cx } from './ui.jsx';

export const HOUSEHOLD_MODES = [
  {
    id: 'INDIVIDUAL',
    label: 'Cá nhân',
    shortDesc: '1 nguồn thu · Dự phòng 4T',
    icon: User,
  },
  {
    id: 'COUPLE',
    label: 'Cặp đôi',
    shortDesc: '2 thu nhập · Dự phòng 6T',
    icon: Users,
  },
  {
    id: 'FAMILY',
    label: 'Gia đình',
    shortDesc: 'Có phụ thuộc · Dự phòng 6–12T',
    icon: Home,
  },
];

export function HouseholdModeSwitch({ value, onChange, compact = false }) {
  return (
    <div className={cx('grid grid-cols-3 gap-1.5 rounded-xl bg-white/[0.03] p-1 ring-1 ring-inset ring-white/[0.07]')}>
      {HOUSEHOLD_MODES.map((m) => {
        const Icon = m.icon;
        const active = value === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={cx(
              'flex flex-col items-center justify-center rounded-lg px-2 text-center transition',
              compact ? 'py-1.5' : 'py-2',
              active
                ? 'bg-indigo-500/20 text-white ring-1 ring-inset ring-indigo-400/40 shadow-sm'
                : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
            )}
          >
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <Icon className={cx('size-3.5', active ? 'text-indigo-300' : 'text-zinc-500')} />
              <span>{m.label}</span>
            </span>
            {!compact && <span className="mt-0.5 text-[10px] text-zinc-500">{m.shortDesc}</span>}
          </button>
        );
      })}
    </div>
  );
}
