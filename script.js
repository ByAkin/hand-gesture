/* ============================================================
   GLASS FRAME — Hand Tracking
   Main application script
   ============================================================
   Structure:
     1. DOM references
     2. Filter presets & filter engine
     3. Gesture / pose constants
     4. Math & rendering helpers
     5. MediaPipe setup (camera + hand landmarker)
     6. Per-frame processing (two-hand frame gesture, one-hand swipe)
     7. Glass rectangle rendering
     8. Bootstrapping
   ============================================================ */

// ------------------------------------------------------------
// 1. DOM references
// ------------------------------------------------------------
const video = document.getElementById('video');
const videoCanvas = document.getElementById('videoCanvas');
const videoCtx = videoCanvas.getContext('2d');
const skeletonCanvas = document.getElementById('skeletonCanvas');
const skeletonCtx = skeletonCanvas.getContext('2d');

const glassRect = document.getElementById('glassRect');
const glassCoreA = document.getElementById('glassCoreA');
const glassCoreB = document.getElementById('glassCoreB');
const grainCtxA = glassCoreA.querySelector('.grainLayer').getContext('2d');
const grainCtxB = glassCoreB.querySelector('.grainLayer').getContext('2d');

const filterLabel = document.getElementById('filterLabel');
const statusDiv = document.getElementById('status');
const fpsDiv = document.getElementById('fps');
const startBtn = document.getElementById('startBtn');
const errorBox = document.getElementById('errorBox');

// ------------------------------------------------------------
// 2. Filter presets & filter engine
// ------------------------------------------------------------
// Each filter is a self-contained config object. Adding a new filter =
// adding one entry to this array. Nothing else in the render pipeline
// needs to change.
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
  {
    name: 'Emerald',
    grad1: 'rgba(20, 110, 90, 0.55)',
    grad2: 'rgba(15, 90, 75, 0.62)',
    grad3: 'rgba(10, 70, 60, 0.58)',
    blur: 14,
    saturate: 150,
    glowColor: 'rgba(80, 255, 190, 0.16)',
    glowSize: 30,
    glowAlpha: 0.24,
    edge: 'rgba(255,255,255,0.26)',
    grain: 0.10,
    radius: 22
  },
  {
    name: 'Rose Quartz',
    grad1: 'rgba(170, 70, 110, 0.5)',
    grad2: 'rgba(150, 55, 95, 0.58)',
    grad3: 'rgba(130, 45, 85, 0.55)',
    blur: 13,
    saturate: 145,
    glowColor: 'rgba(255, 150, 190, 0.18)',
    glowSize: 28,
    glowAlpha: 0.3,
    edge: 'rgba(255,255,255,0.3)',
    grain: 0.09,
    radius: 22
  },
  {
    name: 'Smoke',
    grad1: 'rgba(60, 60, 68, 0.5)',
    grad2: 'rgba(45, 45, 52, 0.58)',
    grad3: 'rgba(30, 30, 36, 0.55)',
    blur: 16,
    saturate: 110,
    glowColor: 'rgba(200, 200, 220, 0.14)',
    glowSize: 26,
    glowAlpha: 0.2,
    edge: 'rgba(255,255,255,0.22)',
    grain: 0.13,
    radius: 22
  },
  {
    name: 'Amber',
    grad1: 'rgba(180, 110, 30, 0.52)',
    grad2: 'rgba(160, 90, 20, 0.6)',
    grad3: 'rgba(140, 70, 15, 0.56)',
    blur: 13,
    saturate: 160,
    glowColor: 'rgba(255, 190, 100, 0.2)',
    glowSize: 30,
    glowAlpha: 0.3,
    edge: 'rgba(255,255,255,0.28)',
    grain: 0.1,
    radius: 22
  }
];

let filterIndex = 0;
let activeLayer = 'A'; // which of glassCoreA/B is currently visible

/**
 * Writes one filter preset's values onto a glass layer element as CSS
 * custom properties (and onto its grain canvas).
 */
