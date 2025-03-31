export function checkForUpdates() {
  const currentVersion = GM_info.script.version;
  const updateUrl = 'https://update.greasyfork.org/scripts/529368/KG_Chat_Application.meta.js';

  GM_xmlhttpRequest({
    method: 'GET',
    url: updateUrl,
    onload: function (response) {
      try {
        const updateInfo = JSON.parse(response.responseText);
        const latestVersion = updateInfo.version;

        // Compare versions (simple string comparison)
        if (latestVersion > currentVersion) {
          showUpdatePopup(latestVersion, updateInfo.downloadUrl || GM_info.script.downloadURL);
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    },
    onerror: function () {
      console.error('Failed to check for updates');
    }
  });
}

function showUpdatePopup(newVersion, downloadUrl) {
  // Create popup overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '9999';

  // Create popup container
  const popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.style.top = '50%';
  popup.style.left = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.backgroundColor = 'white';
  popup.style.padding = '20px';
  popup.style.borderRadius = '5px';
  popup.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
  popup.style.zIndex = '10000';
  popup.style.maxWidth = '400px';

  popup.innerHTML = `
        <h2 style="margin-top: 0; color: #4285f4;">Update Available</h2>
        <p>A new version (${newVersion}) of this script is available.</p>
        <p>You are currently using version ${GM_info.script.version}</p>
        <div style="text-align: right; margin-top: 15px;">
            <button id="update-later" style="margin-right: 10px; padding: 5px 10px; background: #f1f1f1; border: 1px solid #ccc; border-radius: 3px; cursor: pointer;">Later</button>
            <button id="update-now" style="padding: 5px 10px; background: #4285f4; color: white; border: none; border-radius: 3px; cursor: pointer;">Update Now</button>
        </div>
    `;

  document.body.appendChild(overlay);
  document.body.appendChild(popup);

  // Handle button clicks
  document.getElementById('update-later').addEventListener('click', function () {
    document.body.removeChild(overlay);
    document.body.removeChild(popup);
  });

  document.getElementById('update-now').addEventListener('click', function () {
    window.location.href = downloadUrl;
  });
}