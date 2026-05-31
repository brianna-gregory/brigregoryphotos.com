const PASSCODE = "1111";
const EXIT_TAPS_REQUIRED = 4;

const screens = {
  lock:    document.getElementById("lockScreen"),
  setup:   document.getElementById("setupScreen"),
  booth:   document.getElementById("boothScreen"),
  alldone: document.getElementById("alldoneScreen"),
  review:  document.getElementById("reviewScreen")
};

const passcodeInput   = document.getElementById("passcodeInput");
const unlockBtn       = document.getElementById("unlockBtn");
const passcodeError   = document.getElementById("passcodeError");
const cameraSelect    = document.getElementById("cameraSelect");
const refreshCamerasBtn = document.getElementById("refreshCamerasBtn");
const layoutSelect    = document.getElementById("layoutSelect");
const frameUpload     = document.getElementById("frameUpload");
const logoUpload      = document.getElementById("logoUpload");
const eventNameInput  = document.getElementById("eventName");
const startBoothBtn   = document.getElementById("startBoothBtn");
const previewBoothBtn = document.getElementById("previewBoothBtn");
const adminBtn        = document.getElementById("adminBtn");
const takePhotoBtn    = document.getElementById("takePhotoBtn");
const takeAnotherBtn  = document.getElementById("takeAnotherBtn");
const reviewSetupBtn  = document.getElementById("reviewSetupBtn");
const alldoneReadyBtn = document.getElementById("alldoneReadyBtn");
const video    = document.getElementById("video");
const canvas   = document.getElementById("canvas");
const message  = document.getElementById("message");
const countdown = document.getElementById("countdown");
const reviewImage = document.getElementById("reviewImage");

let currentStream      = null;
let frameImage         = null;
let logoImage          = null;
let isTakingPhotos     = false;
let hasCameraPermission = false;

// ── Secret exit tap counter ──
let exitTapCount  = 0;
let exitTapTimer  = null;

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("is-active"));
  screens[name].classList.add("is-active");

  // Reset exit tap count whenever we navigate
  exitTapCount = 0;
  clearTimeout(exitTapTimer);
}

// ══════════════════════════════
// LOCK
// ══════════════════════════════
unlockBtn.addEventListener("click", unlock);
passcodeInput.addEventListener("keydown", e => {
  if (e.key === "Enter") unlock();
});

function unlock() {
  if (passcodeInput.value.trim() !== PASSCODE) {
    passcodeError.textContent = "That passcode is not correct.";
    passcodeInput.value = "";
    return;
  }
  passcodeError.textContent = "";
  showScreen("setup");
  startCamera().catch(showCameraError);
}

// ══════════════════════════════
// CAMERA
// ══════════════════════════════
async function startCamera(deviceId) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera access is not available in this browser.");
  }

  if (currentStream) {
    currentStream.getTracks().forEach(t => t.stop());
  }

  currentStream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: false
  });

  hasCameraPermission = true;
  video.srcObject = currentStream;
  await loadCameras(deviceId);
}

async function loadCameras(selectedDeviceId) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter(d => d.kind === "videoinput");

  cameraSelect.innerHTML = "";
  cameras.forEach((cam, i) => {
    const opt = document.createElement("option");
    opt.value = cam.deviceId;
    opt.textContent = cam.label || `Camera ${i + 1}`;
    opt.selected = selectedDeviceId ? cam.deviceId === selectedDeviceId : i === 0;
    cameraSelect.appendChild(opt);
  });
}

function showCameraError(err) {
  alert(`${err.message}\n\nMake sure this page is opened on HTTPS and camera permission is allowed.`);
}

cameraSelect.addEventListener("change", () => {
  startCamera(cameraSelect.value).catch(showCameraError);
});

refreshCamerasBtn?.addEventListener("click", () => {
  loadCameras(cameraSelect.value).catch(showCameraError);
});

// ══════════════════════════════
// FILE UPLOADS
// ══════════════════════════════
frameUpload.addEventListener("change", async e => {
  frameImage = await loadImageFromFile(e.target.files[0]);
});

logoUpload.addEventListener("change", async e => {
  logoImage = await loadImageFromFile(e.target.files[0]);
});