function styleLayer(layerEl, grainCtx, f) {
  const style = layerEl.style;
  style.setProperty('--f-grad-1', f.grad1);
  style.setProperty('--f-grad-2', f.grad2);
  style.setProperty('--f-grad-3', f.grad3);
  style.setProperty('--f-blur', `${f.blur}px`);
  style.setProperty('--f-saturate', `${f.saturate}%`);
  style.setProperty('--f-glow-color', f.glowColor);
  style.setProperty('--f-glow-size', `${f.glowSize}px`);
  style.setProperty('--f-glow-alpha', f.glowAlpha);
  style.setProperty('--f-edge', f.edge);
  style.setProperty('--f-radius', `${f.radius}px`);
  const grainCanvas = layerEl.querySelector('.grainLayer');
  grainCanvas.style.setProperty('--f-grain', f.grain);
  grainCanvas.style.setProperty('--f-radius', `${f.radius}px`);
}

/**
 * Applies a filter preset by index. On initial load (animate = false)
 * both layers are styled identically and shown instantly. On subsequent
 * calls, the currently-hidden layer is styled with the new filter and
 * crossfaded in — CSS custom properties don't interpolate on their own,
 * but layer opacity does, giving a true smooth transition between filters.
 */
function applyFilter(index, animate = true) {
  const f = FILTERS[index];

  if (!animate) {
    styleLayer(glassCoreA, grainCtxA, f);
    styleLayer(glassCoreB, grainCtxB, f);
    glassCoreA.classList.add('active');
    glassCoreB.classList.remove('active');
    activeLayer = 'A';
    filterLabel.textContent = f.name;
    return;
  }

  if (activeLayer === 'A') {
    styleLayer(glassCoreB, grainCtxB, f);
    glassCoreB.classList.add('active');
    glassCoreA.classList.remove('active');
    activeLayer = 'B';
  } else {
    styleLayer(glassCoreA, grainCtxA, f);
    glassCoreA.classList.add('active');
    glassCoreB.classList.remove('active');
    activeLayer = 'A';
  }

  showFilterLabel(f.name);
}

let labelHideTimer = null;
function showFilterLabel(name) {
  filterLabel.textContent = name;
  filterLabel.classList.add('show');
  clearTimeout(labelHideTimer);
  labelHideTimer = setTimeout(() => {
    filterLabel.classList.remove('show');
  }, 1100);
}

// ------------------------------------------------------------
// 3. Gesture / pose constants & state
// ------------------------------------------------------------
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

// --- Smoothed rectangle pose state ---
const pose = {
  cx: 0, cy: 0,     // center, in canvas px
  angle: 0,          // rotation, radians
  w: 200, h: 120,    // size, px — independently controlled
  visible: false
};
const SMOOTH = 0.22;      // lerp factor per frame for position/rotation
const SIZE_SMOOTH = 0.18; // slightly gentler smoothing for size to avoid wobble

// Independent min/max limits for width and height
const SIZE_LIMITS = {
  minW: 90, maxWRatio: 0.85, // maxW = maxWRatio * canvas width
  minH: 70, maxHRatio: 0.7   // maxH = maxHRatio * canvas height
};

// --- Swipe-to-cycle-filter gesture state ---
const swipe = {
  active: false,   // true while a single pinching hand is tracked for swipe
  startX: null,
  startTime: 0,
  lastFilterChangeTime: 0
};
const SWIPE_THRESHOLD_PX = 90;  // minimum horizontal travel to count as a swipe
const SWIPE_MAX_TIME_MS = 600;  // must happen within this window
const FILTER_COOLDOWN_MS = 400; // cooldown between filter changes
const PINCH_MAX = 140;          // px — upper bound on thumb+index distance to count as "pinching"; also the usable range for pinch-driven height control

// ------------------------------------------------------------
// 4. Math & rendering helpers
// ------------------------------------------------------------
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function generateGrain(canvasEl, ctx, w, h) {
  canvasEl.width = w;
  canvasEl.height = h;
  const imgData = ctx.createImageData(w, h);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
}

