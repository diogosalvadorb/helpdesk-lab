import { getAccountSettings } from "@/data/settings";

import { AccountSettings } from "./_components/account-settings";
export default async function SettingsPage() {
  const account = await getAccountSettings();
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Preferências e segurança</p>
          <h1>Seu perfil, do seu jeito.</h1>
          <p>
            Mantenha suas informações e preferências de atendimento atualizadas.
          </p>
        </div>
      </div>
      <AccountSettings account={account} />
    </>
  );
}
