import "dotenv/config";

import assert from "node:assert/strict";
import { after, test } from "node:test";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";
import { ticketScope } from "../lib/portal-access";
import { compliance, monthBounds, slaDisplay } from "../lib/portal-format";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
after(async () => {
  await prisma.$disconnect();
});

test("month boundaries use Sao Paulo rather than the host timezone", () => {
  const beforeMidnight = monthBounds(new Date("2026-12-01T02:59:59Z"));
  assert.equal(beforeMidnight.start.toISOString(), "2026-11-01T03:00:00.000Z");
  assert.equal(beforeMidnight.end.toISOString(), "2026-12-01T03:00:00.000Z");
  const afterMidnight = monthBounds(new Date("2026-12-01T03:00:00Z"));
  assert.equal(afterMidnight.start.toISOString(), "2026-12-01T03:00:00.000Z");
  assert.equal(
    monthBounds(new Date("2026-01-01T04:00:00Z")).previous.toISOString(),
    "2025-12-01T03:00:00.000Z",
  );
});
test("SLA excludes incomplete data and measures both response and resolution", () => {
  const target = { firstResponseMinutes: 60, resolutionMinutes: 480 };
  assert.equal(compliance([]), null);
  assert.equal(
    compliance([
      { firstResponseMinutes: null, resolutionMinutes: 20, slaTarget: target },
    ]),
    null,
  );
  assert.equal(
    compliance([
      { firstResponseMinutes: 20, resolutionMinutes: 300, slaTarget: target },
      { firstResponseMinutes: 90, resolutionMinutes: 300, slaTarget: target },
      { firstResponseMinutes: 20, resolutionMinutes: 300, slaTarget: null },
    ]),
    50,
  );
  const now = new Date("2026-11-07T15:00:00Z");
  const ticket = {
    status: "WAITING_CUSTOMER" as const,
    firstRespondedAt: now,
    firstResponseDueAt: now,
    resolutionDueAt: new Date("2026-11-07T14:00:00Z"),
    firstResponseMinutes: 10,
    resolutionMinutes: null,
    slaTarget: target,
    slaPauses: [{ id: "pause" }],
  };
  assert.equal(slaDisplay(ticket, now).text, "Pausado");
  assert.equal(slaDisplay({ ...ticket, slaPauses: [] }, now).text, "Vencido");
});
test("seeded tenant and requester isolation is enforced in SQL for every role", async () => {
  const companyId = "helpdesk-demo-company-nexus";
  const base = { companyId, userId: "helpdesk-demo-user-joao" };
  const query = async (where: ReturnType<typeof ticketScope>) =>
    prisma.ticket.findMany({
      where: { AND: [where, { id: { startsWith: "helpdesk-demo-ticket-" } }] },
      select: { id: true, companyId: true, requesterId: true, teamId: true },
    });
  const requester = await query(
    ticketScope({ ...base, role: "CLIENT", membershipRole: "REQUESTER" }),
  );
  assert.equal(
    requester.length,
    1,
    "Execute npm run db:seed to prepare the development fixtures",
  );
  assert.ok(
    requester.every(
      (ticket) =>
        ticket.requesterId === base.userId && ticket.companyId === companyId,
    ),
  );
  const manager = await query(
    ticketScope({ ...base, role: "CLIENT", membershipRole: "MANAGER" }),
  );
  assert.ok(manager.length > requester.length);
  assert.ok(manager.every((ticket) => ticket.companyId === companyId));
  assert.equal(
    (await query(ticketScope({ ...base, role: "CLIENT" }))).length,
    0,
  );
  assert.equal(
    (await query(ticketScope({ ...base, role: "AGENT" }))).length,
    0,
  );
  assert.equal(
    (await query(ticketScope({ ...base, role: "ADMIN", companyId: null })))
      .length,
    0,
  );
  const team = await prisma.supportAgent.findUniqueOrThrow({
    where: { userId: "helpdesk-demo-user-julia" },
    select: { teamId: true },
  });
  const agent = await query(
    ticketScope({ ...base, role: "AGENT", teamId: team.teamId }),
  );
  assert.ok(
    agent.length > 0 &&
      agent.every(
        (ticket) =>
          ticket.companyId === companyId && ticket.teamId === team.teamId,
      ),
  );
  const unrelatedTeam = await query(
    ticketScope({ ...base, role: "AGENT", teamId: "not-an-authorized-team" }),
  );
  assert.equal(unrelatedTeam.length, 0);
  const admin = await query(
    ticketScope({
      ...base,
      role: "ADMIN",
      companyId: "helpdesk-demo-company-horizonte",
    }),
  );
  assert.equal(admin.length, 1);
  assert.ok(admin.every((ticket) => ticket.companyId !== companyId));
});
