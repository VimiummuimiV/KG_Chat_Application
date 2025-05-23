const svgUrl = "http://www.w3.org/2000/svg";
const iconSize = 24;

export const sendSVG = `
  <svg class="send" xmlns="${svgUrl}" 
  width="${iconSize}" 
  height="${iconSize}" 
  viewBox="-10 -10 270 270">
    <path d="M22.32 98.04l-19.04 -87.15c-0.75,-3.46 0.48,-6.84 3.29,-9 2.81,-2.17 6.39,-2.49 9.55,-0.87l225.95 116.02c3.07,1.57 4.87,4.52 4.87,7.96 0,3.44 -1.8,6.39 -4.87,7.96l-225.95 116.02c-3.16,1.62 -6.74,1.3 -9.55,-0.87 -2.81,-2.16 -4.04,-5.54 -3.29,-9l19.04 -87.15c0.79,-3.62 3.53,-6.26 7.18,-6.91l102.6 -18.19c0.91,-0.16 1.56,-0.94 1.56,-1.86 0,-0.92 -0.65,-1.7 -1.56,-1.86l-102.6 -18.19c-3.65,-0.65 -6.39,-3.29 -7.18,-6.91z"/>
  </svg>`;

export const closeSVG = `
  <svg class="no" xmlns="${svgUrl}" 
  width="${iconSize / 1.6}" 
  height="${iconSize / 1.6}" 
  viewBox="0 0 250 250" 
  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
      <path d="M46.62 0l156.76 0c25.64,0 46.62,20.98 46.62,46.62l0 156.75c0,25.65 -20.98,46.63 -46.62,46.63l-156.76 0c-25.64,0 -46.62,-20.98 -46.62,-46.63l0 -156.75c0,-25.64 20.98,-46.62 46.62,-46.62zm45.71 70.24l32.67 32.67 32.67 -32.67c2.73,-2.73 7.18,-2.73 9.91,0l12.18 12.18c2.73,2.73 2.73,7.18 0,9.91l-32.67 32.67 32.67 32.66c2.73,2.74 2.73,7.19 0,9.92l-12.18 12.18c-2.73,2.73 -7.18,2.73 -9.91,0l-32.67 -32.67 -32.67 32.67c-2.73,2.73 -7.18,2.73 -9.91,0l-12.18 -12.18c-2.73,-2.73 -2.73,-7.18 0,-9.92l32.67 -32.66 -32.67 -32.67c-2.73,-2.73 -2.73,-7.18 0,-9.91l12.18 -12.18c2.73,-2.73 7.18,-2.73 9.91,0z"/>
  </svg>`;

export const openSVG = `
  <svg class="yes" xmlns="${svgUrl}" 
  width="${iconSize / 1.6}" 
  height="${iconSize / 1.6}" 
  viewBox="0 0 250 250" 
  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
      <path d="M46.62 0l156.76 0c25.64,0 46.62,20.98 46.62,46.62l0 156.75c0,25.65 -20.98,46.63 -46.62,46.63l-156.76 0c-25.64,0 -46.62,-20.98 -46.62,-46.63l0 -156.75c0,-25.64 20.98,-46.62 46.62,-46.62zm15.5 135.79l57.92 -57.93c2.73,-2.73 7.19,-2.72 9.92,0.01l57.92 57.92c2.73,2.73 2.73,7.18 0,9.91l-12.18 12.18c-2.73,2.73 -7.18,2.73 -9.92,0l-35.82 -35.83c-2.73,-2.73 -7.19,-2.73 -9.92,0l-35.82 35.83c-2.74,2.73 -7.19,2.73 -9.92,0l-12.18 -12.18c-2.73,-2.73 -2.73,-7.18 0,-9.91z"/>
  </svg>`;

