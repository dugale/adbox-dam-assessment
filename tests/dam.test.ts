import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import data from "../assessment/locations.json";
import {
  discoverVariables,
  compatibleFields,
} from "../src/lib/dam/variable-definitions";
import {
  createDefaultRules,
  resolveVariables,
} from "../src/lib/dam/resolve-variables";
import { renderTemplate } from "../src/lib/dam/render-template";
import { damReducer, initialState } from "../src/state/dam-provider";
import type { Asset } from "../src/lib/dam/types";
const logos = Object.fromEntries(
  data.locations.map((location) => [
    location.logo_file,
    `data:image/png;base64,${readFileSync(`assessment/${location.logo_file}`).toString("base64")}`,
  ]),
);
const assets: Asset[] = ["fall_rate_promo", "branch_open_house"].map((name) => {
  const html = readFileSync(`assessment/asset_${name}.html`, "utf8");
  return {
    id: name,
    name,
    category: "Test",
    description: "",
    width: 1200,
    height: 628,
    html,
    variables: discoverVariables(html),
  };
});
const location = data.locations[0];

describe("data-driven variable resolution", () => {
  it("initializes both templates with the assessment defaults and logical sources", () => {
    const expected = {
      logo: { mode: "database", source: "logo_file", fixedValue: "" },
      location_name: {
        mode: "database",
        source: "location_name",
        fixedValue: "",
      },
      address: { mode: "database", source: "address", fixedValue: "" },
      phone: { mode: "database", source: "phone", fixedValue: "" },
      manager_name: {
        mode: "database",
        source: "manager_name",
        fixedValue: "",
      },
      event_date: { mode: "input", source: "", fixedValue: "" },
      deal: { mode: "input", source: "", fixedValue: "" },
      disclaimer: {
        mode: "locked",
        source: "",
        fixedValue: "Member FDIC. Rates subject to change.",
      },
    };
    const state = initialState(assets);
    for (const asset of assets) {
      expect(state.configurations[asset.id]).toEqual(
        Object.fromEntries(
          asset.variables.map((key) => [
            key,
            expected[key as keyof typeof expected],
          ]),
        ),
      );
      const result = resolveVariables(
        asset,
        state.configurations[asset.id],
        location,
        {},
        logos,
      );
      expect(result.values.disclaimer.value).toBe(
        expected.disclaimer.fixedValue,
      );
      expect(result.values.deal.value).toBe("");
      if (asset.variables.includes("event_date"))
        expect(result.values.event_date.value).toBe("");
    }
  });
  it("requires explicit sources for variables without logical mappings and preserves chosen mappings", () => {
    const asset = assets[1];
    for (const key of ["deal", "event_date", "disclaimer"]) {
      let state = initialState(assets);
      const change = (
        patch: Partial<(typeof state.configurations)[string][string]>,
      ) => {
        state = damReducer(state, {
          type: "rule",
          assetId: asset.id,
          key,
          patch,
        });
      };
      change({ mode: "database" });
      expect(state.configurations[asset.id][key].source).toBe("");
      const result = resolveVariables(
        asset,
        state.configurations[asset.id],
        location,
        { [key]: "Draft" },
        logos,
      );
      expect(result.values[key].value).toBe("");
      expect(result.issues).toContainEqual({
        key,
        severity: "error",
        message: expect.stringContaining(
          "choose a database field in Corporate; no source is selected",
        ),
      });
      change({ source: "address" });
      const mapped = resolveVariables(
        asset,
        state.configurations[asset.id],
        location,
        {},
        logos,
      );
      expect(mapped.values[key].value).toBe(location.address);
      expect(mapped.issues.filter((issue) => issue.key === key)).toEqual([]);
      change({ mode: "input" });
      change({ mode: "database" });
      expect(state.configurations[asset.id][key].source).toBe("address");
    }
  });
  it("discovers unique variables and supports an unfamiliar field without component changes", () => {
    const variables = discoverVariables("{new_field} {new_field} {phone}");
    expect(variables).toEqual(["new_field", "phone"]);
    const rules = createDefaultRules(variables);
    expect(rules.new_field.mode).toBe("input");
    expect(
      resolveVariables(
        { variables },
        rules,
        location,
        { new_field: "New content" },
        logos,
      ).values.new_field.value,
    ).toBe("New content");
  });
  it("handles an unfamiliar token through input, locked, and explicit database resolution", () => {
    const html = "<div>{community_message}</div>";
    const asset = { variables: discoverVariables(html) };
    const rules = createDefaultRules(asset.variables);
    const resolve = () =>
      resolveVariables(
        asset,
        rules,
        location,
        { community_message: "<Welcome> & {phone}" },
        logos,
      );
    expect(renderTemplate(html, resolve(), logos)).toContain(
      "&lt;Welcome&gt; &amp; {phone}",
    );
    rules.community_message.mode = "locked";
    rules.community_message.fixedValue = "Corporate message";
    expect(resolve().values.community_message.value).toBe("Corporate message");
    rules.community_message.mode = "database";
    expect(resolve().issues).toContainEqual(
      expect.objectContaining({ key: "community_message", severity: "error" }),
    );
    rules.community_message.source = "manager_name";
    expect(resolve().values.community_message.value).toBe(
      location.manager_name,
    );
    rules.community_message.mode = "input";
    expect(resolve().values.community_message.value).toBe(
      "<Welcome> & {phone}",
    );
  });
  it("rejects unsupported image input mode", () => {
    const rules = createDefaultRules(assets[0].variables);
    rules.logo.mode = "input";
    const result = resolveVariables(
      assets[0],
      rules,
      location,
      { logo: location.logo_file },
      logos,
    );
    expect(result.values.logo.value).toBe("");
    expect(result.issues).toContainEqual(
      expect.objectContaining({ key: "logo", severity: "error" }),
    );
  });
  it("resolves all three modes, ignores drafts when locked, and uses explicit database mappings", () => {
    const rules = createDefaultRules(assets[0].variables);
    rules.deal = {
      mode: "database",
      source: "manager_name",
      fixedValue: "Stored fixed value",
    };
    expect(
      resolveVariables(assets[0], rules, location, { deal: "My draft" }, logos)
        .values.deal.value,
    ).toBe(location.manager_name);
    rules.deal.mode = "locked";
    expect(
      resolveVariables(assets[0], rules, location, { deal: "My draft" }, logos)
        .values.deal.value,
    ).toBe("Stored fixed value");
    rules.deal.mode = "input";
    expect(
      resolveVariables(assets[0], rules, location, { deal: "My draft" }, logos)
        .values.deal.value,
    ).toBe("My draft");
  });
  it("rejects unknown and incompatible mappings without using them", () => {
    const rules = createDefaultRules(assets[0].variables);
    rules.logo.source = "phone";
    rules.deal = { mode: "database", source: "logo_file", fixedValue: "" };
    rules.address.source = "constructor";
    const result = resolveVariables(assets[0], rules, location, {}, logos);
    expect(
      result.issues.filter((issue) => issue.severity === "error"),
    ).toHaveLength(3);
    expect(result.values.logo.value).toBe("");
    expect(result.values.deal.value).toBe("");
    expect(compatibleFields("image").map((field) => field.key)).toEqual([
      "logo_file",
    ]);
    expect(
      compatibleFields("text").some((field) => field.key === "logo_file"),
    ).toBe(false);
  });
  it("handles both original templates for all ten locations, including missing phones", () => {
    for (const asset of assets)
      for (const branch of data.locations) {
        const result = resolveVariables(
          asset,
          createDefaultRules(asset.variables),
          branch,
          { deal: "A local offer", event_date: "November 14, 2–5 PM" },
          logos,
        );
        expect(result.values.phone.value).toBe(branch.phone ?? "");
        expect(
          result.issues.filter((issue) => issue.severity === "error"),
        ).toEqual([]);
        const document = renderTemplate(asset.html, result, logos);
        expect(document).toContain("object-fit:contain");
        expect(document).not.toContain("{logo}");
        expect(document).not.toContain("null");
        if (!branch.phone) {
          expect(result.issues.some((issue) => issue.key === "phone")).toBe(
            true,
          );
          expect(document).not.toMatch(/<br\s*\/?>(\s*)<\/div>/);
        }
      }
  });
});

