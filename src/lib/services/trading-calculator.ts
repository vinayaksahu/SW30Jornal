export interface TradeRecord {
  id: string;
  accountId: string;
  userId?: string;
  ticketNumber?: string | null;
  symbol: string;
  direction: 'BUY' | 'SELL';
  volume: number | any;
  entryPrice: number | any;
  exitPrice?: number | null | any;
  stopLoss?: number | null | any;
  takeProfit?: number | null | any;
  profitLoss?: number | null | any;
  commission?: number | any;
  swap?: number | any;
  entryTime: Date | string;
  exitTime?: Date | string | null;
  durationSeconds?: number | null;
  strategyId?: string | null;
  strategy?: { id?: string; name: string } | null;
  rrRatio?: number | null | any;
  ruleStatus?: string | null;
  newsStatus?: string | null;
  account?: { id?: string; name: string } | null;
  [key: string]: any;
}

export interface AccountRecord {
  id?: string;
  name?: string;
  propFirm?: string;
  accountSize: number | any;
  startingBalance: number | any;
  currentBalance: number | any;
  equity: number | any;
  profitTarget: number | any;
  dailyDrawdownLimit: number | any;
  maxDrawdownLimit: number | any;
  maxRiskPerTrade?: number | null | any;
  maxTradesPerDay?: number | null;
  maxLotSize?: number | null | any;
  minTradingDays?: number | null;
  newsRestrictions?: boolean;
  weekendRestrictions?: boolean;
  status?: string;
  [key: string]: any;
}

export interface EquityPoint {
  date: string;
  fullDate: string;
  tradeIndex: number;
  pnl: number;
  balance: number;
  equity: number;
  drawdown: number;
  drawdownPercent: number;
  symbol?: string;
}

export interface DailyPnLItem {
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  pnl: number;
  tradesCount: number;
  wins: number;
  losses: number;
  breakEvens: number;
  volume: number;
  trades: TradeRecord[];
}

export interface SymbolStat {
  symbol: string;
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnL: number;
  totalVolume: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
}

export interface SessionStat {
  session: 'Asian' | 'London' | 'New York' | 'Other';
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnL: number;
  totalVolume: number;
  profitFactor: number;
}

export interface DayOfWeekStat {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  dayIndex: number;
  netPnL: number;
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  totalVolume: number;
}

export interface StrategyStat {
  strategyId: string;
  strategyName: string;
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnL: number;
  profitFactor: number;
  avgRR: number;
}

export interface ChallengeMetrics {
  startingBalance: number;
  currentBalance: number;
  equity: number;
  accountSize: number;
  profitTarget: number;
  profitTargetAmount: number;
  currentProfit: number;
  targetProgress: number; // percentage (0-100+)
  
  dailyDrawdownLimit: number;
  dailyDDUsed: number;
  dailyDDUsedPercent: number;
  dailyDDRemaining: number;
  dailyDDRemainingPercent: number;
  
  maxDrawdownLimit: number;
  maxDDUsed: number;
  maxDDUsedPercent: number;
  maxDDRemaining: number;
  maxDDRemainingPercent: number;
  
  tradingDaysPassed: number;
  minTradingDays: number;
  tradingDaysProgress: number;
  
  status: 'ACTIVE' | 'PASSED' | 'FAILED' | 'ARCHIVED';
  isDailyDDBreached: boolean;
  isMaxDDBreached: boolean;
  isTargetReached: boolean;
}

export interface AccountStats {
  totalTrades: number;
  closedTrades: number;
  wins: number;
  losses: number;
  breakEvens: number;
  winRate: number;
  lossRate: number;
  
  totalProfit: number;
  totalLoss: number;
  netPnL: number;
  profitFactor: number;
  
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  currentStreak: { type: 'WIN' | 'LOSS' | 'NONE'; count: number };
  
  avgRR: number;
  avgDurationSeconds: number;
  
  maxDrawdown: number;
  maxDrawdownPercent: number;
  currentDrawdown: number;
  currentDrawdownPercent: number;
  
