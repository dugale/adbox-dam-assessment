import { getDefinition } from "./variable-definitions";
import type { Resolution } from "./types";
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
export function renderTemplate(
  html: string,
  resolution: Resolution,
  logoSources: Record<string, string>,
): string {
  // Remove only the preceding redundant break for an empty final contact line.
  const prepared = html.replace(/<br\s*\/?>(\s*)\{phone\}/gi, (match) =>
    resolution.values.phone?.value.trim() ? match : "{phone}",
  );
  const body = prepared.replace(
    /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
    (_token, key: string) => {
      const resolved = resolution.values[key];
      if (!resolved) return "";
      if (resolved.type === "text") {
        const escaped = escapeHtml(resolved.value);
        return getDefinition(key).multiline
          ? escaped.replace(/\r\n|\r|\n/g, "<br>")
          : escaped;
      }
      const source = Object.hasOwn(logoSources, resolved.value)
        ? logoSources[resolved.value]
        : "";
      // Only server-loaded original PNGs can produce markup; no input URLs or HTML.
      if (!source || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(source))
        return "";
      return `<img src="${source}" alt="Location logo" style="display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;" />`;
    },
  );
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-src 'none'"><style>html,body{margin:0;padding:0;background:white;}body{overflow:hidden}.logo-area{overflow:hidden}.asset p,.asset strong,.asset div{overflow-wrap:break-word}</style></head><body>${body}</body></html>`;
}
