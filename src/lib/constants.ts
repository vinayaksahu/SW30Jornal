export const APP_NAME = 'SW30 Trading Journal'

export const PRIMARY_TIMEZONE = 'Asia/Kolkata'

export const MARKET_SESSIONS = {
  LONDON: {
    name: 'London',
    timezone: 'Europe/London',
    open: '08:00',
    close: '16:30',
  },
  NEW_YORK: {
    name: 'New York',
    timezone: 'America/New_York',
    open: '09:30',
    close: '16:00',
  },
  TOKYO: {
    name: 'Tokyo',
    timezone: 'Asia/Tokyo',
    open: '09:00',
    close: '15:00',
  },
  SYDNEY: {
    name: 'Sydney',
    timezone: 'Australia/Sydney',
    open: '08:00',
    close: '17:00',
  },
} as const

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB per file

export const DEFAULT_NEWS_SETTINGS = {
  HIGH: {
    beforeMinutes: 15,
    afterMinutes: 15,
    mode: 'PROTECTION' as const,
  },
  MEDIUM: {
    beforeMinutes: 10,
    afterMinutes: 10,
    mode: 'PROTECTION' as const,
  },
  LOW: {
    beforeMinutes: 5,
    afterMinutes: 5,
    mode: 'WARNING_ONLY' as const,
  },
} as const

export const CHALLENGE_STATUSES = ['ACTIVE', 'PASSED', 'FAILED', 'ARCHIVED'] as const

export const TRADE_DIRECTIONS = ['BUY', 'SELL'] as const

export const RULE_CATEGORIES = {
  ACCOUNT: [
    'ACCOUNT_SIZE',
    'PROFIT_TARGET',
    'DAILY_DRAWDOWN',
    'MAX_DRAWDOWN',
    'MAX_RISK_PER_TRADE',
    'MAX_TRADES_PER_DAY',
    'MAX_LOT_SIZE',
    'MIN_TRADING_DAYS',
    'MAX_DAILY_PROFIT',
    'MAX_DAILY_LOSS',
  ],
  TRADING: [
    'ALLOWED_SYMBOLS',
    'ALLOWED_SESSIONS',
    'MAX_TRADES_PER_DAY',
    'MIN_RR',
    'REQUIRED_STOP_LOSS',
    'REQUIRED_TAKE_PROFIT',
    'MAX_RISK_PERCENTAGE',
    'MAX_RISK_AMOUNT',
    'MIN_HOLDING_TIME',
    'NEWS_TRADING_RESTRICTION',
    'WEEKEND_TRADING_RESTRICTION',
    'CUSTOM',
  ],
} as const

export const PAGINATION_DEFAULT = 20
export const PAGINATION_MAX = 100
