# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — Initial Release

### Added
- Real-time hand tracking via MediaPipe Hand Landmarker (on-device, GPU-accelerated).
- Two-hand "frame" gesture to summon a floating glass rectangle, with independently controlled position, rotation, width, and height.
- Smoothed pose tracking (position, rotation, size) via per-frame interpolation for stable, non-jittery motion.
- Single-hand pinch-and-swipe gesture to cycle glass filters forward/backward.
- Five built-in glass filter presets: Lapis, Emerald, Rose Quartz, Smoke, Amber.
- Crossfaded filter transitions between two stacked glass layers.
- Animated film-grain texture overlay on the glass panel, regenerated periodically.
- Faint real-time hand-skeleton overlay with pinch-point indicators.
- Live status and FPS readout within the camera stage.
- Responsive camera stage with fixed 4:3 aspect ratio.

### Project Structure
- Refactored from a single-file prototype into a maintainable multi-file structure (`index.html`, `style.css`, `script.js`).
- Added supporting documentation (`README.md`, `docs/Installation.md`, `docs/Controls.md`, `docs/Customization.md`).
- Added standard open-source project scaffolding (`LICENSE.txt`, `.gitignore`, `CHANGELOG.md`).
