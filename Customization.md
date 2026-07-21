# Customization Guide

This project was structured so the most common tweaks — adding filters, adjusting gesture feel, or restyling the glass — don't require touching the core tracking/gesture logic.

## Adding or editing glass filters

All filter presets live in the `FILTERS` array near the top of `script.js`:

```js
const FILTERS = [
  {
    name: 'Lapis',
    grad1: 'rgba(30, 70, 160, 0.55)',
    grad2: 'rgba(20, 50, 130, 0.62)',
    grad3: 'rgba(15, 40, 110, 0.58)',
    blur: 14,
    saturate: 150,
    glowColor: 'rgba(80, 140, 255, 0.18)',
    glowSize: 30,
    glowAlpha: 0.28,
    edge: 'rgba(255,255,255,0.28)',
    grain: 0.10,
    radius: 22
  },
  // ...
];
```

To add a new filter, append a new object with the same shape — no other code needs to change. The render pipeline (`styleLayer()` / `applyFilter()`) reads every field generically.

| Field | Meaning |
|---|---|
| `name` | Display name shown in the filter label |
| `grad1` / `grad2` / `grad3` | Three-stop diagonal gradient background (rgba) |
| `blur` | `backdrop-filter` blur radius, in px |
| `saturate` | `backdrop-filter` saturation, in % |
| `glowColor` | Inner glow color (used in the box-shadow inset glow) |
| `glowSize` | Inner glow spread, in px |
| `glowAlpha` | Opacity of the soft top-left highlight gradient |
| `edge` | Border color (the thin outer edge of the glass) |
| `grain` | Opacity of the film-grain overlay |
| `radius` | Corner radius, in px |

Filters cycle in array order — to reorder the swipe cycle, reorder the array.

## Adjusting gesture sensitivity

Key constants, all defined near the top of `script.js`:

```js
const PINCH_MAX = 140;           // px — max thumb-to-index distance still counted as "pinching"
const SWIPE_THRESHOLD_PX = 90;   // px — minimum horizontal travel to register a swipe
const SWIPE_MAX_TIME_MS = 600;   // ms — swipe must complete within this window
const FILTER_COOLDOWN_MS = 400;  // ms — minimum time between filter changes
const SMOOTH = 0.22;             // lerp factor for position/rotation (higher = snappier)
const SIZE_SMOOTH = 0.18;        // lerp factor for width/height (higher = snappier)
```

Guidance:

- **`PINCH_MAX`** — increase if pinches aren't being detected reliably (e.g. lower-resolution camera); decrease if the gesture triggers too easily.
- **`SWIPE_THRESHOLD_PX` / `SWIPE_MAX_TIME_MS`** — increase the threshold or decrease the time window to require a more deliberate, faster swipe.
- **`FILTER_COOLDOWN_MS`** — increase if filters change too rapidly during a single swipe.
- **`SMOOTH` / `SIZE_SMOOTH`** — values closer to `1` make the rectangle track hands almost instantly (more jittery); values closer to `0` make it feel heavier/laggier but smoother.

Rectangle size limits are controlled separately:

```js
const SIZE_LIMITS = {
  minW: 90, maxWRatio: 0.85,
  minH: 70, maxHRatio: 0.7
};
```

`maxWRatio` / `maxHRatio` are fractions of the camera canvas's width/height, so the rectangle's maximum size scales with camera resolution automatically.

## Restyling the glass panel

Visual theming is split cleanly between `style.css` and the per-filter values in `script.js`:

- **Per-filter values** (colors, blur, grain, glow) — edit `FILTERS` in `script.js` as described above.
- **Structural styling** (shadows, border radius fallback, layout, transitions) — edit the `.glassCore`, `.glassCore::before`, `.glassCore::after`, and `.grainLayer` rules in `style.css`.

The glass panel uses two stacked layers (`#glassCoreA` / `#glassCoreB`) that crossfade opacity when the filter changes — this is what makes filter transitions smooth even though the underlying CSS custom properties (`--f-*`) don't animate on their own. If you need a different transition style, adjust the `.glassCore` `transition` and `.glassCore.active` rules.

## Resizing the camera stage

The `#stage` element in `style.css` controls the visible camera viewport:

```css
#stage {
  width: 100%;
  max-width: 820px;
  min-height: 400px;
  aspect-ratio: 4 / 3;
  ...
}
```

Adjust `max-width` and `aspect-ratio` to change the stage's footprint. The internal camera resolution requested from `getUserMedia` (in `setupCamera()` in `script.js`) is independent of this display size and can be adjusted separately if needed.

## Extending gestures

The two gesture handlers — `handleTwoHandFrameGesture()` and `handleSingleHandSwipeGesture()` in `script.js` — are self-contained functions called once per frame from `processResults()`. New gestures can be added as additional handler functions and wired into `processResults()`'s branching on `results.landmarks.length` without needing to modify the existing two.
