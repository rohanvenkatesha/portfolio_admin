import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTripsFresh, isTripsSeeded } from "@/lib/content/trips";
import { TripList } from "@/components/admin/trip-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminTripsPage() {
  const [trips, seeded] = await Promise.all([getTripsFresh(), isTripsSeeded()]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-orange-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Overview
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Trips</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {seeded
            ? "Served from Firestore. Each trip gets its own /travel/[slug] page."
            : "Currently showing repo placeholders. Seed to start editing."}
        </p>
      </div>

      <TripList trips={trips} seeded={seeded} />
    </div>
  );
}
