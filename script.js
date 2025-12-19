// DOM Elements
const verifyScreen = document.getElementById('verifyScreen');
const certificateScreen = document.getElementById('certificateScreen');
const notFoundScreen = document.getElementById('notFoundScreen');

const nameInput = document.getElementById('nameInput');
const codeInput = document.getElementById('phoneInput'); // Using same ID, now for verification code
const verifyBtn = document.getElementById('verifyBtn');
const errorMessage = document.getElementById('errorMessage');

const recipientName = document.getElementById('recipientName');
const programType = document.getElementById('programType');
const activityPeriod = document.getElementById('activityPeriod');
const issueDate = document.getElementById('issueDate');
const certificateId = document.getElementById('certificateId');

const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');

// Current certificate data
let currentCertificateId = null;
let currentCertificateData = null;

// Initialize app
function init() {
  // Get certificate ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const idFromQuery = urlParams.get('id');

  // Also support path-based URL: /certificate/MODUCON-2025-01
  const pathMatch = window.location.pathname.match(/\/([A-Z]+-\d{4}-\d{2})$/i);
  const idFromPath = pathMatch ? pathMatch[1].toUpperCase() : null;

  currentCertificateId = idFromQuery || idFromPath;

  if (currentCertificateId) {
    // Check if certificate exists
    if (CERTIFICATE_DATA[currentCertificateId]) {
      currentCertificateData = CERTIFICATE_DATA[currentCertificateId];
      // Show verification screen to verify access
      showScreen('verify');
    } else {
      showScreen('notFound');
    }
  } else {
    // No ID - show verification screen for manual lookup
    showScreen('verify');
  }
}

// Show specific screen
function showScreen(screenName) {
  verifyScreen.classList.add('hidden');
  certificateScreen.classList.add('hidden');
  notFoundScreen.classList.add('hidden');

  switch (screenName) {
    case 'verify':
      verifyScreen.classList.remove('hidden');
      nameInput.focus();
      break;
    case 'certificate':
      certificateScreen.classList.remove('hidden');
      break;
    case 'notFound':
      notFoundScreen.classList.remove('hidden');
      break;
  }
}

// Verify credentials
function verifyCertificate() {
  const name = nameInput.value.trim();
  const code = codeInput.value.trim().toLowerCase();

  // Validation
  if (!name) {
    showError('이름을 입력해주세요.');
    nameInput.focus();
    return;
  }

  if (!code) {
    showError('인증 코드를 입력해주세요.');
    codeInput.focus();
    return;
  }

  // Check verification code
  if (code !== VERIFICATION_CODE) {
    showError('인증 코드가 올바르지 않습니다.');
    codeInput.focus();
    return;
  }

  // If we have a specific certificate ID from URL
  if (currentCertificateId && currentCertificateData) {
    if (currentCertificateData.name === name) {
      showCertificate(currentCertificateId, currentCertificateData);
    } else {
      showError('이름이 일치하지 않습니다.');
    }
    return;
  }

  // Search for matching certificate by name (no specific ID)
  let foundId = null;
  let foundData = null;

  for (const [id, data] of Object.entries(CERTIFICATE_DATA)) {
    if (data.name === name) {
      foundId = id;
      foundData = data;
      break;
    }
  }

  if (foundId) {
    currentCertificateId = foundId;
    currentCertificateData = foundData;

    // Update URL without page reload
    const newUrl = `${window.location.pathname}?id=${foundId}`;
    window.history.pushState({ id: foundId }, '', newUrl);

    showCertificate(foundId, foundData);
  } else {
    showError('일치하는 인증서를 찾을 수 없습니다.');
  }
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

// Clear error message
function clearError() {
  errorMessage.textContent = '';
  errorMessage.style.display = 'none';
}

// Display certificate
function showCertificate(id, data) {
  recipientName.textContent = data.name;
  programType.textContent = data.category;
  activityPeriod.textContent = data.period;
  issueDate.textContent = formatDate();
  certificateId.textContent = id;

  // Update page title
  document.title = `${data.name} - MODUCON 2025 인증서 | 모두의연구소`;

  showScreen('certificate');
}

// Format current date
function formatDate() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();
  return `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
}

// Get certificate URL
function getCertificateUrl(id) {
  // Use BASE_URL from data.js for production, or current location for dev
  if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
    return `${window.location.origin}${window.location.pathname}?id=${id}`;
  }
  return `${BASE_URL}?id=${id}`;
}

// Download certificate as PDF (print)
function downloadCertificate() {
  window.print();
}

// Share certificate
async function shareCertificate() {
  const name = currentCertificateData.name;
  const category = currentCertificateData.category;
  const url = getCertificateUrl(currentCertificateId);

  const shareData = {
    title: `MODUCON 2025 인증서 - ${name}`,
    text: `${name}님의 ${category} 인증서입니다.`,
    url: url
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        // Fallback to copy
        copyToClipboard(url);
      }
    }
  } else {
    // Fallback: copy URL
    copyToClipboard(url);
  }
}

// Copy link to clipboard
async function copyLink() {
  const url = getCertificateUrl(currentCertificateId);
  copyToClipboard(url);
}

// Copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('링크가 클립보드에 복사되었습니다.');
  } catch (error) {
    console.error('Clipboard error:', error);
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('링크가 클립보드에 복사되었습니다.');
  }
}

// Show toast notification
function showToast(message) {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Go back to verification
function goBack() {
  // Clear inputs
  nameInput.value = '';
  codeInput.value = '';
  clearError();

  // Clear URL parameter
  const newUrl = window.location.pathname;
  window.history.pushState({}, '', newUrl);

  // Reset state
  currentCertificateId = null;
  currentCertificateData = null;

  // Reset title
  document.title = 'MODUCON 2025 인증서 | 모두의연구소';

  showScreen('verify');
}

// Event Listeners
verifyBtn.addEventListener('click', verifyCertificate);

nameInput.addEventListener('input', clearError);
codeInput.addEventListener('input', clearError);

nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    codeInput.focus();
  }
});

codeInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    verifyCertificate();
  }
});

downloadBtn.addEventListener('click', downloadCertificate);
shareBtn.addEventListener('click', shareCertificate);

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.id) {
    currentCertificateId = e.state.id;
    currentCertificateData = CERTIFICATE_DATA[e.state.id];
    if (currentCertificateData) {
      showCertificate(currentCertificateId, currentCertificateData);
    }
  } else {
    goBack();
  }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
