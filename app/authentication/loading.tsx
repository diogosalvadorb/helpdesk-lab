export default function AuthenticationLoading() {
  return (
    <main
      className="bg-auth-background text-auth-muted font-auth grid min-h-svh place-items-center"
      aria-busy="true"
    >
      <p role="status">Preparando seu acesso…</p>
    </main>
  );
}
