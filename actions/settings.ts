"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getAuthenticatedUser } from "@/data/authenticated-user";
import { SupportInputError } from "@/data/service-store";
import {
  savePortalConfiguration,
  savePreferences,
} from "@/data/settings-store";
import { actionClient } from "@/lib/action-client";
import { auth } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import {
  portalConfigurationSchema,
  preferenceSchema,
  profileSchema,
} from "@/lib/validations/settings";
export const updateProfile = actionClient
  .inputSchema(profileSchema)
  .action(async ({ parsedInput }) => {
    await getAuthenticatedUser();
    try {
      await auth.api.updateUser({
        headers: await headers(),
        body: { name: parsedInput.name },
      });
      revalidatePath("/(protected)", "layout");
      return { ok: true as const };
    } catch (error) {
      return { ok: false as const, message: authErrorMessage(error) };
    }
  });
export const updatePreferences = actionClient
  .inputSchema(preferenceSchema)
  .action(async ({ parsedInput }) => {
    const user = await getAuthenticatedUser();
    try {
      await savePreferences(user.id, parsedInput);
      revalidatePath("/(protected)", "layout");
      return { ok: true as const };
    } catch (error) {
      if (error instanceof SupportInputError)
        return { ok: false as const, message: error.message };
      throw error;
    }
  });
export const updateWorkspace = actionClient
  .inputSchema(portalConfigurationSchema)
  .action(async ({ parsedInput }) => {
    const user = await getAuthenticatedUser();
    try {
      await savePortalConfiguration(user.id, parsedInput);
      revalidatePath("/", "layout");
      return { ok: true as const };
    } catch (error) {
      if (error instanceof SupportInputError)
        return { ok: false as const, message: error.message };
      throw error;
    }
  });
