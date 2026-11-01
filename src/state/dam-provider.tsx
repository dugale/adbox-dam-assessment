"use client";
import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";
import { createDefaultRules } from "@/lib/dam/resolve-variables";
import type { Asset, DamState, DamAction } from "@/lib/dam/types";

export function initialState(assets: Asset[]): DamState {
  return {
    configurations: Object.fromEntries(
      assets.map((asset) => [asset.id, createDefaultRules(asset.variables)]),
    ),
    drafts: {},
  };
}
export function damReducer(state: DamState, action: DamAction): DamState {
  if (action.type === "rule") {
    const rules = state.configurations[action.assetId];
    return {
      ...state,
      configurations: {
        ...state.configurations,
        [action.assetId]: {
          ...rules,
          [action.key]: { ...rules[action.key], ...action.patch },
        },
      },
    };
  }
  const assetDrafts = state.drafts[action.assetId] ?? {};
  const locationDrafts = assetDrafts[action.locationId] ?? {};
  return {
    ...state,
    drafts: {
      ...state.drafts,
      [action.assetId]: {
        ...assetDrafts,
        [action.locationId]: { ...locationDrafts, [action.key]: action.value },
      },
    },
  };
}
const DamContext = createContext<{
  state: DamState;
  dispatch: Dispatch<DamAction>;
} | null>(null);
export function DamProvider({
  assets,
  children,
}: {
  assets: Asset[];
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(damReducer, assets, initialState);
  return (
    <DamContext.Provider value={{ state, dispatch }}>
      {children}
    </DamContext.Provider>
  );
}
export function useDam() {
  const context = useContext(DamContext);
  if (!context) throw new Error("useDam must be used inside DamProvider");
  return context;
}
