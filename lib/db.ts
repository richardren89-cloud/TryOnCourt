import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

export type DatabaseClient = PrismaClient;
export const DATABASE_CONNECTION_LIMIT = 5;

const globalDatabase = globalThis as typeof globalThis & {
  courtfitDatabase?: PrismaClient;
};

export function createDb(databaseUrl = process.env.DATABASE_URL): PrismaClient {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a database client.");
  }

  return new PrismaClient({
    adapter: new PrismaMariaDb(toPoolConfig(databaseUrl)),
  });
}

export function getDb(): PrismaClient {
  globalDatabase.courtfitDatabase ??= createDb();
  return globalDatabase.courtfitDatabase;
}

export async function closeDb(): Promise<void> {
  const database = globalDatabase.courtfitDatabase;
  globalDatabase.courtfitDatabase = undefined;
  await database?.$disconnect();
}

function toPoolConfig(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));

  if (!database) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit: DATABASE_CONNECTION_LIMIT,
  };
}