describe("safe original-template rendering", () => {
  it("escapes user and corporate text and does not recursively substitute input tokens", () => {
    const asset = assets[0];
    const rules = createDefaultRules(asset.variables);
    rules.disclaimer.fixedValue = '<script>alert("bad")</script>';
    const result = resolveVariables(
      asset,
      rules,
      location,
      { deal: '<img src=x onerror="alert(1)"> & {phone}' },
      logos,
    );
    const document = renderTemplate(asset.html, result, logos);
    expect(document).toContain(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; {phone}",
    );
    expect(document).toContain("&lt;script&gt;");
    expect(document).not.toContain("<script>");
    expect(document).toContain("default-src 'none'");
    expect(document).toContain("img-src data:");
    expect(document).toContain("base-uri 'none'");
  });
  it("preserves multiline input and corporate text safely in both supplied templates", () => {
    for (const asset of assets) {
      const rules = createDefaultRules(asset.variables);
      rules.disclaimer.fixedValue =
        "Member FDIC.\r\n<script>bad</script>\rRates & terms.";
      const result = resolveVariables(
        asset,
        rules,
        location,
        { deal: "First line\n<img src=x> & {phone}\nLast line" },
        logos,
      );
      const document = renderTemplate(asset.html, result, logos);
      expect(document).toContain(
        "First line<br>&lt;img src=x&gt; &amp; {phone}<br>Last line",
      );
      expect(document).toContain(
        "Member FDIC.<br>&lt;script&gt;bad&lt;/script&gt;<br>Rates &amp; terms.",
      );
      expect(document).not.toContain("<script>");
      expect(document).not.toContain("<img src=x>");
    }
  });
  it("supports a fixed supplied logo but rejects arbitrary paths and malformed sources", () => {
    const asset = assets[0];
    const rules = createDefaultRules(asset.variables);
    rules.logo = {
      mode: "locked",
      source: "logo_file",
      fixedValue: "logos/LOC-007.png",
    };
    const result = resolveVariables(asset, rules, location, {}, logos);
    expect(renderTemplate(asset.html, result, logos)).toContain(
      logos["logos/LOC-007.png"],
    );
    rules.logo.fixedValue = 'https://evil.invalid/" onerror="alert(1)';
    const invalid = resolveVariables(asset, rules, location, {}, logos);
    expect(invalid.values.logo.value).toBe("");
    expect(
      invalid.issues.some(
        (issue) => issue.key === "logo" && issue.severity === "error",
      ),
    ).toBe(true);
    expect(
      renderTemplate(asset.html, result, {
        "logos/LOC-007.png": "javascript:alert(1)",
      }),
    ).not.toContain("<img");
  });
});

