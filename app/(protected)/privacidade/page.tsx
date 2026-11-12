import { InformationContent } from "@/components/information-content";
import { getPublicInformation } from "@/data/settings";
export default async function PrivacyPage() {
  return (
    <InformationContent
      kind="privacy"
      information={await getPublicInformation()}
    />
  );
}
