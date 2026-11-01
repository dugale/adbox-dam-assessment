"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Building2,
  Check,
  ChevronRight,
  FileImage,
  LayoutTemplate,
  MapPin,
  Monitor,
  PanelLeft,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CorporatePanel } from "./corporate-panel";
import { LocationPanel } from "./location-panel";
import { AssetPreview } from "./asset-preview";
import { isLocationEditable } from "@/lib/dam/variable-modes";
import { getDefinition } from "@/lib/dam/variable-definitions";
import { resolveVariables } from "@/lib/dam/resolve-variables";
import { renderTemplate } from "@/lib/dam/render-template";
import { useDam } from "@/state/dam-provider";
import type { Asset, Location } from "@/lib/dam/types";
import { cn } from "@/lib/utils";

export function Workspace({
  assets,
  locations,
  corporateAccount,
  logoSources,
}: {
  assets: Asset[];
  locations: Location[];
  corporateAccount: string;
  logoSources: Record<string, string>;
}) {
  const { state } = useDam();
  const [role, setRole] = useState<"corporate" | "location">("corporate");
  const [assetId, setAssetId] = useState(assets[0].id);
  const [locationId, setLocationId] = useState(locations[0].location_id);
  const asset = assets.find((item) => item.id === assetId)!;
  const location = locations.find((item) => item.location_id === locationId)!;
  const rules = state.configurations[asset.id];
  const inputs = state.drafts[asset.id]?.[location.location_id];
  // Both roles receive this exact resolution and document; no alternate preview path.
  const resolution = useMemo(
    () => resolveVariables(asset, rules, location, inputs ?? {}, logoSources),
    [asset, rules, location, inputs, logoSources],
  );
  const document = useMemo(
    () => renderTemplate(asset.html, resolution, logoSources),
    [asset.html, resolution, logoSources],
  );
  const localCount = asset.variables.filter((key) =>
    isLocationEditable(rules[key].mode, getDefinition(key).type),
  ).length;
  const branchName = location.location_name.replace(
    `${corporateAccount} - `,
    "",
  );
  return (
    <div className="min-h-screen">
      <a
        href="#workspace"
        className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to workspace
      </a>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-5">
            <Image
              src="/logos/LOC-001.png"
              alt="Harbor Point Bank"
              width={190}
              height={48}
              priority
              className="h-auto w-40 sm:w-44"
            />
            <span className="hidden h-7 border-l sm:block" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold tracking-tight">
                Brand Studio
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Local marketing, on brand.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-teal-600" />
            Session workspace
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="size-3.5" aria-hidden="true" />
            {corporateAccount}
            <ChevronRight className="size-3" aria-hidden="true" />
            <span className="text-foreground">Marketing assets</span>
          </div>
          <div
            className="inline-flex rounded-lg border bg-white p-1"
            role="group"
            aria-label="Workspace role"
          >
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={role === "corporate"}
              onClick={() => setRole("corporate")}
              className={cn(
                "text-muted-foreground",
                role === "corporate" &&
                  "bg-primary text-white hover:bg-primary/90 hover:text-white",
              )}
            >
              <Building2 className="size-4" aria-hidden="true" />
              Corporate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={role === "location"}
              onClick={() => setRole("location")}
              className={cn(
                "text-muted-foreground",
                role === "location" &&
                  "bg-primary text-white hover:bg-primary/90 hover:text-white",
              )}
            >
              <MapPin className="size-4" aria-hidden="true" />
              Location
            </Button>
          </div>
        </div>
        <main id="workspace">
          <div className="mb-7">
            <p className="mb-2 text-[11px] font-bold tracking-[0.16em] text-teal-700">
              {role === "corporate"
                ? "CORPORATE WORKSPACE"
                : "LOCATION WORKSPACE"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-[34px]">
              {role === "corporate"
                ? "Your brand. Every location."
                : "Make it local."}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {role === "corporate"
                ? "Set the guardrails once. Give every branch the right details and room to make it their own."
                : "Choose an asset, add your local details, and see your branch’s marketing come together."}
            </p>
          </div>
          <div
            className="mb-6 grid gap-3 sm:grid-cols-2"
            role="group"
            aria-label="Choose a marketing asset"
          >
            {assets.map((item) => {
              const active = item.id === asset.id;
              const Icon = item.category === "Web banner" ? Monitor : FileImage;
              return (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={active}
                  onClick={() => setAssetId(item.id)}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border bg-white p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    active
                      ? "border-primary/60 bg-accent/40 ring-1 ring-primary/10"
                      : "hover:border-slate-400",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-lg",
                      active
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {item.name}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.category} · {item.width} × {item.height}
                    </span>
                  </span>
                  {active && (
                    <Check
                      className="size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-xl border bg-white p-4">
            <div className="w-full sm:w-80">
              <label
                htmlFor="location-selector"
                className="mb-2 flex items-center gap-1.5 text-xs font-medium"
              >
                <MapPin
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                {role === "corporate" ? "Preview as location" : "Your location"}
              </label>
              <Select
                id="location-selector"
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
              >
                {locations.map((item) => (
                  <option value={item.location_id} key={item.location_id}>
                    {item.location_name.replace(`${corporateAccount} - `, "")} ·{" "}
                    {item.location_id}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-4 pb-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <LayoutTemplate className="size-3.5" aria-hidden="true" />
                {asset.variables.length} variables
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden="true" />
                {localCount} editable {localCount === 1 ? "field" : "fields"}
              </span>
            </div>
          </div>
          <a
            href="#asset-preview"
            className="mb-4 inline-block text-sm font-medium text-primary underline lg:hidden"
          >
            Jump to preview
          </a>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
            <div className="space-y-5">
              {role === "corporate" ? (
                <>
                  <CorporatePanel
                    asset={asset}
                    locations={locations}
                    rules={rules}
                    resolution={resolution}
                  />
                  <LocationPanel
                    asset={asset}
                    location={location}
                    rules={rules}
                    inputs={inputs ?? {}}
                    resolution={resolution}
                    logoSources={logoSources}
                    previewMode
                  />
                </>
              ) : (
                <LocationPanel
                  asset={asset}
                  location={location}
                  rules={rules}
                  inputs={inputs ?? {}}
                  resolution={resolution}
                  logoSources={logoSources}
                />
              )}
            </div>
            <AssetPreview
              asset={asset}
              document={document}
              resolution={resolution}
              locationName={`${branchName} · ${location.location_id}`}
            />
          </div>
        </main>
        <footer className="mt-8 flex items-start gap-2 border-t pt-5 text-xs leading-relaxed text-muted-foreground">
          <PanelLeft className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>
            Changes apply immediately in this workspace. Configuration and
            location drafts are kept in memory and reset when you refresh or
            close this page.
          </p>
        </footer>
      </div>
    </div>
  );
}
