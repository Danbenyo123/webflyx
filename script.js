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
  const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

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

    // Check if Google Script URL is configured
    if (GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      showMessage('תודה! (טופס עדיין לא מחובר)', 'success');
      emailInput.value = '';
      return;
    }

    // Submit
    setLoading(true);

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          timestamp: new Date().toISOString(),
        }),
      });

      // With no-cors mode, we can't read the response,
      // but if no error was thrown, we treat it as success.
      recordSubmission();
      showMessage('תודה על ההרשמה!', 'success');
      emailInput.value = '';

    } catch (err) {
      showMessage('שגיאה בשליחה, נא לנסות שוב', 'error');
    } finally {
      setLoading(false);
    }
  });

  // Clear error messages on input
  emailInput.addEventListener('input', () => {
    if (messageEl.classList.contains('error')) {
      clearMessage();
    }
  });
})();
