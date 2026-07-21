# Installation

Glass Gesture Engine Lite is a fully static, client-side project. There is no build step, bundler, or backend server involved.

## Prerequisites

- A modern browser (see [Browser Support](../README.md#browser-support) in the main README).
- A webcam.
- Any method of serving static files over HTTP (recommended) or opening the file directly.

## 1. Get the project

Clone the repository or download and extract the ZIP:

```bash
git clone https://example.com/your-org/Glass-Gesture-Engine-Lite.git
cd Glass-Gesture-Engine-Lite
```

## 2. Serve the project

Because the app uses ES modules (`<script type="module">`) and fetches the MediaPipe WASM runtime from a CDN, it's best served over HTTP rather than opened as a raw `file://` URL, especially in Chrome-based browsers.

Choose any one of the following:

**Python 3**
```bash
python3 -m http.server 8080
```

**Node.js (http-server)**
```bash
npx http-server -p 8080
```

**VS Code**
Use the "Live Server" extension and click "Go Live" from `index.html`.

## 3. Open the app

Navigate to:

```
http://localhost:8080
```

## 4. Start the camera

1. Click **Start camera**.
2. Grant camera permission when prompted by the browser.
3. Wait for the status line to read **"Loading hand model..."** — this fetches the MediaPipe hand-tracking model from a CDN and typically takes 5–10 seconds on first load (faster on subsequent loads due to browser caching).
4. Once the status reads **"✓ Live — form a rectangle with both hands"**, tracking is active.

## Deploying

Because the project has no build step, it can be deployed to any static hosting provider (GitHub Pages, Netlify, Vercel, S3 + CloudFront, etc.) by uploading the project files as-is. Ensure the site is served over **HTTPS** — browsers require a secure context for camera access on any origin other than `localhost`.

## Offline / self-hosting the model

By default, the app loads MediaPipe's WASM runtime and hand-tracking model from Google's CDN at runtime (see the `setupHandLandmarker()` function in `script.js`). If you need a fully offline deployment, download the corresponding MediaPipe Tasks Vision assets and update the `modelAssetPath` and `FilesetResolver` URLs in `script.js` to point to your own hosted copies.
