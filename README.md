# Harbor Point Bank · Brand Studio

AdBox DAM Product Engineer Assessment

**Approximate development time:** 3 hours

A local Digital Asset Management assessment built with Next.js App Router, TypeScript, Tailwind CSS, and shadcn/ui components. Corporate controls variable rules; location managers customize permitted fields. Both views use the same resolution and rendering functions.

## Run locally

Use **Node.js 22.13 or later** (Node 22 LTS recommended) and npm.

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. If port 3000 is occupied, use `npm run dev -- --port 3107` and open **http://localhost:3107**. No database, environment variables, external fonts, or service accounts are required. Dependency installation requires internet access; the application itself uses local files.

For a production run:

```sh
npm run build
npm start
```

## Using the workspace

The initial rules follow the assessment: logo, location name, address, phone, and manager name use their matching database fields; local offer and event date use Location input; disclaimer is Locked to “Member FDIC. Rates subject to change.”

1. Choose **Corporate** and one of the two assets.
2. Set each variable to **From database**, **Location input**, or **Locked**. Logo supports database or locked mode only.
3. Database mode lets you select a compatible source field. Variables without a logical default source show “Choose a field…” and a configuration message until Corporate explicitly selects one. Text fields cannot use logo files; logos cannot use text fields. A missing or invalid mapping is reported and renders empty.
4. Locked text uses a corporate value. A locked logo uses one of the ten supplied originals, shared across locations.
5. Choose a location to preview. Corporate’s **Location draft · preview inputs** section edits that branch’s actual draft, with the same behavior as Location view.
6. Switch to **Location** to fill editable fields. Corporate-provided values are read-only and appear separately.

Rules belong to a template. Drafts belong to a template **and** location. Switching assets, locations, roles, or variable modes preserves entered text and fixed corporate values. Configuration applies immediately. **Refreshing or closing the page resets all changes.** Tabs and other browsers do not share state.

## Structure and decisions

- `assessment/locations.json` is the original, read-only location source.
- `src/lib/dam/asset-catalog.ts` loads the two original HTML templates and original PNG bytes from disk at build time. There are no API endpoints. `public/logos/` contains unchanged copies for normal static serving and application branding.
- `variable-definitions.ts` holds field metadata and compatible database fields. Template tokens are discovered automatically. Unknown text variables default to Location input and get a readable label without new component code.
- `variable-modes.ts` defines each mode’s label, icon, supported value types, editing policy, Corporate control type, and resolution function. The mode type is derived from those definitions. A mode reusing the existing controls can be added there; a new kind of control still needs UI code.
- `resolve-variables.ts` applies those mode definitions, validates mappings, and reports missing data without overwriting drafts.
- `render-template.ts` substitutes in one pass, escapes all text, preserves line breaks in multiline fields using generated `<br>` elements, and generates image markup only for server-loaded PNG data URLs. Braces inside entered text remain literal.
- `src/state/dam-provider.tsx` owns a small React reducer and context. UI selectors live in the workspace; configuration and drafts are separate, serializable data.
- Both interfaces consume the same resolved values and `AssetPreview`. Native dimensions are preserved; the entire iframe is scaled proportionally to fit available width and height. On desktop the preview occupies the viewport below a small sticky offset; Preview notes scroll within a bounded area. Small screens have a jump-to-preview link. Tailwind styles never enter the artwork.
- The iframe has an empty sandbox (no scripts, same-origin access, forms, popups, or navigation permissions), no-referrer policy, and a content policy allowing only inline template styles and embedded images. Original PNG bytes are embedded so the sandbox needs no external image access. This adds a modest payload but keeps the preview self-contained.
- Buttons, inputs, and textareas follow shadcn/ui’s source-owned component approach. A native select styled consistently with them keeps keyboard and mobile behavior simple.

The two absent phone numbers render empty without their redundant line break, with a note outside the artwork. Logos are proportionally contained inside the supplied logo areas, preserving transparent or solid backgrounds without stretching or cropping.

### Deliberate limits

No authentication, persistence, approval flow, export, upload, or rich-text editing. Event date is display text, avoiding timezone conversion. Very long text can overlap in the supplied absolute-positioned artwork; content is neither silently truncated nor auto-shrunk. Missing values render empty and are identified in Preview notes.

For a future backend, persist configurations and drafts at the existing state boundary and enforce editing permissions on the server. At 500 locations, durable storage and server-side authorization would come before bulk workflows; the pure resolver and renderer can remain shared.

## Checks

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Focused Vitest tests cover discovery, all three rules, mappings, every supplied template/location combination, missing phone numbers, escaped text, fixed and invalid logos, and draft preservation.

Browser checks run against a production build on a dedicated port (3107), without reusing another running server:

```sh
npx playwright install chromium
npm run build
npm run test:e2e
```

On Linux, Playwright may require system libraries (`npx playwright install --with-deps chromium` on a machine where you can install OS packages). The browser suite checks the Corporate-to-Location flow, live updates, independent drafts, rule switching, both templates and all ten logos, missing phones, the sandbox, mobile width, and refresh reset.

### Manual review

- Enter local offer and event date text in Location view; switch locations and templates, then return.
- In Corporate, lock a text value, map another to a database field, and select a fixed logo. Verify Location reflects those decisions.
- Try Lakeshore and Ann Arbor for missing phones, and Lakeshore/Ann Arbor versus Downtown for tall and wide logos.
- Review both templates with your actual marketing copy, especially longer offers and disclaimers.
- Check keyboard navigation and the stacked mobile layout.

## Assessment source material

The assessment/ directory contains the original location data, HTML templates, and logo assets required to build the application. The assessment instructions and handout README are not included. No credentials or private keys are required to run the project.
