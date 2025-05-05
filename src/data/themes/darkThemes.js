// Shared button colors for dark themes
export const sharedColors = {
  positive: {
    'photoshop-dark': '#2fb344',
    'photoshop-black': '#2fb344',
    'gruvbox-dark': '#b8bb26',
    'one-dark-pro': '#98c379',
    'dracula-dark': '#50fa7b',
    'palenight-dark': '#c3e88d',
    'one-monokai-dark': '#a6e22e',
    'polykai-dark': '#a0ff20',
    'material-dark': '#43a047',
    'github-dark': '#238636',
    'solarized-dark': '#859900',
    'one-dark': '#98c379',
    'nord-dark': '#a3be8c',
    'monokai-pro-dark': '#a9dc76',
    'vscode-dark': '#388e3c',
    'ayu-dark': '#36c692',
    'ayu-mirage': '#36c692',
    'dark-soul': '#82b32a'
  },
  negative: {
    'photoshop-dark': '#ff5f52',
    'photoshop-black': '#ff5f52',
    'gruvbox-dark': '#cc241d',
    'one-dark-pro': '#e06c75',
    'dracula-dark': '#ff5555',
    'palenight-dark': '#f07178',
    'one-monokai-dark': '#f92672',
    'polykai-dark': '#ff0060',
    'material-dark': '#e53935',
    'github-dark': '#da3633',
    'solarized-dark': '#dc322f',
    'one-dark': '#e06c75',
    'nord-dark': '#bf616a',
    'monokai-pro-dark': '#fc618d',
    'vscode-dark': '#e53935',
    'ayu-dark': '#ff3333',
    'ayu-mirage': '#ff3333',
    'dark-soul': '#d8775a'
  },
  neutral: {
    'photoshop-dark': '#0099ff',
    'photoshop-black': '#0099ff',
    'gruvbox-dark': '#d79921',
    'one-dark-pro': '#e06c75',
    'dracula-dark': '#bd93f9',
    'palenight-dark': '#c792ea',
    'one-monokai-dark': '#f92672',
    'polykai-dark': '#40c4ff',
    'material-dark': '#90caf9',
    'github-dark': '#58a6ff',
    'solarized-dark': '#268bd2',
    'one-dark': '#61afef',
    'nord-dark': '#88c0d0',
    'monokai-pro-dark': '#a9dc76',
    'vscode-dark': '#569cd6',
    'ayu-dark': '#ffcc66',
    'ayu-mirage': '#ffcc66',
    'dark-soul': '#cdb398'
  }
};

