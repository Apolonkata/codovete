// ==========================================
// 0. SUPABASE CLIENT INITIALIZATION
// ==========================================
const SUPABASE_URL = 'https://nhngytexcwzutrckgwzw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fumZiWoHnBYzFnvn71GnxQ_TYME4LZx';
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let currentUser = null;

if (supabase) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      currentUser = session.user;
      await fetchAndSyncProfile();
    } else {
      currentUser = null;
      loadLocalFallbackProfile();
    }
  });
}

async function fetchAndSyncProfile() {
  if (!supabase || !currentUser) return;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (error) {
    console.error('Error fetching Supabase profile:', error.message);
    return;
  }

  if (data) {
    if (usernameInput) usernameInput.value = data.display_name || '';
    
    if (avatarDisplay) {
      if (data.avatar_url && data.avatar_url.startsWith('data:image')) {
        avatarDisplay.innerHTML = `<img src="${data.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="Avatar">`;
      } else {
        avatarDisplay.innerHTML = data.avatar_url || '🔥';
      }
    }

    const bestScore = data.best_score || '--';
    const totalScans = data.total_scans || 0;

    if (document.getElementById('profile-best-score')) {
      document.getElementById('profile-best-score').innerText = bestScore !== '--' ? bestScore + '/100' : '--';
    }
    if (document.getElementById('profile-total-scans')) {
      document.getElementById('profile-total-scans').innerText = totalScans;
    }
    if (document.getElementById('profile-rank')) {
      document.getElementById('profile-rank').innerText = calculateRank(bestScore);
    }
  }
}

function loadLocalFallbackProfile() {
  const savedName = localStorage.getItem('symmrate_username');
  if (savedName && usernameInput) {
    usernameInput.value = savedName;
  }

  const savedAvatar = localStorage.getItem('symmrate_avatar');
  const avatarType = localStorage.getItem('symmrate_avatar_type');

  if (savedAvatar && avatarDisplay) {
    if (avatarType === 'image') {
      avatarDisplay.innerHTML = `<img src="${savedAvatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="Avatar">`;
      presetBtns.forEach(b => b.classList.remove('active'));
    } else {
      avatarDisplay.innerHTML = savedAvatar;
    }
  }

  const bestScore = localStorage.getItem('symmrate_best_score') || '--';
  const totalScans = localStorage.getItem('symmrate_total_scans') || '0';

  if (document.getElementById('profile-best-score')) {
    document.getElementById('profile-best-score').innerText = bestScore !== '--' ? bestScore + '/100' : '--';
  }
  if (document.getElementById('profile-total-scans')) {
    document.getElementById('profile-total-scans').innerText = totalScans;
  }
  if (document.getElementById('profile-rank')) {
    document.getElementById('profile-rank').innerText = calculateRank(bestScore);
  }
}

// ==========================================
// 1. NAVIGATION & PROFILE CONTROLS
// ==========================================

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
        avatarDisplay.innerHTML = `<img src="${event.target.result}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="Avatar">`;
        presetBtns.forEach(b => b.classList.remove('active'));
        localStorage.setItem('symmrate_avatar', event.target.result);
        localStorage.setItem('symmrate_avatar_type', 'image');
      };
      reader.readAsDataURL(file);
    }
  });
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener('click', async () => {
    const nameValue = usernameInput ? usernameInput.value.trim() : '';
    const avatarValue = localStorage.getItem('symmrate_avatar') || '🔥';

    localStorage.setItem('symmrate_username', nameValue);

    if (supabase && currentUser) {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: nameValue,
          avatar_url: avatarValue,
          updated_at: new Date()
        })
        .eq('id', currentUser.id);

      if (error) console.error('Error saving profile to Supabase:', error.message);
    }

    if (profileModal) profileModal.classList.add('hidden');
  });
}

function calculateRank(score) {
  if (score === '--') return 'Unranked';
  const num = parseFloat(score);
  if (num >= 85) return 'Gigachad 👑';
  if (num >= 75) return 'Mogger ⚡';
  if (num >= 65) return 'Chadlite 🔥';
  if (num >= 50) return 'Normie';
  return 'Sub-Five';
}

loadLocalFallbackProfile();

// ==========================================
// 2. AUTHENTICATION (SIGN UP & LOG IN)
// ==========================================

async function signUpUser(email, password) {
  if (!supabase) return;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) alert('Sign Up Error: ' + error.message);
  else alert('Account created successfully!');
}

async function signInUser(email, password) {
  if (!supabase) return;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert('Log In Error: ' + error.message);
  else alert('Logged in successfully!');
}

async function signOutUser() {
  if (!supabase) return;
  await supabase.auth.signOut();
  alert('Logged out.');
}

// ==========================================
// 3. MEDIAPIPE FACE MESH & SCORING ENGINE
// ==========================================

const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('overlay');
const canvasCtx = canvasElement ? canvasElement.getContext('2d') : null;
const startBtn = document.getElementById('start-btn');
const scanBtn = document.getElementById('scan-btn');
const cameraPlaceholder = document.getElementById('camera-placeholder');
const resultsCard = document.getElementById('results');