function loadImageFromFile(file) {
  return new Promise(resolve => {
    if (!file) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
}

// ══════════════════════════════
// ENTER BOOTH
// ══════════════════════════════
startBoothBtn.addEventListener("click", enterBooth);
previewBoothBtn?.addEventListener("click", enterBooth);

async function enterBooth() {
  if (!hasCameraPermission) {
    await startCamera(cameraSelect.value).catch(showCameraError);
  }
  showScreen("booth");
  message.textContent = "Tap to take a photo";
  countdown.textContent = "";
}

// ── Admin (hidden button, kept for fallback) ──
adminBtn?.addEventListener("click", () => showScreen("setup"));

// ── Review actions ──
reviewSetupBtn?.addEventListener("click", () => showScreen("setup"));
takeAnotherBtn?.addEventListener("click", () => {
  showScreen("alldone");
});

// ── All Done → next user ──
alldoneReadyBtn?.addEventListener("click", enterBooth);
document.getElementById("alldoneScreen")?.addEventListener("click", enterBooth);

// ══════════════════════════════
// SECRET EXIT — 4 taps anywhere on booth screen
// ══════════════════════════════
function handleBoothTap(e) {
  // If booth isn't active, ignore
  if (!screens.booth.classList.contains("is-active")) return;
  // If actively taking photos, let normal flow handle it
  if (isTakingPhotos) return;

  exitTapCount++;
  clearTimeout(exitTapTimer);

  if (exitTapCount >= EXIT_TAPS_REQUIRED) {
    exitTapCount = 0;
    showScreen("setup");
    return;
  }

  // Reset counter if no tap within 1.8 seconds
  exitTapTimer = setTimeout(() => {
    exitTapCount = 0;
  }, 1800);

  // First tap (or any non-exit tap) = start photo
  if (exitTapCount === 1) {
    startPhotoSequence();
  }
}

screens.booth.addEventListener("click", handleBoothTap);
screens.booth.addEventListener("touchend", e => {
  e.preventDefault();
  handleBoothTap(e);
}, { passive: false });

takePhotoBtn?.addEventListener("click", e => {
  e.stopPropagation(); // handled by booth tap listener
});

// Space / Enter keyboard shortcut
window.addEventListener("keydown", e => {
  if (!screens.booth.classList.contains("is-active")) return;
  if (e.code === "Space" || e.key === "Enter") {
    e.preventDefault();
    startPhotoSequence();
  }
});

// ══════════════════════════════
// PHOTO SEQUENCE
// ══════════════════════════════
async function startPhotoSequence() {
  if (isTakingPhotos) return;

  isTakingPhotos = true;
  if (takePhotoBtn) takePhotoBtn.disabled = true;

  const photos  = [];
  const layout  = layoutSelect.value;

  try {
    if (layout === "single") {
      message.textContent = "Ready…";
      await countdownFromThree();
      photos.push(capturePhoto());
    } else {
      message.textContent = "Ready…";
      await countdownFromThree();
      photos.push(capturePhoto());

      message.textContent = "Get ready for the next one";
      await wait(1300);
      await countdownFromThree();
      photos.push(capturePhoto());

      message.textContent = "Last one!";
      await wait(1300);
      await countdownFromThree();
      photos.push(capturePhoto());
    }

    message.textContent = "Creating your keepsake…";
    await wait(350);

    const finalImage = createFinalImage(photos, layout);
    downloadImage(finalImage);
    reviewImage.src = finalImage;

    // Go to "All Done" screen instead of review
    showScreen("alldone");

  } catch (err) {
    alert(`Photo failed: ${err.message}`);
  } finally {
    if (takePhotoBtn) takePhotoBtn.disabled = false;
    isTakingPhotos  = false;
    countdown.textContent = "";
    exitTapCount = 0;
  }
}

async function countdownFromThree() {
  for (let n = 3; n > 0; n--) {
    countdown.textContent = n;
    await wait(850);
  }
  countdown.textContent = "✦";
  await wait(260);
  countdown.textContent = "";
}

function capturePhoto() {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("Camera is not ready yet. Try again in a moment.");
  }
  const c   = document.createElement("canvas");
  const ctx = c.getContext("2d");
  c.width   = video.videoWidth;
  c.height  = video.videoHeight;
  ctx.drawImage(video, 0, 0, c.width, c.height);
  return c;
}

// ══════════════════════════════
// COMPOSE FINAL IMAGE
// ══════════════════════════════
function createFinalImage(photos, layout) {
  const ctx = canvas.getContext("2d");
  canvas.width  = 1200;
  canvas.height = 1800;

  // Rich background
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "#1c1510");
  grad.addColorStop(0.5, "#2e1f14");
  grad.addColorStop(1, "#1a0f0a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Inner card
  ctx.fillStyle = "rgba(253,246,238,0.06)";
  roundRect(ctx, 40, 40, 1120, 1720, 48);
  ctx.fill();

  // Gold border
  ctx.strokeStyle = "rgba(201,168,76,0.35)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 40, 40, 1120, 1720, 48);
  ctx.stroke();

  if (layout === "single") {
    drawCroppedImage(ctx, photos[0], 86, 220, 1028, 1260, 32);
  } else {
    drawCroppedImage(ctx, photos[0], 90, 180, 1020, 430, 26);
    drawCroppedImage(ctx, photos[1], 90, 695, 1020, 430, 26);
    drawCroppedImage(ctx, photos[2], 90, 1210, 1020, 430, 26);
  }

  if (frameImage) {
    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
  }

  drawBranding(ctx, layout);
  return canvas.toDataURL("image/png", 1);
}

function drawBranding(ctx, layout) {
  const eventName = eventNameInput.value.trim();
  const topY = layout === "single" ? 165 : 130;

  if (logoImage) {
    const logoW = 300;
    const logoH = (logoImage.height / logoImage.width) * logoW;
    ctx.drawImage(logoImage, (canvas.width - logoW) / 2, topY - logoH / 2 - 10, logoW, logoH);
  } else {
    ctx.fillStyle = "#c9a84c";
    ctx.font = "300 38px 'Cormorant Garamond', Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Brianna Gregory Photography", canvas.width / 2, topY);
  }

  if (eventName) {
    ctx.fillStyle = "rgba(201,168,76,0.85)";
    ctx.font = "700 40px 'DM Sans', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(eventName, canvas.width / 2, 1710);
  }
}

function drawCroppedImage(ctx, img, x, y, w, h, radius = 0) {
  ctx.save();
  if (radius) {
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
  }
  const sr = img.width / img.height;
  const tr = w / h;
  let sx, sy, sw, sh;
  if (sr > tr) {
    sh = img.height; sw = sh * tr;
    sx = (img.width - sw) / 2; sy = 0;
  } else {
    sw = img.width; sh = sw / tr;
    sx = 0; sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function downloadImage(imageData) {
  const ts   = new Date().toISOString().replace(/[:.]/g, "-");
  const link = document.createElement("a");
  link.href  = imageData;
  link.download = `BriGregory-PhotoBooth-${ts}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
