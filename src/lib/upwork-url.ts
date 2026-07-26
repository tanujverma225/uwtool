/**
 * Normalize Upwork job URLs and extract a stable job ID for deduplication.
 */

const UPWORK_JOB_ID_PATTERN = /~([0-9a-f]{10,})/i;
const UPWORK_NUMERIC_ID_PATTERN = /\/jobs\/(\d+)/;

export interface ParsedUpworkUrl {
  originalUrl: string;
  normalizedUrl: string;
  upworkJobId: string | null;
  isValid: boolean;
}

export function parseUpworkUrl(rawUrl: string): ParsedUpworkUrl {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return {
      originalUrl: rawUrl,
      normalizedUrl: "",
      upworkJobId: null,
      isValid: false,
    };
  }

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return {
      originalUrl: rawUrl,
      normalizedUrl: trimmed,
      upworkJobId: null,
      isValid: false,
    };
  }

  if (!url.hostname.includes("upwork.com")) {
    return {
      originalUrl: rawUrl,
      normalizedUrl: url.toString(),
      upworkJobId: null,
      isValid: false,
    };
  }

  const fullPath = `${url.pathname}${url.search}`;
  const tildeMatch = fullPath.match(UPWORK_JOB_ID_PATTERN);
  const numericMatch = url.pathname.match(UPWORK_NUMERIC_ID_PATTERN);

  const upworkJobId = tildeMatch?.[1] ?? numericMatch?.[1] ?? null;

  const normalizedUrl = upworkJobId
    ? `https://www.upwork.com/jobs/~${upworkJobId}`
    : url.origin + url.pathname;

  return {
    originalUrl: rawUrl,
    normalizedUrl,
    upworkJobId,
    isValid: Boolean(upworkJobId),
  };
}

export function isUpworkJobUrl(rawUrl: string): boolean {
  return parseUpworkUrl(rawUrl).isValid;
}
