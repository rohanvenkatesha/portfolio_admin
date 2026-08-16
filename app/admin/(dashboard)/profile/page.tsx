import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProfileFresh } from "@/lib/content/profile";
import { listMedia } from "@/lib/content/media";
import { ProfileForm } from "@/components/admin/profile-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const [profile, portraits] = await Promise.all([getProfileFresh(), listMedia("portrait")]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Overview
        </Link>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">Profile</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Your name, bio, contact details, portrait and links. These appear across the hero, the
          footer, the contact panel and the page metadata, so a change here shows up everywhere at
          once.
        </p>
      </div>

      <ProfileForm initial={profile} portraits={portraits} />
    </div>
  );
}
