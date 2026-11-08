"use client";

import { Button } from "@/components/ui/button";

// This parent boundary also covers failures while loading the protected layout.
export default function PageError({ reset }: { reset: () => void }) {
  return (
    <main className="portal-state" role="alert">
      <h1>Vamos tentar de novo?</h1>
      <p>
        Não foi possível carregar esta página agora. Seus dados não foram
        alterados.
      </p>
      <Button className="portal-primary-button" onClick={reset}>
        Tentar novamente
      </Button>
    </main>
  );
}
