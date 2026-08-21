import { PrismaClient, Role, ChallengeStatus, RuleCategory, RuleStatus } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:dummy@ep-dummy-12345.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool as any);
const prisma = new PrismaClient({ adapter: adapter as any });

async function main() {
  console.log('🌱 Starting database seed...');

  const passwordHash = await bcrypt.hash('Admin@123456', 12);

  // 1. Create or update Default Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sw30journal.com' },
    update: {},
    create: {
      email: 'admin@sw30journal.com',
      name: 'SW30 Admin',
      passwordHash,
      role: Role.ADMIN,
      timezone: 'Asia/Kolkata',
      userSettings: {
        create: {
          defaultTimezone: 'Asia/Kolkata',
          defaultRisk: 1.0,
          theme: 'dark',
          newsAlerts: true,
          ruleViolationAlerts: true,
        },
      },
    },
  });

  console.log(`✅ Admin user ready: ${adminUser.email} (Password: Admin@123456)`);

  // 2. Create Demo Prop Firm Account
  const account = await prisma.account.create({
    data: {
      userId: adminUser.id,
      name: 'FTMO $100K Evaluation',
      propFirm: 'FTMO',
      accountSize: 100000,
      startingBalance: 100000,
      currentBalance: 103450,
      equity: 103450,
      profitTarget: 10000,
      dailyDrawdownLimit: 5000,
      maxDrawdownLimit: 10000,
      maxRiskPerTrade: 1000,
      maxTradesPerDay: 5,
      maxLotSize: 10,
      minTradingDays: 4,
      newsRestrictions: true,
      weekendRestrictions: true,
      status: ChallengeStatus.ACTIVE,
    },
  });

  console.log(`✅ Demo account created: ${account.name}`);

  // 3. Create Sample Trading Strategies
  const strategy1 = await prisma.strategy.create({
    data: {
      userId: adminUser.id,
      name: 'London Breakout & Liquidity Sweep',
      market: 'Forex / Indices',
      timeframe: '15m',
      notes: 'Identify Asian high/low sweeps during London open (1:30 PM IST). Enter on 5m FVG retest.',
      isActive: true,
    },
  });

  const strategy2 = await prisma.strategy.create({
    data: {
      userId: adminUser.id,
      name: 'New York Reversal (Silver Bullet)',
      market: 'US30 / NAS100 / XAUUSD',
      timeframe: '5m',
      notes: 'Trade the 7:30 PM - 8:30 PM IST time macro. Target opposing draw on liquidity with 1:2+ RR.',
      isActive: true,
    },
  });

  console.log(`✅ Demo strategies created: ${strategy1.name}, ${strategy2.name}`);

  // 4. Create Standard Prop Firm Rules for Account
  await prisma.tradingRule.createMany({
    data: [
      {
        accountId: account.id,
        userId: adminUser.id,
        category: RuleCategory.ACCOUNT,
        ruleType: 'MAX_RISK_PER_TRADE',
        name: 'Max Risk 1% Per Trade ($1,000)',
        description: 'Never risk more than $1,000 or 1.0% of starting balance on any single execution.',
        config: { maxRiskPercent: 1.0, maxRiskAmount: 1000 },
        status: RuleStatus.ENABLED,
      },
      {
        accountId: account.id,
        userId: adminUser.id,
        category: RuleCategory.ACCOUNT,
        ruleType: 'DAILY_DRAWDOWN',
        name: 'Max Daily Drawdown 5% ($5,000)',
        description: 'Stop trading for the day if daily losses approach $5,000 buffer.',
        config: { maxDailyLoss: 5000 },
        status: RuleStatus.ENABLED,
      },
      {
        accountId: account.id,
        userId: adminUser.id,
        category: RuleCategory.TRADING,
        ruleType: 'REQUIRED_STOP_LOSS',
        name: 'Mandatory Stop Loss on Every Trade',
        description: 'Every trade must have a defined stop loss at the time of execution.',
        config: { requireStopLoss: true },
        status: RuleStatus.ENABLED,
      },
      {
        accountId: account.id,
        userId: adminUser.id,
        category: RuleCategory.TRADING,
        ruleType: 'NEWS_TRADING_RESTRICTION',
        name: 'High Impact News 15-Minute Blackout',
        description: 'Do not open or close trades within 15 minutes before or after high impact economic releases.',
        config: { blackoutMinutesBefore: 15, blackoutMinutesAfter: 15 },
        status: RuleStatus.ENABLED,
      },
    ],
  });

  console.log('✅ Demo prop firm rules initialized.');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
