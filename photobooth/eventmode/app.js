
const PASSCODE = "1111";

const lockScreen = document.getElementById("lockScreen");
const setupScreen = document.getElementById("setupScreen");
const boothScreen = document.getElementById("boothScreen");

const passcodeInput = document.getElementById("passcodeInput");
const unlockBtn = document.getElementById("unlockBtn");
const passcodeError = document.getElementById("passcodeError");

const cameraSelect = document.getElementById("cameraSelect");
const layoutSelect = document.getElementById("layoutSelect");
const frameUpload = document.getElementById("frameUpload");
const logoUpload = document.getElementById("logoUpload");
const eventNameInput = document.getElementById("eventName");

const startBoothBtn = document.getElementById("startBoothBtn");
const backToSetupBtn = document.getElementById("backToSetupBtn");
const takePhotoBtn = document.getElementById("takePhotoBtn");

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const message = document.getElementById("message");
const countdown = document.getElementById("countdown");

let currentStream = null;
let frameImage = null;
let logoImage = null;
let isTakingPhotos = false;

unlockBtn.addEventListener("click", unlock);
passcodeInput.addEventListener("keydown", e => {
  if (e.key === "Enter") unlock();
});

function unlock() {
  if (passcodeInput.value === PASSCODE) {
    lockScreen.classList.add("hidden");
    setupScreen.classList.remove("hidden");
    initCamera();
  } else {
    passcodeError.textContent = "Wrong passcode. Try again.";
  }
}

async function initCamera(deviceId) {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  currentStream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: false
  });

  video.srcObject = currentStream;
  await loadCameras();
}

async function loadCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter(device => device.kind === "videoinput");

  cameraSelect.innerHTML = "";

  cameras.forEach((camera, index) => {
    const option = document.createElement("option");
    option.value = camera.deviceId;
    option.textContent = camera.label || `Camera ${index + 1}`;
    cameraSelect.appendChild(option);
  });
}

cameraSelect.addEventListener("change", () => {
  initCamera(cameraSelect.value);
});

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

startBoothBtn.addEventListener("click", () => {
  setupScreen.classList.add("hidden");
  boothScreen.classList.remove("hidden");
  message.textContent = "Tap button or press space to take photo";
});

backToSetupBtn.addEventListener("click", () => {
  boothScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");
});

takePhotoBtn.addEventListener("click", startPhotoSequence);

document.addEventListener("keydown", e => {
  if (e.code === "Space" && !boothScreen.classList.contains("hidden")) {
    e.preventDefault();
    startPhotoSequence();
  }
});

async function startPhotoSequence() {
  if (isTakingPhotos) return;

  isTakingPhotos = true;
  takePhotoBtn.disabled = true;

  const layout = layoutSelect.value;
  const photos = [];

  if (layout === "single") {
    message.textContent = "Ready...";
    await countdownFromThree();
    photos.push(capturePhoto());
  }

  if (layout === "triple") {
    message.textContent = "Ready...";
    await countdownFromThree();
    photos.push(capturePhoto());

    message.textContent = "Okay, get ready for the next photo";
    await wait(1300);
    await countdownFromThree();
    photos.push(capturePhoto());

    message.textContent = "Last one";
    await wait(1300);
    await countdownFromThree();
    photos.push(capturePhoto());
  }

  message.textContent = "Creating your photo...";
  const finalImage = createFinalImage(photos, layout);

  downloadImage(finalImage);

  message.textContent = "Done! Tap or press space for another photo";
  countdown.textContent = "";

  takePhotoBtn.disabled = false;
  isTakingPhotos = false;
}

async function countdownFromThree() {
  for (let i = 3; i > 0; i--) {
    countdown.textContent = i;
    await wait(900);
  }

  countdown.textContent = "📸";
  await wait(250);
  countdown.textContent = "";
}

function capturePhoto() {
  const tempCanvas = document.createElement("canvas");
  const ctx = tempCanvas.getContext("2d");

  tempCanvas.width = video.videoWidth;
  tempCanvas.height = video.videoHeight;

  // No mirror flip. This captures the camera exactly as shown.
  ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

  return tempCanvas;
}

function createFinalImage(photos, layout) {
  const ctx = canvas.getContext("2d");

  canvas.width = 1200;
  canvas.height = 1800;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (layout === "single") {
    drawCroppedImage(ctx, photos[0], 80, 180, 1040, 1200);
  }

  if (layout === "triple") {
    drawCroppedImage(ctx, photos[0], 90, 130, 1020, 460);
    drawCroppedImage(ctx, photos[1], 90, 670, 1020, 460);
    drawCroppedImage(ctx, photos[2], 90, 1210, 1020, 460);
  }

  if (frameImage) {
    ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
  }

  if (logoImage) {
    ctx.drawImage(logoImage, 450, 40, 300, 120);
  }

  const eventName = eventNameInput.value.trim();
  if (eventName) {
    ctx.fillStyle = "#111111";
    ctx.font = "bold 44px Arial";
    ctx.textAlign = "center";
    ctx.fillText(eventName, canvas.width / 2, 1740);
  }

  return canvas.toDataURL("image/png");
}

function drawCroppedImage(ctx, img, x, y, w, h) {
  const sourceRatio = img.width / img.height;
  const targetRatio = w / h;

  let sx, sy, sw, sh;

  if (sourceRatio > targetRatio) {
    sh = img.height;
    sw = sh * targetRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function downloadImage(imageData) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const link = document.createElement("a");

  link.href = imageData;
  link.download = `BriGregory-PhotoBooth-${timestamp}.png`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
