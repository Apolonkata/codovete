// ==========================================
// 0. SUPABASE CLIENT INITIALIZATION
// ==========================================
// Make sure you include the Supabase CDN script in your HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_URL = 'https://nhngytexcwzutrckgwzw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fumZiWoHnBYzFnvn71GnxQ_TYME4LZx';
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let currentUser = null;

// Listen for Auth changes (login/logout)
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

// Fetch user profile from Supabase profiles table
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
    
    // Sync Avatar
    if (avatarDisplay) {
      if (data.avatar_url && data.avatar_url.startsWith('data:image')) {
        avatarDisplay.innerHTML = `<img src="${data.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt="Avatar">`;
      } else {
        avatarDisplay.innerHTML = data.avatar_url || '🔥';
      }
    }

    // Sync Stats
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

// Fallback to LocalStorage if user is offline/unauthenticated
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

// Save Profile button handler (Syncs both locally and to Supabase)
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

// Initial load fallback
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

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function calculateSymmetryRatio(dist1, dist2) {
  if (dist1 === 0 || dist2 === 0) return 100;
  const ratio = Math.min(dist1, dist2) / Math.max(dist1, dist2);
  return Math.min(100, Math.max(0, ratio * 100));
}

function convertTo100Scale(rawPercent) {
  if (rawPercent < 75) return Math.round(rawPercent / 2.5);

  let score;
  if (rawPercent < 90) {
    score = 35 + ((rawPercent - 75) * 1.8);
  } else if (rawPercent < 96) {
    score = 62 + ((rawPercent - 90) * 2.8);
  } else {
    score = 79 + ((rawPercent - 96) * 4.7);
  }

  return Math.min(99, Math.max(10, Math.round(score)));
}

function updateProgressBar(barId, textId, score) {
  const bar = document.getElementById(barId);
  const text = document.getElementById(textId);

  if (text) text.innerText = `${score}/100`;
  if (!bar) return;

  bar.className = 'progress-bar-fill';

  if (score < 40) {
    bar.classList.add('bar-red');
  } else if (score < 60) {
    bar.classList.add('bar-orange');
  } else if (score < 80) {
    bar.classList.add('bar-yellow');
  } else {
    bar.classList.add('bar-green');
  }

  setTimeout(() => {
    bar.style.width = `${score}%`;
  }, 100);
}

function generateImprovementTips(harmony, eye, jaw, nose, lip) {
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

  tipsContainer.innerHTML = tipsHTML;
}

// Scan Math Execution & Supabase Sync
if (scanBtn) {
  scanBtn.addEventListener('click', async () => {
    if (!latestLandmarks) return;

    const centerPoint = latestLandmarks[6];

    const leftEye = getDistance(centerPoint, latestLandmarks[33]);
    const rightEye = getDistance(centerPoint, latestLandmarks[263]);
    const eyeScore = convertTo100Scale(calculateSymmetryRatio(leftEye, rightEye));

    const leftJaw = getDistance(centerPoint, latestLandmarks[172]);
    const rightJaw = getDistance(centerPoint, latestLandmarks[397]);
    const jawScore = convertTo100Scale(calculateSymmetryRatio(leftJaw, rightJaw));

    const leftNose = getDistance(centerPoint, latestLandmarks[129]);
    const rightNose = getDistance(centerPoint, latestLandmarks[358]);
    const noseScore = convertTo100Scale(calculateSymmetryRatio(leftNose, rightNose));

    const leftLip = getDistance(centerPoint, latestLandmarks[61]);
    const rightLip = getDistance(centerPoint, latestLandmarks[291]);
    const lipScore = convertTo100Scale(calculateSymmetryRatio(leftLip, rightLip));

    const harmonyScore = Math.round((eyeScore * 0.3) + (jawScore * 0.3) + (noseScore * 0.2) + (lipScore * 0.2));
    const overallScore = Math.round((harmonyScore + eyeScore + jawScore) / 3);

    const scoreElem = document.getElementById('score-value');
    const tierElem = document.getElementById('overall-tier');
    if (scoreElem) scoreElem.innerText = overallScore;
    if (tierElem) tierElem.innerText = calculateRank(overallScore);

    updateProgressBar('harmony-bar', 'harmony-score-text', harmonyScore);
    updateProgressBar('eye-bar', 'eye-score-text', eyeScore);
    updateProgressBar('jaw-bar', 'jaw-score-text', jawScore);
    updateProgressBar('nose-bar', 'nose-score-text', noseScore);
    updateProgressBar('lip-bar', 'lip-score-text', lipScore);

    generateImprovementTips(harmonyScore, eyeScore, jawScore, noseScore, lipScore);

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