let latestLandmarks = null;
let cameraInstance = null;

const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

faceMesh.onResults((results) => {
  if (!canvasElement || !videoElement) return;

  if (canvasElement.width !== videoElement.videoWidth) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    latestLandmarks = results.multiFaceLandmarks[0];
    if (scanBtn) scanBtn.disabled = false;

    for (const point of latestLandmarks) {
      const x = point.x * canvasElement.width;
      const y = point.y * canvasElement.height;

      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 1.2, 0, 2 * Math.PI);
      canvasCtx.fillStyle = '#3b82f6';
      canvasCtx.fill();
    }
  } else {
    latestLandmarks = null;
    if (scanBtn) scanBtn.disabled = true;
  }
  canvasCtx.restore();
});

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
      if (videoElement) videoElement.style.display = 'block';
      startBtn.innerHTML = `<i data-lucide="refresh-cw"></i> Camera Active`;
      if (window.lucide) window.lucide.createIcons();
    } else {
      alert('Camera access not supported by browser.');
    }
  });
}

// 3D Distance Formula
function getDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = (p2.z && p1.z) ? (p2.z - p1.z) : 0;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Perpendicular distance calculation to mid-facial axis (A -> B)
function getPerpendicularDistance(P, A, B) {
  const AB = { x: B.x - A.x, y: B.y - A.y, z: (B.z || 0) - (A.z || 0) };
  const AP = { x: P.x - A.x, y: P.y - A.y, z: (P.z || 0) - (A.z || 0) };

  const abSq = AB.x * AB.x + AB.y * AB.y + AB.z * AB.z;
  if (abSq === 0) return getDistance(P, A);

  const dot = AP.x * AB.x + AP.y * AB.y + AP.z * AB.z;
  const t = dot / abSq;

  const proj = {
    x: A.x + t * AB.x,
    y: A.y + t * AB.y,
    z: (A.z || 0) + t * AB.z
  };

  return getDistance(P, proj);
}

function calculateSymmetryRatio(dist1, dist2) {
  if (dist1 === 0 || dist2 === 0) return 100;
  const ratio = Math.min(dist1, dist2) / Math.max(dist1, dist2);
  return Math.min(100, Math.max(0, ratio * 100));
}

function convertTo100Scale(rawPercent) {
  if (rawPercent >= 98) return Math.round(92 + (rawPercent - 98) * 4);
  if (rawPercent >= 92) return Math.round(80 + (rawPercent - 92) * 2);
  if (rawPercent >= 85) return Math.round(65 + (rawPercent - 85) * 2.14);
  if (rawPercent >= 70) return Math.round(40 + (rawPercent - 70) * 1.66);
  return Math.round(Math.max(10, rawPercent * 0.57));
}

// Update UI Bars and Dynamic Colors
function updateProgressBar(barId, textId, score) {
  const bar = document.getElementById(barId);
  const text = document.getElementById(textId);

  if (text) {
    text.innerText = `${score}/100`;
    text.className = 'category-score';
  }

  if (!bar) return;

  bar.className = 'progress-bar-fill';

  let colorClass = 'bar-green';
  let textColorClass = 'text-green';

  if (score < 40) {
    colorClass = 'bar-red';
    textColorClass = 'text-red';
  } else if (score < 60) {
    colorClass = 'bar-orange';
    textColorClass = 'text-orange';
  } else if (score < 80) {
    colorClass = 'bar-yellow';
    textColorClass = 'text-yellow';
  }

  bar.classList.add(colorClass);
  if (text) text.classList.add(textColorClass);

  setTimeout(() => {
    bar.style.width = `${score}%`;
  }, 100);
}

function generateImprovementTips(eye, jaw, lip, nose, midface) {
  const tipsContainer = document.getElementById('improvement-tips');
  if (!tipsContainer) return;

  let tipsHTML = '';

  if (jaw < 60) {
    tipsHTML += `
      <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 10px 14px; border-radius: 6px; font-size: 0.85rem;">
        <strong>🦴 Jawline Structure:</strong> Asymmetry detected in lower masseters. Chew evenly on both sides and practice posture alignment.
      </div>`;
  } else {
    tipsHTML += `
      <div style="background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e; padding: 10px 14px; border-radius: 6px; font-size: 0.85rem;">
        <strong>🦴 Jawline Structure:</strong> Solid lateral jaw symmetry and masseter balance.
      </div>`;
  }

  if (eye < 60) {
    tipsHTML += `
      <div style="background: rgba(249, 115, 22, 0.1); border-left: 3px solid #f97316; padding: 10px 14px; border-radius: 6px; font-size: 0.85rem;">
        <strong>👁️ Eye Area:</strong> Slight horizontal tilt variance. Ensure straight camera leveling for precise scanning.
      </div>`;
  } else {
    tipsHTML += `
      <div style="background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e; padding: 10px 14px; border-radius: 6px; font-size: 0.85rem;">
        <strong>👁️ Eye Area:</strong> Excellent pupil spacing and horizontal canthal balance.
      </div>`;
  }

  if (midface < 65) {
    tipsHTML += `
      <div style="background: rgba(234, 179, 8, 0.1); border-left: 3px solid #eab308; padding: 10px 14px; border-radius: 6px; font-size: 0.85rem;">
        <strong>📏 Midface Ratio:</strong> Midface height variance detected relative to ideal compact ratios.
      </div>`;
  }

  tipsContainer.innerHTML = tipsHTML;
}

