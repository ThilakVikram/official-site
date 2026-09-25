import PortfolioView from "./_portfolio/PortfolioView";
import { defaultPortfolio } from "./_portfolio/content";
import { getPortfolio } from "@/database/lib/portfolio";
import AssistantChat from "@/components/AssistantChat";
import UserMenu from "@/components/UserMenu";
import { getCurrentUser } from "@/app/_auth/session";

// Content lives in the database and is edited at /edit, so render per request.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [data, user] = await Promise.all([
    getPortfolio().catch((e) => {
      console.error("Failed to load portfolio, showing defaults", e);
      return defaultPortfolio;
    }),
    getCurrentUser().catch((e) => {
      console.error("Failed to load session", e);
      return null;
    }),
  ]);
  return (
    <>
      <PortfolioView data={data} account={user && <UserMenu user={user} />} />
      <AssistantChat ownerName={data.profile.name} />
    </>
  );
}
