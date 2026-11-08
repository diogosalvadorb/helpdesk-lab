import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

import { invalidatePreviousCodes } from "@/data/auth-verification";
import { otpPurposeSchema } from "@/lib/validations/otp";

import { otpDeliveryFailure, sendAuthCode } from "./auth-mail";
import { enforceOtpPolicy, isOtpSendPath } from "./auth-otp-policy";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    sendOnSignUp: false,
    sendOnSignIn: false,
    autoSignInAfterVerification: false,
  },
  logger: { disabled: true },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (
        (
          ctx.context as typeof ctx.context & { [otpDeliveryFailure]?: boolean }
        )[otpDeliveryFailure]
      ) {
        throw new APIError("SERVICE_UNAVAILABLE", {
          code: "EMAIL_DELIVERY_UNAVAILABLE",
          message:
            "Não foi possível enviar o código. Tente novamente em instantes.",
        });
      }
    }),
    before: createAuthMiddleware(async (ctx) => {
      await enforceOtpPolicy(ctx.path, ctx.body, ctx.headers);
      if (isOtpSendPath(ctx.path)) {
        const type =
          ctx.path === "/email-otp/send-verification-otp"
            ? ctx.body.type
            : "forget-password";
        // The schema does not make identifier unique. Remove every previous code
        // before rotation so a resend cannot leave an older OTP valid.
        await invalidatePreviousCodes(
          ctx.body.email,
          otpPurposeSchema.parse(type),
        );
      }
    }),
  },
  user: {
    additionalFields: {
      company: { type: "string", required: true },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      storeOTP: "hashed",
      resendStrategy: "rotate",
      sendVerificationOnSignUp: false,
      disableSignUp: true,
      async sendVerificationOTP(data, ctx) {
        if (
          data.type === "email-verification" ||
          data.type === "forget-password"
        )
          try {
            await sendAuthCode({ ...data, type: data.type });
          } catch {
            if (ctx) Object.assign(ctx.context, { [otpDeliveryFailure]: true });
          }
      },
    }),
    nextCookies(),
  ],
});
