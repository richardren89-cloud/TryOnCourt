import { z } from "zod";

import { verifyPassword } from "@/lib/auth/password";

export const loginInputSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

interface LoginDb {
  user: {
    findFirst(input: {
      where: { username: string; deletedAt: null };
      select: { id: true; username: true; passwordHash: true };
    }): Promise<{ id: string; username: string; passwordHash: string } | null>;
  };
}

export async function authenticateUser(
  db: LoginDb,
  rawInput: z.infer<typeof loginInputSchema>,
): Promise<{ id: string; username: string } | null> {
  const input = loginInputSchema.parse(rawInput);
  const user = await db.user.findFirst({
    where: { username: input.username, deletedAt: null },
    select: { id: true, username: true, passwordHash: true },
  });

  if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
    return null;
  }

  return { id: user.id, username: user.username };
}
