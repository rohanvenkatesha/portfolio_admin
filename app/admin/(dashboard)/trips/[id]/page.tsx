import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getTripsFresh } from "@/lib/content/trips";
import { listMedia } from "@/lib/content/media";
import { TripForm } from "@/components/admin/trip-form";
import { PostList } from "@/components/admin/post-list";
import { getPostsFresh } from "@/lib/content/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditTripPage({ params }: PageProps<"/admin/trips/[id]">) {
  const { id } = await params;
  const [trips, covers, allPosts] = await Promise.all([
    getTripsFresh(),
    listMedia("trips"),
    getPostsFresh(),
  ]);
  const trip = trips.find((t) => t.id === id);
  const posts = allPosts.filter((p) => p.tripId === id);

  if (!trip) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/trips"
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-brand-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All trips
        </Link>

        <Link
          href={`/travel/${trip.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-brand-400"
        >
          View live page
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {trip.destination}
        </h1>
        <p className="mt-2 font-mono text-[12px] text-zinc-600">{trip.id}</p>
      </div>

      <PostList tripId={trip.id} posts={posts} />

      <TripForm trip={trip} covers={covers} />
    </div>
  );
}
