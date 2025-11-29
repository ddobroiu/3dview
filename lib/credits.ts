import { prisma } from './db';
import type { Prisma } from '@prisma/client';

export interface CreditBalance {
  userId: string;
  credits: number;
  totalUsed: number;
  subscriptionTier: string;
}

export interface CreditCost {
  STANDARD: number;
  HIGH: number;
  ULTRA: number;
}

export const GENERATION_COSTS: CreditCost = {
  STANDARD: 1,
  HIGH: 2,
  ULTRA: 5,
};

export const SUBSCRIPTION_LIMITS = {
  FREE: {
    maxCreditsPerMonth: 50,
    dailyRefill: 2,
  },
  BASIC: {
    maxCreditsPerMonth: 200,
    dailyRefill: 10,
  },
  PRO: {
    maxCreditsPerMonth: 1000,
    dailyRefill: 50,
  },
  PREMIUM: {
    maxCreditsPerMonth: -1, // unlimited
    dailyRefill: 100,
  },
};

export async function getUserCredits(userId: string): Promise<CreditBalance | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      credits: true,
      totalCreditsUsed: true,
      subscriptionTier: true,
      lastCreditRefill: true,
    },
  });

  if (!user) return null;

  // Check if user needs daily refill
  const now = new Date();
  const lastRefill = new Date(user.lastCreditRefill);
  const daysSinceRefill = Math.floor((now.getTime() - lastRefill.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceRefill >= 1) {
    const refillAmount = SUBSCRIPTION_LIMITS[user.subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS]?.dailyRefill || 2;
    const updatedUser = await addCredits(userId, refillAmount, 'DAILY_REFILL', 'Daily credit refill');
    if (updatedUser) {
      return updatedUser;
    }
  }

  return {
    userId: user.id,
    credits: user.credits,
    totalUsed: user.totalCreditsUsed,
    subscriptionTier: user.subscriptionTier,
  };
}

export async function addCredits(
  userId: string,
  amount: number,
  type: string,
  description: string,
  purchaseId?: string
): Promise<CreditBalance | null> {
  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // Add credits to user
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          credits: { increment: amount },
          ...(type === 'DAILY_REFILL' && { lastCreditRefill: new Date() }),
        },
        select: {
          id: true,
          credits: true,
          totalCreditsUsed: true,
          subscriptionTier: true,
        },
      });

      // Record transaction
      await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          type,
          description,
          purchaseId,
        },
      });

      return user;
    });

    return {
      userId: result.id,
      credits: result.credits,
      totalUsed: result.totalCreditsUsed,
      subscriptionTier: result.subscriptionTier,
    };
  } catch (error) {
    console.error('Error adding credits:', error);
    return null;
  }
}

export async function useCredits(
  userId: string,
  amount: number,
  generationId: string,
  quality: keyof CreditCost = 'STANDARD'
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const user = await getUserCredits(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.credits < amount) {
      return { success: false, error: 'Insufficient credits' };
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Deduct credits from user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: amount },
          totalCreditsUsed: { increment: amount },
        },
        select: { credits: true },
      });

      // Record transaction
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'GENERATION_USE',
          description: `3D Generation (${quality}) - Generation ID: ${generationId}`,
        },
      });

      return updatedUser;
    });

    return { success: true, newBalance: result.credits };
  } catch (error) {
    console.error('Error using credits:', error);
    return { success: false, error: 'Failed to process credits' };
  }
}

export async function getCreditHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string;
    createdAt: Date;
  }>;
  total: number;
}> {
  try {
    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          createdAt: true,
        },
      }),
      prisma.creditTransaction.count({
        where: { userId },
      }),
    ]);

    return { transactions, total };
  } catch (error) {
    console.error('Error getting credit history:', error);
    return { transactions: [], total: 0 };
  }
}

export async function getGenerationHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{
  generations: Array<{
    id: string;
    originalImageUrl: string;
    prompt?: string;
    videoUrl?: string;
    modelUrl?: string;
    status: string;
    creditsCost: number;
    quality: string;
    createdAt: Date;
    completedAt?: Date;
    processingTime?: number;
  }>;
  total: number;
}> {
  try {
    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          originalImageUrl: true,
          prompt: true,
          videoUrl: true,
          modelUrl: true,
          status: true,
          creditsCost: true,
          quality: true,
          createdAt: true,
          completedAt: true,
          processingTime: true,
        },
      }),
      prisma.generation.count({
        where: { userId },
      }),
    ]);

    return { generations, total };
  } catch (error) {
    console.error('Error getting generation history:', error);
    return { generations: [], total: 0 };
  }
}

export function calculateGenerationCost(quality: keyof CreditCost): number {
  return GENERATION_COSTS[quality] || GENERATION_COSTS.STANDARD;
}

export async function initializeCreditPackages(): Promise<void> {
  const packages = [
    {
      name: 'Starter Pack',
      credits: 50,
      price: 19.99,
      currency: 'RON',
      bonus: 5,
    },
    {
      name: 'Popular Pack',
      credits: 150,
      price: 49.99,
      currency: 'RON',
      bonus: 25,
      popular: true,
    },
    {
      name: 'Pro Pack',
      credits: 500,
      price: 149.99,
      currency: 'RON',
      bonus: 100,
    },
    {
      name: 'Ultimate Pack',
      credits: 1500,
      price: 399.99,
      currency: 'RON',
      bonus: 500,
    },
  ];

  try {
    for (const pkg of packages) {
      await prisma.creditPackage.upsert({
        where: {
          credits_price: {
            credits: pkg.credits,
            price: pkg.price,
          },
        },
        update: {},
        create: pkg,
      });
    }
    console.log('Credit packages initialized successfully');
  } catch (error) {
    console.error('Error initializing credit packages:', error);
  }
}