export const collapseSVG = `
  <svg class="yes" xmlns="${svgUrl}" 
  width="${iconSize / 1.6}" 
  height="${iconSize / 1.6}" 
  viewBox="0 0 250 250"
  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
    <path d="M46.62 0l156.76 0c25.64,0 46.62,20.98 46.62,46.62l0 156.75c0,25.65 -20.98,46.63 -46.62,46.63l-156.76 0c-25.64,0 -46.62,-20.98 -46.62,-46.63l0 -156.75c0,-25.64 20.98,-46.62 46.62,-46.62zm109.99 181.69l-75.07 0c-7.3,0 -13.23,-5.92 -13.23,-13.22l0 -75.08c0,-2.35 1.92,-4.28 4.28,-4.28l17.9 0c2.35,0 4.27,1.93 4.27,4.28l0 32.81c0,1.77 1.01,3.28 2.64,3.96 1.63,0.67 3.42,0.33 4.66,-0.93l59.68 -59.68c1.67,-1.65 4.38,-1.65 6.05,0l12.66 12.66c1.66,1.67 1.66,4.38 0,6.05l-59.68 59.68c-1.26,1.24 -1.6,3.03 -0.93,4.66 0.68,1.63 2.19,2.64 3.96,2.64l32.81 0c2.35,0 4.28,1.92 4.28,4.28l0 17.9c0,2.36 -1.93,4.28 -4.28,4.28z"/>
  </svg>`;

export const expandSVG = `
  <svg class="no" xmlns="${svgUrl}" 
  width="${iconSize / 1.6}" 
  height="${iconSize / 1.6}" 
  viewBox="0 0 250 250"
  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
    <path d="M46.62 0l156.76 0c25.64,0 46.62,20.98 46.62,46.62l0 156.75c0,25.65 -20.98,46.63 -46.62,46.63l-156.76 0c-25.64,0 -46.62,-20.98 -46.62,-46.63l0 -156.75c0,-25.64 20.98,-46.62 46.62,-46.62zm46.77 68.31l75.07 0c7.3,0 13.23,5.92 13.23,13.22l0 75.08c0,2.35 -1.92,4.28 -4.28,4.28l-17.9 0c-2.35,0 -4.27,-1.93 -4.27,-4.28l0 -32.81c0,-1.77 -1.01,-3.28 -2.64,-3.96 -1.63,-0.67 -3.42,-0.33 -4.66,0.93l-59.68 59.68c-1.67,1.65 -4.38,1.65 -6.05,0l-12.66 -12.66c-1.66,-1.67 -1.66,-4.38 0,-6.05l59.68 -59.68c1.26,-1.24 1.6,-3.03 0.93,-4.66 -0.68,-1.63 -2.19,-2.64 -3.96,-2.64l-32.81 0c-2.35,0 -4.28,-1.92 -4.28,-4.27l0 -17.9c0,-2.36 1.93,-4.28 4.28,-4.28z"/>
  </svg>`;

export const helpSVG = `
  <svg class="help" xmlns="${svgUrl}" 
  width="${iconSize / 1.6}" 
  height="${iconSize / 1.6}" 
  viewBox="0 0 250 250"
  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
    <path d="M46.59 0l156.82 0c25.65,0 46.59,20.94 46.59,46.59l0 156.82c0,25.65 -20.94,46.59 -46.59,46.59l-156.82 0c-25.65,0 -46.59,-20.94 -46.59,-46.59l0 -156.82c0,-25.65 20.94,-46.59 46.59,-46.59zm130.96 87.85c0,6.57 -1.03,12.72 -3.08,18.06 -2.05,5.34 -4.93,9.85 -8.42,13.75 -3.69,3.9 -8,7.39 -13.13,10.47 -4.11,2.46 -8.83,4.93 -13.96,6.98 -1.64,0.82 -2.87,2.46 -2.87,4.51l0 15.19c0,2.67 -2.06,4.72 -4.73,4.72l-25.04 0c-2.66,0 -4.92,-2.05 -4.92,-4.72l0 -25.65c0,-2.26 1.44,-3.9 3.49,-4.52 2.87,-1.02 5.95,-2.05 9.23,-3.28 4.52,-1.85 8.62,-3.9 12.11,-6.57 3.9,-2.67 6.78,-5.75 9.24,-9.24 2.46,-3.49 3.49,-7.59 3.49,-12.31 0,-6.78 -2.05,-11.7 -6.36,-14.78 -4.31,-2.88 -10.06,-4.52 -17.65,-4.52 -5.75,0 -11.7,1.24 -18.07,3.7 -5.33,2.05 -9.85,4.31 -13.13,6.36 -1.03,0.62 -2.26,0.62 -3.29,0 -1.02,-0.62 -1.64,-1.64 -1.64,-2.87l0 -23.2c0,-2.05 1.23,-3.9 3.08,-4.51 4.1,-1.44 9.44,-3.08 15.8,-4.52 8.42,-2.05 17.24,-3.07 26.89,-3.07 8.42,0 16.01,1.02 22.58,3.07 6.36,2.06 12.11,4.72 16.62,8.42 4.52,3.49 7.8,7.8 10.27,12.72 2.26,4.73 3.49,10.06 3.49,15.81l0 0zm-46.19 114.12l-25.04 0c-2.67,0 -4.92,-2.05 -4.92,-4.72l0 -17.24c0,-2.67 2.25,-4.72 4.92,-4.72l25.04 0c2.67,0 4.72,2.05 4.72,4.72l0 17.24c0,2.67 -2.05,4.72 -4.72,4.72z"/>
  </svg>`;

