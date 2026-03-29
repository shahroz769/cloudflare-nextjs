const FALLBACK_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeDI9IjEwMCUiIHkxPSIwJSIgeTI9IjEwMCUiPjxzdG9wIHN0b3AtY29sb3I9IiNlZWYyZjciIG9mZnNldD0iMCUiLz48c3RvcCBzdG9wLWNvbG9yPSIjZDVkZGVhIiBvZmZzZXQ9IjEwMCUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=";

function clampChannel(value) {
  return Math.max(64, Math.min(224, value));
}

function createHash(input = "") {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function hashToColorPair(input = "") {
  const hash = createHash(input);
  const red = clampChannel(hash & 255);
  const green = clampChannel((hash >> 8) & 255);
  const blue = clampChannel((hash >> 16) & 255);

  const start = `rgb(${red}, ${green}, ${blue})`;
  const end = `rgb(${clampChannel(red + 18)}, ${clampChannel(green + 18)}, ${clampChannel(blue + 18)})`;

  return { start, end };
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function createBlurSvg(seed = "") {
  const normalizedSeed = String(seed || "").trim();

  if (!normalizedSeed) {
    return FALLBACK_BLUR_DATA_URL;
  }

  const { start, end } = hashToColorPair(normalizedSeed);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${start}" />
          <stop offset="100%" stop-color="${end}" />
        </linearGradient>
        <filter id="b" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect width="40" height="40" fill="url(#g)" filter="url(#b)" />
    </svg>
  `.replace(/\s+/g, " ").trim();

  return svgToDataUrl(svg);
}

export async function generateBlurDataURLFromDataUrl(dataUrl) {
  return createBlurSvg(dataUrl);
}

export async function generateBlurDataURLFromRemoteUrl(url) {
  return createBlurSvg(url);
}
