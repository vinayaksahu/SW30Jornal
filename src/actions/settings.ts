'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

const settingsSchema = z.object({
  defaultAccountId: z.string().optional().nullable(),
  defaultTimezone: z.string().default('Asia/Kolkata'),
  defaultRisk: z.coerce.number().min(0).max(100).default(1.0),
  theme: z.string().default('dark'),
  newsAlerts: z.boolean().default(true),
  ruleViolationAlerts: z.boolean().default(true),
  dailySummary: z.boolean().default(false),
});

export async function getUserSettings() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      timezone: true,
      createdAt: true,
      userSettings: true,
    },
  });

  if (!user) throw new Error('User not found');
  return user;
}

export async function updateUserProfile(data: z.infer<typeof profileSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const validated = profileSchema.parse(data);

  const existingUser = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!existingUser) throw new Error('User not found');

  // Check if email already taken by another user
  if (validated.email !== existingUser.email) {
    const emailConflict = await db.user.findUnique({
      where: { email: validated.email },
    });
    if (emailConflict && emailConflict.id !== session.user.id) {
      throw new Error('Email is already taken by another user');
    }
  }

  const updateData: { name: string; email: string; passwordHash?: string } = {
    name: validated.name,
    email: validated.email,
  };

  // If changing password, verify old password
  if (validated.newPassword && validated.newPassword.length > 0) {
    if (!validated.currentPassword) {
      throw new Error('Current password is required to change password');
    }
    const isPasswordValid = await bcrypt.compare(validated.currentPassword, existingUser.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Incorrect current password');
    }
    updateData.passwordHash = await bcrypt.hash(validated.newPassword, 12);
  }

  const updatedUser = await db.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true },
  });

  revalidatePath('/settings');
  return { success: true, user: updatedUser };
}

export async function updateUserSettings(data: z.infer<typeof settingsSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const validated = settingsSchema.parse(data);

  const settings = await db.userSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      defaultAccountId: validated.defaultAccountId || null,
      defaultTimezone: validated.defaultTimezone,
      defaultRisk: validated.defaultRisk,
      theme: validated.theme,
      newsAlerts: validated.newsAlerts,
      ruleViolationAlerts: validated.ruleViolationAlerts,
      dailySummary: validated.dailySummary,
    },
    update: {
      defaultAccountId: validated.defaultAccountId || null,
      defaultTimezone: validated.defaultTimezone,
      defaultRisk: validated.defaultRisk,
      theme: validated.theme,
      newsAlerts: validated.newsAlerts,
      ruleViolationAlerts: validated.ruleViolationAlerts,
      dailySummary: validated.dailySummary,
    },
  });

  // Also update user's base timezone
  await db.user.update({
    where: { id: session.user.id },
    data: { timezone: validated.defaultTimezone },
  });

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  return { success: true, settings };
}
