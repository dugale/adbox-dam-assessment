import { allowedModes, modeDefinitions } from "./variable-modes";
import type { Asset, Location, Resolution, Rule, Rules } from "./types";
import { compatibleFields, getDefinition } from "./variable-definitions";

export function createDefaultRules(variables: string[]): Rules {
  return Object.fromEntries(
    variables.map((key) => {
      const definition = getDefinition(key);
      return [
        key,
        {
          mode: definition.defaultMode,
          source: definition.source ?? "",
          fixedValue: definition.defaultValue ?? "",
        } satisfies Rule,
      ];
    }),
  );
}

export function resolveVariables(
  asset: Pick<Asset, "variables">,
  rules: Rules,
  location: Location,
  inputs: Record<string, string>,
  logoSources: Record<string, string>,
): Resolution {
  const result: Resolution = { values: {}, issues: [] };
  for (const key of asset.variables) {
    const definition = getDefinition(key);
    const rule = rules[key];
    let value = "";
    const issue = (
      message: string,
      severity: "error" | "warning" = "error",
    ) => {
      result.issues.push({ key, message, severity });
    };
    if (!rule) {
      issue(`${definition.label}: no rule configured.`);
    } else {
      const mode = Object.hasOwn(modeDefinitions, rule.mode)
        ? modeDefinitions[rule.mode]
        : undefined;
      if (!mode) {
        issue(`${definition.label}: unsupported variable mode.`);
      } else if (
        !allowedModes(definition.type).some((item) => item.value === rule.mode)
      ) {
        issue(
          `${definition.label}: ${mode.label} is not supported for ${definition.type} variables.`,
        );
      } else {
        value = mode.resolve({
          source: rule.source,
          fixedValue: rule.fixedValue,
          input: inputs[key] ?? "",
          location,
          fields: compatibleFields(definition.type),
          issue: (message, severity) =>
            issue(`${definition.label}: ${message}`, severity),
        });
      }
    }
    if (!value.trim() && !result.issues.some((item) => item.key === key)) {
      issue(
        `${definition.label}: ${rule ? (modeDefinitions[rule.mode]?.emptyLabel ?? "value") : "value"} is empty.`,
        "warning",
      );
    }
    if (
      definition.type === "image" &&
      value &&
      !Object.hasOwn(logoSources, value)
    ) {
      issue("Logo: select one of the supplied logos in Corporate.");
      value = "";
    }
    result.values[key] = { type: definition.type, value };
  }
  return result;
}
