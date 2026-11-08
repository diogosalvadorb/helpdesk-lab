import { createHash } from "node:crypto";

import type { CreateTicketInput } from "@/lib/validations/ticket";

// A fresh UUID permits two legitimate requests with identical content. The same
// UUID always maps to the same primary key, even after a timeout or process restart.
export function submissionIdentity(userId: string, input: CreateTicketInput) {
  const hash = (value: string) =>
    createHash("sha256").update(value).digest("hex");
  return {
    id: `portal-${hash(JSON.stringify([userId, input.companyId, input.submissionKey]))}`,
    fingerprint: hash(
      JSON.stringify([
        input.departmentId,
        input.categoryId,
        input.subject,
        input.description,
        input.impact,
      ]),
    ),
  };
}
