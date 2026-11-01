import {
  Database,
  LockKeyhole,
  PencilLine,
  type LucideIcon,
} from "lucide-react";
import type { Location, ValueType } from "./types";

type ModeContext = {
  source: string;
  fixedValue: string;
  input: string;
  location: Location;
  fields: readonly { key: keyof Location; label: string }[];
  issue: (message: string, severity?: "error" | "warning") => void;
};
type ModeDefinition = {
  label: string;
  description: string;
  icon: LucideIcon;
  types: readonly ValueType[];
  locationEditable: boolean;
  control: "source" | "fixed" | "none";
  emptyLabel: string;
  resolve: (context: ModeContext) => string;
};

// One small definition per mode; rendering only consumes the resolved value.
export const modeDefinitions = {
  database: {
    label: "From database",
    description: "Filled from the selected location’s record.",
    icon: Database,
    types: ["text", "image"],
    locationEditable: false,
    control: "source",
    emptyLabel: "database value",
    resolve: ({ source, location, fields, issue }: ModeContext) => {
      const field = fields.find((item) => item.key === source);
      if (!field) {
        issue(
          source
            ? "choose a compatible database field in Corporate."
            : "choose a database field in Corporate; no source is selected.",
        );
        return "";
      }
      const value = location[field.key] ?? "";
      if (!value.trim())
        issue(
          `${field.label.toLowerCase()} not provided for this location.`,
          "warning",
        );
      return value;
    },
  },
  input: {
    label: "Location input",
    description: "The location supplies this value.",
    icon: PencilLine,
    types: ["text"],
    locationEditable: true,
    control: "none",
    emptyLabel: "location input",
    resolve: ({ input }: ModeContext) => input,
  },
  locked: {
    label: "Locked",
    description: "One corporate value for every location.",
    icon: LockKeyhole,
    types: ["text", "image"],
    locationEditable: false,
    control: "fixed",
    emptyLabel: "corporate value",
    resolve: ({ fixedValue }: ModeContext) => fixedValue,
  },
} satisfies Record<string, ModeDefinition>;

export type Mode = keyof typeof modeDefinitions;
export const modes = (Object.keys(modeDefinitions) as Mode[]).map((value) => ({
  value,
  ...modeDefinitions[value],
}));
export function allowedModes(type: ValueType) {
  return modes.filter((mode) =>
    (mode.types as readonly ValueType[]).includes(type),
  );
}
export function isLocationEditable(mode: Mode, type: ValueType) {
  return (
    modeDefinitions[mode].locationEditable &&
    allowedModes(type).some((item) => item.value === mode)
  );
}
