import { parseUpworkUrl } from "@/lib/upwork-url";

export type UpworkJobData = {
  jobTitle: string | null;
  summary: string | null;
  questions: string | null;
  fetched: boolean;
  warning?: string;
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function matchMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function extractFromJsonLd(html: string): Partial<UpworkJobData> {
  const scripts = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!scripts) return {};

  for (const script of scripts) {
    const jsonText = script.replace(/<\/?script[^>]*>/gi, "").trim();
    try {
      const data = JSON.parse(jsonText) as Record<string, unknown>;
      const title =
        (typeof data.title === "string" && data.title) ||
        (typeof data.name === "string" && data.name) ||
        null;
      const description =
        (typeof data.description === "string" && data.description) || null;
      if (title || description) {
        return { jobTitle: title, summary: description };
      }
    } catch {
      // try next script block
    }
  }
  return {};
}

function extractQuestions(html: string): string | null {
  const questionBlocks = [
    ...html.matchAll(/screening[^<]{0,40}question[\s\S]{0,2000}?<\/[^>]+>/gi),
    ...html.matchAll(/"questions?"\s*:\s*\[([\s\S]*?)\]/gi),
  ];

  const lines: string[] = [];
  for (const block of questionBlocks) {
    const text = stripTags(block[0]);
    if (text.length > 10) lines.push(text);
  }

  const unique = [...new Set(lines)].slice(0, 5);
  return unique.length ? unique.join("\n\n") : null;
}

export async function fetchUpworkJob(url: string): Promise<UpworkJobData> {
  const parsed = parseUpworkUrl(url);
  if (!parsed.isValid || !parsed.normalizedUrl) {
    return {
      jobTitle: null,
      summary: null,
      questions: null,
      fetched: false,
      warning: "Invalid Upwork job URL",
    };
  }

  try {
    const response = await fetch(parsed.normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return {
        jobTitle: null,
        summary: null,
        questions: null,
        fetched: false,
        warning: `Upwork returned ${response.status}. Paste job details manually.`,
      };
    }

    const html = await response.text();
    const jsonLd = extractFromJsonLd(html);

    const jobTitle =
      jsonLd.jobTitle ??
      matchMeta(html, "og:title") ??
      matchMeta(html, "twitter:title") ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.replace(/\s*\|.*$/, "").trim() ??
      null;

    const summary =
      jsonLd.summary ??
      matchMeta(html, "og:description") ??
      matchMeta(html, "description") ??
      null;

    const questions = extractQuestions(html);

    if (!jobTitle && !summary) {
      return {
        jobTitle: null,
        summary: null,
        questions: null,
        fetched: false,
        warning:
          "Could not read job details (Upwork may require login). Copy title and description manually.",
      };
    }

    return {
      jobTitle: jobTitle ? stripTags(jobTitle) : null,
      summary: summary ? stripTags(summary) : null,
      questions,
      fetched: true,
    };
  } catch {
    return {
      jobTitle: null,
      summary: null,
      questions: null,
      fetched: false,
      warning:
        "Failed to fetch job page. Paste title, summary, and questions manually.",
    };
  }
}
