import "server-only";

import { prisma } from "@/lib/prisma";
import type { OtpPurpose } from "@/lib/validations/otp";

export async function invalidatePreviousCodes(
  email: string,
  purpose: OtpPurpose,
) {
  await prisma.verification.deleteMany({
    where: { identifier: `${purpose}-otp-${email}` },
  });
}
