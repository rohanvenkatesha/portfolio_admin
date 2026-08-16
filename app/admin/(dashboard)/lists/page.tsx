import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getListsFresh } from "@/lib/content/lists";
import { ListsEditor } from "@/components/admin/lists-editor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminListsPage() {
  const lists = await getListsFresh();

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
          Services, numbers, principles &amp; skills
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          The four card lists behind the Services and About sections. The headings above those
          sections live under{" "}
          <Link
            href="/admin/headings"
            className="text-brand-400 transition-colors hover:text-brand-300"
          >
            Headings &amp; intros
          </Link>
          , and your bio is under{" "}
          <Link
            href="/admin/profile"
            className="text-brand-400 transition-colors hover:text-brand-300"
          >
            Profile
          </Link>
          .
        </p>
      </div>

      <ListsEditor initial={lists} />
    </div>
  );
}
