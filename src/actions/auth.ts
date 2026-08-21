'use server';

import { registerSchema } from '@/lib/validations/auth';
import { db } from '@/lib/db';
import bcryptjs from 'bcryptjs';
import { z } from 'zod';

type RegisterInput = z.infer<typeof registerSchema>;

export async function registerUser(data: RegisterInput) {
  try {
    const validatedData = registerSchema.parse(data);

    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return { error: 'User with this email already exists' };
    }

    const passwordHash = await bcryptjs.hash(validatedData.password, 10);

    await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return { error: 'Invalid data provided' };
    }
    return { error: 'An unexpected error occurred' };
  }
}
