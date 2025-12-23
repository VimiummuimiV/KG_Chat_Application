const colorUtils = {
  // Convert HSL (with h in [0,360] and s,l in percentage numbers) to hex
  hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r, g, b;
    if (h < 60) {
      r = c; g = x; b = 0;
    } else if (h < 120) {
      r = x; g = c; b = 0;
    } else if (h < 180) {
      r = 0; g = c; b = x;
    } else if (h < 240) {
      r = 0; g = x; b = c;
    } else if (h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b)
      .toString(16).slice(1);
  },

  // Convert hex to HSL object {h, s, l}
  hexToHSL(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      if (max === r) {
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      } else if (max === g) {
        h = ((b - r) / d + 2) * 60;
      } else {
        h = ((r - g) / d + 4) * 60;
      }
    }

    return { h: Math.round(h), s: s * 100, l: l * 100 };
  },

  // Extract just the hue from a hex color
  hexToHue(hex) {
    return this.hexToHSL(hex).h;
  },

  // Calculate relative luminance from hex for accessibility calculations
  getLuminance(hex) {
    hex = hex.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const convert = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * convert(r) + 0.7152 * convert(g) + 0.0722 * convert(b);
  },

  // Calculate contrast ratio between two colors
  contrastRatio(fg, bg) {
    const L1 = this.getLuminance(fg);
    const L2 = this.getLuminance(bg);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  }
};

