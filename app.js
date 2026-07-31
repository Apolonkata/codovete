// ==========================================
// 1. THEME & NAVIGATION CONTROLS (Your Code)
// ==========================================

const themeToggleBtn = document.getElementById('theme-toggle');

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('symmrate_theme', 'light');
    } else {
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('symmrate_theme', 'dark');
    }
  });
}

if (localStorage.getItem('symmrate_theme') === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
}

const profileBtn = document.getElementById('profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');

if (profileBtn && profileDropdown) {
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    if (!profileDropdown.classList.contains('hidden')) {
      profileDropdown.classList.add('hidden');
    }
  });
}

const profileModal = document.getElementById('profile-modal');
const closeProfileBtn = document.getElementById('close-profile-btn');
const menuProfileLink = document.getElementById('menu-profile-link');
const saveProfileBtn = document.getElementById('save-profile-btn');

if (menuProfileLink && profileModal) {
  menuProfileLink.addEventListener('click', (e) => {
    e.preventDefault();
    profileModal.classList.remove('hidden');
  });
}

if (closeProfileBtn && profileModal) {
  closeProfileBtn.addEventListener('click', () => {
    profileModal.classList.add('hidden');
  });
}

const avatarDisplay = document.getElementById('avatar-display');
const presetBtns = document.querySelectorAll('.preset-btn');
const avatarInput = document.getElementById('avatar-upload-input');
const usernameInput = document.getElementById('username-input');

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const selectedEmoji = btn.getAttribute('data-avatar');
    avatarDisplay.innerHTML = selectedEmoji;
    localStorage.setItem('symmrate_avatar', selectedEmoji);
    localStorage.setItem('symmrate_avatar_type', 'emoji');
  });
});

if (avatarInput) {
  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        avatarDisplay.innerHTML = `<img src="${event.target.result}" class="avatar-img-custom" alt="Avatar">`;
        presetBtns.forEach(b => b.classList.remove('active'));
        localStorage.setItem('symmrate_avatar', event.target.result);
        localStorage.setItem('symmrate_avatar_type', 'image');
      };
      reader.readAsDataURL(file);
    }
  });
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener('click', () => {
    if (usernameInput) {
      localStorage.setItem('symmrate_username', usernameInput.value.trim());
    }
    profileModal.classList.add('hidden');
  });
}

function loadSavedProfile() {
  const savedName = localStorage.getItem('symmrate_username');
  if (savedName && usernameInput) {
    usernameInput.value = savedName;
  }

  const savedAvatar = localStorage.getItem('symmrate_avatar');
  const avatarType = localStorage.getItem('symmrate_avatar_type');

  if (savedAvatar && avatarDisplay) {
    if (avatarType === 'image') {
      avatarDisplay.innerHTML = `<img src="${savedAvatar}" class="avatar-img-custom" alt="Avatar">`;
      presetBtns.forEach(b => b.classList.remove('active'));
    } else {
      avatarDisplay.innerHTML = savedAvatar;
      presetBtns.forEach(b => {
        if (b.getAttribute('data-avatar') === savedAvatar) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }
  }

  // Load stats into profile modal
  const bestScore = localStorage.getItem('symmrate_best_score') || '--';
  const totalScans = localStorage.getItem('symmrate_total_scans') || '0';
  
  if (document.getElementById('profile-best-score')) document.getElementById('profile-best-score').innerText = bestScore !== '--' ? bestScore + '%' : '--';
  if (document.getElementById('profile-total-scans')) document.getElementById('profile-total-scans').innerText = totalScans;
  if (document.getElementById('profile-rank')) document.getElementById('profile-rank').innerText = calculateRank(bestScore);
}

loadSavedProfile();

function calculateRank(score) {
  if (score === '--') return 'Unranked';
  const num = parseFloat(score);
  if (num >= 92) return 'Gigachad 👑';
  if (num >= 85) return 'Mogger ⚡';
  if (num >= 75) return 'Chadlite 🔥';
  if (num >= 65) return 'Normie';
  return 'Sub-Five';
}

// ==========================================
// 2. MEDIAPIPE AI FACE MESH & SYMMETRY ENGINE
// ==========================================

const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('overlay');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('start-btn');
const scanBtn = document.getElementById('scan-btn');
const cameraPlaceholder = document.getElementById('camera-placeholder');
const resultsCard = document.getElementById('results');

let latestLandmarks = null;
let cameraInstance = null;

// Initialize MediaPipe FaceMesh
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// Real-time canvas rendering callback
faceMesh.onResults((results) => {
  // Synchronize canvas size with live video aspect ratio
  if (canvasElement.width !== videoElement.videoWidth) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    latestLandmarks = results.multiFaceLandmarks[0];
    scanBtn.disabled = false; // Enable scan button when a face is present

    // Render facial mesh dots
    for (const point of latestLandmarks) {
      const x = point.x * canvasElement.width;
      const y = point.y * canvasElement.height;
      
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 1.2, 0, 2 * Math.PI);
      canvasCtx.fillStyle = '#0070f3';
      canvasCtx.fill();
    }
  } else {
    latestLandmarks = null;
    scanBtn.disabled = true;
  }
  canvasCtx.restore();
});

