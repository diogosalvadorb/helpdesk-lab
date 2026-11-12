import { InformationContent } from "@/components/information-content";
import { getServiceAgreement } from "@/data/dashboard";
import { getPublicInformation } from "@/data/settings";
export default async function ChannelsPage() {
  const [information, agreement] = await Promise.all([
    getPublicInformation(),
    getServiceAgreement(),
  ]);
  return (
    <InformationContent
      kind="help"
      information={information}
      calendar={agreement?.slaPolicy.calendar ?? information.calendar}
      contract={Boolean(agreement)}
    />
  );
}