  dailyPnL: Record<string, DailyPnLItem>;
  equityCurve: EquityPoint[];
  symbolBreakdown: SymbolStat[];
  sessionBreakdown: SessionStat[];
  dayOfWeekBreakdown: DayOfWeekStat[];
  strategyBreakdown: StrategyStat[];
  
  challengeMetrics: ChallengeMetrics;
  
  // Extra convenience metrics
  bestTrade: number;
  worstTrade: number;
  avgTradePnL: number;
  totalVolume: number;
  complianceRate: number; // % of trades with ruleStatus === 'FOLLOWED'
  longTradesCount: number;
  shortTradesCount: number;
  longWinRate: number;
  shortWinRate: number;
}

/**
 * Calculates net profit/loss for a trade taking commission and swap into account.
 */
export function getTradeNetProfit(trade: TradeRecord): number {
  const pl = Number(trade.profitLoss) || 0;
  const comm = Number(trade.commission) || 0;
  const sw = Number(trade.swap) || 0;
  return pl - comm - sw;
}

/**
 * Converts a date to IST YYYY-MM-DD string
 */
export function formatISTDateKey(dateInput: Date | string): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }
}

/**
 * Formats a date into a human readable IST string
 */
export function formatISTDateTime(dateInput: Date | string): string {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Determines the market session for a given trade entry time in UTC
 */
export function determineTradeSession(dateInput: Date | string): 'Asian' | 'London' | 'New York' | 'Other' {
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const utcHours = d.getUTCHours();
    const utcMinutes = d.getUTCMinutes();
    const timeDec = utcHours + utcMinutes / 60;

    // Asian: 00:00 - 08:00 UTC (Tokyo 09:00-17:00, Sydney)
    // London: 08:00 - 13:00 UTC (London morning before NY overlap)
    // New York: 13:00 - 21:00 UTC (London/NY overlap 13:00-16:30 + NY afternoon 16:30-21:00)
    // Other: 21:00 - 24:00 UTC (Late rollover / pre-Asia)
    if (timeDec >= 0 && timeDec < 8) {
      return 'Asian';
    } else if (timeDec >= 8 && timeDec < 13) {
      return 'London';
    } else if (timeDec >= 13 && timeDec < 21) {
      return 'New York';
    } else {
      return 'Other';
    }
  } catch {
    return 'Other';
  }
}

/**
 * Calculates comprehensive statistics for a list of trades and an optional account.
 */