// Start Camera Handler
if (startBtn) {
  startBtn.addEventListener('click', () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      cameraInstance = new Camera(videoElement, {
        onFrame: async () => {
          await faceMesh.send({ image: videoElement });
        },
        width: 640,
        height: 480
      });
      
      cameraInstance.start();
      if (cameraPlaceholder) cameraPlaceholder.style.display = 'none';
      videoElement.style.display = 'block';
      startBtn.innerHTML = `<i data-lucide="refresh-cw"></i> Camera Active`;
      if (window.lucide) window.lucide.createIcons();
    } else {
      alert('Camera access is not supported by your browser.');
    }
  });
}

// 2D Distance Formula
function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Symmetry Percentage Calculation
function calculateSymmetryRatio(dist1, dist2) {
  if (dist1 === 0 || dist2 === 0) return 100;
  const ratio = Math.min(dist1, dist2) / Math.max(dist1, dist2);
  return Math.min(100, Math.max(0, ratio * 100));
}

// Face Scan Math Calculation
if (scanBtn) {
  scanBtn.addEventListener('click', () => {
    if (!latestLandmarks) return;

    // Key MediaPipe Indices:
    // 6: Nose Bridge (Center Axis reference)
    // Left Eye Outer (33), Right Eye Outer (263)
    // Left Jaw (172), Right Jaw (397)
    // Left Lip Corner (61), Right Lip Corner (291)
    
    const centerPoint = latestLandmarks[6];

    // 1. Eye Symmetry (Distance from center to outer corners)
    const leftEyeDist = getDistance(centerPoint, latestLandmarks[33]);
    const rightEyeDist = getDistance(centerPoint, latestLandmarks[263]);
    const eyeSymmetry = calculateSymmetryRatio(leftEyeDist, rightEyeDist);

    // 2. Jawline Symmetry (Distance from center to jaw corners)
    const leftJawDist = getDistance(centerPoint, latestLandmarks[172]);
    const rightJawDist = getDistance(centerPoint, latestLandmarks[397]);
    const jawSymmetry = calculateSymmetryRatio(leftJawDist, rightJawDist);

    // 3. Lips Proportion (Distance from center to mouth corners)
    const leftLipDist = getDistance(centerPoint, latestLandmarks[61]);
    const rightLipDist = getDistance(centerPoint, latestLandmarks[291]);
    const lipSymmetry = calculateSymmetryRatio(leftLipDist, rightLipDist);

    // 4. Weighted Overall Score
    const overallSymmetry = (eyeSymmetry * 0.4) + (jawSymmetry * 0.35) + (lipSymmetry * 0.25);

    // Update Results UI
    document.getElementById('score-value').innerText = `${overallSymmetry.toFixed(1)}%`;
    document.getElementById('eye-score').innerText = `${eyeSymmetry.toFixed(1)}%`;
    document.getElementById('jaw-score').innerText = `${jawSymmetry.toFixed(1)}%`;
    document.getElementById('lip-score').innerText = `${lipSymmetry.toFixed(1)}%`;

    if (resultsCard) resultsCard.classList.remove('hidden');

    // Update LocalStorage Stats
    let totalScans = parseInt(localStorage.getItem('symmrate_total_scans') || '0', 10);
    totalScans += 1;
    localStorage.setItem('symmrate_total_scans', totalScans.toString());

    let bestScore = parseFloat(localStorage.getItem('symmrate_best_score') || '0');
    if (overallSymmetry > bestScore) {
      localStorage.setItem('symmrate_best_score', overallSymmetry.toFixed(1));
    }

    // Refresh profile modal numbers
    loadSavedProfile();

    // Scroll smoothly to results card
    resultsCard.scrollIntoView({ behavior: 'smooth' });
  });
}
