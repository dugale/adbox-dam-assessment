import { isLocationEditable, modeDefinitions } from "@/lib/dam/variable-modes";
import Image from "next/image";
import { LockKeyhole, PencilLine } from "lucide-react";
import { VariableField } from "./variable-field";
import { getDefinition } from "@/lib/dam/variable-definitions";
import type { Asset, Location, Resolution, Rules } from "@/lib/dam/types";
import { useDam } from "@/state/dam-provider";

export function LocationPanel({
  asset,
  location,
  rules,
  inputs,
  resolution,
  logoSources,
  previewMode = false,
}: {
  asset: Asset;
  location: Location;
  rules: Rules;
  inputs: Record<string, string>;
  resolution: Resolution;
  logoSources: Record<string, string>;
  previewMode?: boolean;
}) {
  const { dispatch } = useDam();
  const editable = asset.variables.filter((key) =>
    isLocationEditable(rules[key].mode, getDefinition(key).type),
  );
  const provided = asset.variables.filter(
    (key) => !isLocationEditable(rules[key].mode, getDefinition(key).type),
  );
  return (
    <div className="space-y-5">
      <section
        aria-labelledby={
          previewMode ? "preview-inputs-heading" : "customize-heading"
        }
        className="rounded-xl border bg-white shadow-xs"
      >
        <div className="border-b p-5">
          <h2
            id={previewMode ? "preview-inputs-heading" : "customize-heading"}
            className="flex items-center gap-2 font-semibold"
          >
            <PencilLine className="size-4 text-primary" aria-hidden="true" />
            {previewMode
              ? "Location draft · preview inputs"
              : "Customize your asset"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {previewMode
              ? "These fields edit this location’s draft, exactly as in Location view."
              : "Fill in the details below. Your preview updates as you type."}
          </p>
        </div>
        <div className="space-y-6 p-5">
          {editable.length === 0 ? (
            <p className="flex items-start gap-2 text-sm leading-relaxed">
              {resolution.issues.length === 0
                ? "No location inputs are required. All asset values are provided."
                : "No location inputs are required. Review Preview notes for missing values or configuration issues."}
            </p>
          ) : (
            editable.map((key) => (
              <VariableField
                key={key}
                id={`${previewMode ? "preview" : "local"}-${key}`}
                definition={getDefinition(key)}
                value={inputs[key] ?? ""}
                hint={getDefinition(key).hint}
                onChange={(value) =>
                  dispatch({
                    type: "input",
                    assetId: asset.id,
                    locationId: location.location_id,
                    key,
                    value,
                  })
                }
              />
            ))
          )}
        </div>
      </section>
      {!previewMode && provided.length > 0 && (
        <section
          aria-labelledby="provided-heading"
          className="rounded-xl border bg-white shadow-xs"
        >
          <div className="border-b p-5">
            <h2
              id="provided-heading"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <LockKeyhole
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Provided by corporate
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              These details are managed for you.
            </p>
          </div>
          <dl className="divide-y px-5">
            {provided.map((key) => {
              const definition = getDefinition(key);
              const resolved = resolution.values[key];
              const mode = modeDefinitions[rules[key].mode];
              const Icon = mode.icon;
              const issue = resolution.issues.find((item) => item.key === key);
              return (
                <div key={key} className="py-4">
                  <dt className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                    <span>{definition.label}</span>
                    <span className="flex items-center gap-1 text-[10px]">
                      <Icon className="size-3" aria-hidden="true" />
                      {mode.label}
                    </span>
                  </dt>
                  <dd className="text-sm leading-relaxed break-words">
                    {definition.type === "image" &&
                    resolved.value &&
                    logoSources[resolved.value] ? (
                      <div className="flex h-16 w-40 items-center justify-center rounded border bg-slate-50 p-2">
                        <Image
                          src={logoSources[resolved.value]}
                          unoptimized
                          alt="Selected location logo"
                          width={140}
                          height={48}
                          className="max-h-full w-auto max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      resolved.value || (
                        <span className="text-amber-800">
                          {issue?.severity === "error"
                            ? "Needs corporate configuration"
                            : "Not provided"}
                        </span>
                      )
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      )}
    </div>
  );
}
