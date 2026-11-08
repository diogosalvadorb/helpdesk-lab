import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

const handlers = toNextJsHandler(auth);
export const GET = handlers.GET;

export async function POST(request: Request) {
  const response = await handlers.POST(request);
  const path = new URL(request.url).pathname.replace(/^\/api\/auth/, "");
  // Preserve the same public response for missing accounts and mail-provider
  // failures. This is an acknowledgement of the request, not a delivery receipt.
  if (
    [
      "/email-otp/send-verification-otp",
      "/email-otp/request-password-reset",
      "/forget-password/email-otp",
    ].includes(path) &&
    response.status >= 500
  ) {
    const error = await response
      .clone()
      .json()
      .catch(() => null);
    if (error?.code === "EMAIL_DELIVERY_UNAVAILABLE")
      return Response.json({ success: true });
  }
  return response;
}
