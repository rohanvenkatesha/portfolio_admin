"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { getFirebaseStorage } from "@/lib/firebase/client";
import { addPhoto, type ActionResult } from "@/lib/actions/photos";
import { cn } from "@/lib/utils";

const MAX_BYTES = 20 * 1024 * 1024;

/** Read EXIF-ish hints the browser already knows, to prefill the form. */
function baseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export function PhotoUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [dragging, setDragging] = useState(false);

  function choose(next: File | null) {
    setResult(null);

    if (!next) return;
    if (!next.type.startsWith("image/")) {
      setResult({ ok: false, error: "That file isn't an image." });
      return;
    }
    if (next.size > MAX_BYTES) {
      setResult({
        ok: false,
        error: `That file is ${(next.size / 1024 / 1024).toFixed(1)}MB. The limit is 20MB — export a web-sized version.`,
      });
      return;
    }

    setFile(next);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(next);
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setResult({ ok: false, error: "Choose an image first." });
      return;
    }

    const formData = new FormData(event.currentTarget);
    setResult(null);
    setProgress(0);

    try {
      /**
       * Upload browser → Storage directly. Server Actions cap request bodies
       * well below photo size, and streaming megabytes through the Next server
       * would buy nothing — storage.rules enforces that only an admin can write.
       */
      const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage");
      const storage = await getFirebaseStorage();

      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
      const path = `media/photos/${Date.now()}-${safeName}`;
      const task = uploadBytesResumable(ref(storage, path), file, {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
      });

      const url = await new Promise<string>((resolve, reject) => {
        task.on(
          "state_changed",
          (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          async () => resolve(await getDownloadURL(task.snapshot.ref))
        );
      });

      formData.set("src", url);

      startTransition(async () => {
        const outcome = await addPhoto(formData);
        setResult(outcome);
        setProgress(null);

        if (outcome.ok) {
          setFile(null);
          setPreview((old) => {
            if (old) URL.revokeObjectURL(old);
            return null;
          });
          inputRef.current?.form?.reset();
          router.refresh();
        }
      });
    } catch (error) {
      const code = (error as { code?: string })?.code ?? "";
      console.error("[photo upload]", code, error);
      setProgress(null);

      setResult({
        ok: false,
        error:
          code === "storage/unauthorized"
            ? "Storage rejected the upload. Deploy storage.rules with: firebase deploy --only storage"
            : code === "storage/unknown"
              ? "Storage isn't set up on this project yet. Open Storage in the Firebase console and click Get started."
              : "Upload failed. The browser console has the details.",
      });
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-panel-2 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20";

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/8 bg-panel p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        <ImagePlus className="h-4 w-4 text-orange-500" />
        Add a frame
      </h2>

      {/* Drop zone */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          choose(e.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-orange-500 bg-orange-500/10"
            : "border-white/15 bg-panel-2 hover:border-white/30"
        )}
      >
        <input
          suppressHydrationWarning
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => choose(e.target.files?.[0] ?? null)}
        />

        {preview ? (
          // Local object URL preview — next/image would need a remote host.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="max-h-44 rounded-lg object-contain" />
        ) : (
          <>
            <UploadCloud className="h-7 w-7 text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-300">
              Drop an image, or click to choose
            </p>
            <p className="mt-1 text-[11px] text-zinc-600">JPEG, PNG or WebP · up to 20MB</p>
          </>
        )}
      </label>

      {file ? (
        <p className="mt-2 truncate font-mono text-[11px] text-zinc-500">
          {file.name} · {(file.size / 1024 / 1024).toFixed(1)}MB
        </p>
      ) : null}

      {/* Metadata */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input
          suppressHydrationWarning
          name="title"
          placeholder="Title"
          defaultValue={file ? baseName(file.name) : ""}
          key={file?.name /* refresh the default when a new file is picked */}
          className={inputClass}
        />
        <input suppressHydrationWarning name="location" placeholder="Location" className={inputClass} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <input suppressHydrationWarning name="camera" placeholder="Camera" className={inputClass} />
        <input suppressHydrationWarning name="lens" placeholder="Lens" className={inputClass} />
        <select suppressHydrationWarning name="span" defaultValue="square" className={inputClass}>
          <option value="square" className="bg-panel-2">square</option>
          <option value="tall" className="bg-panel-2">tall</option>
          <option value="wide" className="bg-panel-2">wide</option>
        </select>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <input suppressHydrationWarning name="iso" placeholder="ISO" className={inputClass} />
        <input suppressHydrationWarning name="aperture" placeholder="f/2.8" className={inputClass} />
        <input suppressHydrationWarning name="shutter" placeholder="1/250" className={inputClass} />
        <input suppressHydrationWarning name="focal" placeholder="35mm" className={inputClass} />
      </div>

      {/* Progress */}
      {progress !== null ? (
        <div className="mt-5">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-orange-500 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-zinc-500">Uploading… {progress}%</p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || progress !== null || !file}
          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-orange-400 disabled:opacity-50"
        >
          {pending || progress !== null ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UploadCloud className="h-3.5 w-3.5" />
          )}
          Upload
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
