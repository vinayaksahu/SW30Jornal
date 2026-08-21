export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ChallengeStatus = {
  ACTIVE: 'ACTIVE',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ChallengeStatus = (typeof ChallengeStatus)[keyof typeof ChallengeStatus];

export const TradeDirection = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;
export type TradeDirection = (typeof TradeDirection)[keyof typeof TradeDirection];

export const RuleCategory = {
  ACCOUNT: 'ACCOUNT',
  TRADING: 'TRADING',
} as const;
export type RuleCategory = (typeof RuleCategory)[keyof typeof RuleCategory];

export const RuleStatus = {
  ENABLED: 'ENABLED',
  DISABLED: 'DISABLED',
} as const;
export type RuleStatus = (typeof RuleStatus)[keyof typeof RuleStatus];

export const ViolationStatus = {
  FOLLOWED: 'FOLLOWED',
  VIOLATED: 'VIOLATED',
  WARNING: 'WARNING',
  INFORMATION: 'INFORMATION',
} as const;
export type ViolationStatus = (typeof ViolationStatus)[keyof typeof ViolationStatus];

export const NewsImpact = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
export type NewsImpact = (typeof NewsImpact)[keyof typeof NewsImpact];

export const NewsProtectionMode = {
  WARNING_ONLY: 'WARNING_ONLY',
  PROTECTION: 'PROTECTION',
  DISABLED: 'DISABLED',
} as const;
export type NewsProtectionMode = (typeof NewsProtectionMode)[keyof typeof NewsProtectionMode];
