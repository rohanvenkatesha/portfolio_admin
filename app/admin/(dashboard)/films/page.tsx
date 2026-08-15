import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getFilmsFresh, isFilmsSeeded } from "@/lib/content/films";
import { FilmList } from "@/components/admin/film-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFilmsPage() {
  const [films, seeded] = await Promise.all([getFilmsFresh(), isFilmsSeeded()]);

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
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Films</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {seeded
            ? "Served from Firestore. Add a video link to activate the player."
            : "Currently showing repo placeholders. Seed to start editing."}
        </p>
      </div>

      <FilmList films={films} seeded={seeded} />
    </div>
  );
}