export const magicWandSVG = `
  <svg class="theme" xmlns="${svgUrl}" 
  width="${iconSize / 1.6}" 
  height="${iconSize / 1.6}" 
  viewBox="0 0 250 250" 
  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
    <path d="M46.59 0l156.82 0c25.65,0 46.59,20.94 46.59,46.59l0 156.82c0,25.65 -20.94,46.59 -46.59,46.59l-156.82 0c-25.65,0 -46.59,-20.94 -46.59,-46.59l0 -156.82c0,-25.65 20.94,-46.59 46.59,-46.59zm5.64 173.13l65.47 -60.21c4.39,-4.03 11.2,-3.74 15.41,0.47l3.42 3.42c4.21,4.21 4.5,11.02 0.47,15.41l-60.22 65.47c-2.17,2.37 -4.86,3.69 -8.08 3.79 -3.21,0.1 -6.02,-1.01 -8.29,-3.29l-8.68 -8.68c-2.28,-2.28 -3.39,-5.08 -3.29,-8.3 0.1,-3.21 1.42,-5.9 3.79,-8.08zm142.53 -113.72l-4.72 22.03 11.64 21.05c0.62,1.11 0.63,2.35 0.05,3.47 -0.59,1.13 -1.62,1.82 -2.87,1.95l-22.41 2.32 -16.43 17.58c-0.86,0.93 -2.03,1.32 -3.28,1.11 -1.25,-0.21 -2.23,-0.97 -2.74,-2.12l-9.13 -20.59 -21.8 -10.19c-1.15,-0.54 -1.89,-1.53 -2.07,-2.78 -0.19,-1.26 0.23,-2.42 1.17,-3.27l16.76 -15.05 2.96 -23.87c0.16,-1.26 0.87,-2.27 2.01,-2.83 1.13,-0.57 2.37,-0.53 3.47,0.11l19.48 11.29 23.63 -4.57c1.24,-0.24 2.42,0.13 3.31,1.03 0.89,0.91 1.23,2.09 0.97,3.33z"/>
  </svg>`;

export const userColorsSVG = `
  <svg class="colors" xmlns="${svgUrl}" 
  width="${iconSize / 1.6}" 
  height="${iconSize / 1.6}" 
  viewBox="0 0 250 250"
  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
    <path d="M46.59 0l156.82 0c25.65,0 46.59,20.94 46.59,46.59l0 156.82c0,25.65 -20.94,46.59 -46.59,46.59l-156.82 0c-25.65,0 -46.59,-20.94 -46.59,-46.59l0 -156.82c0,-25.65 20.94,-46.59 46.59,-46.59zm78.41 47.82c9.23,0 17.59,3.75 23.65,9.8 6.05,6.05 9.79,14.41 9.79,23.64 0,9.23 -3.74,17.6 -9.79,23.65 -6.06,6.05 -14.42,9.79 -23.65,9.79 -9.23,0 -17.59,-3.74 -23.64,-9.79 -6.06,-6.05 -9.8,-14.42 -9.8,-23.65 0,-9.23 3.74,-17.59 9.8,-23.64 6.05,-6.05 14.41,-9.8 23.64,-9.8zm-73.59 146.17c1.72,-38.79 33.75,-70.35 73.59,-70.35 39.84,0 71.87,31.56 73.59,70.35 0.17,4.09 -3.07,7.49 -7.16,7.49l-14.83 0c-3.81,0 -6.94,-2.98 -7.16,-6.77 -1.34,-23.41 -20.72,-41.9 -44.44,-41.9 -23.51,0 -43.09,18.27 -44.44,41.9 -0.21,3.79 -3.35,6.77 -7.15,6.77l-14.84 0c-4.09,0 -7.33,-3.4 -7.16,-7.49z"/>
</svg>`;

