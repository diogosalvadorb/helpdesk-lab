import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addWorkingMilliseconds,
  addWorkingMinutes,
  type WorkCalendar,
  workingMillisecondsBetween,
} from "../lib/business-calendar";
import { ticketScope } from "../lib/portal-access";
import { operationScope, permittedLevels } from "../lib/support-access";
import {
  queueFilterSchema,
  replySchema,
  serviceActionSchema,
} from "../lib/validations/ticket-service";

const calendar: WorkCalendar = {
  timeZone: "America/Sao_Paulo",
  alwaysOpen: false,
  hours: [1, 2, 3, 4, 5].flatMap((weekday) => [
    { weekday, startMinute: 480, endMinute: 720 },
    { weekday, startMinute: 780, endMinute: 1080 },
  ]),
  holidays: [],
};

test("pause extension counts only working time and preserves fractional minutes", () => {
  const paused = new Date("2026-11-06T20:30:30Z");
  const resumed = new Date("2026-11-09T11:00:30Z");
  const elapsed = workingMillisecondsBetween(paused, resumed, calendar);
  assert.equal(elapsed, 30 * 60000);
  assert.equal(
    addWorkingMilliseconds(
      new Date("2026-11-09T11:30:00Z"),
      elapsed,
      calendar,
    ).toISOString(),
    "2026-11-09T12:00:00.000Z",
  );
  assert.equal(
    addWorkingMinutes(
      new Date("2026-11-09T14:30:00Z"),
      60,
      calendar,
    ).toISOString(),
    "2026-11-09T16:30:00.000Z",
  );
});
test("pause calculation excludes holidays and supports 24h/DST", () => {
  assert.equal(
    workingMillisecondsBetween(
      new Date("2026-11-06T21:00:00Z"),
      new Date("2026-11-09T21:00:00Z"),
      { ...calendar, holidays: [{ date: new Date("2026-11-09T00:00:00Z") }] },
    ),
    0,
  );
  const dst = { ...calendar, alwaysOpen: true, timeZone: "America/New_York" };
  assert.equal(
    workingMillisecondsBetween(
      new Date("2026-11-01T05:30:00Z"),
      new Date("2026-11-01T07:30:00Z"),
      dst,
    ),
    7200000,
  );
  assert.throws(() =>
    workingMillisecondsBetween(
      new Date("2026-11-09"),
      new Date("2026-11-08"),
      calendar,
    ),
  );
  assert.throws(() =>
    addWorkingMinutes(new Date(), 60, { ...calendar, hours: [] }),
  );
});
test("operational access requires active agent/team and a compatible level", () => {
  assert.equal(operationScope({ role: "CLIENT", supportAgent: null }), null);
  assert.equal(
    operationScope({
      role: "AGENT",
      supportAgent: {
        active: false,
        teamId: "team",
        level: "N3",
        team: { active: true },
      },
    }),
    null,
  );
  assert.equal(
    operationScope({
      role: "AGENT",
      supportAgent: {
        active: true,
        teamId: "team",
        level: "N3",
        team: { active: false },
      },
    }),
    null,
  );
  assert.deepEqual(permittedLevels("N1"), ["N1"]);
  assert.deepEqual(permittedLevels("N2"), ["N1", "N2"]);
  assert.deepEqual(
    operationScope({
      role: "AGENT",
      supportAgent: {
        active: true,
        teamId: "team",
        level: "N1",
        team: { active: true },
      },
    }),
    {
      company: { status: "ACTIVE" },
      teamId: "team",
      team: { active: true },
      level: { in: ["N1"] },
    },
  );
  assert.deepEqual(
    ticketScope({
      role: "AGENT",
      userId: "agent",
      companyId: "company",
      teamId: "team",
    }),
    { id: { in: [] } },
  );
  assert.deepEqual(
    ticketScope({
      role: "CLIENT",
      userId: "client",
      companyId: "company",
      membershipRole: "REQUESTER",
    }),
    {
      companyId: "company",
      company: { status: "ACTIVE" },
      requesterId: "client",
    },
  );
});
test("reply validation rejects forged fields and validates trimmed body", () => {
  const input = {
    ticketId: "ticket",
    companyId: "company",
    submissionKey: "40874a5d-1c50-497b-865e-58b02c185822",
    audience: "portal",
    visibility: "PUBLIC",
    body: " Olá ",
  };
  assert.equal(replySchema.parse(input).body, "Olá");
  assert.equal(
    replySchema.safeParse({ ...input, authorId: "other" }).success,
    false,
  );
  assert.equal(replySchema.safeParse({ ...input, body: " " }).success, false);
  assert.equal(
    replySchema.safeParse({ ...input, body: "a".repeat(10001) }).success,
    false,
  );
});
test("service actions require relevant fields and reject role escalation", () => {
  const input = {
    ticketId: "ticket",
    submissionKey: "40874a5d-1c50-497b-865e-58b02c185822",
    expectedUpdatedAt: "2026-11-08T12:00:00.000Z",
    operation: "wait",
  };
  assert.equal(serviceActionSchema.safeParse(input).success, false);
  assert.equal(
    serviceActionSchema.safeParse({
      ...input,
      reason: "Aguardando informações",
    }).success,
    true,
  );
  assert.equal(
    serviceActionSchema.safeParse({ ...input, operation: "assign" }).success,
    false,
  );
  assert.equal(
    serviceActionSchema.safeParse({
      ...input,
      operation: "route",
      teamId: "team",
      level: "N3",
    }).success,
    false,
  );
});
test("queue parameters are bounded and malformed filters use safe defaults", () => {
  assert.equal(
    queueFilterSchema.parse({ page: "-1", status: ["OPEN"], q: "" }).page,
    1,
  );
  assert.equal(
    queueFilterSchema.parse({ page: "100000", q: "a".repeat(121) }).q,
    "",
  );
  assert.equal(queueFilterSchema.parse({ level: "N9" }).level, undefined);
});
