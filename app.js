// ==========================================
// 1. THEME & NAVIGATION CONTROLS
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
  
  if (document.getElementById('profile-best-score')) {
    document.getElementById('profile-best-score').innerText = bestScore !== '--' ? bestScore + '/10' : '--';
  }
  if (document.getElementById('profile-total-scans')) {
    document.getElementById('profile-total-scans').innerText = totalScans;
  }
  if (document.getElementById('profile-rank')) {
    document.getElementById('profile-rank').innerText = calculateRank(bestScore);
  }
}

loadSavedProfile();

// Strict Rank Tier Calculator (/10 Scale)
function calculateRank(score) {
  if (score === '--') return 'Unranked';
  const num = parseFloat(score);
  if (num >= 8.5) return 'Gigachad 👑';
  if (num >= 7.5) return 'Mogger ⚡';
  if (num >= 6.5) return 'Chadlite 🔥';
  if (num >= 5.0) return 'Normie';
  return 'Sub-Five';
}

// ==========================================
// 2. MEDIAPIPE AI FACE MESH & SCORING ENGINE
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
  if (canvasElement.width !== videoElement.videoWidth) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    latestLandmarks = results.multiFaceLandmarks[0];
    scanBtn.disabled = false;

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

// Raw Symmetry Ratio
function calculateSymmetryRatio(dist1, dist2) {
  if (dist1 === 0 || dist2 === 0) return 100;
  const ratio = Math.min(dist1, dist2) / Math.max(dist1, dist2);
  return Math.min(100, Math.max(0, ratio * 100));
}

// Stricter Attractiveness Rating Curve (Maps standard 90-95% symmetry to realistic 6.0-7.8 range)
function convertToTenScale(rawPercent) {
  if (rawPercent < 75) {
    return (Math.max(1.0, (rawPercent / 20))).toFixed(1);
  }

  let score;
  if (rawPercent < 90) {
    // 75% -> 89.9% raw symmetry maps to 3.5 -> 6.2/10
    score = 3.5 + ((rawPercent - 75) * 0.18);
  } else if (rawPercent < 96) {
    // 90% -> 95.9% raw symmetry maps to 6.3 -> 7.8/10
    score = 6.3 + ((rawPercent - 90) * 0.25);
  } else {
    // 96% -> 100% raw symmetry maps to 7.9 -> 9.8/10 (Gigachad level)
    score = 7.9 + ((rawPercent - 96) * 0.47);
  }

  return Math.min(9.9, Math.max(1.0, score)).toFixed(1);
}

// Actionable Improvement Generator
function generateImprovementTips(eyeScore, jawScore, lipScore) {
  const tipsContainer = document.getElementById('improvement-tips');
  if (!tipsContainer) return;

  let tipsHTML = '';

  // Eye Analysis
  if (parseFloat(eyeScore) < 7.0) {
    tipsHTML += `
      <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 8px 12px; border-radius: 4px;">
        <strong>👁️ Eye Symmetry:</strong> Minor imbalance detected. Avoid sleeping predominantly on one side of your face and maintain posture alignment.
      </div>`;
  } else {
    tipsHTML += `
      <div style="background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e; padding: 8px 12px; border-radius: 4px;">
        <strong>👁️ Eye Symmetry:</strong> Excellent alignment and balanced periocular proportions.
      </div>`;
  }

  // Jawline Analysis
  if (parseFloat(jawScore) < 7.0) {
    tipsHTML += `
      <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 8px 12px; border-radius: 4px;">
        <strong>🦴 Jawline Alignment:</strong> Minor asymmetry. Practice proper tongue posture (mewing) and chew evenly on both sides of your mouth.
      </div>`;
  } else {
    tipsHTML += `
      <div style="background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e; padding: 8px 12px; border-radius: 4px;">
        <strong>🦴 Jawline Alignment:</strong> Strong lateral symmetry and sharp jawline masseter balance.
      </div>`;
  }

  // Lip Analysis
  if (parseFloat(lipScore) < 7.0) {
    tipsHTML += `
      <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 8px 12px; border-radius: 4px;">
        <strong>👄 Lower Face:</strong> Avoid mouth breathing to preserve proper palatal width and lip seal symmetry.
      </div>`;
  } else {
    tipsHTML += `
      <div style="background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e; padding: 8px 12px; border-radius: 4px;">
        <strong>👄 Lower Face:</strong> Proportional lip corner ratio and resting facial balance.
      </div>`;
  }

  tipsContainer.innerHTML = tipsHTML;
  if (window.lucide) window.lucide.createIcons();
}

// Face Scan Math Calculation
if (scanBtn) {
  scanBtn.addEventListener('click', () => {
    if (!latestLandmarks) return;

    const centerPoint = latestLandmarks[6];

    // 1. Eye Symmetry
    const leftEyeDist = getDistance(centerPoint, latestLandmarks[33]);
    const rightEyeDist = getDistance(centerPoint, latestLandmarks[263]);
    const rawEye = calculateSymmetryRatio(leftEyeDist, rightEyeDist);

    // 2. Jawline Symmetry
    const leftJawDist = getDistance(centerPoint, latestLandmarks[172]);
    const rightJawDist = getDistance(centerPoint, latestLandmarks[397]);
    const rawJaw = calculateSymmetryRatio(leftJawDist, rightJawDist);

    // 3. Lips Symmetry
    const leftLipDist = getDistance(centerPoint, latestLandmarks[61]);
    const rightLipDist = getDistance(centerPoint, latestLandmarks[291]);
    const rawLip = calculateSymmetryRatio(leftLipDist, rightLipDist);

    // Weighted raw score
    const rawOverall = (rawEye * 0.4) + (rawJaw * 0.35) + (rawLip * 0.25);

    // 4. Convert to 1/10 Ratings
    const eyeRating = convertToTenScale(rawEye);
    const jawRating = convertToTenScale(rawJaw);
    const lipRating = convertToTenScale(rawLip);
    const overallRating = convertToTenScale(rawOverall);

    // 5. Update UI
    document.getElementById('score-value').innerText = `${overallRating}/10`;
    document.getElementById('eye-score').innerText = `${eyeRating}/10`;
    document.getElementById('jaw-score').innerText = `${jawRating}/10`;
    document.getElementById('lip-score').innerText = `${lipRating}/10`;

    // Generate actionable improvement tips
    generateImprovementTips(eyeRating, jawRating, lipRating);

    if (resultsCard) resultsCard.classList.remove('hidden');

    // 6. Update LocalStorage Stats
    let totalScans = parseInt(localStorage.getItem('symmrate_total_scans') || '0', 10);
    totalScans += 1;
    localStorage.setItem('symmrate_total_scans', totalScans.toString());

    let bestScore = parseFloat(localStorage.getItem('symmrate_best_score') || '0');
    if (parseFloat(overallRating) > bestScore) {
      localStorage.setItem('symmrate_best_score', overallRating);
    }

    loadSavedProfile();
    resultsCard.scrollIntoView({ behavior: 'smooth' });
  });
}
