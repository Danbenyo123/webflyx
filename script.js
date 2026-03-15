(() => {
  'use strict';

  // =====================================================================
  // CONFIGURATION
  // =====================================================================

  // Replace this URL with your Google Apps Script web app deployment URL.
  // To create one:
  //   1. Go to https://script.google.com and create a new project
  //   2. Paste the Apps Script code (see google-apps-script.js in this repo)
  //   3. Deploy → New deployment → Web app
  //   4. Set "Execute as" = Me, "Who has access" = Anyone
  //   5. Copy the deployment URL and paste it below
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby_45UISys4VS3M32woxn6f2YVl-oh3ZqNUE5X8wLm0Kk6-xOYc6Ux445OZKMdh77Sy/exec';

  // Rate limiting: minimum seconds between submissions
  const RATE_LIMIT_SECONDS = 30;

  // =====================================================================
  // DOM Elements
  // =====================================================================
  const form = document.getElementById('signup-form');
  const emailInput = document.getElementById('email');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  const messageEl = document.getElementById('form-message');
  const honeypot = document.getElementById('hp');

  // =====================================================================
  // Helpers
  // =====================================================================

  function getFbc() {
    const match = document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/);
    if (match) return match[1];
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (fbclid) return 'fb.1.' + Date.now() + '.' + fbclid;
    return null;
  }

  /** Basic email validation regex */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /** Sanitize input string */
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /** Show a message below the form */
  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'form-message ' + type;
  }

  /** Clear message */
  function clearMessage() {
    messageEl.textContent = '';
    messageEl.className = 'form-message';
  }

  /** Set loading state */
  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.hidden = loading;
    btnLoading.hidden = !loading;
  }

  /** Simple rate limiter using localStorage */
  function isRateLimited() {
    const lastSubmit = localStorage.getItem('_lastEmailSubmit');
    if (!lastSubmit) return false;
    const elapsed = (Date.now() - parseInt(lastSubmit, 10)) / 1000;
    return elapsed < RATE_LIMIT_SECONDS;
  }

  function recordSubmission() {
    localStorage.setItem('_lastEmailSubmit', Date.now().toString());
  }

  // =====================================================================
  // Form Submission
  // =====================================================================
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage();

    // Honeypot check — bots will fill this hidden field
    if (honeypot.value) {
      showMessage('תודה על ההרשמה!', 'success');
      return;
    }

    const email = sanitize(emailInput.value.trim());

    // Validate
    if (!email) {
      showMessage('נא להזין כתובת אימייל', 'error');
      emailInput.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showMessage('כתובת אימייל לא תקינה', 'error');
      emailInput.focus();
      return;
    }

    // Rate limit
    if (isRateLimited()) {
      showMessage('נא להמתין לפני שליחה נוספת', 'error');
      return;
    }

    // Submit via hidden iframe + form (bypasses CORS entirely)
    setLoading(true);

    try {
      await new Promise((resolve, reject) => {
        const iframeName = '_submit_frame_' + Date.now();
        const iframe = document.createElement('iframe');
        iframe.name = iframeName;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        const tempForm = document.createElement('form');
        tempForm.method = 'POST';
        tempForm.action = GOOGLE_SCRIPT_URL;
        tempForm.target = iframeName;
        tempForm.style.display = 'none';

        const emailField = document.createElement('input');
        emailField.name = 'email';
        emailField.value = email;
        tempForm.appendChild(emailField);

        document.body.appendChild(tempForm);

        iframe.addEventListener('load', () => {
          // Clean up
          document.body.removeChild(iframe);
          document.body.removeChild(tempForm);
          resolve();
        });

        iframe.addEventListener('error', () => {
          document.body.removeChild(iframe);
          document.body.removeChild(tempForm);
          reject(new Error('Submission failed'));
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
            document.body.removeChild(tempForm);
            resolve(); // Treat timeout as success (iframe may have loaded)
          }
        }, 10000);

        tempForm.submit();
      });

    // Generate event ID for Meta deduplication
      const eventId = 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const fbc = getFbc();

      // Send to MyMarketing + Meta CAPI in one call
      try {
          const res = await fetch('/api/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, eventId, fbc })
          });
          const data = await res.json();
          if (data.success) {
              fbq('track', 'Lead', {}, { eventID: eventId });
          }
      } catch (e) {}

      recordSubmission();
      emailInput.value = '';
      showSuccessOverlay();

    } catch (err) {
      showMessage('שגיאה בשליחה, נא לנסות שוב', 'error');
    } finally {
      setLoading(false);
    }
  });

  /** Show success overlay with animated checkmark */
  function showSuccessOverlay() {
    const overlay = document.getElementById('success-overlay');
    overlay.hidden = false;
  }

  // Clear error messages on input
  emailInput.addEventListener('input', () => {
    if (messageEl.classList.contains('error')) {
      clearMessage();
    }
  });

  // Scroll input into view when keyboard opens on mobile
  emailInput.addEventListener('focus', () => {
    setTimeout(() => {
      emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  });
})();
