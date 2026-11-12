import { InformationContent } from "@/components/information-content";
import { getPublicInformation } from "@/data/settings";
export default async function TermsPage() {
  const information = await getPublicInformation();
  return <InformationContent kind="terms" information={information} />;
}
