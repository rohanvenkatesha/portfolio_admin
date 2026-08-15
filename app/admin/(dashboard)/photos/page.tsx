import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPhotosFresh, isPhotosSeeded } from "@/lib/content/photos";
import { listMedia } from "@/lib/content/media";
import { PhotoUploader } from "@/components/admin/photo-uploader";
import { PhotoList } from "@/components/admin/photo-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const [photos, seeded, files] = await Promise.all([
    getPhotosFresh(),
    isPhotosSeeded(),
    listMedia("photos"),
  ]);

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
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Darkroom</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {seeded
            ? "Served from Firestore. Images come from public/media/photos in the repo."
            : "Currently showing repo placeholders. Seed the gallery to start uploading."}
        </p>
      </div>

      {seeded ? <PhotoUploader files={files} /> : null}

      <PhotoList photos={photos} seeded={seeded} />
    </div>
  );
}
