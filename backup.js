// --- Theme Toggle ---
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

// Restore theme on load
if (localStorage.getItem('symmrate_theme') === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
}

// --- Navigation Dropdown ---
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

// --- Profile Modal Controls ---
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

// --- Avatar Selection & Upload ---
const avatarDisplay = document.getElementById('avatar-display');
const presetBtns = document.querySelectorAll('.preset-btn');
const avatarInput = document.getElementById('avatar-upload-input');
const usernameInput = document.getElementById('username-input');

// Handle preset emoji picks
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

// Handle custom image file uploads
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

// Save profile name
if (saveProfileBtn) {
  saveProfileBtn.addEventListener('click', () => {
    if (usernameInput) {
      localStorage.setItem('symmrate_username', usernameInput.value.trim());
    }
    profileModal.classList.add('hidden');
  });
}

// Restore saved profile settings on page load
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
}

loadSavedProfile();