export const blockedUsersSVG = `
  <svg class="blocked" xmlns="${svgUrl}" 
  width="${iconSize / 1.6}" 
  height="${iconSize / 1.6}" 
  viewBox="0 0 250 250"
  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
    <path d="M46.59 0l156.82 0c25.65,0 46.59,20.94 46.59,46.59l0 156.82c0,25.65 -20.94,46.59 -46.59,46.59l-156.82 0c-25.65,0 -46.59,-20.94 -46.59,-46.59l0 -156.82c0,-25.65 20.94,-46.59 46.59,-46.59zm78.41 45.74c43.78,0 79.26,35.49 79.26,79.26 0,43.78 -35.48,79.26 -79.26,79.26 -43.77,0 -79.26,-35.49 -79.26,-79.26 0,-43.77 35.49,-79.26 79.26,-79.26zm-28.51 33.08l74.7 74.69c13.19,-21.32 9.98,-49.1 -7.81,-66.88 -17.79,-17.79 -45.56,-21.01 -66.89,-7.81zm57.02 92.37l-74.69 -74.7c-13.19,21.32 -9.98,49.1 7.8,66.88 17.81,17.78 45.54,21.02 66.89,7.82z"/>
</svg>`;

export const smileSVG = `
  <svg class="smile" xmlns="${svgUrl}"
  width="${iconSize}"
  height="${iconSize}"
  viewBox="-10 -10 270 270"
  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
    <defs>
      <linearGradient id="id0" gradientUnits="objectBoundingBox" x1="50.0025%" y1="0%" x2="50.0025%" y2="100%">
        <stop offset="0" style="stop-opacity:0.8; stop-color:white"/>
        <stop offset="1" style="stop-opacity:0; stop-color:#FEFEFE"/>
      </linearGradient>
      <radialGradient id="id1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(6.12322E-17 0.999998 -0.999998 6.12322E-17 250 0)" cx="125" cy="125" r="165.74" fx="125" fy="125">
        <stop offset="0" style="stop-opacity:0; stop-color:black"/>
        <stop offset="0.8" style="stop-opacity:0; stop-color:black"/>
        <stop offset="1" style="stop-opacity:0.2; stop-color:black"/>
      </radialGradient>
      <radialGradient id="id2" gradientUnits="userSpaceOnUse" gradientTransform="matrix(6.12322E-17 0.999998 -0.999998 6.12322E-17 250 0)" cx="125" cy="125" r="165.74" fx="125" fy="125">
        <stop offset="0" style="stop-opacity:0.4; stop-color:#FEFEFE"/>
        <stop offset="0.701961" style="stop-opacity:0.254902; stop-color:#FEFEFE"/>
        <stop offset="1" style="stop-opacity:0; stop-color:white"/>
      </radialGradient>
    </defs>

    <g id="smile_svg">
      <path
        id="smile_background"
        fill="#261717"
        transform="translate(125 125) scale(0.9) translate(-125 -125)"
        d="M125 0c69.04,0 125,55.96 125,125 0,69.04 -55.96,125 -125,125 -69.04,0 -125,-55.96 -125,-125 0,-69.04 55.96,-125 125,-125z"/>

      <path
        id="smile_color"
        d="M81.5 78.58c9.51,0 17.23,8.98 17.23,20.05 0,11.08 -7.72,20.05 -17.23,20.05 -9.51,0 -17.22,-8.97 -17.22,-20.05 0,-11.07 7.71,-20.05 17.22,-20.05
           zm87 0c-9.51,0 -17.23,8.98 -17.23,20.05 0,11.08 7.72,20.05 17.23,20.05 9.51,0 17.22,-8.97 17.22,-20.05 0,-11.07 -7.71,-20.05 -17.22,-20.05
           zm-43.5 171.42c69.04,0 125,-55.96 125,-125 0,-69.04 -55.96,-125 -125,-125 -69.04,0 -125,55.96 -125,125 0,69.04 55.96,125 125,125
           zm-48.25 -90.43c7.62,5.06 24.35,14.68 48.25,14.68 23.9,0 40.63,-9.62 48.25,-14.68 1.98,-1.32 4.64,-0.88 6.09,1 1.45,1.89 1.2,4.56 -0.58,6.14
           -8.12,7.24 -26.48,20.11 -53.76,20.11 -27.28,0 -45.64,-12.87 -53.76,-20.11 -1.78,-1.58 -2.03,-4.25 -0.58,-6.14 1.45,-1.88 4.11,-2.32 6.09,-1z"/>

      <path
        id="smile_around_shadow"
        fill="url(#id1)"
        d="M81.5 78.58c9.51,0 17.23,8.98 17.23,20.05 0,11.08 -7.72,20.05 -17.23,20.05 -9.51,0 -17.22,-8.97 -17.22,-20.05 0,-11.07 7.71,-20.05 17.22,-20.05
           zm87 0c-9.51,0 -17.23,8.98 -17.23,20.05 0,11.08 7.72,20.05 17.23,20.05 9.51,0 17.22,-8.97 17.22,-20.05 0,-11.07 -7.71,-20.05 -17.22,-20.05
           zm-43.5 171.42c69.04,0 125,-55.96 125,-125 0,-69.04 -55.96,-125 -125,-125 -69.04,0 -125,55.96 -125,125 0,69.04 55.96,125 125,125
           zm-48.25 -90.43c7.62,5.06 24.35,14.68 48.25,14.68 23.9,0 40.63,-9.62 48.25,-14.68 1.98,-1.32 4.64,-0.88 6.09,1 1.45,1.89 1.2,4.56 -0.58,6.14
           -8.12,7.24 -26.48,20.11 -53.76,20.11 -27.28,0 -45.64,-12.87 -53.76,-20.11 -1.78,-1.58 -2.03,-4.25 -0.58,-6.14 1.45,-1.88 4.11,-2.32 6.09,-1z"/>

      <path
        id="smile_front_light"
        fill="url(#id2)"
        d="M81.5 78.58c9.51,0 17.23,8.98 17.23,20.05 0,11.08 -7.72,20.05 -17.23,20.05 -9.51,0 -17.22,-8.97 -17.22,-20.05 0,-11.07 7.71,-20.05 17.22,-20.05
           zm87 0c-9.51,0 -17.23,8.98 -17.23,20.05 0,11.08 7.72,20.05 17.23,20.05 9.51,0 17.22,-8.97 17.22,-20.05 0,-11.07 -7.71,-20.05 -17.22,-20.05
           zm-43.5 171.42c69.04,0 125,-55.96 125,-125 0,-69.04 -55.96,-125 -125,-125 -69.04,0 -125,55.96 -125,125 0,69.04 55.96,125 125,125
           zm-48.25 -90.43c7.62,5.06 24.35,14.68 48.25,14.68 23.9,0 40.63,-9.62 48.25,-14.68 1.98,-1.32 4.64,-0.88 6.09,1 1.45,1.89 1.2,4.56 -0.58,6.14
           -8.12,7.24 -26.48,20.11 -53.76,20.11 -27.28,0 -45.64,-12.87 -53.76,-20.11 -1.78,-1.58 -2.03,-4.25 -0.58,-6.14 1.45,-1.88 4.11,-2.32 6.09,-1z"/>

      <path
        id="smile_left_eye_highlight"
        fill="url(#id0)"
        d="M79.25 82.88c-4.34,0 -7.87,4.1 -7.87,9.16 0,5.06 3.53,9.16 7.87,9.16 4.35,0 7.88,-4.1 7.88,-9.16 0,-5.06 -3.53,-9.16 -7.88,-9.16z"/>

      <path
        id="smile_right_eye_highlight"
        fill="url(#id0)"
        d="M166.25 82.88c-4.35,0 -7.87,4.1 -7.87,9.16 0,5.06 3.52,9.16 7.87,9.16 4.35,0 7.87,-4.1 7.87,-9.16 0,-5.06 -3.52,-9.16 -7.87,-9.16z"/>
    </g>
  </svg>`;

