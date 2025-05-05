// Shared button colors for light themes
export const sharedColors = {
  positive: {
    'photoshop-light': '#2fb344',
    'photoshop-gray': '#2aa23d',
    'gruvbox-light': '#79740e',
    'dracula-light': '#05ae30',
    'material-light': '#43a047',
    'github-light': '#2ea44f',
    'solarized-light': '#859900',
    'one-light': '#50a14f',
    'nord-light': '#7da35c',
    'monokai-pro-light': '#80b319',
    'vscode-light': '#388e3c',
    'ayu-light': '#36c692'
  },
  negative: {
    'photoshop-light': '#ff5f52',
    'photoshop-gray': '#ff1300',
    'gruvbox-light': '#9d0006',
    'dracula-light': '#f33f33',
    'material-light': '#e53935',
    'github-light': '#d73a49',
    'solarized-light': '#dc322f',
    'one-light': '#e45649',
    'nord-light': '#bf616a',
    'monokai-pro-light': '#f8075e',
    'vscode-light': '#e53935',
    'ayu-light': '#ff3333'
  },
  neutral: {
    'photoshop-light': '#0099ff',
    'photoshop-gray': '#0099ff',
    'gruvbox-light': '#b57614',
    'dracula-light': '#6272a4',
    'material-light': '#1e88e5',
    'github-light': '#0969da',
    'solarized-light': '#268bd2',
    'one-light': '#0184bc',
    'nord-light': '#5e81ac',
    'monokai-pro-light': '#139eb9',
    'vscode-light': '#0066b8',
    'ayu-light': '#55b4d4'
  }
};

