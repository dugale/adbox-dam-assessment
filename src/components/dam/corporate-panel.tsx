import { modeDefinitions } from "@/lib/dam/variable-modes";
import { Select } from "@/components/ui/select";
import { VariableField } from "./variable-field";
import {
  allowedModes,
  compatibleFields,
  getDefinition,
  modes,
} from "@/lib/dam/variable-definitions";
import type { Asset, Location, Mode, Resolution, Rules } from "@/lib/dam/types";
import { useDam } from "@/state/dam-provider";

export function CorporatePanel({
  asset,
  locations,
  rules,
  resolution,
}: {
  asset: Asset;
  locations: Location[];
  rules: Rules;
  resolution: Resolution;
}) {
  const { dispatch } = useDam();
  return (
    <section
      aria-labelledby="rules-heading"
      className="rounded-xl border bg-white shadow-xs"
    >
      <div className="border-b p-4">
        <h2 id="rules-heading" className="font-semibold">
          Variable rules
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Decide what comes from your records and what locations can change.
        </p>
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {modes.map((mode) => (
            <li key={mode.value}>
              <strong>{mode.label}:</strong> {mode.description}
            </li>
          ))}
        </ul>
      </div>
      <div className="divide-y">
        {asset.variables.map((key) => {
          const definition = getDefinition(key);
          const rule = rules[key];
          const mode = modeDefinitions[rule.mode];
          const Icon = mode.icon;
          const update = (patch: Partial<typeof rule>) =>
            dispatch({ type: "rule", assetId: asset.id, key, patch });
          const errors = resolution.issues.filter(
            (issue) => issue.key === key && issue.severity === "error",
          );
          return (
            <div key={key} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Icon
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {definition.label}
                </h3>

                <div className="w-full min-[480px]:w-44 lg:w-40">
                  <label htmlFor={`mode-${key}`} className="sr-only">
                    {definition.label} mode
                  </label>
                  <Select
                    id={`mode-${key}`}
                    value={rule.mode}
                    onChange={(event) =>
                      update({ mode: event.target.value as Mode })
                    }
                  >
                    {allowedModes(definition.type).map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              {mode.control === "source" && (
                <div className="space-y-1.5">
                  <label
                    htmlFor={`source-${key}`}
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Database field for {definition.label.toLowerCase()}
                  </label>
                  <Select
                    id={`source-${key}`}
                    value={rule.source}
                    aria-invalid={errors.length > 0}
                    aria-describedby={
                      errors.length > 0 ? `source-error-${key}` : undefined
                    }
                    onChange={(event) => update({ source: event.target.value })}
                  >
                    <option value="">Choose a field…</option>
                    {compatibleFields(definition.type).map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {mode.control === "fixed" &&
                (definition.type === "image" ? (
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`fixed-${key}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Fixed logo for all locations
                    </label>
                    <Select
                      id={`fixed-${key}`}
                      value={rule.fixedValue}
                      onChange={(event) =>
                        update({ fixedValue: event.target.value })
                      }
                    >
                      <option value="">Choose a supplied logo…</option>
                      {locations.map((location) => (
                        <option
                          key={location.location_id}
                          value={location.logo_file}
                        >
                          {location.location_name.replace(
                            "Harbor Point Bank - ",
                            "",
                          )}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <VariableField
                    definition={definition}
                    id={`fixed-${key}`}
                    label={`Corporate value for ${definition.label.toLowerCase()}`}
                    value={rule.fixedValue}
                    onChange={(fixedValue) => update({ fixedValue })}
                  />
                ))}
              {errors.map((issue) => (
                <p
                  key={issue.message}
                  id={`source-error-${key}`}
                  className="text-xs text-red-700"
                  role="alert"
                >
                  {issue.message}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
