import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    console.error("Server action failed:", error);
    return "Não foi possível concluir a solicitação. Tente novamente.";
  },
});
