import type { ValueType, VariableDefinition } from "./types";

export { modes, allowedModes } from "./variable-modes";
// This schema controls the source selector and validates mappings in the resolver.
export const databaseFields = [
  { key: "location_name", label: "Location name", type: "text" },
  { key: "address", label: "Address", type: "text" },
  { key: "phone", label: "Phone number", type: "text" },
  { key: "manager_name", label: "Manager name", type: "text" },
  { key: "logo_file", label: "Location logo", type: "image" },
] as const;

const definitions: VariableDefinition[] = [
  {
    key: "logo",
    label: "Logo",
    type: "image",
    defaultMode: "database",
    source: "logo_file",
  },
  {
    key: "location_name",
    label: "Location name",
    type: "text",
    defaultMode: "database",
    source: "location_name",
  },
  {
    key: "address",
    label: "Address",
    type: "text",
    defaultMode: "database",
    source: "address",
  },
  {
    key: "phone",
    label: "Phone number",
    type: "text",
    defaultMode: "database",
    source: "phone",
  },
  {
    key: "manager_name",
    label: "Manager name",
    type: "text",
    defaultMode: "database",
    source: "manager_name",
  },
  {
    key: "deal",
    label: "Local offer",
    type: "text",
    defaultMode: "input",
    multiline: true,
    hint: "For example: Earn more with our fall savings rates.",
  },
  {
    key: "event_date",
    label: "Event date & time",
    type: "text",
    defaultMode: "input",
    hint: "For example: November 14, 2–5 PM",
  },
  {
    key: "disclaimer",
    label: "Disclaimer",
    type: "text",
    defaultMode: "locked",
    multiline: true,
    defaultValue: "Member FDIC. Rates subject to change.",
  },
];
export function getDefinition(key: string): VariableDefinition {
  return (
    definitions.find((item) => item.key === key) ?? {
      key,
      label: key.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase()),
      type: "text",
      defaultMode: "input",
    }
  );
}
export function compatibleFields(type: ValueType) {
  return databaseFields.filter((field) => field.type === type);
}
export function discoverVariables(html: string): string[] {
  return [
    ...new Set(
      [...html.matchAll(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g)].map(
        (match) => match[1],
      ),
    ),
  ];
}
