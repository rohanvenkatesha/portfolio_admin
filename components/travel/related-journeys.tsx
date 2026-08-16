"use client";

import FlowingMenu from "@/components/vendor/reactbits/FlowingMenu";

export type RelatedJourney = { slug: string; destination: string; coverUrl?: string };

/**
 * Other trips, as rows that break into a scrolling marquee of the destination
 * and its cover the moment you point at one.
 *
 * A wrapper rather than direct use in the page: React Bits' FlowingMenu is a
 * client component, the page is a Server Component, and keeping our colours and
 * the href shape here means the vendored file stays untouched.
 */
export function RelatedJourneys({ items }: { items: RelatedJourney[] }) {
  if (items.length === 0) return null;

  return (
    // The component sizes its rows to the container, so the height is set here
    // rather than inside it — four rows at 7rem is a full screen on a laptop.
    <div className="h-[7rem] w-full" style={{ height: `${items.length * 7}rem` }}>
      <FlowingMenu
        items={items.map((item) => ({
          link: `/travel/${item.slug}`,
          text: item.destination,
          // Falls back to the site's own placeholder rather than an empty
          // string, which would render a broken image in the marquee.
          image: item.coverUrl || "/media/trips/gallery-1.jpg",
        }))}
        textColor="#ffffff"
        bgColor="transparent"
        marqueeBgColor="var(--brand)"
        marqueeTextColor="#0a0a0c"
        borderColor="rgba(255,255,255,0.1)"
      />
    </div>
  );
}
