import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCopyFresh } from "@/lib/content/copy";
import { CopyEditor } from "@/components/admin/copy-editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminCopyPage() {
  const copy = await getCopyFresh();

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

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Section copy
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          The eyebrow, headline and description above every section. Headlines are two lines — the
          second is set in the accent colour, which is why it&apos;s a separate field. The preview
          above each row shows how the halves read together.
        </p>
      </div>

      <CopyEditor initial={copy} />
    </div>
  );
}
