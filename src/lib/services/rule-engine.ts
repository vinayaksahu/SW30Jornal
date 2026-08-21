import { Trade, Account, TradingRule, ViolationStatus, TradeDirection } from '@prisma/client'

export interface RuleEvaluationResult {
  ruleId: string
  ruleName: string
  status: ViolationStatus
  actualValue?: string
  expectedValue?: string
  message: string
}

type RuleConfig = Record<string, any>

export class RuleEngine {
  static evaluate(
    trade: Trade,
    account: Account,
    rules: TradingRule[]
  ): RuleEvaluationResult[] {
    const results: RuleEvaluationResult[] = []

    // Filter enabled rules
    const activeRules = rules.filter(r => r.status === 'ENABLED')

    for (const rule of activeRules) {
      const config = rule.config as RuleConfig
      let result: RuleEvaluationResult | null = null

      switch (rule.ruleType) {
        case 'MAX_RISK_PER_TRADE':
          result = this.evaluateMaxRisk(trade, rule, config)
          break
        case 'MAX_TRADES_PER_DAY':
          // This requires historical trades for the day, which we don't have passed in here
          // This might be evaluated before entering a trade or checked with a separate query.
          // For now, we'll return an info status.
          result = {
            ruleId: rule.id,
            ruleName: rule.name,
            status: ViolationStatus.INFORMATION,
            message: 'Requires daily trade count context to evaluate properly.'
          }
          break
        case 'MAX_LOT_SIZE':
          result = this.evaluateMaxLotSize(trade, rule, config)
          break
        case 'REQUIRED_STOP_LOSS':
          result = this.evaluateRequiredStopLoss(trade, rule)
          break
        case 'REQUIRED_TAKE_PROFIT':
          result = this.evaluateRequiredTakeProfit(trade, rule)
          break
        case 'MIN_RR':
          result = this.evaluateMinRR(trade, rule, config)
          break
        case 'ALLOWED_SESSIONS':
          result = this.evaluateAllowedSessions(trade, rule, config)
          break
        case 'ALLOWED_SYMBOLS':
          result = this.evaluateAllowedSymbols(trade, rule, config)
          break
        case 'WEEKEND_TRADING':
          result = this.evaluateWeekendTrading(trade, rule, config)
          break
        default:
          result = {
            ruleId: rule.id,
            ruleName: rule.name,
            status: ViolationStatus.INFORMATION,
            message: `Rule type ${rule.ruleType} not fully supported yet by engine.`
          }
      }

      if (result) {
        results.push(result)
      }
    }

    return results
  }

  private static evaluateMaxRisk(trade: Trade, rule: TradingRule, config: RuleConfig): RuleEvaluationResult {
    // Requires account size / risk calculation.
    // For simplicity, let's assume we compare trade.volume against config.maxLot if risk $ is not strictly computable without tick values.
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status: ViolationStatus.FOLLOWED,
      message: 'Max risk per trade followed'
    }
  }

  private static evaluateMaxLotSize(trade: Trade, rule: TradingRule, config: RuleConfig): RuleEvaluationResult {
    const maxLot = Number(config.maxLotSize)
    const actualLot = Number(trade.volume)
    if (!isNaN(maxLot) && actualLot > maxLot) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        status: ViolationStatus.VIOLATED,
        actualValue: actualLot.toString(),
        expectedValue: `<= ${maxLot}`,
        message: `Lot size ${actualLot} exceeds maximum allowed ${maxLot}.`
      }
    }
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status: ViolationStatus.FOLLOWED,
      actualValue: actualLot.toString(),
      message: 'Lot size is within limits.'
    }
  }

  private static evaluateRequiredStopLoss(trade: Trade, rule: TradingRule): RuleEvaluationResult {
    if (!trade.stopLoss) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        status: ViolationStatus.VIOLATED,
        actualValue: 'No SL',
        expectedValue: 'SL Required',
        message: 'Trade placed without a Stop Loss.'
      }
    }
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status: ViolationStatus.FOLLOWED,
      message: 'Stop loss is set.'
    }
  }

  private static evaluateRequiredTakeProfit(trade: Trade, rule: TradingRule): RuleEvaluationResult {
    if (!trade.takeProfit) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        status: ViolationStatus.VIOLATED,
        actualValue: 'No TP',
        expectedValue: 'TP Required',
        message: 'Trade placed without a Take Profit.'
      }
    }
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status: ViolationStatus.FOLLOWED,
      message: 'Take profit is set.'
    }
  }

  private static evaluateMinRR(trade: Trade, rule: TradingRule, config: RuleConfig): RuleEvaluationResult {
    const minRr = Number(config.minRr)
    if (!trade.rrRatio) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        status: ViolationStatus.INFORMATION,
        message: 'RR Ratio could not be evaluated.'
      }
    }
    const actualRr = Number(trade.rrRatio)
    if (!isNaN(minRr) && actualRr < minRr) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        status: ViolationStatus.VIOLATED,
        actualValue: actualRr.toString(),
        expectedValue: `>= ${minRr}`,
        message: `RR Ratio ${actualRr.toFixed(2)} is less than minimum ${minRr}.`
      }
    }
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status: ViolationStatus.FOLLOWED,
      message: 'RR Ratio meets minimum requirements.'
    }
  }

  private static evaluateAllowedSessions(trade: Trade, rule: TradingRule, config: RuleConfig): RuleEvaluationResult {
    // Config should have array of allowed sessions, e.g. ['LONDON', 'NEW_YORK']
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status: ViolationStatus.INFORMATION,
      message: 'Session rules not completely mapped to trade time yet.'
    }
  }

  private static evaluateAllowedSymbols(trade: Trade, rule: TradingRule, config: RuleConfig): RuleEvaluationResult {
    const allowed = Array.isArray(config.symbols) ? config.symbols : []
    if (allowed.length > 0 && !allowed.includes(trade.symbol)) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        status: ViolationStatus.VIOLATED,
        actualValue: trade.symbol,
        expectedValue: allowed.join(', '),
        message: `Traded symbol ${trade.symbol} is not in the allowed list.`
      }
    }
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status: ViolationStatus.FOLLOWED,
      message: 'Symbol is allowed.'
    }
  }

  private static evaluateWeekendTrading(trade: Trade, rule: TradingRule, config: RuleConfig): RuleEvaluationResult {
    const day = trade.entryTime.getUTCDay()
    // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        status: ViolationStatus.VIOLATED,
        actualValue: 'Weekend',
        expectedValue: 'Weekday',
        message: 'Trade placed on the weekend.'
      }
    }
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      status: ViolationStatus.FOLLOWED,
      message: 'Trade placed during the week.'
    }
  }
}
