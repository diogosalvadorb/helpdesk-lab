import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// React cache only deduplicates within a server render, never across users.
export const getAuthenticatedUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  if (!session) redirect("/authentication");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      role: true,
      emailVerified: true,
      supportAgent: {
        select: {
          active: true,
          teamId: true,
          team: { select: { active: true } },
        },
      },
    },
  });
  if (!user || !user.emailVerified) redirect("/authentication?view=confirm");
  return user;
});
