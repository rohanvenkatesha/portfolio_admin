"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Plus } from "lucide-react";
import { addPhoto, type ActionResult } from "@/lib/actions/photos";
import { ImagePicker } from "@/components/admin/image-picker";
import type { MediaFile } from "@/lib/content/media";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-panel-2 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20";

/**
 * Add a frame to the gallery.
 *
 * Images live in the repo under public/media/photos, so this picks one that is
 * already committed and attaches the caption and EXIF. Committing a batch of
 * images is the only step that needs git — assigning them doesn't.
 */
export function PhotoUploader({ files }: { files: MediaFile[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  /** Bumped after a successful add, to reset the picker and every input. */
  const [formKey, setFormKey] = useState(0);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setResult(null);

    startTransition(async () => {
      const outcome = await addPhoto(formData);
      setResult(outcome);
      if (outcome.ok) {
        setFormKey((k) => k + 1);
        router.refresh();
      }
    });
  }

  return (
    <form
      key={formKey}
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/8 bg-panel p-6"
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        <ImagePlus className="h-4 w-4 text-brand-500" />
        Add a frame
      </h2>

      <div className="mt-4">
        <ImagePicker
          name="src"
          folder="photos"
          files={files}
          label="Image"
          hint="Committed under public/media/photos"
        />
      </div>

      {/* Metadata */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input suppressHydrationWarning name="title" placeholder="Title" className={inputClass} />
        <input
          suppressHydrationWarning
          name="location"
          placeholder="Location"
          className={inputClass}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <input suppressHydrationWarning name="camera" placeholder="Camera" className={inputClass} />
        <input suppressHydrationWarning name="lens" placeholder="Lens" className={inputClass} />
        <select suppressHydrationWarning name="span" defaultValue="square" className={inputClass}>
          <option value="square" className="bg-panel-2">
            square
          </option>
          <option value="tall" className="bg-panel-2">
            tall
          </option>
          <option value="wide" className="bg-panel-2">
            wide
          </option>
        </select>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <input suppressHydrationWarning name="iso" placeholder="ISO" className={inputClass} />
        <input suppressHydrationWarning name="aperture" placeholder="f/2.8" className={inputClass} />
        <input suppressHydrationWarning name="shutter" placeholder="1/250" className={inputClass} />
        <input suppressHydrationWarning name="focal" placeholder="35mm" className={inputClass} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || files.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-brand-400 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Add to gallery
        </button>

        {result ? (
          <p
            role="status"
            className={cn(
              "flex items-start gap-2 text-[12.5px] leading-relaxed",
              result.ok ? "text-emerald-300" : "text-red-300"
            )}
          >
            {result.ok ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            {result.ok ? result.message : result.error}
          </p>
        ) : null}
      </div>
    </form>
  );
}
