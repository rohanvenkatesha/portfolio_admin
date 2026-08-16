"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { restoreBackup, type ActionResult } from "@/lib/actions/backup";
import { cn } from "@/lib/utils";

/**
 * Snapshot and restore.
 *
 * Download is a plain link — a GET the browser saves, no client code involved.
 * Restore reads the file locally and hands the text to a Server Action, so the
 * file never becomes a multipart upload and there's nothing to clean up if it's
 * rejected.
 */
export function BackupPanel({ documentCount }: { documentCount: number }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  /** Holds the chosen file until it's confirmed — restore overwrites everything. */
  const [staged, setStaged] = useState<{ name: string; text: string } | null>(null);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setResult(null);
    setStaged({ name: file.name, text: await file.text() });
    // Cleared so picking the same file again still fires a change event.
    event.target.value = "";
  }

  function confirmRestore() {
    if (!staged) return;
    const text = staged.text;
    setStaged(null);
    setResult(null);
    startTransition(async () => {
      const outcome = await restoreBackup(text);
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-panel p-6">
      <h2 className="text-sm font-semibold text-white">Backup</h2>
      <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-zinc-600">
        Downloads all {documentCount} content documents as one JSON file. Worth taking before a big
        edit — it&apos;s the only thing that covers a bad bulk save, not just a deletion.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a
          href="/api/admin/backup"
          className="ember-fill inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-[var(--brand-ink)] hover:ember-fill-hot"
        >
          <Download className="h-3.5 w-3.5" />
          Download backup
        </a>

        <button
          type="button"
          disabled={pending}
          onClick={() => fileInput.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3.5 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Restore from file
        </button>

        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={onPick}
          className="hidden"
        />
      </div>

      {/* Confirmation. A restore replaces live content, so it never happens on
          the same click that chose the file. */}
      {staged ? (
        <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/[0.06] p-4">
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-amber-200">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Restoring <span className="font-mono">{staged.name}</span> replaces your projects,
              photos, films, trips, posts and every setting with whatever is in that file. Anything
              changed since it was taken is lost.
            </span>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmRestore}
              className="rounded-full border border-amber-500/50 px-4 py-2 text-[12px] font-semibold text-amber-200 transition-colors hover:bg-amber-500/10"
            >
              Replace everything
            </button>
            <button
              type="button"
              onClick={() => setStaged(null)}
              className="rounded-full border border-white/12 px-4 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {result ? (
        <p
          role="status"
          className={cn(
            "mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed",
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
  );
}
