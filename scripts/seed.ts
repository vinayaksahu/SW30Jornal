import 'dotenv/config';
import { PrismaClient, Role, ChallengeStatus, RuleCategory, RuleStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Standalone prisma client for seed
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const adminPasswordHash = await bcrypt.hash('Admin@123456', 12);
  const userPasswordHash = await bcrypt.hash('Trader@123456', 12);

  // 1. Create or update Default Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@sw30journal.com' },
    update: {},
    create: {
      email: 'admin@sw30journal.com',
      name: 'SW30 Admin',
      passwordHash: adminPasswordHash,
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

  // 2. Create or update Standard Trader User
  const traderUser = await prisma.user.upsert({
    where: { email: 'trader@sw30journal.com' },
    update: {},
    create: {
      email: 'trader@sw30journal.com',
      name: 'Vinayak Sahu',
      passwordHash: userPasswordHash,
      role: Role.USER,
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

  console.log(`✅ Standard trader user ready: ${traderUser.email} (Password: Trader@123456)`);

  // 3. Create Demo Prop Firm Account for Trader
  const existingAccount = await prisma.account.findFirst({
    where: { userId: traderUser.id },
  });

  if (!existingAccount) {
    const account = await prisma.account.create({
      data: {
        userId: traderUser.id,
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

    // Create rules for account
    await prisma.tradingRule.createMany({
      data: [
        {
          accountId: account.id,
          userId: traderUser.id,
          category: RuleCategory.ACCOUNT,
          ruleType: 'MAX_RISK_PER_TRADE',
          name: 'Max Risk 1% Per Trade ($1,000)',
          description: 'Never risk more than $1,000 or 1.0% of starting balance on any single execution.',
          config: { maxRiskPercent: 1.0, maxRiskAmount: 1000 },
          status: RuleStatus.ENABLED,
        },
        {
          accountId: account.id,
          userId: traderUser.id,
          category: RuleCategory.ACCOUNT,
          ruleType: 'DAILY_DRAWDOWN',
          name: 'Max Daily Drawdown 5% ($5,000)',
          description: 'Stop trading for the day if daily losses approach $5,000 buffer.',
          config: { maxDailyLoss: 5000 },
          status: RuleStatus.ENABLED,
        },
        {
          accountId: account.id,
          userId: traderUser.id,
          category: RuleCategory.TRADING,
          ruleType: 'REQUIRED_STOP_LOSS',
          name: 'Mandatory Stop Loss on Every Trade',
          description: 'Every trade must have a defined stop loss at the time of execution.',
          config: { requireStopLoss: true },
          status: RuleStatus.ENABLED,
        },
        {
          accountId: account.id,
          userId: traderUser.id,
          category: RuleCategory.TRADING,
          ruleType: 'NEWS_TRADING_RESTRICTION',
          name: 'High Impact News 15-Minute Blackout',
          description: 'Do not open or close trades within 15 minutes before or after high impact economic releases.',
          config: { blackoutMinutesBefore: 15, blackoutMinutesAfter: 15 },
          status: RuleStatus.ENABLED,
        },
      ],
    });
  }

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
