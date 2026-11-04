import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    console.error("Server action failed:", error);
    return "Não foi possível concluir o cadastro. Tente novamente.";
  },
});
