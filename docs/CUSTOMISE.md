# Branding it for a specific school

Walking into a pilot meeting with the school's own name and colours already in
the app changes how the conversation goes. It takes about an hour.

---

## The school's details

Everything about the demo school lives in one place:
`src/lib/data/seed.ts`, in the `SCHOOL` object near the top.

```ts
export const SCHOOL: School = {
  name: 'Thamizh Nilam Matriculation Higher Secondary School',
  name_ta: 'தமிழ் நிலம் மெட்ரிகுலேஷன் மேல்நிலைப் பள்ளி',
  board: 'matriculation',        // or 'cbse'
  city: 'Coimbatore',
  phone: '0422 246 8800',
  address: '14, Trichy Road, Ramanathapuram, Coimbatore — 641045',
  academic_year: '2026–2027',
  udise_code: '33091200000',
  logo_text: 'TN',               // two letters, shown in the app icon block
  ...
}
```

Change those and the name flows through the sidebar, the sign-in screen, the
report card letterhead and the fee receipt.

For a **deployed** demo you can override the two most visible fields without
touching code, via environment variables in Vercel:

```bash
NEXT_PUBLIC_SCHOOL_NAME=St. Joseph's Matriculation School
NEXT_PUBLIC_SCHOOL_CITY=Madurai
```

Useful when you want two demo links for two different prospects off one repo.

---

## Colours

The design system is token-based, so the whole app re-skins from one block in
`src/app/globals.css`.

Colours are stored as **space-separated RGB channels**, not hex — that is what
lets Tailwind compose opacity (`bg-forest/40`). Convert the school's colour to
RGB before pasting it in.

```css
:root {
  --forest: 26 60 43;      /* primary — sidebar, buttons, letterhead */
  --forest-2: 42 98 68;    /* hover state, a shade lighter */
  --forest-dim: 231 239 233; /* tinted background for active nav, badges */
  ...
}
```

A maroon school, for example:

```css
--forest: 122 31 42;
--forest-2: 152 48 60;
--forest-dim: 245 232 234;
```

Change the same three under `.dark` (lighter versions — dark backgrounds need
brighter accents to stay legible), and update `theme_color` in
`public/manifest.webmanifest` so the phone's status bar matches.

> Check contrast after changing. Body text sits on `--paper`; the primary is
> used for white text on a filled button. Anything below 4.5:1 will be hard to
> read on a phone in a sunlit corridor, which is exactly where teachers use it.

---

## The app icon

`public/icons/` holds the generated icons. Replace all four with the school's
crest at the same sizes:

- `icon-192.png` — 192×192
- `icon-512.png` — 512×512
- `icon-maskable-512.png` — 512×512, with the crest inside the middle 80% so
  Android's shape mask doesn't crop it
- `apple-touch-icon.png` — 180×180

Also update `name` and `short_name` in `public/manifest.webmanifest` — that is
what shows under the icon on the home screen.

---

## Language

The full EN/தமிழ் dictionary is `src/lib/i18n/dictionary.ts`. Every string is a
key with both translations:

```ts
'att.markAllPresent': { en: 'Mark all present', ta: 'அனைவரும் வருகை' },
```

Adjust wording to match the school's own vocabulary. Terminology varies:
some schools say **Headmaster** rather than Principal, and CBSE schools use
**Std** where matriculation schools say **Class**. Getting this right is a small
detail that signals you know the sector.

To add a third language, add the code to `Locale` and `LOCALES`, then add that
key to every entry — TypeScript will list every string you missed.

---

## Demo data scale

If the school has 1,200 students, a 521-student demo undersells it. In
`src/lib/data/seed.ts`:

```ts
const strength = sec.standard <= 10 ? between(19, 26) : between(14, 20)
```

Raise those numbers, or add sections `C` and `D`:

```ts
const sections = std <= 10 ? ['A', 'B', 'C'] : ['A', 'B']
```

Fee amounts are in `termFeeFor()` — set them to the school's actual fee bands so
the collection figures on the dashboard look plausible to someone who knows
them. A principal who sees a fee number that couldn't be their school stops
believing the rest of the screen.

The data is deterministic, so once you change these, run it once and check the
dashboard reads sensibly before the meeting.

---

## Removing the demo badge

The amber **DEMO DATA** badge in the sidebar appears whenever
`NEXT_PUBLIC_DATA_MODE=demo`. Leave it on for demos — it is honest, and no
principal minds sample data as long as you say so. It disappears on its own in
Supabase mode.

---

## Before the meeting

- [ ] School name, city and address updated
- [ ] `logo_text` set to the school's initials
- [ ] Primary colour matched to the school crest, contrast checked
- [ ] Icons replaced, manifest name updated
- [ ] Fee amounts match the school's real bands
- [ ] Student count in the right range
- [ ] Deployed, and installed to your phone's home screen
- [ ] Opened once in Tamil to check nothing overflows
