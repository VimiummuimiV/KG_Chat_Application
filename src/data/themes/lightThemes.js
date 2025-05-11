// Shared button colors for light themes
export const sharedColors = {
  background: {
    'photoshop-light': '#f0f0f0',
    'photoshop-gray': '#b8b8b8',
    'gruvbox-light': '#fbf1c7',
    'dracula-light': '#ffffff',
    'material-light': '#fafafa',
    'github-light': '#ffffff',
    'solarized-light': '#fdf6e3',
    'one-light': '#fafafa',
    'nord-light': '#e5e9f0',
    'monokai-pro-light': '#f8f8f2',
    'ayu-light': '#fcfcfc',
    'paper-light': '#eeeeee',
    'dollar-light': '#e4e4d5',
    'ysgrifennwr': '#f9f8f4'
  },
  foreground: {
    'photoshop-light': '#f0f0f0',
    'photoshop-gray': '#a3a3a3',
    'gruvbox-light': '#ebdbb2',
    'dracula-light': '#e9e9f4',
    'material-light': '#d9d9d9',
    'github-light': '#f6f8fa',
    'solarized-light': '#eee8d5',
    'one-light': '#f0f0f0',
    'nord-light': '#eceff4',
    'monokai-pro-light': '#e8e5de',
    'ayu-light': '#e6eaed',
    'paper-light': '#cccccc',
    'dollar-light': '#d0d1bd',
    'ysgrifennwr': '#edece8'
  },
  highlight: {
    'photoshop-light': '#dbdbdb',
    'photoshop-gray': '#a3a3a3',
    'gruvbox-light': '#ebdbb2',
    'dracula-light': '#e9e9f4',
    'material-light': '#e6e6e6',
    'github-light': '#ebf0f4',
    'solarized-light': '#eee8d5',
    'one-light': '#eaeaea',
    'nord-light': '#d2d9e5',
    'monokai-pro-light': '#e8e5de',
    'ayu-light': '#e6eaed',
    'paper-light': '#d9d9d9',
    'dollar-light': '#d0d1bd',
    'ysgrifennwr': '#edece8'
  },

  // Accent colors
  firstAccent: {
    'photoshop-light': '#30ac44',
    'photoshop-gray': '#1b6427',
    'gruvbox-light': '#79740e',
    'dracula-light': '#05ae30',
    'material-light': '#43a047',
    'github-light': '#2ea44f',
    'solarized-light': '#859900',
    'one-light': '#50a14f',
    'nord-light': '#7da35c',
    'monokai-pro-light': '#80b319',
    'ayu-light': '#25c097',
    'paper-light': '#12a036',
    'dollar-light': '#12a036',
    'ysgrifennwr': '#8f9550'
  },
  secondAccent: {
    'photoshop-light': '#d23e32',
    'photoshop-gray': '#922920',
    'gruvbox-light': '#9d0006',
    'dracula-light': '#f33f33',
    'material-light': '#e53935',
    'github-light': '#d73a49',
    'solarized-light': '#dc322f',
    'one-light': '#e45649',
    'nord-light': '#bf616a',
    'monokai-pro-light': '#f8075e',
    'ayu-light': '#cf4b4d',
    'paper-light': '#d2181a',
    'dollar-light': '#d2181a',
    'ysgrifennwr': '#e05281'
  },
  thirdAccent: {
    'photoshop-light': '#1473e6',
    'photoshop-gray': '#0c468d',
    'gruvbox-light': '#b57614',
    'dracula-light': '#6272a4',
    'material-light': '#3c96ef',
    'github-light': '#0969da',
    'solarized-light': '#268bd2',
    'one-light': '#0184bc',
    'nord-light': '#5e81ac',
    'monokai-pro-light': '#139eb9',
    'ayu-light': '#32a7e9',
    'paper-light': '#1285a0',
    'dollar-light': '#8a9a6b',
    'ysgrifennwr': '#c38647'
  },
  fourthAccent: {
    'photoshop-light': '#1a66e1',
    'photoshop-gray': '#0075ff',
    'gruvbox-light': '#427b58',
    'dracula-light': '#8d602d',
    'material-light': '#234f5d',
    'github-light': '#2f4c77',
    'solarized-light': '#2aa198',
    'one-light': '#50a14f',
    'nord-light': '#bf616a',
    'monokai-pro-light': '#709d16',
    'ayu-light': '#fa8834',
    'paper-light': '#2e5d9a',
    'dollar-light': '#5f6a48',
    'ysgrifennwr': '#67c6d0'
  }
};

