/**
 * Server-Only FX Multi-Currency Conversion, Portfolio Valuation & Savings Hurdle Engine.
 */

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function calculateFxPortfolio({
  holdings = [],
  convertFrom = 'USD',
  convertTo = 'VND',
  convertAmount = 1000,
  rateType = 'transfer',
  targetRates = [],
  benchmarkVndRate = 6.9,
  currencies = [],
  lang = 'vi',
} = {}) {
  const lx = (vi, en, ja) => (lang === 'en' ? en : lang === 'ja' ? ja : vi);
  const rateMap = new Map();

  rateMap.set('VND', {
    code: 'VND',
    name: 'VIETNAMESE DONG',
    buy: 1,
    transfer: 1,
    sell: 1,
    mid: 1,
    spreadPct: 0,
  });

  for (const item of currencies) {
    if (item?.code) {
      rateMap.set(String(item.code).toUpperCase(), item);
    }
  }

  const fromCode = String(convertFrom || 'USD').toUpperCase();
  const toCode = String(convertTo || 'VND').toUpperCase();
  const fromFx = rateMap.get(fromCode) || rateMap.get('USD') || rateMap.get('VND');
  const toFx = rateMap.get(toCode) || rateMap.get('VND');
  const amt = Math.max(0, toNum(convertAmount, 0));

  const buyKey = rateType === 'cash' ? 'buy' : 'transfer';
  const fromVndRate = fromCode === 'VND' ? 1 : toNum(fromFx?.[buyKey] || fromFx?.transfer, 1);
  const toVndRate = toCode === 'VND' ? 1 : toNum(toFx?.sell || toFx?.transfer, 1);

  const vndIntermediate = amt * fromVndRate;
  const convertedAmount = toVndRate > 0 ? vndIntermediate / toVndRate : 0;
  const unitRate = amt > 0 ? convertedAmount / amt : toVndRate > 0 ? fromVndRate / toVndRate : 0;

  // Mid reference comparison for spread cost estimation
  const fromMid = fromCode === 'VND' ? 1 : toNum(fromFx?.mid, fromVndRate);
  const toMid = toCode === 'VND' ? 1 : toNum(toFx?.mid, toVndRate);
  const midConverted = toMid > 0 ? (amt * fromMid) / toMid : convertedAmount;
  const conversionSpreadPct =
    midConverted > 0 ? Number((((midConverted - convertedAmount) / midConverted) * 100).toFixed(2)) : 0;

  // 2. Portfolio valuation across multi-currency holdings
  const cleanHoldings = Array.isArray(holdings) ? holdings.slice(0, 20) : [];
  const breakdown = [];
  let totalVndLiquidation = 0;
  let totalVndReplacement = 0;
  let totalVndMid = 0;
  let weightedSpreadNumerator = 0;

  for (const h of cleanHoldings) {
    const code = String(h?.code || '').toUpperCase().trim();
    const amount = Math.max(0, toNum(h?.amount, 0));
    if (!code || amount <= 0) continue;
    const fx = rateMap.get(code);
    if (!fx) continue;

    const liqRate = code === 'VND' ? 1 : toNum(fx.transfer || fx.buy, 0);
    const repRate = code === 'VND' ? 1 : toNum(fx.sell || liqRate, 0);
    const midRate = code === 'VND' ? 1 : toNum(fx.mid || liqRate, 0);

    const vndLiquidation = Math.round(amount * liqRate);
    const vndReplacement = Math.round(amount * repRate);
    const vndMid = Math.round(amount * midRate);
    const note = String(h?.note || '').trim().slice(0, 60);

    totalVndLiquidation += vndLiquidation;
    totalVndReplacement += vndReplacement;
    totalVndMid += vndMid;
    if (code !== 'VND') {
      weightedSpreadNumerator += vndLiquidation * toNum(fx.spreadPct, 0);
    }

    breakdown.push({
      code,
      name: fx.name,
      amount,
      note,
      buyRate: fx.buy,
      transferRate: fx.transfer,
      sellRate: fx.sell,
      spreadPct: fx.spreadPct,
      vndLiquidation,
      vndReplacement,
      vndMid,
      sharePct: 0,
    });
  }

  let nonVndTotal = 0;
  let maxSingleFxShare = 0;
  let maxSingleFxCode = '';

  for (const row of breakdown) {
    row.sharePct =
      totalVndLiquidation > 0 ? Number(((row.vndLiquidation / totalVndLiquidation) * 100).toFixed(1)) : 0;
    if (row.code !== 'VND') {
      nonVndTotal += row.vndLiquidation;
      if (row.sharePct > maxSingleFxShare) {
        maxSingleFxShare = row.sharePct;
        maxSingleFxCode = row.code;
      }
    }
  }

  breakdown.sort((a, b) => b.vndLiquidation - a.vndLiquidation);

  const vndRateBench = Math.max(0, Math.min(25, toNum(benchmarkVndRate, 6.9)));
  const avgFxSpreadPct =
    nonVndTotal > 0 ? Number((weightedSpreadNumerator / nonVndTotal).toFixed(2)) : 0;
  // Total annual hurdle = opportunity yield of VND bank savings + spread recovery needed
  const breakEvenFxAppreciationPct = Number((vndRateBench + avgFxSpreadPct).toFixed(2));
  const vnd1YearBankInterest = Math.round(totalVndLiquidation * (vndRateBench / 100));
  const spreadLossVnd = Math.max(0, totalVndReplacement - totalVndLiquidation);

  const fxExposurePct =
    totalVndLiquidation > 0 ? Number(((nonVndTotal / totalVndLiquidation) * 100).toFixed(1)) : 0;

  // Sensitivity scenarios (only applied to non-VND foreign currency exposure; VND cash stays 1:1)
  const vndBaseAmount = Math.max(0, totalVndLiquidation - nonVndTotal);
  const sensitivity = [-5, -2, 0, 2, 5, 10].map((shiftPct) => {
    const projectedFxVnd = Math.round(nonVndTotal * (1 + shiftPct / 100));
    const projectedTotalVnd = vndBaseAmount + projectedFxVnd;
    return {
      shiftPct,
      projectedTotalVnd,
      deltaVnd: projectedTotalVnd - totalVndLiquidation,
    };
  });

  // Target exchange rate alerts
  const alerts = (Array.isArray(targetRates) ? targetRates.slice(0, 12) : [])
    .map((t) => {
      const code = String(t?.code || '').toUpperCase().trim();
      const target = toNum(t?.targetRate, 0);
      const direction = t?.direction === 'below' ? 'below' : 'above';
      const fx = rateMap.get(code);
      if (!fx || target <= 0 || code === 'VND') return null;

      const currentRate = direction === 'below' ? fx.sell : fx.transfer;
      const gapPct =
        currentRate > 0 ? Number((((currentRate - target) / target) * 100).toFixed(2)) : 0;
      const reached = direction === 'above' ? currentRate >= target : currentRate <= target;
      const close = !reached && Math.abs(gapPct) <= 1.25;

      return {
        code,
        direction,
        currentRate,
        targetRate: target,
        gapPct,
        status: reached ? 'reached' : close ? 'close' : 'watching',
      };
    })
    .filter(Boolean);

  const insights = [];
  if (breakdown.length === 0) {
    insights.push(
      lx(
        'Hãy thêm ít nhất 1 khoản nắm giữ ngoại tệ (hoặc VND) để phân tích tỷ trọng và bài test biến động tỷ giá.',
        'Add at least one FX or VND holding to analyze allocation weights and exchange-rate sensitivity.',
        '外貨またはVNDの保有資産を追加すると、通貨構成比や為替変動ストレステストを確認できます。'
      )
    );
  } else {
    if (maxSingleFxShare >= 50) {
      insights.push(
        lx(
          `${maxSingleFxCode} đang chiếm ${maxSingleFxShare}% tổng tài sản quy đổi. Nên cân nhắc đa dạng hoá hoặc giữ một phần bằng VND gửi kỳ hạn để giảm rủi ro tỷ giá đơn lẻ.`,
          `${maxSingleFxCode} represents ${maxSingleFxShare}% of converted wealth. Consider diversifying or holding a VND term buffer to reduce single-currency risk.`,
          `${maxSingleFxCode}が全体の${maxSingleFxShare}%を占めています。単一通貨リスクを抑えるためVND定期預金や他通貨への分散をご検討ください。`
        )
      );
    }
    if (nonVndTotal > 0) {
      insights.push(
        lx(
          `Với lãi suất tiết kiệm VND ${vndRateBench}%/năm và chênh lệch mua-bán ~${avgFxSpreadPct}%, ngoại tệ cần tăng tối thiểu +${breakEvenFxAppreciationPct}%/năm mới có lợi thế hơn gửi tiết kiệm VND (nếu ngoại tệ không trả lãi suất cao).`,
          `Against ${vndRateBench}% p.a. VND savings and ~${avgFxSpreadPct}% bid-ask spread, FX holdings need +${breakEvenFxAppreciationPct}%/year appreciation just to break even vs VND term deposits.`,
          `年利${vndRateBench}%のVND預金と売買スプレッド約${avgFxSpreadPct}%を考慮すると、年+${breakEvenFxAppreciationPct}%以上の上昇がVND定期預金を上回る損益分岐点となります。`
        )
      );
    }
  }

  return {
    conversion: {
      fromCode,
      toCode,
      amount: amt,
      rateType: buyKey,
      convertedAmount: Number(convertedAmount.toFixed(toCode === 'VND' ? 0 : 4)),
      unitRate: Number(unitRate.toFixed(toCode === 'VND' ? 2 : 6)),
      fromVndRate,
      toVndRate,
      conversionSpreadPct: Math.max(0, conversionSpreadPct),
    },
    portfolio: {
      totalVndLiquidation,
      totalVndReplacement,
      totalVndMid,
      nonVndVndValue: nonVndTotal,
      fxExposurePct,
      avgFxSpreadPct,
      spreadLossVnd,
      vndRateBenchmark: vndRateBench,
      vnd1YearBankInterest,
      breakEvenFxAppreciationPct,
      holdingsCount: breakdown.length,
    },
    breakdown,
    sensitivity,
    alerts,
    insights,
  };
}
