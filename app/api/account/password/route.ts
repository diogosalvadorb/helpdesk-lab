import { headers } from "next/headers";

import { getAuthenticatedUser } from "@/data/authenticated-user";
import { auth } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { passwordChangeSchema } from "@/lib/validations/settings";

// A dedicated response lets the browser receive the rotated session cookie before
// requesting protected RSC content with that new session.
export async function POST(request: Request) {
  const responseHeaders = { "Cache-Control": "private, no-store" };
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json(
      { ok: false, message: "Origem da solicitação inválida." },
      { status: 403, headers: responseHeaders },
    );
  await getAuthenticatedUser();
  const input = passwordChangeSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!input.success)
    return Response.json(
      {
        ok: false,
        message: "Confira a senha atual e a confirmação da nova senha.",
      },
      { status: 400, headers: responseHeaders },
    );
  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: input.data.currentPassword,
        newPassword: input.data.newPassword,
        revokeOtherSessions: true,
      },
    });
    return Response.json({ ok: true }, { headers: responseHeaders });
  } catch (error) {
    return Response.json(
      { ok: false, message: authErrorMessage(error) },
      { status: 400, headers: responseHeaders },
    );
  }
}
