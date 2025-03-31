// Replace the entire updateCheck.js with this corrected version:
export function checkForUpdates() {
  const initialVersion = "0.0.0"; // Version used only for first run
  const localVersionKey = "KG_Chat_App_Version";
  const updateUrl = 'https://update.greasyfork.org/scripts/529368/KG_Chat_Application.meta.js';
  
  // Initialize localStorage version to initialVersion if not set yet
  if (!localStorage.getItem(localVersionKey)) {
    localStorage.setItem(localVersionKey, initialVersion);
  }
  
  // Get the stored version (which is now guaranteed to exist)
  const storedVersion = localStorage.getItem(localVersionKey);
  
  fetch(updateUrl)
    .then(response => response.text())
    .then(text => {
      // Extract version and download URL with regex
      const versionMatch = text.match(/@version\s+([\d.]+)/);
      const downloadUrlMatch = text.match(/@downloadURL\s+(https?:\/\/\S+)/);
      
      if (!versionMatch) throw new Error("Version not found in meta file");
      
      const latestVersion = versionMatch[1];
      const downloadUrl = downloadUrlMatch?.[1] || '';
      
      // Compare the remote version with the stored version
      if (latestVersion > storedVersion) {
        // Only update localStorage with the latest version after user accepts update
        showUpdatePopup(latestVersion, storedVersion, downloadUrl, () => {
          localStorage.setItem(localVersionKey, latestVersion);
        });
      }
    })
    .catch(error => console.error('Update check failed:', error));
}

function showUpdatePopup(newVersion, currentVersion, downloadUrl, onUpdateComplete) {
  // Create elements and apply styles in a more compact way
  const overlay = Object.assign(document.createElement('div'), {
    style: `position:fixed; top:0; left:0; width:100%; height:100%; 
            background-color:rgba(0,0,0,0.5); z-index:9999`
  });
  
  const popup = Object.assign(document.createElement('div'), {
    style: `position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); 
            background-color:white; padding:20px; border-radius:5px; 
            box-shadow:0 0 10px rgba(0,0,0,0.3); z-index:10000; max-width:400px`,
    innerHTML: `
      <h2 style="margin-top:0; color:#4285f4">Update Available</h2>
      <p>A new version (${newVersion}) of this script is available.</p>
      <p>You are currently using version ${currentVersion}</p>
      <div style="text-align:right; margin-top:15px">
        <button id="update-later" style="margin-right:10px; padding:5px 10px; background:#f1f1f1; 
                border:1px solid #ccc; border-radius:3px; cursor:pointer">Later</button>
        <button id="update-now" style="padding:5px 10px; background:#4285f4; color:white; 
                border:none; border-radius:3px; cursor:pointer">Update Now</button>
      </div>
    `
  });
  
  document.body.append(overlay, popup);
  
  // Set up event handlers with cleanup
  document.getElementById('update-later').addEventListener('click', () => {
    overlay.remove();
    popup.remove();
    // Don't update localStorage version when user clicks "Later"
  });
  
  document.getElementById('update-now').addEventListener('click', () => {
    // Call the callback to update the stored version
    if (onUpdateComplete) onUpdateComplete();
    window.location.href = downloadUrl;
  });
}