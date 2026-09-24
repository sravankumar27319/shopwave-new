import "dotenv/config";
import { PrismaClient, Prisma } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var pgPoolGlobal: Pool | undefined;
}

const connectionString = process.env["DATABASE_URL"] || "";

const pool =
  globalThis.pgPoolGlobal ??
  new Pool({
    connectionString,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    adapter,
  });

if (process.env["NODE_ENV"] !== "production") {
  globalThis.prismaGlobal = prisma;
  globalThis.pgPoolGlobal = pool;
}

export { Prisma };
export default prisma;
