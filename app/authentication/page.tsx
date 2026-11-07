import AuthenticationScreen from "./_components/authentication-screen";

export default async function AuthenticationPage({
  searchParams,
}: PageProps<"/authentication">) {
  const { view } = await searchParams;
  return (
    <AuthenticationScreen
      initialView={view === "register" ? "register" : "login"}
    />
  );
}
