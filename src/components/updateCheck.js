export function checkForUpdates() {
  const initialVersion = "0.0.0"; // Version used only for first run
  const localVersionKey = "KG_Chat_App_Version";
  const metaUrl = 'https://update.greasyfork.org/scripts/529368/KG_Chat_Application.meta.js';
  const fullMetaUrl = metaUrl + '?rand=' + Date.now();
  // Fallback download URL (user script URL)
  const fallbackDownloadUrl = 'https://update.greasyfork.org/scripts/529368/KG_Chat_Application.user.js';

  // Initialize localStorage version to initialVersion if not set yet
  if (!localStorage.getItem(localVersionKey)) {
    localStorage.setItem(localVersionKey, initialVersion);
  }

  // Get the stored version (which is now guaranteed to exist)
  const storedVersion = localStorage.getItem(localVersionKey);

  fetch(fullMetaUrl)
    .then(response => response.text())
    .then(text => {
      // Updated regex: allow an optional "v" or "V" prefix and trim extra spaces
      const versionMatch = text.match(/@version\s+v?([\d.]+)/i);
      const downloadUrlMatch = text.match(/@downloadURL\s+(https?:\/\/\S+)/i);

      if (!versionMatch) {
        throw new Error("Version not found in meta file");
      }

      // Trim to remove any accidental whitespace
      const latestVersion = versionMatch[1].trim();

      // Get download URL from meta or fallback to a known URL
      let downloadUrl = (downloadUrlMatch && downloadUrlMatch[1]) || fallbackDownloadUrl;
      // Ensure that the download URL points to the user script, not the meta file
      downloadUrl = downloadUrl.replace('.meta.js', '.user.js');

      // Compare the remote version with the stored version
      if (compareVersions(latestVersion, storedVersion) > 0) {
        showUpdatePopup(latestVersion, storedVersion, downloadUrl, () => {
          localStorage.setItem(localVersionKey, latestVersion);
        });
      }
    })
    .catch(error => console.error('Update check failed:', error));
}

function showUpdatePopup(newVersion, currentVersion, downloadUrl, onUpdateComplete) {
  // Create overlay and popup elements and assign classes for styling
  const overlay = document.createElement('div');
  overlay.className = 'update-overlay';

  const popup = document.createElement('div');
  popup.className = 'update-popup';

  popup.innerHTML = `
      <h2>Update Available</h2>
      <p>A new version (${newVersion}) of KG_Chat_Application is available.</p>
      <p>You are currently using version ${currentVersion}.</p>
      <div class="button-container">
        <button id="update-later" class="update-later">Later</button>
        <button id="update-skip" class="update-skip">Skip</button>
        <button id="update-now" class="update-now">Update Now</button>
      </div>
  `;

  document.body.append(overlay, popup);

  // "Later" button: simply dismiss the popup without updating stored version
  document.getElementById('update-later').addEventListener('click', () => {
    overlay.remove();
    popup.remove();
  });

  // "Skip" button: dismiss the popup and update stored version so the user won't be prompted again for this version
  document.getElementById('update-skip').addEventListener('click', () => {
    if (onUpdateComplete) onUpdateComplete();
    overlay.remove();
    popup.remove();
  });

  // "Update Now" button: open a new tab with the download URL without updating the stored version
  document.getElementById('update-now').addEventListener('click', () => {
    if (onUpdateComplete) onUpdateComplete();
    window.open(downloadUrl, '_blank');
    overlay.remove();
    popup.remove();
  });
}

// Version compare helper function that supports versions with different lengths (e.g., 1.0 vs 1.0.1)
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
