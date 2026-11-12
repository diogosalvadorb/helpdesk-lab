import Link from "next/link";
import type { ReactNode } from "react";
const destinations = {
  privacy: "/informacoes/privacidade",
  terms: "/informacoes/termos",
  help: "/informacoes/ajuda",
  recovery: "/authentication?view=recover",
};
export function AuthInfo({
  topic,
  children,
}: {
  topic: keyof typeof destinations;
  children: ReactNode;
}) {
  return (
    <Link className="auth-text-link" href={destinations[topic]}>
      {children}
    </Link>
  );
}