export const lightThemes = {
  // Base theme colors
  '--main-background-color': {
    'photoshop-light': '#f6f6f6',
    'photoshop-gray': '#e3e3e3',
    'gruvbox-light': '#fbf1c7',
    'dracula-light': '#ffffff',
    'material-light': '#fafafa',
    'github-light': '#ffffff',
    'solarized-light': '#fdf6e3',
    'one-light': '#fafafa',
    'nord-light': '#e5e9f0',
    'monokai-pro-light': '#f8f8f2',
    'vscode-light': '#ffffff',
    'ayu-light': '#fcfcfc'
  },
  '--secondary-background-color': {
    'photoshop-light': '#e6e6e6',
    'photoshop-gray': '#d4d4d4',
    'gruvbox-light': '#ebdbb2',
    'dracula-light': '#e9e9f4',
    'material-light': '#f5f5f5',
    'github-light': '#f6f8fa',
    'solarized-light': '#eee8d5',
    'one-light': '#f0f0f0',
    'nord-light': '#eceff4',
    'monokai-pro-light': '#f5f4f1',
    'vscode-light': '#f3f3f3',
    'ayu-light': '#f6f6f6'
  },
  '--main-text-color': {
    'photoshop-light': '#222222',
    'photoshop-gray': '#2d2d2d',
    'gruvbox-light': '#3c3836',
    'dracula-light': '#383a59',
    'material-light': '#212121',
    'github-light': '#24292e',
    'solarized-light': '#657b83',
    'one-light': '#383a42',
    'nord-light': '#2e3440',
    'monokai-pro-light': '#272822',
    'vscode-light': '#333333',
    'ayu-light': '#5c6166'
  },

  // Accent colors
  '--main-accent-color': sharedColors.neutral,
  '--secondary-accent-color': {
    'photoshop-light': '#ff5f52',
    'photoshop-gray': '#ff5f52',
    'gruvbox-light': '#79740e',
    'dracula-light': '#ff79c6',
    'material-light': '#ff5252',
    'github-light': '#8250df',
    'solarized-light': '#b58900',
    'one-light': '#e45649',
    'nord-light': '#a3be8c',
    'monokai-pro-light': '#fd971f',
    'vscode-light': '#b5200d',
    'ayu-light': '#ffd580'
  },
  '--third-accent-color': {
    'photoshop-light': '#2fb344',
    'photoshop-gray': '#2fb344',
    'gruvbox-light': '#427b58',
    'dracula-light': '#50fa7b',
    'material-light': '#43a047',
    'github-light': '#1a7f37',
    'solarized-light': '#2aa198',
    'one-light': '#50a14f',
    'nord-light': '#bf616a',
    'monokai-pro-light': '#a6e22e',
    'vscode-light': '#007acc',
    'ayu-light': '#36c692'
  },

  // Anchor colors
  '--link-color': {
    'photoshop-light': '#0099ff',
    'photoshop-gray': '#0099ff',
    'gruvbox-light': '#076678',
    'dracula-light': '#6272a4',
    'material-light': '#1976d2',
    'github-light': '#0969da',
    'solarized-light': '#268bd2',
    'one-light': '#0184bc',
    'nord-light': '#5e81ac',
    'monokai-pro-light': '#66d9ef',
    'vscode-light': '#0066b8',
    'ayu-light': '#55b4d4'
  },
  '--link-hover-color': {
    'photoshop-light': '#007acc',
    'photoshop-gray': '#007acc',
    'gruvbox-light': '#458588',
    'dracula-light': '#44475a',
    'material-light': '#1565c0',
    'github-light': '#054289',
    'solarized-light': '#005f87',
    'one-light': '#005f87',
    'nord-light': '#81a1c1',
    'monokai-pro-light': '#a1efe4',
    'vscode-light': '#005a9e',
    'ayu-light': '#36c692'
  },

  // Drag area colors
  '--drag-area-background-color': {
    'photoshop-light': '#e6e6e6',
    'photoshop-gray': '#d4d4d4',
    'gruvbox-light': '#ebdbb2',
    'dracula-light': '#e9e9f4',
    'material-light': '#eeeeee',
    'github-light': '#f6f8fa',
    'solarized-light': '#eee8d5',
    'one-light': '#eaeaea',
    'nord-light': '#eceff4',
    'monokai-pro-light': '#f5f4f1',
    'vscode-light': '#f3f3f3',
    'ayu-light': '#f6f6f6'
  },

  // Scrollbar colors
  '--scrollbar-thumb-color': {
    'photoshop-light': '#cccccc',
    'photoshop-gray': '#b8b8b8',
    'gruvbox-light': '#d5c4a1',
    'dracula-light': '#d6d6e7',
    'material-light': '#bdbdbd',
    'github-light': '#d0d7de',
    'solarized-light': '#d3cfc4',
    'one-light': '#cccccc',
    'nord-light': '#d8dee9',
    'monokai-pro-light': '#e0e0e0',
    'vscode-light': '#cccccc',
    'ayu-light': '#e6e6e6'
  },
  '--scrollbar-track-color': {
    'photoshop-light': '#f6f6f6',
    'photoshop-gray': '#e3e3e3',
    'gruvbox-light': '#fbf1c7',
    'dracula-light': '#f8f8f2',
    'material-light': '#fafafa',
    'github-light': '#f6f8fa',
    'solarized-light': '#fdf6e3',
    'one-light': '#fafafa',
    'nord-light': '#e5e9f0',
    'monokai-pro-light': '#f8f8f2',
    'vscode-light': '#f3f3f3',
    'ayu-light': '#fcfcfc'
  },

  // Border colors
  '--border-color': {
    'photoshop-light': '#d9d9d9',
    'photoshop-gray': '#c4c4c4',
    'gruvbox-light': '#d5c4a1',
    'dracula-light': '#d6d6e7',
    'material-light': '#e0e0e0',
    'github-light': '#d0d7de',
    'solarized-light': '#eee8d5',
    'one-light': '#e5e5e6',
    'nord-light': '#d8dee9',
    'monokai-pro-light': '#e0e0e0',
    'vscode-light': '#cccccc',
    'ayu-light': '#e6e6e6'
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
