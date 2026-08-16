import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTrashedTrips, getAllTripsRaw } from "@/lib/content/trips";
import { getTrashedPosts } from "@/lib/content/posts";
import { TrashPanel, type TrashEntry } from "@/components/admin/trash-panel";
import { Eyebrow } from "@/components/admin/admin-ui";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminTrashPage() {
  const [trips, posts, allTrips] = await Promise.all([
    getTrashedTrips(),
    getTrashedPosts(),
    // Posts name their trip by id; the whole set is needed because a post's
    // trip may be in the trash alongside it.
    getAllTripsRaw(),
  ]);

  const tripName = new Map(allTrips.map((trip) => [trip.id, trip.destination]));

  const entries: TrashEntry[] = [
    ...trips.map(
      (trip): TrashEntry => ({
        id: trip.id,
        kind: "trip",
        title: trip.destination,
        detail: trip.region || "no region",
        deletedAt: trip.deletedAt ?? "",
      })
    ),
    ...posts.map(
      (post): TrashEntry => ({
        id: post.id,
        kind: "post",
        title: post.title,
        detail: tripName.get(post.tripId) ?? "orphaned",
        deletedAt: post.deletedAt ?? "",
      })
    ),
    // Newest first across both kinds, so the thing just deleted is at the top.
  ].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-brand-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Overview
      </Link>

      <div>
        <Eyebrow>Safety</Eyebrow>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Trash
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Deleted trips and posts wait here. They&apos;re off the live site immediately, but nothing
          is really gone until you delete it from this page.
        </p>
      </div>

      <TrashPanel entries={entries} />
    </div>
  );
}
