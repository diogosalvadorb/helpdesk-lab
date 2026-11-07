import { HomeCta } from "./_components/home-cta";
import { HomeFeatures } from "./_components/home-features";
import { HomeFooter } from "./_components/home-footer";
import { HomeHeader } from "./_components/home-header";
import { HomeHero } from "./_components/home-hero";
import { PortalPreview } from "./_components/portal-preview";
import { SupportJourney } from "./_components/support-journey";

export default function Home() {
  return (
    <div className="home">
      <HomeHeader />
      <main>
        <HomeHero />
        <SupportJourney />
        <HomeFeatures />
        <PortalPreview />
        <HomeCta />
      </main>
      <HomeFooter />
    </div>
  );
}
