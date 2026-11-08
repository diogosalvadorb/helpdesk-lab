"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";

import { markOwnNotificationRead } from "@/data/dashboard";
import { getPortalContext } from "@/data/portal-context";
import { actionClient } from "@/lib/action-client";
import { auth } from "@/lib/auth";

export const signOutPortal = actionClient.action(async () => {
  await auth.api.signOut({ headers: await headers() });
  (await cookies()).delete("portal-company");
  return { ok: true };
});

export const selectCompany = actionClient
  .inputSchema(z.object({ companyId: z.string().min(1).max(200) }))
  .action(async ({ parsedInput }) => {
    const context = await getPortalContext();
    if (!context.companies.some((c) => c.id === parsedInput.companyId))
      return { ok: false, message: "Você não tem acesso a esta empresa." };
    (await cookies()).set("portal-company", parsedInput.companyId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return { ok: true };
  });
export const markNotificationRead = actionClient
  .inputSchema(z.object({ id: z.string().min(1).max(200) }))
  .action(async ({ parsedInput }) => {
    return { ok: await markOwnNotificationRead(parsedInput.id) };
  });
