import PortfolioView from "./_portfolio/PortfolioView";
import { defaultPortfolio } from "./_portfolio/content";
import { getPortfolio } from "@/database/lib/portfolio";
import AssistantChat from "@/components/AssistantChat";

// Content lives in the database and is edited at /edit, so render per request.
export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getPortfolio().catch((e) => {
    console.error("Failed to load portfolio, showing defaults", e);
    return defaultPortfolio;
  });
  return (
    <>
      <PortfolioView data={data} />
      <AssistantChat ownerName={data.profile.name} />
    </>
  );
}
