import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

export type RateRule = { key: string; max: number; seconds: number };

/** PostgreSQL advisory locks make the read/increment atomic across app instances.
 * Only hashes of identifiers are persisted; expired counters use the existing
 * Verification lifecycle. No authentication token is created here.
 */
export async function consumeAuthLimits(rules: RateRule[]) {
  return prisma.$transaction(async (tx) => {
    const entries = rules
      .map((rule) => ({
        ...rule,
        identifier: `auth-limit:${createHash("sha256").update(rule.key).digest("hex")}`,
      }))
      .sort((a, b) => a.identifier.localeCompare(b.identifier));
    // Consistent lock order also protects requests spanning several buckets.
    for (const entry of entries) {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${entry.identifier}, 0))::text`;
    }
    const now = new Date();
    const counters = await Promise.all(
      entries.map(async (entry) => {
        const counter = await tx.verification.findFirst({
          where: { identifier: entry.identifier, expiresAt: { gt: now } },
        });
        return { entry, counter };
      }),
    );
    const blocked = counters.find(
      ({ entry, counter }) => counter && Number(counter.value) >= entry.max,
    );
    if (blocked?.counter)
      return Math.max(
        1,
        Math.ceil((blocked.counter.expiresAt.getTime() - now.getTime()) / 1000),
      );
    for (const { entry, counter } of counters) {
      if (counter) {
        await tx.verification.update({
          where: { id: counter.id },
          data: { value: String(Number(counter.value) + 1) },
        });
      } else {
        await tx.verification.deleteMany({
          where: { identifier: entry.identifier },
        });
        await tx.verification.create({
          data: {
            id: randomUUID(),
            identifier: entry.identifier,
            value: "1",
            expiresAt: new Date(now.getTime() + entry.seconds * 1000),
          },
        });
      }
    }
    return 0;
  });
}
