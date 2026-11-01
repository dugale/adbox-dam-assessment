"use client";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Eye, ShieldCheck } from "lucide-react";
import type { Asset, Resolution } from "@/lib/dam/types";
import { getDefinition } from "@/lib/dam/variable-definitions";

export function AssetPreview({
  asset,
  document,
  resolution,
  locationName,
}: {
  asset: Asset;
  document: string;
  resolution: Resolution;
  locationName: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const scale = Math.min(
    (size.width || 600) / asset.width,
    (size.height || 400) / asset.height,
    1,
  );
  return (
    <section
      id="asset-preview"
      tabIndex={-1}
      aria-labelledby="preview-heading"
      className="flex scroll-mt-5 flex-col overflow-hidden rounded-xl border bg-white shadow-xs lg:sticky lg:top-5 lg:h-[calc(100dvh-2.5rem)]"
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2
            id="preview-heading"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <Eye className="size-4 text-muted-foreground" aria-hidden="true" />
            Live preview
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{locationName}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-800">
          <span className="size-1.5 rounded-full bg-teal-600" />
          Updates as you type
        </span>
      </div>
      <div className="preview-grid h-[55dvh] shrink-0 p-4 sm:p-5 lg:h-auto lg:min-h-0 lg:flex-1 lg:shrink">
        <div
          ref={container}
          className="flex h-full w-full items-center justify-center"
        >
          <div
            className="relative mx-auto overflow-hidden bg-white shadow-lg"
            style={{ width: asset.width * scale, height: asset.height * scale }}
          >
            <iframe
              title={`${asset.name} preview`}
              srcDoc={document}
              sandbox=""
              referrerPolicy="no-referrer"
              width={asset.width}
              height={asset.height}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                border: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2 border-t px-5 py-3 text-[11px] text-muted-foreground">
        <span>
          {asset.width} × {asset.height} px · {asset.category}
        </span>
        <span>{Math.round(scale * 100)}% · Fit to view</span>
      </div>
      {resolution.issues.length > 0 && (
        <div className="max-h-32 shrink-0 overflow-y-auto border-t bg-amber-50/50 px-5 py-3">
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-900">
            <AlertCircle className="size-4" aria-hidden="true" />
            Preview notes
          </h3>
          <ul
            className="space-y-1.5 text-xs leading-relaxed text-amber-900"
            aria-label="Preview notes"
          >
            {resolution.issues.map((issue) => (
              <li key={`${issue.key}-${issue.message}`}>
                <span className="font-medium">
                  {getDefinition(issue.key).label}:
                </span>{" "}
                {issue.message.substring(issue.message.indexOf(":") + 1).trim()}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="flex shrink-0 items-center gap-1.5 border-t px-5 py-3 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
        Original template · Corporate rules applied
      </p>
    </section>
  );
}