describe("session state", () => {
  it("isolates drafts by asset and location and preserves them through repeated rule changes", () => {
    let state = initialState(assets);
    const update = (assetId: string, locationId: string, value: string) => {
      state = damReducer(state, {
        type: "input",
        assetId,
        locationId,
        key: "deal",
        value,
      });
    };
    update(assets[0].id, "LOC-001", "Downtown offer");
    update(assets[0].id, "LOC-002", "Eastside offer");
    update(assets[1].id, "LOC-001", "Flyer offer");
    const drafts = state.drafts;
    state = damReducer(state, {
      type: "rule",
      assetId: assets[0].id,
      key: "deal",
      patch: { mode: "locked", fixedValue: "Corporate offer" },
    });
    expect(state.drafts).toBe(drafts);
    expect(state.configurations[assets[1].id].deal.mode).toBe("input");
    state = damReducer(state, {
      type: "rule",
      assetId: assets[0].id,
      key: "deal",
      patch: { mode: "input" },
    });
    expect(state.drafts[assets[0].id]["LOC-001"].deal).toBe("Downtown offer");
    expect(state.drafts[assets[0].id]["LOC-002"].deal).toBe("Eastside offer");
    expect(state.drafts[assets[1].id]["LOC-001"].deal).toBe("Flyer offer");
    expect(state.configurations[assets[0].id].deal.fixedValue).toBe(
      "Corporate offer",
    );
  });
});
