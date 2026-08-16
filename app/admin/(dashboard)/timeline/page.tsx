import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTimelineFresh } from "@/lib/content/timeline";
import { TimelineEditor } from "@/components/admin/timeline-editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminTimelinePage() {
  const timeline = await getTimelineFresh();

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

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">Journey</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Your career and creative timeline. Each entry sits on one of two tracks, and the section
          offers Technical, Blended and Creative views over them — Blended sorts everything by year,
          which is why every period needs one in it.
        </p>
      </div>

      <TimelineEditor initial={timeline} />
    </div>
  );
}