// Regenerate grain texture periodically (not every frame — expensive &
// unnecessary). Both layers get fresh grain so a filter crossfade never
// reveals stale/blank noise.
let grainTimer = 0;
function maybeRegenerateGrain(w, h) {
  grainTimer++;
  if (grainTimer % 6 === 0) {
    const rw = Math.max(1, Math.round(w));
    const rh = Math.max(1, Math.round(h));
    generateGrain(glassCoreA.querySelector('.grainLayer'), grainCtxA, rw, rh);
    generateGrain(glassCoreB.querySelector('.grainLayer'), grainCtxB, rw, rh);
  }
}

function showError(msg) {
  errorBox.style.display = 'block';
  errorBox.textContent = msg;
  statusDiv.textContent = 'Error';
  statusDiv.style.color = '#f44';
  startBtn.disabled = false;
  startBtn.textContent = 'Retry';
}

// ------------------------------------------------------------
// 5. MediaPipe setup (camera + hand landmarker)
// ------------------------------------------------------------
let handLandmarker = null;
let running = false;
let lastVideoTime = -1;
let frameCount = 0;
let lastFpsTime = Date.now();

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 960 } },
    audio: false
  });
  video.srcObject = stream;
  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      videoCanvas.width = video.videoWidth;
      videoCanvas.height = video.videoHeight;
      skeletonCanvas.width = video.videoWidth;
      skeletonCanvas.height = video.videoHeight;
      resolve();
    };
  });
  await video.play();
}

async function setupHandLandmarker() {
  const { HandLandmarker, FilesetResolver } = await import(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14'
  );

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });
}

function renderLoop() {
  if (!running) return;

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const results = handLandmarker.detectForVideo(video, performance.now());
    processResults(results);
  }

  requestAnimationFrame(renderLoop);
}

// ------------------------------------------------------------
// 6. Per-frame processing
// ------------------------------------------------------------
function processResults(results) {
  videoCtx.drawImage(video, 0, 0, videoCanvas.width, videoCanvas.height);
  skeletonCtx.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);

  const W = videoCanvas.width;
  const H = videoCanvas.height;

  let targetVisible = false;

  if (results.landmarks && results.landmarks.length === 2) {
    targetVisible = handleTwoHandFrameGesture(results.landmarks, W, H);
  } else if (results.landmarks && results.landmarks.length === 1) {
    targetVisible = handleSingleHandSwipeGesture(results.landmarks[0], W, H);
  }

  pose.visible = targetVisible;
  updateGlassRect(W, H);

  frameCount++;
  const now = Date.now();
  if (now - lastFpsTime >= 1000) {
    fpsDiv.textContent = `FPS: ${frameCount}`;
    frameCount = 0;
    lastFpsTime = now;
  }
}

/**
 * Two-hand "frame" gesture: each hand's thumb+index pinch forms an "L"
 * corner; the two corners together define the glass rectangle's pose.
 *   Width  = hand-to-hand separation (move hands apart sideways)
 *   Height = how far each hand's own thumb+index pinch is held open
 *            (open the "L" wider with either hand)
 * This keeps height fully decoupled from rotation and from width, since
 * it never depends on hand position — only on finger spread.
 * Returns whether the rectangle should be visible this frame.
 */
