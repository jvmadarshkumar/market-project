import { authFetch, isLoggedIn, renderNav, showToast } from './api.js';

if (!isLoggedIn()) {
  showToast('Please login to change your password.', 'error');
  setTimeout(() => { window.location.href = '/login.html'; }, 800);
}

renderNav();

const cpForm = document.getElementById('change-password-form');
if (cpForm) {
  cpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('password-submit');
    const errEl = document.getElementById('password-error');
    errEl.textContent = '';

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;

    if (newPassword !== confirmPassword) {
      errEl.textContent = 'New passwords do not match.';
      return;
    }
    if (newPassword.length < 6) {
      errEl.textContent = 'New password must be at least 6 characters.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Updating…';

    try {
      const data = await authFetch('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      showToast(data.message || 'Password successfully updated!', 'success');
      cpForm.reset();
      
      // Redirect back to dashboard after a successful change
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1500);
      
    } catch (err) {
      errEl.textContent = err.message;
      btn.disabled = false;
      btn.textContent = 'Update Password';
    } 
  });
}
