export class InsufficientCreditsError extends Error {
  constructor() {
    super("Insufficient credits.");
    this.name = "InsufficientCreditsError";
  }
}

interface CreditLedgerDb {
  creditLedgerEntry: {
    aggregate(input: {
      where: { userId: string };
      _sum: { amount: true };
    }): Promise<{ _sum: { amount: number | null } }>;
  };
}

interface CreditTransactionDb extends CreditLedgerDb {
  user: {
    update(input: { where: { id: string }; data: { updatedAt: Date } }): Promise<unknown>;
  };
  creditLedgerEntry: CreditLedgerDb["creditLedgerEntry"] & {
    findUnique(input: {
      where: { userId_businessKey: { userId: string; businessKey: string } };
    }): Promise<unknown | null>;
    create(input: {
      data: {
        userId: string;
        type: "GENERATION_SPEND" | "GENERATION_REFUND";
        amount: -1 | 1;
        businessKey: string;
        note: string;
      };
    }): Promise<unknown>;
  };
}

interface TransactionCapableDb extends CreditLedgerDb {
  $transaction<T>(callback: (client: CreditTransactionDb) => Promise<T>): Promise<T>;
}

export async function getCreditBalance(
  db: CreditLedgerDb,
  userId: string,
): Promise<number> {
  const result = await db.creditLedgerEntry.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  return result._sum.amount ?? 0;
}

export async function spendCredit(
  db: TransactionCapableDb,
  userId: string,
  businessKey: string,
): Promise<number> {
  return db.$transaction(async (tx) => {
    await lockUserCreditRow(tx, userId);

    const existing = await findLedgerEntry(tx, userId, businessKey);
    if (existing) {
      return getCreditBalance(tx, userId);
    }

    const balance = await getCreditBalance(tx, userId);
    if (balance < 1) {
      throw new InsufficientCreditsError();
    }

    await tx.creditLedgerEntry.create({
      data: {
        userId,
        type: "GENERATION_SPEND",
        amount: -1,
        businessKey,
        note: "Generation spend",
      },
    });

    return balance - 1;
  });
}

export async function refundCredit(
  db: TransactionCapableDb,
  userId: string,
  businessKey: string,
): Promise<number> {
  return db.$transaction(async (tx) => {
    await lockUserCreditRow(tx, userId);

    const existing = await findLedgerEntry(tx, userId, businessKey);
    if (existing) {
      return getCreditBalance(tx, userId);
    }

    const balance = await getCreditBalance(tx, userId);
    await tx.creditLedgerEntry.create({
      data: {
        userId,
        type: "GENERATION_REFUND",
        amount: 1,
        businessKey,
        note: "Generation refund",
      },
    });

    return balance + 1;
  });
}

async function lockUserCreditRow(
  db: Pick<CreditTransactionDb, "user">,
  userId: string,
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { updatedAt: new Date() },
  });
}

function findLedgerEntry(
  db: Pick<CreditTransactionDb, "creditLedgerEntry">,
  userId: string,
  businessKey: string,
) {
  return db.creditLedgerEntry.findUnique({
    where: { userId_businessKey: { userId, businessKey } },
  });
}
