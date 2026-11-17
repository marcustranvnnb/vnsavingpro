import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { compact, vnd } from '../utils/format.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

/**
 * Wealth growth chart: total balance vs. money deposited vs. target.
 * `log` is calculatePassiveIncomeRoadmap().monthByMonthLog
 */
export default function GrowthChart({ log, target }) {
  const data = useMemo(() => {
    const points = log.filter((r, i) => r.month === 0 || r.month % 12 === 0 || i === log.length - 1);
    return {
      labels: points.map((r) => (r.month === 0 ? 'Nay' : r.month % 12 === 0 ? `Năm ${r.month / 12}` : `T${r.month}`)),
      datasets: [
        {
          label: 'Tổng tài sản',
          data: points.map((r) => r.totalBalance),
          borderColor: '#818cf8',
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#fff',
          fill: true,
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            const area = chart.chartArea;
            if (!area) return 'rgba(99,102,241,0.15)';
            const g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
            g.addColorStop(0, 'rgba(99,102,241,0.35)');
            g.addColorStop(1, 'rgba(99,102,241,0)');
            return g;
          },
        },
        {
          label: 'Tiền bạn gửi',
          data: points.map((r) => r.principalDeposited),
          borderColor: 'rgba(161,161,170,0.7)',
          borderWidth: 1.5,
          borderDash: [4, 4],
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: false,
        },
        {
          label: 'Mục tiêu',
          data: points.map(() => target),
          borderColor: 'rgba(52,211,153,0.8)',
          borderWidth: 1.5,
          borderDash: [2, 4],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
        },
      ],
    };
  }, [log, target]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(22,24,29,0.96)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          titleColor: '#fff',
          bodyColor: '#d4d4d8',
          titleFont: { family: 'Inter', weight: '600' },
          bodyFont: { family: 'Inter' },
          boxPadding: 4,
          callbacks: { label: (c) => ` ${c.dataset.label}: ${vnd(c.parsed.y)}` },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#71717a', font: { family: 'Inter', size: 11 }, maxRotation: 0, autoSkipPadding: 16 },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          border: { display: false },
          ticks: { color: '#71717a', font: { family: 'Inter', size: 11 }, callback: (v) => compact(v), maxTicksLimit: 5 },
        },
      },
    }),
    []
  );

  return <Line data={data} options={options} />;
}