function handleTwoHandFrameGesture(landmarksList, W, H) {
  // Draw skeletons for both hands, faint
  landmarksList.forEach((landmarks) => {
    drawHandSkeleton(landmarks, W, H);
  });

  // For each hand, compute the thumb-index pinch corner.
  const handCorners = landmarksList.map((landmarks) => {
    const thumbTip = { x: landmarks[4].x * W, y: landmarks[4].y * H };
    const indexTip = { x: landmarks[8].x * W, y: landmarks[8].y * H };
    return {
      thumbTip,
      indexTip,
      pinchDist: dist(thumbTip, indexTip),
      corner: { x: (thumbTip.x + indexTip.x) / 2, y: (thumbTip.y + indexTip.y) / 2 }
    };
  });

  const bothFraming = handCorners.every((h) => h.pinchDist < PINCH_MAX);
  let targetVisible = false;

  if (bothFraming) {
    const [h1, h2] = handCorners;

    // Rectangle center = midpoint between the two hand corners
    const targetCx = (h1.corner.x + h2.corner.x) / 2;
    const targetCy = (h1.corner.y + h2.corner.y) / 2;

    // Rotation = angle of the line between the two hands
    const dx = h2.corner.x - h1.corner.x;
    const dy = h2.corner.y - h1.corner.y;
    const targetAngle = Math.atan2(dy, dx);

    // Two hand-corner points only encode ONE distance (their separation)
    // plus an angle — not two independent size dimensions. So width and
    // height are driven from two genuinely separate gesture signals.
    const separation = Math.hypot(dx, dy);
    const avgPinchSpread = (h1.pinchDist + h2.pinchDist) / 2;

    const targetW = Math.max(
      SIZE_LIMITS.minW,
      Math.min(separation * 0.9, W * SIZE_LIMITS.maxWRatio)
    );
    const targetH = Math.max(
      SIZE_LIMITS.minH,
      Math.min(avgPinchSpread * 2.4 + 50, H * SIZE_LIMITS.maxHRatio)
    );

    if (!pose.visible) {
      // Snap on first appearance to avoid a fly-in from (0,0)
      pose.cx = targetCx;
      pose.cy = targetCy;
      pose.angle = targetAngle;
      pose.w = targetW;
      pose.h = targetH;
    } else {
      pose.cx = lerp(pose.cx, targetCx, SMOOTH);
      pose.cy = lerp(pose.cy, targetCy, SMOOTH);
      pose.angle = lerpAngle(pose.angle, targetAngle, SMOOTH);
      pose.w = lerp(pose.w, targetW, SIZE_SMOOTH);
      pose.h = lerp(pose.h, targetH, SIZE_SMOOTH);
    }

    targetVisible = true;
  }

  // Visual cue: highlight pinch points
  handCorners.forEach((h) => {
    const active = h.pinchDist < PINCH_MAX;
    drawPinchIndicator(h.corner, active);
  });

  // Two hands present but not both framing (e.g. mid-gesture) — reset
  // any in-progress swipe tracking so a stray single-hand pinch from a
  // moment ago doesn't leak into a two-hand pose.
  swipe.active = false;
  swipe.startX = null;

  return targetVisible;
}

/**
 * Single-hand "swipe" gesture: pinch (thumb+index) and travel
 * horizontally within the time window to cycle the active filter.
 * Returns whether the rectangle should be visible this frame (it is
 * kept at its last known pose/visibility while a single hand is present,
 * since the user is likely mid-gesture rather than dismissing it).
 */
function handleSingleHandSwipeGesture(landmarks, W, H) {
  drawHandSkeleton(landmarks, W, H);

  const thumbTip = { x: landmarks[4].x * W, y: landmarks[4].y * H };
  const indexTip = { x: landmarks[8].x * W, y: landmarks[8].y * H };
  const pinchDist = dist(thumbTip, indexTip);
  const corner = { x: (thumbTip.x + indexTip.x) / 2, y: (thumbTip.y + indexTip.y) / 2 };
  const isPinching = pinchDist < PINCH_MAX;

  drawPinchIndicator(corner, isPinching);

  const now = Date.now();

  if (isPinching) {
    if (!swipe.active) {
      swipe.active = true;
      swipe.startX = corner.x;
      swipe.startTime = now;
    } else {
      const elapsed = now - swipe.startTime;
      const travel = corner.x - swipe.startX;
      const cooledDown = (now - swipe.lastFilterChangeTime) > FILTER_COOLDOWN_MS;

      if (elapsed <= SWIPE_MAX_TIME_MS && cooledDown) {
        if (travel > SWIPE_THRESHOLD_PX) {
          filterIndex = (filterIndex + 1) % FILTERS.length;
          applyFilter(filterIndex);
          swipe.lastFilterChangeTime = now;
          swipe.active = false;
          swipe.startX = null;
        } else if (travel < -SWIPE_THRESHOLD_PX) {
          filterIndex = (filterIndex - 1 + FILTERS.length) % FILTERS.length;
          applyFilter(filterIndex);
          swipe.lastFilterChangeTime = now;
          swipe.active = false;
          swipe.startX = null;
        }
      }

      // Swipe window expired without a completed swipe — restart the
      // tracking window from the current position rather than staying
      // stuck, so slow drifts don't permanently block future swipes.
      if (elapsed > SWIPE_MAX_TIME_MS) {
        swipe.startX = corner.x;
        swipe.startTime = now;
      }
    }
  } else {
    swipe.active = false;
    swipe.startX = null;
  }

  // Keep the rectangle exactly where it was (last known pose) while a
  // single hand is present.
  return pose.visible;
}

