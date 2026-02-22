// =====================================================================
// Google Apps Script — Email Signup Handler
// =====================================================================
// HOW TO SET UP:
//   1. Go to https://script.google.com → New Project
//   2. Replace the default code with this entire file
//   3. Update SHEET_ID below with your Google Sheets ID
//      (the long string in the sheet URL between /d/ and /edit)
//   4. Deploy → New deployment → Web app
//      - Execute as: Me
//      - Who has access: Anyone
//   5. Copy the deployment URL into script.js (GOOGLE_SCRIPT_URL)
// =====================================================================

const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Signups';

// Allowed origins — add your Vercel domain here
const ALLOWED_ORIGINS = [
  'https://your-project.vercel.app',
  'http://localhost:3000',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const email = data.email;

    // Validate email server-side
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid email' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Open sheet and append row
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    // Check for duplicate
    const emails = sheet.getRange('A:A').getValues().flat();
    if (emails.includes(email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'duplicate', message: 'Already registered' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Append: Email, Timestamp
    sheet.appendRow([email, new Date().toISOString()]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle preflight CORS (optional — not needed with no-cors mode)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Service is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}