// Color generator factory function (not exported)
function colorGenerator(config) {
  // Use sessionStorage as required
  const storageKey = config.storageKey || 'usernameColors';
  let colorMap;
  try {
    const stored = sessionStorage.getItem(storageKey);
    colorMap = stored ? JSON.parse(stored) : {};
  } catch (e) {
    colorMap = {};
  }

  // Allow the entire hue circle by default.
  const hueRanges = config.hueRanges || [{ min: 0, max: 360 }];

  // Calculate total available hue space
  const totalHueSpace = hueRanges.reduce((sum, range) =>
    sum + (range.max - range.min), 0);

  const hasFixedSaturation = Boolean(config.saturation);
  const hasFixedLightness = Boolean(config.lightness);
  const minSat = config.minSaturation || 40;
  const maxSat = config.maxSaturation || 90;
  const minLight = config.minLightness || 55;
  const maxLight = config.maxLightness || 80;
  const satRange = maxSat - minSat;
  const lightRange = maxLight - minLight;

  // Cache existing color values and used hues for quick comparison
  const existingColorValues = new Set(Object.values(colorMap));
  const usedHues = new Set();

  // Extract used hues from stored hex values by converting back to hue
  Object.values(colorMap).forEach(colorStr => {
    try {
      usedHues.add(colorUtils.hexToHue(colorStr));
    } catch (e) {
      // Ignore parsing errors
    }
  });

  // Helper to generate a random hue from the allowed ranges
  function generateRandomHue() {
    // Generate a random value within the total available hue space
    let randomValue = Math.floor(Math.random() * totalHueSpace);

    // Map this random value to the correct range
    for (let range of hueRanges) {
      const rangeSize = range.max - range.min;
      if (randomValue < rangeSize) {
        // Map the value to the range
        return range.min + randomValue;
      }
      // Move to the next range
      randomValue -= rangeSize;
    }

    // Fallback (should never happen if ranges are configured correctly)
    return hueRanges[0].min;
  }

  return {
    getColor(username) {
      // If username is falsy, return a default color (converted to hex)
      if (!username) {
        const satVal = hasFixedSaturation ? parseInt(config.saturation, 10) : 50;
        let lightVal = hasFixedLightness ? parseInt(config.lightness, 10) : 50;
        // Ensure default follows the rule if hue is 0 (which is not in 210–280, so no check needed)
        return colorUtils.hslToHex(0, satVal, lightVal);
      }

      // Get the username from localStorage if exist to prevent color generation
      const key = username.trim();

      // First, check localStorage
      let localColors = {};
      try {
        const storedLocal = localStorage.getItem(storageKey);
        localColors = storedLocal ? JSON.parse(storedLocal) : {};
      } catch (e) {
        // Ignore parsing errors
      }
      if (localColors[key]) {
      // Handle both old format (direct color string) and new format (object with id and color)
        return typeof localColors[key] === 'string' ? localColors[key] : localColors[key].color;
      }

      // Next, check sessionStorage cache from colorMap
      if (colorMap[key]) {
        return colorMap[key];
      }

      let color = null;
      let attempts = 0;

      // Try to find a unique color (max 10 attempts)
      while (!color && attempts < 10) {
        // Generate a hue from the allowed ranges
        let hue;
        if (usedHues.size >= totalHueSpace) {
          // If all possible hues are used, pick a random one from allowed ranges
          hue = generateRandomHue();
        } else {
          // Try to find an unused hue within allowed ranges
          do {
            hue = generateRandomHue();
          } while (usedHues.has(hue) && usedHues.size < totalHueSpace);
        }

        // Generate saturation as a number
        const satVal = hasFixedSaturation ? parseInt(config.saturation, 10) :
          Math.floor(Math.random() * satRange) + minSat;

        // Generate lightness with a special rule:
        // For hues between 210 and 280, the lightness must be at least 65.
        let lightVal;
        if (hasFixedLightness) {
          lightVal = parseInt(config.lightness, 10);
          if (hue >= 210 && hue < 280 && lightVal < 65) {
            lightVal = 65;
          }
        } else {
          let effectiveMinLight = minLight;
          if (hue >= 210 && hue < 280) {
            effectiveMinLight = Math.max(minLight, 65);
          }
          const effectiveLightRange = maxLight - effectiveMinLight;
          lightVal = Math.floor(Math.random() * effectiveLightRange) + effectiveMinLight;
        }

        const newColor = colorUtils.hslToHex(hue, satVal, lightVal);

        // Check if this color is unique
        if (!existingColorValues.has(newColor)) {
          color = newColor;
          usedHues.add(hue);
          break;
        }
        attempts++;
      }

      // Fallback if unique color not found in allotted attempts
      if (!color) {
        const hue = generateRandomHue();
        const satVal = hasFixedSaturation ? parseInt(config.saturation, 10) :
          Math.floor(Math.random() * satRange) + minSat;
        let lightVal;
        if (hasFixedLightness) {
          lightVal = parseInt(config.lightness, 10);
          if (hue >= 210 && hue < 280 && lightVal < 65) {
            lightVal = 65;
          }
        } else {
          let effectiveMinLight = minLight;
          if (hue >= 210 && hue < 280) {
            effectiveMinLight = Math.max(minLight, 65);
          }
          const effectiveLightRange = maxLight - effectiveMinLight;
          lightVal = Math.floor(Math.random() * effectiveLightRange) + effectiveMinLight;
        }
        color = colorUtils.hslToHex(hue, satVal, lightVal);
      }

      // Save the new color
      colorMap[key] = color;
      existingColorValues.add(color);

      // Batch update to sessionStorage with throttling
      this.saveColors();

      return color;
    },

    // Use a debounced save to reduce writes to sessionStorage
    saveTimeout: null,
    saveColors() {
      if (this.saveTimeout) clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(colorMap));
        } catch (e) {
          // Handle potential storage errors silently
        }
      }, 500);
    }
  };
}

// Darken the color until it meets 4.5:1 contrast on white (exported)
export const optimizeColor = hex => {
  console.info("Optimizing color for contrast:", hex);
  let { h, s, l } = colorUtils.hexToHSL(hex);
  let newHex = hex;
  while (colorUtils.contrastRatio(newHex, "#FFFFFF") < 4.5 && l > 0) {
    newHex = colorUtils.hslToHex(h, s, --l);
  }
  return newHex;
};

// Pre-configured color generators (exported)
export const usernameColors = colorGenerator({
  storageKey: 'usernameColors',
  minSaturation: 35,
  maxSaturation: 75,
  minLightness: 65,
  maxLightness: 80
});