export const lightThemes = {
  // Background colors
  '--background-color': sharedColors.background,
  '--foreground-color': sharedColors.foreground,
  '--highlight-color': sharedColors.highlight,

  // Main text colors
  '--main-text-color': {
    'photoshop-light': '#6c6c6c',
    'photoshop-gray': '#535353',
    'gruvbox-light': '#3c3836',
    'dracula-light': '#665e92',
    'material-light': '#212121',
    'github-light': '#2c3136',
    'solarized-light': '#657b83',
    'one-light': '#383a42',
    'nord-light': '#2e3440',
    'monokai-pro-light': '#272822',
    'ayu-light': '#5c6167',
    'paper-light': '#444444',
    'dollar-light': '#555a56',
    'ysgrifennwr': '#424348'
  },

  // Drag area colors
  '--drag-area-background-color': {
    'photoshop-light': '#f0f0f0',
    'photoshop-gray': '#b8b8b8',
    'gruvbox-light': '#ebdbb2',
    'dracula-light': '#e9e9f4',
    'material-light': '#eeeeee',
    'github-light': '#f6f8fa',
    'solarized-light': '#eee8d5',
    'one-light': '#eaeaea',
    'nord-light': '#eceff4',
    'monokai-pro-light': '#f5f4f1',
    'ayu-light': '#f8f9fa',
    'paper-light': '#eeeeee',
    'dollar-light': '#e4e4d5',
    'ysgrifennwr': '#edece8'
  },

  // Border colors
  '--border-color': {
    'photoshop-light': '#d1d1d1',
    'photoshop-gray': '#9c9c9c',
    'gruvbox-light': '#d5c4a1',
    'dracula-light': '#d6d6e7',
    'material-light': '#e0e0e0',
    'github-light': '#e1e4e8',
    'solarized-light': '#eee8d5',
    'one-light': '#e5e5e6',
    'nord-light': '#d8dee9',
    'monokai-pro-light': '#e0e0e0',
    'ayu-light': '#eaecef',
    'paper-light': '#d9d9d9',
    'dollar-light': '#d0d1bd',
    'ysgrifennwr': '#edece8'
  },

  // Username filter (brightness) per light theme
  '--username-filter': {
    'photoshop-light': 'brightness(0.7)',
    'photoshop-gray': 'brightness(0.55)',
    'gruvbox-light': 'brightness(0.6)',
    'dracula-light': 'brightness(0.8)',
    'material-light': 'brightness(0.8)',
    'github-light': 'brightness(0.8)',
    'solarized-light': 'brightness(0.7)',
    'one-light': 'brightness(0.8)',
    'nord-light': 'brightness(0.7)',
    'monokai-pro-light': 'brightness(0.8)',
    'ayu-light': 'brightness(0.8)',
    'paper-light': 'brightness(0.7)',
    'dollar-light': 'brightness(0.6)',
    'ysgrifennwr': 'brightness(0.8)'
  },

  // Accent colors
  '--third-accent-color': sharedColors.thirdAccent,
  '--first-accent-color': sharedColors.firstAccent,
  '--second-accent-color': sharedColors.secondAccent,
  '--fourth-accent-color': sharedColors.fourthAccent,

  // Hotkey colors
  '--hotkey-label-text-color': sharedColors.fourthAccent,
  '--hotkey-label-background-color': Object.fromEntries(
    Object.entries(sharedColors.fourthAccent).map(([theme, color]) => [theme, color + '1a'])
  ),
  '--hotkey-label-border-color': Object.fromEntries(
    Object.entries(sharedColors.fourthAccent).map(([theme, color]) => [theme, color + '66'])
  ),

  // Private mode input colors
  '--private-mode-color': sharedColors.secondAccent,
  '--private-mode-placeholder-color': Object.fromEntries(
    Object.entries(sharedColors.secondAccent).map(([theme, color]) => [theme, color + 'cc'])
  ),
  '--private-mode-background-color': Object.fromEntries(
    Object.entries(sharedColors.secondAccent).map(([theme, color]) => [theme, color + '40'])
  ),

  // Private message sent colors
  '--private-message-sent-color': sharedColors.firstAccent,
  '--private-message-sent-background-color': Object.fromEntries(
    Object.entries(sharedColors.firstAccent).map(([theme, color]) => [theme, color + '20'])
  ),
  '--private-message-sent-border-color': Object.fromEntries(
    Object.entries(sharedColors.firstAccent).map(([theme, color]) => [theme, color + '30'])
  ),
  '--private-message-sent-time-color': sharedColors.firstAccent,

  // Private message received colors
  '--private-message-received-color': sharedColors.secondAccent,
  '--private-message-received-background-color': Object.fromEntries(
    Object.entries(sharedColors.secondAccent).map(([theme, color]) => [theme, color + '20'])
  ),
  '--private-message-received-border-color': Object.fromEntries(
    Object.entries(sharedColors.secondAccent).map(([theme, color]) => [theme, color + '30'])
  ),
  '--private-message-received-time-color': sharedColors.secondAccent,

  // System message colors
  '--system-message-color': sharedColors.thirdAccent,
  '--system-message-background-color': Object.fromEntries(
    Object.entries(sharedColors.thirdAccent).map(([theme, color]) => [theme, color + '20'])
  ),
  '--system-message-border-color': Object.fromEntries(
    Object.entries(sharedColors.thirdAccent).map(([theme, color]) => [theme, color + '30'])
  ),
  '--system-message-time-color': sharedColors.thirdAccent,

  // Ban message colors
  '--ban-message-color': sharedColors.fourthAccent,
  '--ban-message-background-color': Object.fromEntries(
    Object.entries(sharedColors.fourthAccent).map(([theme, color]) => [theme, color + '20'])
  ),
  '--ban-message-border-color': Object.fromEntries(
    Object.entries(sharedColors.fourthAccent).map(([theme, color]) => [theme, color + '30'])
  ),
  '--ban-message-time-color': sharedColors.fourthAccent
};