export const darkThemes = {
  // Base theme colors
  '--main-background-color': {
    'photoshop-dark': '#2d2d2d',
    'photoshop-black': '#181818',
    'gruvbox-dark': '#282828',
    'one-dark-pro': '#282c34',
    'dracula-dark': '#282a36',
    'palenight-dark': '#292d3e',
    'one-monokai-dark': '#222222',
    'polykai-dark': '#141818',
    'material-dark': '#121212',
    'github-dark': '#0d1117',
    'solarized-dark': '#002b36',
    'one-dark': '#282c34',
    'nord-dark': '#2e3440',
    'monokai-pro-dark': '#2d2a2e',
    'vscode-dark': '#1e1e1e',
    'ayu-dark': '#0a0e14',
    'ayu-mirage': '#1f2430',
    'dark-soul': '#1e1e1e'
  },
  '--secondary-background-color': {
    'photoshop-dark': '#383838',
    'photoshop-black': '#222222',
    'gruvbox-dark': '#3c3836',
    'one-dark-pro': '#21252b',
    'dracula-dark': '#44475a',
    'palenight-dark': '#32374d',
    'one-monokai-dark': '#2a2a2a',
    'polykai-dark': '#1e2424',
    'material-dark': '#1e1e1e',
    'github-dark': '#161b22',
    'solarized-dark': '#073642',
    'one-dark': '#21252b',
    'nord-dark': '#3b4252',
    'monokai-pro-dark': '#363537',
    'vscode-dark': '#252526',
    'ayu-dark': '#151a1e',
    'ayu-mirage': '#232834',
    'dark-soul': '#2a2a2a'
  },
  '--main-text-color': {
    'photoshop-dark': '#e6e6e6',
    'photoshop-black': '#e6e6e6',
    'gruvbox-dark': '#ebdbb2',
    'one-dark-pro': '#abb2bf',
    'dracula-dark': '#f8f8f2',
    'palenight-dark': '#a6accd',
    'one-monokai-dark': '#d4d4d4',
    'polykai-dark': '#aaaaaa',
    'material-dark': '#e0e0e0',
    'github-dark': '#c9d1d9',
    'solarized-dark': '#839496',
    'one-dark': '#abb2bf',
    'nord-dark': '#d8dee9',
    'monokai-pro-dark': '#fcfcfa',
    'vscode-dark': '#d4d4d4',
    'ayu-dark': '#b3b1ad',
    'ayu-mirage': '#cbccc6',
    'dark-soul': '#cdb398'
  },

  // Accent colors
  '--main-accent-color': sharedColors.neutral,
  '--secondary-accent-color': {
    'photoshop-dark': '#ff5f52',
    'photoshop-black': '#ff5f52',
    'gruvbox-dark': '#fabd2f',
    'one-dark-pro': '#98c379',
    'dracula-dark': '#ff79c6',
    'palenight-dark': '#82aaff',
    'one-monokai-dark': '#a6e22e',
    'polykai-dark': '#ff0060',
    'material-dark': '#f48fb1',
    'github-dark': '#d2a8ff',
    'solarized-dark': '#b58900',
    'one-dark': '#e06c75',
    'nord-dark': '#bf616a',
    'monokai-pro-dark': '#fc9867',
    'vscode-dark': '#d7ba7d',
    'ayu-dark': '#ff3333',
    'ayu-mirage': '#ff3333',
    'dark-soul': '#ffa500'
  },
  '--third-accent-color': {
    'photoshop-dark': '#2fb344',
    'photoshop-black': '#2fb344',
    'gruvbox-dark': '#b8bb26',
    'one-dark-pro': '#56b6c2',
    'dracula-dark': '#50fa7b',
    'palenight-dark': '#89ddff',
    'one-monokai-dark': '#66d9ef',
    'polykai-dark': '#a0ff20',
    'material-dark': '#80cbc4',
    'github-dark': '#3fb950',
    'solarized-dark': '#2aa198',
    'one-dark': '#98c379',
    'nord-dark': '#a3be8c',
    'monokai-pro-dark': '#78dce8',
    'vscode-dark': '#4ec9b0',
    'ayu-dark': '#36c692',
    'ayu-mirage': '#36c692',
    'dark-soul': '#00ff58'
  },

  // Anchor colors
  '--link-color': {
    'photoshop-dark': '#0099ff',
    'photoshop-black': '#0099ff',
    'gruvbox-dark': '#458588',
    'one-dark-pro': '#61afef',
    'dracula-dark': '#8be9fd',
    'palenight-dark': '#80cbc4',
    'one-monokai-dark': '#66d9ef',
    'polykai-dark': '#40c4ff',
    'material-dark': '#90caf9',
    'github-dark': '#58a6ff',
    'solarized-dark': '#268bd2',
    'one-dark': '#61afef',
    'nord-dark': '#88c0d0',
    'monokai-pro-dark': '#78dce8',
    'vscode-dark': '#3794ff',
    'ayu-dark': '#5ccfe6',
    'ayu-mirage': '#5ccfe6',
    'dark-soul': '#82b32a'
  },
  '--link-hover-color': {
    'photoshop-dark': '#33adff',
    'photoshop-black': '#33adff',
    'gruvbox-dark': '#83a598',
    'one-dark-pro': '#61afef',
    'dracula-dark': '#8be9fd',
    'palenight-dark': '#80cbc4',
    'one-monokai-dark': '#66d9ef',
    'polykai-dark': '#6080ff',
    'material-dark': '#42a5f5',
    'github-dark': '#1f6feb',
    'solarized-dark': '#005f87',
    'one-dark': '#528bff',
    'nord-dark': '#81a1c1',
    'monokai-pro-dark': '#ab9df2',
    'vscode-dark': '#40a6ff',
    'ayu-dark': '#73d0ff',
    'ayu-mirage': '#73d0ff',
    'dark-soul': '#95cc30'
  },

  // Drag area colors
  '--drag-area-background-color': {
    'photoshop-dark': '#1f1f1f',
    'photoshop-black': '#0f0f0f',
    'gruvbox-dark': '#3c3836',
    'one-dark-pro': '#21252b',
    'dracula-dark': '#44475a',
    'palenight-dark': '#32374d',
    'one-monokai-dark': '#2a2a2a',
    'polykai-dark': '#1e2424',
    'material-dark': '#232323',
    'github-dark': '#161b22',
    'solarized-dark': '#073642',
    'one-dark': '#21252b',
    'nord-dark': '#3b4252',
    'monokai-pro-dark': '#363537',
    'vscode-dark': '#252526',
    'ayu-dark': '#151a1e',
    'ayu-mirage': '#232834',
    'dark-soul': '#171717'
  },

  // Scrollbar colors
  '--scrollbar-thumb-color': {
    'photoshop-dark': '#4a4a4a',
    'photoshop-black': '#2a2a2a',
    'gruvbox-dark': '#504945',
    'one-dark-pro': '#4b5263',
    'dracula-dark': '#44475a',
    'palenight-dark': '#444267',
    'one-monokai-dark': '#3e3e3e',
    'polykai-dark': '#3c4848',
    'material-dark': '#424242',
    'github-dark': '#30363d',
    'solarized-dark': '#586e75',
    'one-dark': '#3e4451',
    'nord-dark': '#4c566a',
    'monokai-pro-dark': '#403e41',
    'vscode-dark': '#424242',
    'ayu-dark': '#202734',
    'ayu-mirage': '#232834',
    'dark-soul': '#333333'
  },
  '--scrollbar-track-color': {
    'photoshop-dark': '#2d2d2d',
    'photoshop-black': '#181818',
    'gruvbox-dark': '#282828',
    'one-dark-pro': '#282c34',
    'dracula-dark': '#282a36',
    'palenight-dark': '#292d3e',
    'one-monokai-dark': '#222222',
    'polykai-dark': '#141818',
    'material-dark': '#121212',
    'github-dark': '#161b22',
    'solarized-dark': '#002b36',
    'one-dark': '#282c34',
    'nord-dark': '#2e3440',
    'monokai-pro-dark': '#2d2a2e',
    'vscode-dark': '#1e1e1e',
    'ayu-dark': '#0a0e14',
    'ayu-mirage': '#1f2430',
    'dark-soul': '#1e1e1e'
  },

  // Border colors
  '--border-color': {
    'photoshop-dark': '#4a4a4a',
    'photoshop-black': '#2a2a2a',
    'gruvbox-dark': '#504945',
    'one-dark-pro': '#4b5263',
    'dracula-dark': '#44475a',
    'palenight-dark': '#444267',
    'one-monokai-dark': '#3e3e3e',
    'polykai-dark': '#242424',
    'material-dark': '#333333',
    'github-dark': '#30363d',
    'solarized-dark': '#073642',
    'one-dark': '#181a1f',
    'nord-dark': '#434c5e',
    'monokai-pro-dark': '#403e41',
    'vscode-dark': '#333333',
    'ayu-dark': '#202734',
    'ayu-mirage': '#232834',
    'dark-soul': '#333333'
  },

  // Button colors
  '--add-button-color': sharedColors.positive,
  '--remove-button-color': sharedColors.negative,
  '--input-error-color': sharedColors.negative,
  '--yes-button-color': sharedColors.positive,
  '--no-button-color': sharedColors.negative,
  '--theme-button-color': sharedColors.neutral,
  '--send-button-color': sharedColors.neutral,

  // Hotkey colors
  '--hotkey-label-text-color': Object.fromEntries(
    Object.entries(sharedColors.neutral).map(([theme, color]) => [theme, color])
  ),
  '--hotkey-label-background-color': Object.fromEntries(
    Object.entries(sharedColors.neutral).map(([theme, color]) => [theme, color + '1a'])
  ),
  '--hotkey-label-border-color': Object.fromEntries(
    Object.entries(sharedColors.neutral).map(([theme, color]) => [theme, color + '66'])
  ),

  // Private mode input colors
  '--private-mode-color': sharedColors.negative,
  '--private-mode-placeholder-color': Object.fromEntries(
    Object.entries(sharedColors.negative).map(([theme, color]) => [theme, color + '80'])
  ),
  '--private-mode-background-color': Object.fromEntries(
    Object.entries(sharedColors.negative).map(([theme, color]) => [theme, color + '20'])
  ),

  // Private message sent colors
  '--private-message-sent-color': sharedColors.positive,
  '--private-message-sent-background-color': Object.fromEntries(
    Object.entries(sharedColors.positive).map(([theme, color]) => [theme, color + '20'])
  ),
  '--private-message-sent-border-color': Object.fromEntries(
    Object.entries(sharedColors.positive).map(([theme, color]) => [theme, color + '30'])
  ),
  '--private-message-sent-time-color': sharedColors.positive,

  // Private message received colors
  '--private-message-received-color': sharedColors.negative,
  '--private-message-received-background-color': Object.fromEntries(
    Object.entries(sharedColors.negative).map(([theme, color]) => [theme, color + '20'])
  ),
  '--private-message-received-border-color': Object.fromEntries(
    Object.entries(sharedColors.negative).map(([theme, color]) => [theme, color + '30'])
  ),
  '--private-message-received-time-color': sharedColors.negative,

  // System message colors
  '--system-message-color': sharedColors.neutral,
  '--system-message-background-color': Object.fromEntries(
    Object.entries(sharedColors.neutral).map(([theme, color]) => [theme, color + '20'])
  ),
  '--system-message-border-color': Object.fromEntries(
    Object.entries(sharedColors.neutral).map(([theme, color]) => [theme, color + '30'])
  ),
  '--system-message-time-color': sharedColors.neutral
};
