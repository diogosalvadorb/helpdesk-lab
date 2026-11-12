import AuthenticationScreen from "./_components/authentication-screen";

export default async function AuthenticationPage({
  searchParams,
}: PageProps<"/authentication">) {
  const { view } = await searchParams;
  return (
    <AuthenticationScreen
      initialView={
        view === "register"
          ? "register"
          : view === "recover"
            ? "recover"
            : "login"
      }
      initialNotice={
        view === "confirm"
          ? "Confirme seu e-mail para acessar o portal. Entre com suas credenciais para continuar a confirmação."
          : undefined
      }
    />
  );
}
