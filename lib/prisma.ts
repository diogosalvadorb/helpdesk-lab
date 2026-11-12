import { PrismaClient } from "@/generated/prisma/client";

import { SequentialPrismaPg } from "./prisma-pg";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new SequentialPrismaPg({ connectionString });

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
