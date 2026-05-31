const PASSCODE = "1111";

const screens = {
  lock: document.getElementById("lockScreen"),
  setup: document.getElementById("setupScreen"),
  booth: document.getElementById("boothScreen"),
  review: document.getElementById("reviewScreen")
};

const passcodeInput = document.getElementById("passcodeInput");
const unlockBtn = document.getElementById("unlockBtn");
const passcodeError = document.getElementById("passcodeError");
const cameraSelect = document.getElementById("cameraSelect");
const refreshCamerasBtn = document.getElementById("refreshCamerasBtn");
const layoutSelect = document.getElementById("layoutSelect");
const frameUpload = document.getElementById("frameUpload");
const logoUpload = document.getElementById("logoUpload");
const eventNameInput = document.getElementById("eventName");
const startBoothBtn = document.getElementById("startBoothBtn");
const previewBoothBtn = document.getElementById("previewBoothBtn");
const adminBtn = document.getElementById("adminBtn");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const takeAnotherBtn = document.getElementById("takeAnotherBtn");
const reviewSetupBtn = document.getElementById("reviewSetupBtn");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const message = document.getElementById("message");
const countdown = document.getElementById("countdown");
const reviewImage = document.getElementById("reviewImage");

let currentStream = null;
let frameImage = null;
let logoImage = null;
let isTakingPhotos = false;
let hasCameraPermission = false;

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
}

unlockBtn.addEventListener("click", unlock);
passcodeInput.addEventListener("keydown", event => {
  if (event.key === "Enter") unlock();
});

function unlock() {
  if (passcodeInput.value.trim() !== PASSCODE) {
    passcodeError.textContent = "That passcode is not correct.";
    return;
  }

  passcodeError.textContent = "";
  showScreen("setup");
  startCamera().catch(showCameraError);
}

async function startCamera(deviceId) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera access is not available in this browser.");
  }

  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  const constraints = {
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: false
  };

  currentStream = await navigator.mediaDevices.getUserMedia(constraints);
  hasCameraPermission = true;
  video.srcObject = currentStream;

  await loadCameras(deviceId);
}

async function loadCameras(selectedDeviceId) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter(device => device.kind === "videoinput");

  cameraSelect.innerHTML = "";

  cameras.forEach((camera, index) => {
    const option = document.createElement("option");
    option.value = camera.deviceId;
    option.textContent = camera.label || `Camera ${index + 1}`;
    option.selected = selectedDeviceId ? camera.deviceId === selectedDeviceId : index === 0;
    cameraSelect.appendChild(option);
  });
}

function showCameraError(error) {
  alert(`${error.message}\n\nMake sure this page is opened on HTTPS and camera permission is allowed.`);
}

cameraSelect.addEventListener("change", () => {
  startCamera(cameraSelect.value).catch(showCameraError);
});

refreshCamerasBtn.addEventListener("click", () => {
  loadCameras(cameraSelect.value).catch(showCameraError);
});

frameUpload.addEventListener("change", async event => {
  frameImage = await loadImageFromFile(event.target.files[0]);
});

logoUpload.addEventListener("change", async event => {
  logoImage = await loadImageFromFile(event.target.files[0]);
});

function loadImageFromFile(file) {
  return new Promise(resolve => {
    if (!file) return resolve(null);
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = URL.createObjectURL(file);
  });
}

startBoothBtn.addEventListener("click", enterBooth);
previewBoothBtn.addEventListener("click", enterBooth);

async function enterBooth() {
  if (!hasCameraPermission) {
    await startCamera(cameraSelect.value).catch(showCameraError);
  }

  showScreen("booth");
  message.textContent = "Tap below or press space to begin";
  countdown.textContent = "";
}

adminBtn.addEventListener("click", () => {
  showScreen("setup");
});

reviewSetupBtn.addEventListener("click", () => showScreen("setup"));
takeAnotherBtn.addEventListener("click", enterBooth);
takePhotoBtn.addEventListener("click", startPhotoSequence);

