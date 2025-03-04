export function getAuthData() {
  // Ensure the function runs only on the gamelist page
  if (!window.location.href.startsWith('https://klavogonki.ru/gamelist/')) return;

  try {
    // Find the script containing PageData
    const script = Array.from(document.scripts).find(s => s.text.includes('PageData'));

    if (!script) throw new Error('PageData script not found');

    // Extract and parse the JSON-like data inside the script
    const rawData = script.text.match(/\.constant\('PageData', ([\s\S]*?})\)/)[1];

    const parsedData = JSON.parse(
      rawData
        .replace(/(\w+):/g, '"$1":') // Fix object keys
        .replace(/'/g, '"') // Fix string quotes
    );

    const username = `${parsedData.chatParams.user.id}#${parsedData.chatParams.user.login}`;
    const password = parsedData.chatParams.pass;

    // Store credentials in localStorage (persistent across sessions)
    localStorage.setItem('klavoauth', JSON.stringify({ username, password }));
    setTimeout(() => {
      window.location.href = 'https://klavogonki.ru';
    }, 500);

  } catch (e) {
    console.error('Auth error:', e);
    localStorage.removeItem('klavoauth');
    alert(`Auth failed: ${e.message}\nPlease refresh the page.`);
  }
};