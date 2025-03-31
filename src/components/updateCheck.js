export function checkForUpdates() {
  const initialVersion = "0.0.0"; // Version used only for first run
  const localVersionKey = "KG_Chat_App_Version";
  const metaUrl = 'https://update.greasyfork.org/scripts/529368/KG_Chat_Application.meta.js';
  // Fallback download URL (user script URL)
  const fallbackDownloadUrl = 'https://update.greasyfork.org/scripts/529368/KG_Chat_Application.user.js';

  // Initialize localStorage version to initialVersion if not set yet
  if (!localStorage.getItem(localVersionKey)) {
    localStorage.setItem(localVersionKey, initialVersion);
  }

  // Get the stored version (which is now guaranteed to exist)
  const storedVersion = localStorage.getItem(localVersionKey);

  fetch(metaUrl)
    .then(response => response.text())
    .then(text => {
      // Extract version and download URL with regex
      const versionMatch = text.match(/@version\s+([\d.]+)/);
      const downloadUrlMatch = text.match(/@downloadURL\s+(https?:\/\/\S+)/);

      if (!versionMatch) {
        throw new Error("Version not found in meta file");
      }

      const latestVersion = versionMatch[1];

      // Get download URL from meta or fallback to a known URL
      let downloadUrl = downloadUrlMatch?.[1] || fallbackDownloadUrl;
      // Ensure that the download URL points to the user script, not the meta file
      downloadUrl = downloadUrl.replace('.meta.js', '.user.js');

      // Compare the remote version with the stored version
      if (latestVersion > storedVersion) {
        // Only update localStorage with the latest version after user explicitly chooses to skip the update
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
      <p>A new version (${newVersion}) of KG_Chat_Application available.</p>
      <p>You are currently using version ${currentVersion}</p>
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