/** Draws a faint hand skeleton onto the skeleton canvas. */
function drawHandSkeleton(landmarks, W, H) {
  skeletonCtx.strokeStyle = 'rgba(120, 180, 255, 0.35)';
  skeletonCtx.lineWidth = 1.5;
  HAND_CONNECTIONS.forEach(([a, b]) => {
    const p1 = landmarks[a];
    const p2 = landmarks[b];
    skeletonCtx.beginPath();
    skeletonCtx.moveTo(p1.x * W, p1.y * H);
    skeletonCtx.lineTo(p2.x * W, p2.y * H);
    skeletonCtx.stroke();
  });
}

/** Draws the pinch-point dot, colored by whether the pinch is active. */
function drawPinchIndicator(point, active) {
  skeletonCtx.fillStyle = active ? 'rgba(120,190,255,0.9)' : 'rgba(255,255,255,0.4)';
  skeletonCtx.beginPath();
  skeletonCtx.arc(point.x, point.y, 6, 0, Math.PI * 2);
  skeletonCtx.fill();
}

// ------------------------------------------------------------
// 7. Glass rectangle rendering
// ------------------------------------------------------------
function updateGlassRect(W, H) {
  const wasVisible = glassRect.classList.contains('visible');
  glassRect.classList.toggle('visible', pose.visible);

  // Skip the positioning math once fully hidden and already was last
  // frame — nothing to update while the rectangle is invisible and stable.
  if (!pose.visible && !wasVisible) return;

  // Convert canvas px -> stage px so it scales with responsive layout.
  // Note: video is mirrored via CSS scaleX(-1) on the canvases, but this
  // div is a sibling positioned in the same unmirrored coordinate space
  // as #stage, so we mirror the x coordinate manually here.
  const stage = document.getElementById('stage');
  const stageRect = stage.getBoundingClientRect();
  const scaleX = stageRect.width / W;
  const scaleY = stageRect.height / H;

  const mirroredCx = W - pose.cx; // mirror to match visually mirrored video
  const px = mirroredCx * scaleX;
  const py = pose.cy * scaleY;
  const pw = pose.w * scaleX;
  const ph = pose.h * scaleY;
  // Mirror the rotation angle too, since x is flipped
  const angleDeg = -pose.angle * (180 / Math.PI);

  glassRect.style.width = `${pw}px`;
  glassRect.style.height = `${ph}px`;
  glassRect.style.transform =
    `translate(${px - pw / 2}px, ${py - ph / 2}px) rotate(${angleDeg}deg)`;

  maybeRegenerateGrain(pw, ph);
}

// ------------------------------------------------------------
// 8. Bootstrapping
// ------------------------------------------------------------
async function start() {
  startBtn.disabled = true;
  startBtn.textContent = 'Starting...';
  errorBox.style.display = 'none';

  try {
    applyFilter(filterIndex, false);

    statusDiv.textContent = 'Requesting camera...';
    await setupCamera();

    statusDiv.textContent = 'Loading hand model (first load ~5-10s)...';
    await setupHandLandmarker();

    statusDiv.textContent = '✓ Live — form a rectangle with both hands';
    statusDiv.style.color = '#8cf';
    startBtn.style.display = 'none';

    running = true;
    renderLoop();
  } catch (err) {
    console.error(err);
    showError('Failed: ' + (err && err.message ? err.message : String(err)));
  }
}

startBtn.addEventListener('click', start);
