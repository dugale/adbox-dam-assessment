import data from "../../assessment/locations.json";
import { loadAssets, loadLogoSources } from "@/lib/dam/asset-catalog";
import { Workspace } from "@/components/dam/workspace";
import { DamProvider } from "@/state/dam-provider";
export default async function Page() {
  const [assets, logoSources] = await Promise.all([
    loadAssets(),
    loadLogoSources(),
  ]);
  return (
    <DamProvider assets={assets}>
      <Workspace
        assets={assets}
        locations={data.locations}
        corporateAccount={data.corporate_account}
        logoSources={logoSources}
      />
    </DamProvider>
  );
}