window.addEventListener("keydown", event => {
  if (!screens.booth.classList.contains("is-active")) return;

  if (event.code === "Space" || event.key === "Enter") {
    event.preventDefault();
    startPhotoSequence();
  }
});

async function startPhotoSequence() {
  if (isTakingPhotos) return;

  isTakingPhotos = true;
  takePhotoBtn.disabled = true;

  const photos = [];
  const layout = layoutSelect.value;

  try {
    if (layout === "single") {
      message.textContent = "Ready...";
      await countdownFromThree();
      photos.push(capturePhoto());
    } else {
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

    message.textContent = "Creating your keepsake...";
    await wait(350);

    const finalImage = createFinalImage(photos, layout);
    downloadImage(finalImage);
    reviewImage.src = finalImage;
    showScreen("review");
  } catch (error) {
    alert(`Photo failed: ${error.message}`);
  } finally {
    takePhotoBtn.disabled = false;
    isTakingPhotos = false;
    countdown.textContent = "";
  }
}

async function countdownFromThree() {
  for (let number = 3; number > 0; number--) {
    countdown.textContent = number;
    await wait(850);
  }

  countdown.textContent = "ðŸ“¸";
  await wait(260);
  countdown.textContent = "";
}

function capturePhoto() {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("Camera is not ready yet. Try again in a second.");
  }

  const photoCanvas = document.createElement("canvas");
  const context = photoCanvas.getContext("2d");

  photoCanvas.width = video.videoWidth;
  photoCanvas.height = video.videoHeight;

  // No mirror flip. The saved image matches the camera orientation.
  context.drawImage(video, 0, 0, photoCanvas.width, photoCanvas.height);

  return photoCanvas;
}

function createFinalImage(photos, layout) {
  const context = canvas.getContext("2d");

  canvas.width = 1200;
  canvas.height = 1800;

  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#fffaf3");
  gradient.addColorStop(1, "#eadfce");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "rgba(255,255,255,0.78)";
  roundRect(context, 42, 42, 1116, 1716, 44);
  context.fill();

  if (layout === "single") {
    drawCroppedImage(context, photos[0], 86, 210, 1028, 1280, 28);
  } else {
    drawCroppedImage(context, photos[0], 90, 170, 1020, 430, 24);
    drawCroppedImage(context, photos[1], 90, 690, 1020, 430, 24);
    drawCroppedImage(context, photos[2], 90, 1210, 1020, 430, 24);
  }

  if (frameImage) {
    context.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
  }

  drawBranding(context);

  return canvas.toDataURL("image/png", 1);
}

function drawBranding(context) {
  const eventName = eventNameInput.value.trim();

  if (logoImage) {
    const logoWidth = 320;
    const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
    context.drawImage(logoImage, (canvas.width - logoWidth) / 2, 62, logoWidth, logoHeight);
  } else {
    context.fillStyle = "#1f1b16";
    context.font = "700 40px Playfair Display, Georgia, serif";
    context.textAlign = "center";
    context.fillText("Brianna Gregory Photography", canvas.width / 2, 112);
  }

  if (eventName) {
    context.fillStyle = "#5f4d3f";
    context.font = "800 46px Inter, Arial, sans-serif";
    context.textAlign = "center";
    context.fillText(eventName, canvas.width / 2, 1690);
  }
}

function drawCroppedImage(context, image, x, y, width, height, radius = 0) {
  context.save();
  if (radius) {
    roundRect(context, x, y, width, height, radius);
    context.clip();
  }

  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;

  let sx, sy, sw, sh;
  if (sourceRatio > targetRatio) {
    sh = image.height;
    sw = sh * targetRatio;
    sx = (image.width - sw) / 2;
    sy = 0;
  } else {
    sw = image.width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (image.height - sh) / 2;
  }

  context.drawImage(image, sx, sy, sw, sh, x, y, width, height);
  context.restore();
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
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
