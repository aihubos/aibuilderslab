const MB = 1024 * 1024;

export const DEFAULT_LIMITS = Object.freeze({
  maxImageBytes: 5 * MB,
  maxFileBytes: 20 * MB,
  maxImages: 4,
  maxFiles: 4,
  maxTotalBytes: 25 * MB,
  uploadCapBytes: 3 * 1024 * MB,
  rateHour: 5,
  rateDay: 20,
  reportHour: 10,
  likeHour: 60,
  likeDay: 300,
  maxContactLength: 300,
  secretFailHour: 10,
  adminFailHour: 10,
  maxName: 40,
  maxTitle: 80,
  maxSummary: 160,
  maxTools: 400,
  maxPrompt: 8000,
  maxLinks: 8,
  maxLinkLength: 500,
  maxReason: 400,
  thumbEdge: 960,
  maxImagePixels: 20_000_000,
});

export function resolveLimits(overrides = {}) {
  return { ...DEFAULT_LIMITS, ...overrides };
}
