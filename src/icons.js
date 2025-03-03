const svgUrl = "http://www.w3.org/2000/svg";
const iconSize = 24;

// SVG icon
const buttonAccentColor = "#096AD9";
const buttonOpenedColor = "#82B32A";
const buttonClosedColor = "#B34A2A";
export const sendSVG = `
  <svg xmlns="${svgUrl}" 
      width="${iconSize}" 
      height="${iconSize}" 
      viewBox="0 0 250 250">
    <path fill="${buttonAccentColor}" d="M22.32 98.04l-19.04 -87.15c-0.75,-3.46 0.48,-6.84 3.29,-9 2.81,-2.17 6.39,-2.49 9.55,-0.87l225.95 116.02c3.07,1.57 4.87,4.52 4.87,7.96 0,3.44 -1.8,6.39 -4.87,7.96l-225.95 116.02c-3.16,1.62 -6.74,1.3 -9.55,-0.87 -2.81,-2.16 -4.04,-5.54 -3.29,-9l19.04 -87.15c0.79,-3.62 3.53,-6.26 7.18,-6.91l102.6 -18.19c0.91,-0.16 1.56,-0.94 1.56,-1.86 0,-0.92 -0.65,-1.7 -1.56,-1.86l-102.6 -18.19c-3.65,-0.65 -6.39,-3.29 -7.18,-6.91z"/>
  </svg>
`;

export const closeSVG = `
  <svg xmlns="${svgUrl}" 
       width="${iconSize / 1.6}" 
       height="${iconSize / 1.6}" 
       viewBox="0 0 250 250" 
       style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
      <path fill="${buttonOpenedColor}" d="M46.62 0l156.76 0c25.64,0 46.62,20.98 46.62,46.62l0 156.75c0,25.65 -20.98,46.63 -46.62,46.63l-156.76 0c-25.64,0 -46.62,-20.98 -46.62,-46.63l0 -156.75c0,-25.64 20.98,-46.62 46.62,-46.62zm45.71 70.24l32.67 32.67 32.67 -32.67c2.73,-2.73 7.18,-2.73 9.91,0l12.18 12.18c2.73,2.73 2.73,7.18 0,9.91l-32.67 32.67 32.67 32.66c2.73,2.74 2.73,7.19 0,9.92l-12.18 12.18c-2.73,2.73 -7.18,2.73 -9.91,0l-32.67 -32.67 -32.67 32.67c-2.73,2.73 -7.18,2.73 -9.91,0l-12.18 -12.18c-2.73,-2.73 -2.73,-7.18 0,-9.92l32.67 -32.66 -32.67 -32.67c-2.73,-2.73 -2.73,-7.18 0,-9.91l12.18 -12.18c2.73,-2.73 7.18,-2.73 9.91,0z"/>
  </svg>
`;

export const openSVG = `
  <svg xmlns="${svgUrl}" 
       width="${iconSize / 1.6}" 
       height="${iconSize / 1.6}" 
       viewBox="0 0 250 250" 
       style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd">
      <path fill="${buttonClosedColor}" d="M46.62 0l156.76 0c25.64,0 46.62,20.98 46.62,46.62l0 156.75c0,25.65 -20.98,46.63 -46.62,46.63l-156.76 0c-25.64,0 -46.62,-20.98 -46.62,-46.63l0 -156.75c0,-25.64 20.98,-46.62 46.62,-46.62zm15.5 135.79l57.92 -57.93c2.73,-2.73 7.19,-2.72 9.92,0.01l57.92 57.92c2.73,2.73 2.73,7.18 0,9.91l-12.18 12.18c-2.73,2.73 -7.18,2.73 -9.92,0l-35.82 -35.83c-2.73,-2.73 -7.19,-2.73 -9.92,0l-35.82 35.83c-2.74,2.73 -7.19,2.73 -9.92,0l-12.18 -12.18c-2.73,-2.73 -2.73,-7.18 0,-9.91z"/>
  </svg>
`;