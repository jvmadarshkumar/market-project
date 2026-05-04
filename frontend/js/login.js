import { apiFetch, saveToken, saveUser, isLoggedIn, showToast } from './api.js';

// Redirect if already logged in
if (isLoggedIn()) window.location.href = '/';

// ── User Login ──
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('login-submit');
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Logging in…';

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value,
      }),
    });
    // Prevent admin from logging in via the regular user login form
    if (data.user.role === 'admin') {
      errEl.textContent = 'Please use the 🛡️ Admin tab to login as administrator.';
      return;
    }
    saveToken(data.token);
    saveUser(data.user);
    showToast(`Welcome back, ${data.user.name}!`, 'success');
    setTimeout(() => { window.location.href = '/'; }, 800);
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Login';
  }
});

let pendingVerificationEmail = '';

// ── Register ──
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('reg-submit');
  const errEl = document.getElementById('reg-error');
  errEl.textContent = '';

  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    const data = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    
    pendingVerificationEmail = data.email || email;
    showToast(data.message || 'OTP sent! Please verify your email.', 'success');
    switchTab('verify-otp');
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
});

// ── Verify OTP ──
document.getElementById('verify-otp-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('otp-submit');
  const errEl = document.getElementById('otp-error');
  errEl.textContent = '';

  const otp = document.getElementById('otp-code').value.trim();

  if (otp.length !== 6) {
    errEl.textContent = 'OTP must be exactly 6 digits.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Verifying…';

  try {
    const data = await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: pendingVerificationEmail, otp }),
    });
    saveToken(data.token);
    saveUser(data.user);
    showToast(`Verified! Welcome, ${data.user.name}!`, 'success');
    setTimeout(() => { window.location.href = '/'; }, 800);
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Verify Account';
  }
});

let pendingResetEmail = '';

// ── Forgot Password ──
document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('forgot-submit');
  const errEl = document.getElementById('forgot-error');
  const succEl = document.getElementById('forgot-success');
  errEl.textContent = '';
  succEl.style.display = 'none';

  const email = document.getElementById('forgot-email').value.trim();
  if (!email) {
    errEl.textContent = 'Please enter your email.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending OTP…';

  try {
    const data = await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    
    pendingResetEmail = email;
    showToast(data.message || 'OTP sent! Check your email.', 'success');
    switchTab('reset-password');
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send OTP';
  }
});

// ── Reset Password ──
document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('reset-submit');
  const errEl = document.getElementById('reset-error');
  errEl.textContent = '';

  const otp = document.getElementById('reset-otp').value.trim();
  const newPassword = document.getElementById('reset-new-password').value;

  if (otp.length !== 6) {
    errEl.textContent = 'OTP must be exactly 6 digits.';
    return;
  }
  if (newPassword.length < 6) {
    errEl.textContent = 'New password must be at least 6 characters.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Resetting…';

  try {
    const data = await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: pendingResetEmail, otp, newPassword }),
    });
    
    showToast(data.message || 'Password successfully reset!', 'success');
    switchTab('login');
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Reset Password';
  }
});

// ── Admin Login ──
document.getElementById('admin-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('admin-submit');
  const errEl = document.getElementById('admin-error');
  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = '⏳ Verifying…';

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('admin-email').value.trim(),
        password: document.getElementById('admin-password').value,
      }),
    });

    // Ensure only admin role is accepted here
    if (data.user.role !== 'admin') {
      errEl.textContent = 'Access denied. This portal is for the administrator only.';
      return;
    }

    saveToken(data.token);
    saveUser(data.user);
    showToast(`Welcome, ${data.user.name}! Admin access granted.`, 'success');
    setTimeout(() => { window.location.href = '/dashboard.html'; }, 800);
  } catch (err) {
    errEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = '🛡️ Login as Admin';
  }
});