export function calculateAccountStats(
  trades: TradeRecord[] = [],
  account?: AccountRecord | null
): AccountStats {
  const accountSize = Number(account?.accountSize) || 50000;
  const startingBalance = Number(account?.startingBalance) || accountSize;
  const rawCurrentBalance = Number(account?.currentBalance) || startingBalance;
  const rawEquity = Number(account?.equity) || rawCurrentBalance;
  
  const profitTargetInput = Number(account?.profitTarget) || 5000;
  const dailyDrawdownLimit = Number(account?.dailyDrawdownLimit) || (accountSize * 0.05);
  const maxDrawdownLimit = Number(account?.maxDrawdownLimit) || (accountSize * 0.10);
  const minTradingDays = Number(account?.minTradingDays) || 5;
  const status = (account?.status as any) || 'ACTIVE';

  // Profit target amount: if input > startingBalance, it was entered as balance target (e.g. 55000)
  const profitTargetAmount = profitTargetInput > startingBalance
    ? profitTargetInput - startingBalance
    : profitTargetInput;

  // Sort trades chronologically (ascending by entryTime)
  const sortedTrades = [...trades].sort((a, b) => {
    const timeA = new Date(a.entryTime).getTime();
    const timeB = new Date(b.entryTime).getTime();
    return timeA - timeB;
  });

  const totalTrades = sortedTrades.length;
  let wins = 0;
  let losses = 0;
  let breakEvens = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  let netPnL = 0;
  let totalVolume = 0;
  let totalDurationSeconds = 0;
  let durationCount = 0;
  let totalRR = 0;
  let rrCount = 0;
  let bestTrade = 0;
  let worstTrade = 0;
  let followedRulesCount = 0;

  let longTradesCount = 0;
  let longWins = 0;
  let shortTradesCount = 0;
  let shortWins = 0;

  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentStreakCount = 0;
  let currentStreakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';

  const dailyPnL: Record<string, DailyPnLItem> = {};
  const symbolMap: Record<string, { trades: number; wins: number; losses: number; pnl: number; volume: number; totalProfit: number; totalLoss: number } > = {};
  const sessionMap: Record<'Asian' | 'London' | 'New York' | 'Other', { trades: number; wins: number; losses: number; pnl: number; volume: number; totalProfit: number; totalLoss: number }> = {
    Asian: { trades: 0, wins: 0, losses: 0, pnl: 0, volume: 0, totalProfit: 0, totalLoss: 0 },
    London: { trades: 0, wins: 0, losses: 0, pnl: 0, volume: 0, totalProfit: 0, totalLoss: 0 },
    'New York': { trades: 0, wins: 0, losses: 0, pnl: 0, volume: 0, totalProfit: 0, totalLoss: 0 },
    Other: { trades: 0, wins: 0, losses: 0, pnl: 0, volume: 0, totalProfit: 0, totalLoss: 0 },
  };
  const dayOfWeekMap: Record<string, { dayIndex: number; pnl: number; trades: number; wins: number; losses: number; volume: number }> = {
    Mon: { dayIndex: 1, pnl: 0, trades: 0, wins: 0, losses: 0, volume: 0 },
    Tue: { dayIndex: 2, pnl: 0, trades: 0, wins: 0, losses: 0, volume: 0 },
    Wed: { dayIndex: 3, pnl: 0, trades: 0, wins: 0, losses: 0, volume: 0 },
    Thu: { dayIndex: 4, pnl: 0, trades: 0, wins: 0, losses: 0, volume: 0 },
    Fri: { dayIndex: 5, pnl: 0, trades: 0, wins: 0, losses: 0, volume: 0 },
    Sat: { dayIndex: 6, pnl: 0, trades: 0, wins: 0, losses: 0, volume: 0 },
    Sun: { dayIndex: 0, pnl: 0, trades: 0, wins: 0, losses: 0, volume: 0 },
  };
  const strategyMap: Record<string, { name: string; trades: number; wins: number; losses: number; pnl: number; totalProfit: number; totalLoss: number; totalRR: number; rrCount: number }> = {};

  // Equity Curve tracking
  const equityCurve: EquityPoint[] = [
    {
      date: 'Start',
      fullDate: 'Initial Balance',
      tradeIndex: 0,
      pnl: 0,
      balance: startingBalance,
      equity: startingBalance,
      drawdown: 0,
      drawdownPercent: 0,
    },
  ];

  let runningBalance = startingBalance;
  let peakBalance = startingBalance;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;

  for (let i = 0; i < sortedTrades.length; i++) {
    const trade = sortedTrades[i];
    const pnl = getTradeNetProfit(trade);
    const volume = Number(trade.volume) || 0;
    totalVolume += volume;
    netPnL += pnl;

    if (pnl > bestTrade) bestTrade = pnl;
    if (pnl < worstTrade) worstTrade = pnl;

    // Direction breakdown
    if (trade.direction === 'BUY') {
      longTradesCount++;
      if (pnl > 0.001) longWins++;
    } else {
      shortTradesCount++;
      if (pnl > 0.001) shortWins++;
    }

    // Win / Loss / Break-even
    if (pnl > 0.001) {
      wins++;
      totalProfit += pnl;
      if (currentStreakType === 'WIN') {
        currentStreakCount++;
      } else {
        currentStreakType = 'WIN';
        currentStreakCount = 1;
      }
      if (currentStreakCount > maxConsecutiveWins) {
        maxConsecutiveWins = currentStreakCount;
      }
    } else if (pnl < -0.001) {
      losses++;
      totalLoss += Math.abs(pnl);
      if (currentStreakType === 'LOSS') {
        currentStreakCount++;
      } else {
        currentStreakType = 'LOSS';
        currentStreakCount = 1;
      }
      if (currentStreakCount > maxConsecutiveLosses) {
        maxConsecutiveLosses = currentStreakCount;
      }
    } else {
      breakEvens++;
    }

    // RR Ratio
    if (trade.rrRatio != null && !isNaN(Number(trade.rrRatio))) {
      totalRR += Number(trade.rrRatio);
      rrCount++;
    }

    // Duration
    let dur = trade.durationSeconds;
    if (dur == null && trade.exitTime && trade.entryTime) {
      const startMs = new Date(trade.entryTime).getTime();
      const endMs = new Date(trade.exitTime).getTime();
      if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
        dur = Math.round((endMs - startMs) / 1000);
      }
    }
    if (dur != null && dur > 0) {
      totalDurationSeconds += dur;
      durationCount++;
    }

    // Rules compliance
    if (trade.ruleStatus === 'FOLLOWED' || trade.ruleStatus === 'PASSED') {
      followedRulesCount++;
    }

    // Equity Curve update
    runningBalance += pnl;
    if (runningBalance > peakBalance) {
      peakBalance = runningBalance;
    }
    const currentDD = peakBalance - runningBalance;
    const currentDDPct = peakBalance > 0 ? (currentDD / peakBalance) * 100 : 0;
    if (currentDD > maxDrawdown) maxDrawdown = currentDD;
    if (currentDDPct > maxDrawdownPercent) maxDrawdownPercent = currentDDPct;

    const dateKey = formatISTDateKey(trade.entryTime);
    const shortDate = formatISTDateTime(trade.entryTime).split(',')[0];

    equityCurve.push({
      date: shortDate || `#${i + 1}`,
      fullDate: formatISTDateTime(trade.entryTime),
      tradeIndex: i + 1,
      pnl: Math.round(pnl * 100) / 100,
      balance: Math.round(runningBalance * 100) / 100,
      equity: Math.round(runningBalance * 100) / 100,
      drawdown: Math.round(currentDD * 100) / 100,
      drawdownPercent: Math.round(currentDDPct * 100) / 100,
      symbol: trade.symbol,
    });

    // Daily Map update
    const entryDate = new Date(trade.entryTime);
    let dayOfWeek = 'Mon';
    try {
      dayOfWeek = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(entryDate);
    } catch {
      dayOfWeek = 'Mon';
    }

    if (!dailyPnL[dateKey]) {
      dailyPnL[dateKey] = {
        date: dateKey,
        formattedDate: formatISTDateTime(trade.entryTime).split(',')[0] || dateKey,
        dayOfWeek,
        pnl: 0,
        tradesCount: 0,
        wins: 0,
        losses: 0,
        breakEvens: 0,
        volume: 0,
        trades: [],
      };
    }
    dailyPnL[dateKey].pnl += pnl;
    dailyPnL[dateKey].tradesCount += 1;
    dailyPnL[dateKey].volume += volume;
    dailyPnL[dateKey].trades.push(trade);
    if (pnl > 0.001) dailyPnL[dateKey].wins += 1;
    else if (pnl < -0.001) dailyPnL[dateKey].losses += 1;
    else dailyPnL[dateKey].breakEvens += 1;

    // Day of Week map update
    if (dayOfWeekMap[dayOfWeek]) {
      dayOfWeekMap[dayOfWeek].pnl += pnl;
      dayOfWeekMap[dayOfWeek].trades += 1;
      dayOfWeekMap[dayOfWeek].volume += volume;
      if (pnl > 0.001) dayOfWeekMap[dayOfWeek].wins += 1;
      else if (pnl < -0.001) dayOfWeekMap[dayOfWeek].losses += 1;
    }

    // Symbol Map update
    const sym = trade.symbol || 'UNKNOWN';
    if (!symbolMap[sym]) {
      symbolMap[sym] = { trades: 0, wins: 0, losses: 0, pnl: 0, volume: 0, totalProfit: 0, totalLoss: 0 };
    }
    symbolMap[sym].trades += 1;
    symbolMap[sym].pnl += pnl;
    symbolMap[sym].volume += volume;
    if (pnl > 0.001) {
      symbolMap[sym].wins += 1;
      symbolMap[sym].totalProfit += pnl;
    } else if (pnl < -0.001) {
      symbolMap[sym].losses += 1;
      symbolMap[sym].totalLoss += Math.abs(pnl);
    }

    // Session Map update
    const session = determineTradeSession(trade.entryTime);
    sessionMap[session].trades += 1;
    sessionMap[session].pnl += pnl;
    sessionMap[session].volume += volume;
    if (pnl > 0.001) {
      sessionMap[session].wins += 1;
      sessionMap[session].totalProfit += pnl;
    } else if (pnl < -0.001) {
      sessionMap[session].losses += 1;
      sessionMap[session].totalLoss += Math.abs(pnl);
    }

    // Strategy Map update
    const stratId = trade.strategyId || 'unassigned';
    const stratName = trade.strategy?.name || (stratId === 'unassigned' ? 'Manual / Discretionary' : 'Strategy');
    if (!strategyMap[stratId]) {
      strategyMap[stratId] = {
        name: stratName,
        trades: 0,
        wins: 0,
        losses: 0,
        pnl: 0,
        totalProfit: 0,
        totalLoss: 0,
        totalRR: 0,
        rrCount: 0,
      };
    }
    strategyMap[stratId].trades += 1;
    strategyMap[stratId].pnl += pnl;
    if (trade.rrRatio != null) {
      strategyMap[stratId].totalRR += Number(trade.rrRatio);
      strategyMap[stratId].rrCount += 1;
    }
    if (pnl > 0.001) {
      strategyMap[stratId].wins += 1;
      strategyMap[stratId].totalProfit += pnl;
    } else if (pnl < -0.001) {
      strategyMap[stratId].losses += 1;
      strategyMap[stratId].totalLoss += Math.abs(pnl);
    }
  }

  // Final Balance: use currentBalance if account has it, otherwise calculated runningBalance
  const currentBalance = rawCurrentBalance !== startingBalance || totalTrades === 0
    ? rawCurrentBalance
    : runningBalance;
  const equity = rawEquity !== startingBalance || totalTrades === 0
    ? rawEquity
    : runningBalance;

  // Averages & Rates
  const closedTrades = wins + losses + breakEvens;
  const winRate = closedTrades > 0 ? (wins / closedTrades) * 100 : 0;
  const lossRate = closedTrades > 0 ? (losses / closedTrades) * 100 : 0;
  
  const profitFactor = totalLoss === 0
    ? totalProfit > 0 ? 999 : 0
    : totalProfit / totalLoss;
  
  const avgWin = wins > 0 ? totalProfit / wins : 0;
  const avgLoss = losses > 0 ? totalLoss / losses : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0;
  
  const avgRR = rrCount > 0
    ? totalRR / rrCount
    : winLossRatio > 0 && winLossRatio < 900
    ? winLossRatio
    : 0;

  const avgDurationSeconds = durationCount > 0 ? Math.round(totalDurationSeconds / durationCount) : 0;
  const avgTradePnL = totalTrades > 0 ? netPnL / totalTrades : 0;
  const complianceRate = totalTrades > 0 ? (followedRulesCount / totalTrades) * 100 : 100;
  
  const longWinRate = longTradesCount > 0 ? (longWins / longTradesCount) * 100 : 0;
  const shortWinRate = shortTradesCount > 0 ? (shortWins / shortTradesCount) * 100 : 0;

  const currentDrawdown = peakBalance - currentBalance > 0 ? peakBalance - currentBalance : 0;
  const currentDrawdownPercent = peakBalance > 0 ? (currentDrawdown / peakBalance) * 100 : 0;

  // Symbol Breakdown Array
  const symbolBreakdown: SymbolStat[] = Object.entries(symbolMap)
    .map(([symbol, s]) => {
      const symClosed = s.wins + s.losses;
      const sWinRate = symClosed > 0 ? (s.wins / symClosed) * 100 : 0;
      const sPF = s.totalLoss === 0 ? (s.totalProfit > 0 ? 999 : 0) : s.totalProfit / s.totalLoss;
      const sAvgWin = s.wins > 0 ? s.totalProfit / s.wins : 0;
      const sAvgLoss = s.losses > 0 ? s.totalLoss / s.losses : 0;
      return {
        symbol,
        tradesCount: s.trades,
        wins: s.wins,
        losses: s.losses,
        winRate: Math.round(sWinRate * 10) / 10,
        netPnL: Math.round(s.pnl * 100) / 100,
        totalVolume: Math.round(s.volume * 100) / 100,
        profitFactor: Math.round(sPF * 100) / 100,
        avgWin: Math.round(sAvgWin * 100) / 100,
        avgLoss: Math.round(sAvgLoss * 100) / 100,
      };
    })
    .sort((a, b) => b.netPnL - a.netPnL);

  // Session Breakdown Array
  const sessionBreakdown: SessionStat[] = (['Asian', 'London', 'New York', 'Other'] as const).map(
    (sess) => {
      const s = sessionMap[sess];
      const sClosed = s.wins + s.losses;
      const sWinRate = sClosed > 0 ? (s.wins / sClosed) * 100 : 0;
      const sPF = s.totalLoss === 0 ? (s.totalProfit > 0 ? 999 : 0) : s.totalProfit / s.totalLoss;
      return {
        session: sess,
        tradesCount: s.trades,
        wins: s.wins,
        losses: s.losses,
        winRate: Math.round(sWinRate * 10) / 10,
        netPnL: Math.round(s.pnl * 100) / 100,
        totalVolume: Math.round(s.volume * 100) / 100,
        profitFactor: Math.round(sPF * 100) / 100,
      };
    }
  );

  // Day of Week Breakdown Array
  const dayOfWeekBreakdown: DayOfWeekStat[] = (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map(
    (day) => {
      const d = dayOfWeekMap[day];
      const dClosed = d.wins + d.losses;
      const dWinRate = dClosed > 0 ? (d.wins / dClosed) * 100 : 0;
      return {
        day,
        dayIndex: d.dayIndex,
        netPnL: Math.round(d.pnl * 100) / 100,
        tradesCount: d.trades,
        wins: d.wins,
        losses: d.losses,
        winRate: Math.round(dWinRate * 10) / 10,
        totalVolume: Math.round(d.volume * 100) / 100,
      };
    }
  );

  // Strategy Breakdown Array
  const strategyBreakdown: StrategyStat[] = Object.entries(strategyMap)
    .map(([stratId, s]) => {
      const sClosed = s.wins + s.losses;
      const sWinRate = sClosed > 0 ? (s.wins / sClosed) * 100 : 0;
      const sPF = s.totalLoss === 0 ? (s.totalProfit > 0 ? 999 : 0) : s.totalProfit / s.totalLoss;
      const sAvgRR = s.rrCount > 0 ? s.totalRR / s.rrCount : 0;
      return {
        strategyId: stratId,
        strategyName: s.name,
        tradesCount: s.trades,
        wins: s.wins,
        losses: s.losses,
        winRate: Math.round(sWinRate * 10) / 10,
        netPnL: Math.round(s.pnl * 100) / 100,
        profitFactor: Math.round(sPF * 100) / 100,
        avgRR: Math.round(sAvgRR * 100) / 100,
      };
    })
    .sort((a, b) => b.netPnL - a.netPnL);

  // Prop Firm Challenge Metrics
  const currentProfit = currentBalance - startingBalance;
  const targetProgress = profitTargetAmount > 0
    ? (currentProfit / profitTargetAmount) * 100
    : 0;

  // Daily drawdown used today (IST)
  const todayKey = formatISTDateKey(new Date());
  const todayPnL = dailyPnL[todayKey]?.pnl || 0;
  const dailyDDUsed = todayPnL < 0 ? Math.abs(todayPnL) : 0;
  const dailyDDUsedPercent = dailyDrawdownLimit > 0 ? (dailyDDUsed / dailyDrawdownLimit) * 100 : 0;
  const dailyDDRemaining = Math.max(0, dailyDrawdownLimit - dailyDDUsed);
  const dailyDDRemainingPercent = Math.max(0, 100 - dailyDDUsedPercent);

  // Max drawdown used & remaining
  const maxDDUsed = maxDrawdown;
  const maxDDUsedPercent = maxDrawdownLimit > 0 ? (maxDDUsed / maxDrawdownLimit) * 100 : 0;
  const maxDDRemaining = Math.max(0, maxDrawdownLimit - maxDDUsed);
  const maxDDRemainingPercent = Math.max(0, 100 - maxDDUsedPercent);

  // Trading days
  const tradingDaysPassed = Object.keys(dailyPnL).length;
  const tradingDaysProgress = minTradingDays > 0
    ? Math.min(100, (tradingDaysPassed / minTradingDays) * 100)
    : 100;

  const isDailyDDBreached = dailyDDUsed >= dailyDrawdownLimit;
  const isMaxDDBreached = maxDDUsed >= maxDrawdownLimit;
  const isTargetReached = currentProfit >= profitTargetAmount && tradingDaysPassed >= minTradingDays;

  const challengeMetrics: ChallengeMetrics = {
    startingBalance,
    currentBalance,
    equity,
    accountSize,
    profitTarget: profitTargetInput,
    profitTargetAmount,
    currentProfit,
    targetProgress: Math.round(targetProgress * 10) / 10,
    
    dailyDrawdownLimit,
    dailyDDUsed: Math.round(dailyDDUsed * 100) / 100,
    dailyDDUsedPercent: Math.round(dailyDDUsedPercent * 10) / 10,
    dailyDDRemaining: Math.round(dailyDDRemaining * 100) / 100,
    dailyDDRemainingPercent: Math.round(dailyDDRemainingPercent * 10) / 10,
    
    maxDrawdownLimit,
    maxDDUsed: Math.round(maxDDUsed * 100) / 100,
    maxDDUsedPercent: Math.round(maxDDUsedPercent * 10) / 10,
    maxDDRemaining: Math.round(maxDDRemaining * 100) / 100,
    maxDDRemainingPercent: Math.round(maxDDRemainingPercent * 10) / 10,
    
    tradingDaysPassed,
    minTradingDays,
    tradingDaysProgress: Math.round(tradingDaysProgress * 10) / 10,
    
    status,
    isDailyDDBreached,
    isMaxDDBreached,
    isTargetReached,
  };

  return {
    totalTrades,
    closedTrades,
    wins,
    losses,
    breakEvens,
    winRate: Math.round(winRate * 10) / 10,
    lossRate: Math.round(lossRate * 10) / 10,
    
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalLoss: Math.round(totalLoss * 100) / 100,
    netPnL: Math.round(netPnL * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    winLossRatio: Math.round(winLossRatio * 100) / 100,
    
    maxConsecutiveWins,
    maxConsecutiveLosses,
    currentStreak: { type: currentStreakType, count: currentStreakCount },
    
    avgRR: Math.round(avgRR * 100) / 100,
    avgDurationSeconds,
    
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    maxDrawdownPercent: Math.round(maxDrawdownPercent * 10) / 10,
    currentDrawdown: Math.round(currentDrawdown * 100) / 100,
    currentDrawdownPercent: Math.round(currentDrawdownPercent * 10) / 10,
    
    dailyPnL,
    equityCurve,
    symbolBreakdown,
    sessionBreakdown,
    dayOfWeekBreakdown,
    strategyBreakdown,
    challengeMetrics,
    
    bestTrade: Math.round(bestTrade * 100) / 100,
    worstTrade: Math.round(worstTrade * 100) / 100,
    avgTradePnL: Math.round(avgTradePnL * 100) / 100,
    totalVolume: Math.round(totalVolume * 100) / 100,
    complianceRate: Math.round(complianceRate * 10) / 10,
    longTradesCount,
    shortTradesCount,
    longWinRate: Math.round(longWinRate * 10) / 10,
    shortWinRate: Math.round(shortWinRate * 10) / 10,
  };
}
