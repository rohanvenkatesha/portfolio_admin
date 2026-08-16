# Trip covers

Drop trip photos here, commit them, then pick one per trip in
**Admin → Trips → (a trip) → Cover photo**.

The cover appears in three places:

- the archive card on `/travel` (4:3)
- the preview that trails your cursor on the home page (4:3)
- the hero plate at the top of the guide (wide)

A **4:3 landscape** crop suits all three; each is cover-cropped from the centre.
Around 1600×1200 is plenty — `next/image` generates the smaller sizes.

Every one of those places keeps a dark scrim over the photo so the title stays
readable, so a busy or bright shot still works.

Leave a trip without a cover and all three fall back to its `gradient` — nothing
breaks, it just renders the colour treatment it had before.
