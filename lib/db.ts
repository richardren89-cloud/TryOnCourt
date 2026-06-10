import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

export type DatabaseClient = PrismaClient;

export function createDb(databaseUrl = process.env.DATABASE_URL): PrismaClient {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a database client.");
  }

  return new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
  });
}
