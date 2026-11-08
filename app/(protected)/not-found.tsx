import Link from "next/link";
export default function ProtectedNotFound() {
  return (
    <div className="portal-state">
      <h1>Conteúdo indisponível</h1>
      <p>
        Este conteúdo não foi encontrado ou não está disponível para sua conta.
      </p>
      <Link href="/dashboard" className="portal-primary-button">
        Voltar ao início
      </Link>
    </div>
  );
}
