import { hash, verify } from "@node-rs/argon2";

const PASSWORD_MIN_LENGTH = 10;
// @node-rs/argon2 exposes these as ambient const enums, which cannot be
// referenced directly with isolatedModules enabled.
const ARGON2ID = 2;
const ARGON2_VERSION_13 = 1;

export async function hashPassword(password: string): Promise<string> {
  assertPasswordStrength(password);

  return hash(password, {
    algorithm: ARGON2ID,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    version: ARGON2_VERSION_13,
  });
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  if (!password) {
    return false;
  }

  return verify(passwordHash, password);
}

export function assertPasswordStrength(password: string): void {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error("Password must be at least 10 characters.");
  }
}
