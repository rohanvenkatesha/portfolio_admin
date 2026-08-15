"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, FolderOpen, ImageOff, X } from "lucide-react";
import type { MediaFile } from "@/lib/content/media";
import { cn } from "@/lib/utils";

/**
 * Choose an image from the ones committed under public/media.
 *
 * There's no upload here by design — images live in git, so adding one is a
 * commit. This lets you assign any already-committed image without another.
 * The selection is written to a hidden input so the surrounding form submits
 * it as ordinary FormData.
 */
export function ImagePicker({
  name,
  folder,
  files,
  initialSrc = "",
  label = "Image",
  hint,
}: {
  name: string;
  /** Folder these came from, shown in the empty state. */
  folder: string;
  files: MediaFile[];
  initialSrc?: string;
  label?: string;
  hint?: string;
}) {
  const [src, setSrc] = useState(initialSrc);

  return (
    <div>
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[12px] font-medium text-zinc-300">{label}</span>
        {hint ? <span className="text-[11px] text-zinc-600">{hint}</span> : null}
      </span>

      {/* The value the form actually submits */}
      <input type="hidden" name={name} value={src} />

      {files.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-panel-2 px-6 py-9 text-center">
          <ImageOff className="mx-auto h-6 w-6 text-zinc-600" />
          <p className="mt-3 text-[13px] font-medium text-zinc-300">No images committed yet</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-600">
            Drop files into{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
              public/media/{folder}/
            </code>{" "}
            and commit. They&apos;ll appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Current selection */}
          {src ? (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/[0.06] p-3">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg">
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-400">
                {src}
              </span>
              <button
                type="button"
                onClick={() => setSrc("")}
                aria-label="Clear selection"
                className="rounded-full border border-white/12 p-1.5 text-zinc-500 transition-colors hover:border-red-500/50 hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          {/* Grid */}
          <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto rounded-xl border border-white/10 bg-panel-2 p-2 sm:grid-cols-4">
            {files.map((file) => {
              const selected = file.src === src;
              return (
                <button
                  key={file.src}
                  type="button"
                  onClick={() => setSrc(selected ? "" : file.src)}
                  aria-pressed={selected}
                  title={file.name}
                  className={cn(
                    "group relative aspect-[4/3] overflow-hidden rounded-lg border transition-all",
                    selected
                      ? "border-brand-500 ring-2 ring-brand-500/30"
                      : "border-white/10 hover:border-white/30"
                  )}
                >
                  <Image
                    src={file.src}
                    alt={file.name}
                    fill
                    sizes="200px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {selected ? (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  ) : null}

                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent px-2 py-1 text-left text-[9px] text-white/80">
                    {file.name}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-600">
            <FolderOpen className="h-3 w-3" />
            {files.length} in public/media/{folder}/
          </p>
        </>
      )}
    </div>
  );
}
