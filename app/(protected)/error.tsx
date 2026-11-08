"use client";

import { Button } from "@/components/ui/button";

export default function PortalError({ reset }: { reset: () => void }) {
  return (
    <div className="portal-state" role="alert">
      <h1>Seu atendimento está seguro.</h1>
      <p>
        Não foi possível carregar o portal agora. Tente novamente em instantes.
      </p>
      <Button onClick={reset} className="portal-primary-button">
        Tentar novamente
      </Button>
    </div>
  );
}
