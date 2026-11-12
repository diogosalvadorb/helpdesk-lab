import { InformationContent } from "@/components/information-content";
import { getPublicInformation } from "@/data/settings";
export default async function HelpPage() {
  const information = await getPublicInformation();
  return <InformationContent kind="help" information={information} />;
}
