"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  NotebookPen,
  Plus,
  Trash2,
} from "lucide-react";
import {
  createPost,
  deletePost,
  togglePostPublished,
  type ActionResult,
} from "@/lib/actions/posts";
import type { TripPost } from "@/content/posts";
import { cn } from "@/lib/utils";

/**
 * Posts belonging to one trip, shown on that trip's admin page.
 *
 * Publishing is a one-click toggle here rather than something you have to open
 * the editor for — flipping a finished draft live is the most common action and
 * shouldn't cost a page load.
 */
export function PostList({ tripId, posts }: { tripId: string; posts: TripPost[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>) {
    setResult(null);
    startTransition(async () => {
      const outcome = await action();
      setResult(outcome);
      if (outcome.ok) router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-white/8 bg-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <NotebookPen className="h-4 w-4 text-brand-500" />
          Blog posts
          <span className="font-mono text-[11px] font-normal text-zinc-600">({posts.length})</span>
        </h2>

        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => createPost(tripId))}
          className="ember-fill inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold text-[var(--brand-ink)] hover:ember-fill-hot disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          New post
        </button>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
        Each post gets its own page with a route map, galleries, stats, riders and video. Drafts
        stay off the site entirely.
      </p>

      <div className="mt-5 space-y-2">
        {posts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 bg-panel-2 px-4 py-8 text-center text-[12px] text-zinc-600">
            No posts yet. &ldquo;New post&rdquo; creates a draft you can fill in.
          </p>
        ) : null}

        {posts.map((post) => (
          <div
            key={post.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-white/8 bg-panel-2 p-3.5"
          >
            <span
              title={post.published ? "Published" : "Draft"}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                post.published ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-zinc-600"
              )}
            >
              {post.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </span>

            <Link
              href={`/admin/trips/${tripId}/posts/${post.id}`}
              className="min-w-0 flex-1 transition-colors hover:text-brand-400"
            >
              <span className="block truncate text-[13px] font-medium text-white">{post.title}</span>
              <span className="mt-0.5 block truncate font-mono text-[10px] text-zinc-600">
                {post.date || "no date"} · {post.blocks.length} blocks
                {post.route.length ? ` · ${post.route.length} stops` : ""}
              </span>
            </Link>

            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => togglePostPublished(post.id))}
              className="rounded-full border border-white/12 px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
            >
              {post.published ? "Unpublish" : "Publish"}
            </button>

            {confirming === post.id ? (
              <span className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setConfirming(null);
                    run(() => deletePost(post.id));
                  }}
                  className="rounded-full border border-red-500/50 px-3 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:bg-red-500/10"
                >
                  Move to trash
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  className="rounded-full border border-white/12 px-3 py-1.5 text-[11px] text-zinc-400"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                aria-label={`Delete ${post.title}`}
                onClick={() => setConfirming(post.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 text-zinc-500 transition-colors hover:border-red-500/50 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

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
    </section>
  );
}
