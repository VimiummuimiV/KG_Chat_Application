// auth.js - Should be loaded ONLY on gamelist page
(function() {
  // Only execute on gamelist page
  if (!window.location.href.startsWith('https://klavogonki.ru/gamelist/')) return;

  try {
    // Find the script containing PageData
    const script = Array.from(document.scripts)
      .find(s => s.text.includes('PageData'));
    
    if (!script) throw new Error('PageData script not found');

    // Extract and parse the data
    const rawData = script.text.match(/\.constant\('PageData', ([\s\S]*?})\)/)[1];
    const parsedData = JSON.parse(
      rawData
        .replace(/(\w+):/g, '"$1":') // Fix key quotes
        .replace(/'/g, '"')         // Fix string quotes
    );

    // Store credentials
    localStorage.setItem('klavoauth', JSON.stringify({
      username: `${parsedData.chatParams.user.id}#${parsedData.chatParams.user.login}`,
      password: parsedData.chatParams.pass
    }));

    // Redirect to game page after short delay
    setTimeout(() => {
      window.location.href = 'https://klavogonki.ru/g/';
    }, 500);

  } catch(e) {
    console.error('Auth error:', e);
    localStorage.removeItem('klavoauth');
    alert(`Auth failed: ${e.message}\nPlease refresh the page.`);
  }
})();