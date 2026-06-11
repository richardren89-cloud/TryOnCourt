import { z } from "zod";

import { hashPassword } from "@/lib/auth/password";

const CURRENT_YEAR = 2026;
const MINIMUM_AGE = 13;
const ADULT_AGE = 18;

export const registrationInputSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(10),
  birthYear: z.number().int().gte(1900).lte(CURRENT_YEAR - MINIMUM_AGE),
  ageConfirmed: z.literal(true),
  guardianConsent: z.boolean(),
  termsVersion: z.string().min(1),
  privacyVersion: z.string().min(1),
  ipHash: z.string().optional(),
});

export type RegistrationInput = z.infer<typeof registrationInputSchema>;

interface RegistrationDb {
  $transaction<T>(callback: (client: RegistrationTx) => Promise<T>): Promise<T>;
}

interface RegistrationTx {
  user: {
    create(input: {
      data: {
        username: string;
        passwordHash: string;
        dateOfBirth: Date;
        termsVersion: string;
      };
    }): Promise<{ id: string; username: string }>;
  };
  consentRecord: {
    create(input: {
      data: {
        userId: string;
        termsVersion: string;
        privacyVersion: string;
        ageConfirmed: boolean;
        guardianConsent: boolean;
        ipHash?: string;
      };
    }): Promise<unknown>;
  };
  creditLedgerEntry: {
    create(input: {
      data: {
        userId: string;
        type: "SIGNUP_BONUS";
        amount: 5;
        businessKey: string;
        note: string;
      };
    }): Promise<unknown>;
  };
}

export async function registerUser(
  db: RegistrationDb,
  rawInput: RegistrationInput,
): Promise<{ id: string; username: string }> {
  const input = registrationInputSchema.parse(rawInput);
  const age = CURRENT_YEAR - input.birthYear;

  if (age < ADULT_AGE && !input.guardianConsent) {
    throw new Error("Guardian consent is required for users under 18.");
  }

  const passwordHash = await hashPassword(input.password);

  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: input.username,
        passwordHash,
        dateOfBirth: new Date(Date.UTC(input.birthYear, 0, 1)),
        termsVersion: input.termsVersion,
      },
    });

    await tx.consentRecord.create({
      data: {
        userId: user.id,
        termsVersion: input.termsVersion,
        privacyVersion: input.privacyVersion,
        ageConfirmed: input.ageConfirmed,
        guardianConsent: input.guardianConsent,
        ipHash: input.ipHash,
      },
    });

    await tx.creditLedgerEntry.create({
      data: {
        userId: user.id,
        type: "SIGNUP_BONUS",
        amount: 5,
        businessKey: `signup:${user.id}`,
        note: "New user signup bonus",
      },
    });

    return user;
  });
}
