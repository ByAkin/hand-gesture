# Controls

Glass Gesture Engine Lite recognizes two distinct gestures depending on how many hands are visible to the camera.

## Two-Hand Gesture: Frame the Glass Rectangle

**Trigger:** Both hands visible, each pinching (thumb tip to index tip distance below the pinch threshold).

While both hands are pinching, the following are tracked continuously and independently:

| Control | How | Effect |
|---|---|---|
| **Position** | Move both hands together as a pair | Rectangle center follows the midpoint between your two pinch points |
| **Rotation** | Tilt the imaginary line connecting your two pinch points | Rectangle rotates to match that angle |
| **Width** | Move your hands apart / closer together (horizontal separation) | Rectangle widens / narrows |
| **Height** | Open or close either hand's own thumb-index pinch wider | Rectangle grows / shrinks in height |

Width and height are deliberately driven by two separate signals — hand-to-hand distance for width, and pinch-openness for height — so you can resize one dimension without disturbing the other.

Motion is smoothed frame-to-frame (position/rotation and size use slightly different smoothing rates) so the panel doesn't jitter with small hand tremors. On the very first appearance, the rectangle snaps directly to your hands' current pose rather than animating in from a corner.

**Releasing:** If you drop below two visibly-pinching hands, the rectangle holds its last known pose rather than disappearing immediately — useful since a single-hand swipe gesture (below) is often performed right after framing. It only fully fades out when no hands are detected at all.

## One-Hand Gesture: Swipe to Cycle Filters

**Trigger:** Exactly one hand visible, pinching (thumb tip to index tip).

With one hand pinching, a quick horizontal swipe changes the active glass filter:

| Swipe direction | Effect |
|---|---|
| **Right** (travel > ~90px within 600ms) | Advances to the next filter in the list |
| **Left** (travel > ~90px within 600ms, opposite direction) | Reverts to the previous filter |

Details:

- The swipe must complete within a short time window from when the pinch started (or since the last swipe check) — slow drags don't count and the tracking window simply restarts.
- There is a short cooldown between successive filter changes to prevent a single continuous swipe from cycling multiple filters at once.
- Releasing the pinch at any point resets the swipe tracking.

### Filter order

Filters cycle in this order (wrapping around at both ends):

1. Lapis
2. Emerald
3. Rose Quartz
4. Smoke
5. Amber

The currently active filter's name appears briefly at the top of the glass panel whenever it changes.

## Visual feedback

- A faint blue hand-skeleton is drawn over each detected hand every frame.
- The pinch point (midpoint between thumb tip and index tip) is drawn as a small dot — bright blue when actively pinching, dim white otherwise.
- The status line and FPS counter in the top-left of the camera stage reflect tracking state and performance in real time.

## Tuning gesture thresholds

If gestures feel too sensitive or not sensitive enough for your camera setup, see [`Customization.md`](Customization.md) for the relevant constants in `script.js`.