export const addSVG = `
  <svg class="add-icon" xmlns="${svgUrl}" 
  width="${iconSize / 2}" 
  height="${iconSize / 2}" 
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>`;

export const editSVG = `
  <svg class="edit-icon" xmlns="${svgUrl}" 
  width="${iconSize / 2}" 
  height="${iconSize / 2}" 
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>`;

export const removeSVG = `
  <svg class="remove-icon" xmlns="${svgUrl}" 
  width="${iconSize / 2}" 
  height="${iconSize / 2}" 
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>`;

export const importSVG = `
  <svg class="export-icon" xmlns="${svgUrl}" 
  width="${iconSize / 2}" 
  height="${iconSize / 2}" 
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>`;

export const exportSVG = `
  <svg class="import-icon" xmlns="${svgUrl}" 
  width="${iconSize / 2}" 
  height="${iconSize / 2}" 
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>`;

export const loadSVG = `
  <svg class="load-icon" xmlns="${svgUrl}" 
  width="${iconSize / 2}" 
  height="${iconSize / 2}" 
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round">
    <line x1="12" y1="2" x2="12" y2="6"></line>
    <line x1="12" y1="18" x2="12" y2="22"></line>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
    <line x1="2" y1="12" x2="6" y2="12"></line>
    <line x1="18" y1="12" x2="22" y2="12"></line>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
  </svg>`;

