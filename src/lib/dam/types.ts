export type Location = {
  location_id: string;
  location_name: string;
  address: string;
  phone: string | null;
  manager_name: string;
  logo_file: string;
};
import type { Mode } from "./variable-modes";
export type { Mode } from "./variable-modes";
export type ValueType = "text" | "image";
export type Rule = { mode: Mode; source: string; fixedValue: string };
export type Rules = Record<string, Rule>;
export type VariableDefinition = {
  key: string;
  label: string;
  type: ValueType;
  defaultMode: Mode;
  source?: string;
  defaultValue?: string;
  hint?: string;
  multiline?: boolean;
};
export type Asset = {
  id: string;
  name: string;
  category: string;
  description: string;
  width: number;
  height: number;
  html: string;
  variables: string[];
};
export type Resolution = {
  values: Record<string, { type: ValueType; value: string }>;
  issues: { key: string; message: string; severity: "warning" | "error" }[];
};
export type Drafts = Record<string, Record<string, Record<string, string>>>;
export type DamState = {
  configurations: Record<string, Rules>;
  drafts: Drafts;
};
export type DamAction =
  | { type: "rule"; assetId: string; key: string; patch: Partial<Rule> }
  | {
      type: "input";
      assetId: string;
      locationId: string;
      key: string;
      value: string;
    };
