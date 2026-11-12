import { InformationContent } from "@/components/information-content";
import { getPublicInformation } from "@/data/settings";
export default async function TermsPage() {
  return (
    <InformationContent
      kind="terms"
      information={await getPublicInformation()}
    />
  );
}
