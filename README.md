# Glass Gesture Engine Lite

A browser-based, camera-driven "liquid glass" panel that you summon and shape with your bare hands — no mouse, no touch, no controllers. Frame a rectangle between both hands to conjure a frosted-glass surface, then pinch-swipe with one hand to cycle through a set of tinted glass filters.

Built on [MediaPipe Hand Landmarker](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker) for real-time hand tracking, entirely client-side — nothing is uploaded, nothing is installed.

---

## Overview

Glass Gesture Engine Lite turns your webcam into a gesture surface. Hold up both hands, pinch thumb-to-index on each, and move them apart to "frame" a floating glass rectangle in space. The rectangle tracks your hands' position, rotation, and size in real time, rendered as a soft, blurred, frosted glass panel with a subtle animated grain texture and inner glow.

Swipe with a single pinching hand to cycle through five glass tints (Lapis, Emerald, Rose Quartz, Smoke, Amber), each with its own blur strength, saturation, glow color, and grain intensity.

Everything runs locally in the browser. The video feed is never transmitted anywhere — hand tracking runs on-device via MediaPipe's WASM/GPU pipeline.

## Features

- **Two-hand framing gesture** — pinch with both hands and move them to define a rectangle's position, rotation, width, and height independently.
- **Smoothed, springy tracking** — position, rotation, and size are all lerped frame-to-frame so the panel feels stable rather than jittery.
- **One-hand swipe-to-cycle filters** — quick pinch + horizontal swipe cycles forward or backward through five glass presets.
- **Five built-in glass filters** — Lapis, Emerald, Rose Quartz, Smoke, and Amber, each independently tuned (blur, saturation, glow, edge highlight, grain).
- **Crossfaded filter transitions** — filter changes blend smoothly between two stacked glass layers rather than snapping instantly.
- **Live animated grain texture** — a subtle film-grain overlay regenerates periodically so the glass never looks static or flat.
- **Real-time skeleton overlay** — a faint hand-skeleton visualization confirms tracking is working and pinch points are detected.
- **On-device hand tracking** — powered by MediaPipe's Hand Landmarker model, no server round-trip.
- **Responsive stage** — the camera stage scales to fit the viewport while preserving a 4:3 aspect ratio.
- **Status & FPS readout** — a small in-stage overlay reports tracking status and live frame rate.

## Installation

No build step, package manager, or server-side dependency is required — this is a static, client-side project.

1. Clone or download this repository.
2. Serve the project root with any static file server (a plain `file://` open will usually work too, but a local server avoids browser camera-permission quirks):

   ```bash
   # Using Python
   python3 -m http.server 8080

   # Or using Node's http-server
   npx http-server -p 8080
   ```

3. Open `http://localhost:8080` in your browser.
4. Click **Start camera**, grant camera permission, and wait a few seconds for the hand-tracking model to load (~5–10s on first load).
5. Hold up both hands, pinch thumb-to-index on each, and frame a rectangle to summon the glass panel.

No API keys, `.env` files, or accounts are needed.

## Browser Support

Requires a modern browser with:

- `getUserMedia` (camera access)
- WebAssembly + WebGL (for MediaPipe's GPU-accelerated inference)
- ES modules (`<script type="module">`)
- CSS `backdrop-filter`

Recommended / tested:

| Browser | Support |
|---|---|
| Chrome / Edge (recent) | ✅ Full support, GPU-accelerated |
| Firefox (recent) | ✅ Supported |
| Safari (recent, macOS/iOS) | ⚠️ Supported, `backdrop-filter` performance may vary |
| Older browsers / IE | ❌ Not supported |

A webcam is required. HTTPS (or `localhost`) is required by browsers for camera access outside of local development.

## Controls

| Gesture | Action |
|---|---|
| **Both hands, both pinching** (thumb tip to index tip) | Summons the glass rectangle |
| **Move both hands apart / together** | Widens or narrows the rectangle |
| **Open either hand's pinch wider** | Increases the rectangle's height |
| **Tilt the line between both hands** | Rotates the rectangle |
| **One hand, pinching, quick swipe right** | Cycles to the next glass filter |
| **One hand, pinching, quick swipe left** | Cycles to the previous glass filter |
| **Release pinch / drop hands** | Rectangle holds its last pose; fades out when no hands are visible |

See [`docs/Controls.md`](docs/Controls.md) for a more detailed gesture breakdown and tuning notes.

## Folder Structure

```
Glass-Gesture-Engine-Lite/
│
├── index.html            # Semantic markup, loads style.css & script.js
├── style.css              # All styling, including CSS custom-property theming
├── script.js              # Hand-tracking, gesture logic, filter engine, rendering
├── README.md               # This file
├── LICENSE.txt             # MIT License
├── CHANGELOG.md            # Version history (Semantic Versioning)
├── .gitignore               # Standard ignores for JS/static projects
│
├── assets/
│   ├── icons/               # (reserved for future UI icons)
│   ├── images/               # (reserved for future imagery)
│   └── fonts/                 # (reserved for future custom fonts)
│
└── docs/
    ├── Installation.md        # Extended setup instructions
    ├── Controls.md              # Full gesture reference
    └── Customization.md          # How to add/tune filters and gesture thresholds
```

## Customization Guide

The project is intentionally structured so common tweaks don't require touching gesture logic.

- **Add or edit a glass filter** — open `script.js` and add/edit an entry in the `FILTERS` array. Each entry is a self-contained object (gradient colors, blur, saturation, glow, edge color, grain, corner radius); no other code needs to change.
- **Adjust gesture sensitivity** — constants near the top of `script.js` (`PINCH_MAX`, `SWIPE_THRESHOLD_PX`, `SWIPE_MAX_TIME_MS`, `FILTER_COOLDOWN_MS`, `SMOOTH`, `SIZE_SMOOTH`) control pinch tolerance, swipe distance/time, filter-change cooldown, and pose smoothing.
- **Restyle the glass panel** — all visual theming lives in `style.css` under the `.glassCore` rules, driven by the `--f-*` CSS custom properties that `script.js` sets per filter.
- **Resize the stage** — `#stage` in `style.css` controls the camera viewport size and aspect ratio.

See [`docs/Customization.md`](docs/Customization.md) for full details and examples.

## Troubleshooting

**"Failed: ..." error after clicking Start camera**
Usually a camera-permission denial or no camera device found. Check browser site permissions and that no other application is holding the camera.

**Hand model takes a long time to load**
The first load fetches the MediaPipe WASM runtime and model file from a CDN (~5–10s depending on connection). Subsequent loads are typically cached by the browser.

**Glass rectangle won't appear**
Make sure both hands are clearly visible in frame and that you're pinching thumb-tip to index-tip on both hands simultaneously (distance must stay under the pinch threshold).

**Filter won't cycle**
The swipe must be a single hand, pinching, moving at least ~90px horizontally within 600ms, and there's a short cooldown between filter changes — try a quicker, more deliberate swipe.

**Choppy frame rate**
Hand tracking is GPU-accelerated where available; performance depends on device and browser. Closing other GPU-heavy tabs/apps can help. The in-stage FPS readout shows live performance.

**Backdrop blur looks flat / missing**
Some browsers require hardware acceleration enabled, or don't fully support `backdrop-filter`. Try an up-to-date Chrome, Edge, or Firefox build.

## Support

For bugs, questions, or feature requests, contact:

**support@example.com**

## License

Released under the MIT License. See [`LICENSE.txt`](LICENSE.txt) for full terms.
