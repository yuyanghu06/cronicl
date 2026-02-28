import { db } from '../db/client';
import { usageRecords, userQuotas } from '../db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

const DEFAULT_DAILY_REQUESTS = 100;
const DEFAULT_MONTHLY_REQUESTS = 2000;

export async function recordUsage(
  userId: string,
  endpoint: string,
  tokensIn?: number,
  tokensOut?: number,
  costUsd?: string
): Promise<void> {
  await db.insert(usageRecords).values({
    userId,
    endpoint,
    tokensIn: tokensIn ?? null,
    tokensOut: tokensOut ?? null,
    estimatedCostUsd: costUsd ?? null,
  });
}

export async function getUserUsage(
  userId: string,
  period: 'day' | 'month'
): Promise<number> {
  const now = new Date();
  let periodStart: Date;

  if (period === 'day') {
    periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usageRecords)
    .where(
      and(
        eq(usageRecords.userId, userId),
        gte(usageRecords.createdAt, periodStart)
      )
    );

  return result[0]?.count ?? 0;
}

export interface UserQuotaLimits {
  dailyRequests: number;
  monthlyRequests: number;
}

export async function getUserQuotaLimits(
  userId: string
): Promise<UserQuotaLimits> {
  const quota = await db.query.userQuotas.findFirst({
    where: eq(userQuotas.userId, userId),
  });

  return {
    dailyRequests: quota?.dailyRequests ?? DEFAULT_DAILY_REQUESTS,
    monthlyRequests: quota?.monthlyRequests ?? DEFAULT_MONTHLY_REQUESTS,
  };
}
