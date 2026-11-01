import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import data from "../../../assessment/locations.json";
import { discoverVariables } from "./variable-definitions";
import type { Asset } from "./types";

const catalog = [
  {
    id: "fall-rate-promo",
    file: "asset_fall_rate_promo.html",
    name: "Fall Rate Promo",
    category: "Web banner",
    description: "A seasonal offer, made local.",
    width: 1200,
    height: 628,
  },
  {
    id: "branch-open-house",
    file: "asset_branch_open_house.html",
    name: "Branch Open House",
    category: "Print flyer",
    description: "Invite your community to stop by.",
    width: 816,
    height: 1056,
  },
];
export async function loadAssets(): Promise<Asset[]> {
  return Promise.all(
    catalog.map(async ({ file, ...asset }) => {
      const html = await readFile(
        path.join(process.cwd(), "assessment", file),
        "utf8",
      );
      return { ...asset, html, variables: discoverVariables(html) };
    }),
  );
}
export async function loadLogoSources(): Promise<Record<string, string>> {
  return Object.fromEntries(
    await Promise.all(
      data.locations.map(async (location) => {
        const bytes = await readFile(
          path.join(process.cwd(), "assessment", location.logo_file),
        );
        return [
          location.logo_file,
          `data:image/png;base64,${bytes.toString("base64")}`,
        ];
      }),
    ),
  );
}