if (scanBtn) {
  scanBtn.addEventListener('click', async () => {
    if (!latestLandmarks) return;

    // Facial Midline Vector (Top Mid-brow 10 -> Chin 152)
    const topMidline = latestLandmarks[10];
    const bottomMidline = latestLandmarks[152];

    // Reference Scale Baseline: Interpupillary Distance (IPD)
    const ipd = getDistance(latestLandmarks[33], latestLandmarks[263]);

    // 1. Eye Symmetry (Outer Canthi)
    const leftEyeDist = getPerpendicularDistance(latestLandmarks[33], topMidline, bottomMidline) / ipd;
    const rightEyeDist = getPerpendicularDistance(latestLandmarks[263], topMidline, bottomMidline) / ipd;
    const eyeScore = convertTo100Scale(calculateSymmetryRatio(leftEyeDist, rightEyeDist));

    // 2. Jawline Alignment (Jaw Angles 172 vs 397)
    const leftJawDist = getPerpendicularDistance(latestLandmarks[172], topMidline, bottomMidline) / ipd;
    const rightJawDist = getPerpendicularDistance(latestLandmarks[397], topMidline, bottomMidline) / ipd;
    const jawScore = convertTo100Scale(calculateSymmetryRatio(leftJawDist, rightJawDist));

    // 3. Lips Proportion (Mouth Corners 61 vs 291)
    const leftLipDist = getPerpendicularDistance(latestLandmarks[61], topMidline, bottomMidline) / ipd;
    const rightLipDist = getPerpendicularDistance(latestLandmarks[291], topMidline, bottomMidline) / ipd;
    const lipScore = convertTo100Scale(calculateSymmetryRatio(leftLipDist, rightLipDist));

    // 4. Nose Balance (Alares 129 vs 358)
    const leftNoseDist = getPerpendicularDistance(latestLandmarks[129], topMidline, bottomMidline) / ipd;
    const rightNoseDist = getPerpendicularDistance(latestLandmarks[358], topMidline, bottomMidline) / ipd;
    const noseScore = convertTo100Scale(calculateSymmetryRatio(leftNoseDist, rightNoseDist));

    // 5. Midface Ratio (Compactness Ratio: Pupil-to-Lip vs IPD)
    const midfaceHeight = getDistance(latestLandmarks[1], latestLandmarks[13]);
    const idealRatio = 0.95; // Golden ratio midface compact standard
    const currentRatio = midfaceHeight / ipd;
    const midfaceScore = Math.round(100 - (Math.abs(idealRatio - currentRatio) * 100));
    const clampedMidface = Math.min(99, Math.max(30, midfaceScore));

    // Weighted Overall Score
    const overallScore = Math.round(
      (eyeScore * 0.25) + 
      (jawScore * 0.25) + 
      (lipScore * 0.20) + 
      (noseScore * 0.15) + 
      (clampedMidface * 0.15)
    );

    // Update UI
    const scoreElem = document.getElementById('score-value');
    const tierElem = document.getElementById('overall-tier');
    if (scoreElem) scoreElem.innerText = overallScore;
    if (tierElem) tierElem.innerText = calculateRank(overallScore);

    updateProgressBar('eye-bar', 'eye-score-text', eyeScore);
    updateProgressBar('jaw-bar', 'jaw-score-text', jawScore);
    updateProgressBar('lip-bar', 'lip-score-text', lipScore);
    updateProgressBar('nose-bar', 'nose-score-text', noseScore);
    updateProgressBar('midface-bar', 'midface-score-text', clampedMidface);

    generateImprovementTips(eyeScore, jawScore, lipScore, noseScore, clampedMidface);

    if (resultsCard) resultsCard.classList.remove('hidden');

    // Local Storage Updates
    let totalScans = parseInt(localStorage.getItem('symmrate_total_scans') || '0', 10) + 1;
    localStorage.setItem('symmrate_total_scans', totalScans.toString());

    let bestScore = parseInt(localStorage.getItem('symmrate_best_score') || '0', 10);
    if (overallScore > bestScore) {
      bestScore = overallScore;
      localStorage.setItem('symmrate_best_score', bestScore.toString());
    }

    // Supabase Updates
    if (supabase && currentUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('best_score, total_scans')
        .eq('id', currentUser.id)
        .single();

      const newBestScore = Math.max(overallScore, profile?.best_score || 0);
      const newTotalScans = (profile?.total_scans || 0) + 1;

      await supabase
        .from('profiles')
        .update({
          best_score: newBestScore,
          total_scans: newTotalScans,
          rank_title: calculateRank(newBestScore),
          updated_at: new Date()
        })
        .eq('id', currentUser.id);

      await fetchAndSyncProfile();
    } else {
      loadLocalFallbackProfile();
    }

    if (resultsCard) resultsCard.scrollIntoView({ behavior: 'smooth' });
  });
}
  
