import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getTripsFresh } from "@/lib/content/trips";
import { getPostsFresh } from "@/lib/content/posts";
import { listMedia } from "@/lib/content/media";
import { PostEditor } from "@/components/admin/post-editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: PageProps<"/admin/trips/[id]/posts/[postId]">) {
  const { id, postId } = await params;

  const [trips, posts, media] = await Promise.all([
    getTripsFresh(),
    getPostsFresh(),
    // Trip covers and post imagery share a folder — one place to drop photos
    // for a journey rather than two.
    listMedia("trips"),
  ]);

  const trip = trips.find((t) => t.id === id);
  const post = posts.find((p) => p.id === postId);
  if (!trip || !post) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/admin/trips/${trip.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-brand-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {trip.destination}
        </Link>

        {post.published ? (
          <Link
            href={`/travel/${trip.slug}/${post.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-brand-400"
          >
            View live page
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="font-mono text-[11px] text-zinc-600">
            Draft — not reachable on the site
          </span>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{post.title}</h1>
        <p className="mt-2 font-mono text-[12px] text-zinc-600">{post.id}</p>
      </div>

      <PostEditor post={post} trip={trip} trips={trips} media={media} />
    </div>
  );
}