export const eventsSVG = `
  <svg class="activity" xmlns="${svgUrl}" 
  width="${iconSize / 1.6}" 
  height="${iconSize / 1.6}" 
  viewBox="0 0 250 250"
  style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
    <path d="M46.59 0l156.82 0c25.65,0 46.59,20.94 46.59,46.59l0 156.82c0,25.65 -20.94,46.59 -46.59,46.59l-156.82 0c-25.65,0 -46.59,-20.94 -46.59,-46.59l0 -156.82c0,-25.65 20.94,-46.59 46.59,-46.59zm152.82 112.66c6.82,0 12.34,5.53 12.34,12.34 0,6.82 -5.52,12.34 -12.34,12.34l-20.92 0 -19.5 58.49c-2.13,6.44 -9.08,9.94 -15.52,7.81 -3.84,-1.27 -6.63,-4.25 -7.81,-7.81l-32.98 -98.95 -10.66 31.98c-1.71,5.16 -6.51,8.48 -11.67,8.48l-29.76 0c-6.82,0 -12.34,-5.52 -12.34,-12.34 0,-6.81 5.52,-12.34 12.34,-12.34l20.92 0 19.5 -58.49c1.18,-3.56 3.97,-6.54 7.81,-7.81 6.44,-2.13 13.39,1.37 15.52,7.81l32.98 98.95 10.3 -30.88c1.25,-5.48 6.16,-9.58 12.03,-9.58l29.76 0z"/>
  </svg>`;

// Log messages icons
export const infoSVG = `
  <svg class="event-info" xmlns="${svgUrl}" 
  viewBox="0 0 24 24" 
  width="14"
  height="14"
  fill="none" 
  stroke="currentColor" 
  stroke-width="2" 
  stroke-linecap="round" 
  stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>`;

export const warningSVG = `
  <svg class="event-warning" xmlns="${svgUrl}" 
  viewBox="0 0 24 24" 
  width="14"
  height="14"
  fill="none" 
  stroke="currentColor" 
  stroke-width="2" 
  stroke-linecap="round" 
  stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>`;

export const errorSVG = `
  <svg class="event-error" xmlns="${svgUrl}" 
  viewBox="0 0 24 24" 
  width="14"
  height="14"
  fill="none" 
  stroke="currentColor" 
  stroke-width="2" 
  stroke-linecap="round" 
  stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>`;

export const successSVG = `
  <svg class="event-success" xmlns="${svgUrl}" 
  viewBox="0 0 24 24" 
  width="14"
  height="14"
  fill="none" 
  stroke="currentColor" 
  stroke-width="2" 
  stroke-linecap="round" 
  stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>`;

export const clearSVG = `
  <svg class="event-clear" xmlns="${svgUrl}"
  viewBox="0 0 24 24"
  width="${iconSize / 2}"
  height="${iconSize / 2}"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>`;