import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  handleServerError() {
    return "Não foi possível concluir a solicitação. Tente novamente.";
  },
});
