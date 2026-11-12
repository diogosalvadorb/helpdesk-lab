"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signOutPortal } from "@/actions/portal";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/portal-format";

export function UserMenu({
  name,
  roleLabel,
}: {
  name: string;
  roleLabel: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function logout() {
    setBusy(true);
    setError(false);
    try {
      const result = await signOutPortal();
      if (!result?.data?.ok) throw new Error("logout");
      router.replace("/authentication");
      router.refresh();
    } catch {
      setError(true);
      setBusy(false);
    }
  }
  return (
    <div className="portal-profile">
      <span className="portal-avatar" aria-hidden="true">
        {initials(name)}
      </span>
      <div>
        <Link href="/configuracoes" aria-label={`Configurações de ${name}`}>
          <strong>{name}</strong>
        </Link>
        <small>{roleLabel}</small>
        {error && <p role="alert">Não foi possível sair. Tente novamente.</p>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={logout}
        disabled={busy}
        aria-label={busy ? "Saindo" : "Sair da conta"}
        className="portal-icon-button"
      >
        <LogOut aria-hidden="true" />
      </Button>
    </div>
  );
}
