# Trip photos

**One folder per trip, named exactly after the trip's slug.**

```
public/media/trips/
  western-ghats/      <- slug of the trip
    cover.jpg
    day-one.jpg
  manali-leh/
    ...
```

The slug is the one in **Admin → Trips → (a trip) → Slug**, and it is the same
string as the trip's URL: `/travel/western-ghats` reads
`public/media/trips/western-ghats/`.

Create the folder, drop the photos in, commit. The admin lists that folder and
nothing else, so while you are writing about a trip you only ever see its own
photos. A trip with no folder yet simply shows an empty picker naming the folder
to create — that is the normal state for a new trip, not an error.

This folder feeds both the trip's cover and every image inside its posts: one
place to drop photos for a journey rather than two.

## Loose files in this directory

The `gallery-*.jpg` files sitting here predate the per-trip folders. Anything
already pointing at them keeps working — stored paths are untouched and still
render — but they no longer appear in any picker. Move them into the relevant
trip's folder when you get to it; the post that references one will need
re-picking afterwards, since its stored path changes.

## Sizes

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
