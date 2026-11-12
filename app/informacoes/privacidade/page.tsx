import { InformationContent } from "@/components/information-content";
import { getPublicInformation } from "@/data/settings";
export default async function PrivacyPage() {
  const information = await getPublicInformation();
  return <InformationContent kind="privacy" information={information} />;
}
