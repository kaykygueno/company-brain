// Pure, network-free logic for the official-website collection adapter.
//
// Kept separate from discovery.ts (which owns the Convex action that drives a
// real fetch) so link discovery, text extraction, and candidate drafting can
// be unit tested against fixture HTML instead of the real internet.
//
// This is a controlled company researcher, not a general-purpose crawler: it
// only ever looks at the company's own domain, only follows links that match
// a known company-page category, and stays inside the limits below.

export type PageKind =
    | "Home"
    | "About"
    | "Products"
    | "Services"
    | "Locations"
    | "Contact"
    | "Team"
    | "FAQ"
    | "Pricing"
    | "Blog/News"
    | "Careers"
    | "Company information";

export const WEBSITE_COLLECTION_LIMITS = {
    // Total pages fetched per run, homepage included.
    maxPages: 8,
    // Bytes read from any single page response before we stop reading it.
    maxContentBytes: 300_000,
    // Characters of evidence text kept per page, after stripping markup.
    maxEvidenceLength: 1_500,
    // Redirect hops allowed before a URL is abandoned.
    maxRedirects: 3,
    // Time allowed per request before it's aborted.
    requestTimeoutMs: 8_000,
    // Minimum gap between outgoing requests, to stay a polite, low-rate visitor.
    minRequestIntervalMs: 350,
} as const;

// Pages worth following, ranked by how useful they tend to be for company
// knowledge. Order also decides which pages win when more categories match
// than the page budget allows.
const PAGE_PATTERNS: { kind: PageKind; pattern: RegExp }[] = [
    { kind: "About", pattern: /\b(about(?:[- ]?us)?|our[- ]story|who[- ]we[- ]are)\b/i },
    { kind: "Company information", pattern: /\b(company[- ]information|corporate[- ]information|impressum)\b/i },
    { kind: "Products", pattern: /\b(products?|shop|store|catalog(?:ue)?|menu)\b/i },
    { kind: "Services", pattern: /\b(services?|solutions?|what[- ]we[- ]do)\b/i },
    { kind: "Locations", pattern: /\b(locations?|branches|stores?|find[- ]us|where[- ]we[- ]are)\b/i },
    { kind: "Pricing", pattern: /\b(pricing|plans|rates)\b/i },
    { kind: "FAQ", pattern: /\bfaqs?\b|frequently[- ]asked/i },
    { kind: "Team", pattern: /\b(team|our[- ]people|leadership|meet[- ]the[- ]team)\b/i },
    { kind: "Contact", pattern: /\b(contact(?:[- ]?us)?|get[- ]in[- ]touch)\b/i },
    { kind: "Careers", pattern: /\b(careers?|jobs?|join[- ]us|hiring)\b/i },
    { kind: "Blog/News", pattern: /\b(blog|news|press|articles?)\b/i },
];

// File types a company researcher has no business downloading and parsing as HTML.
const IRRELEVANT_EXTENSION = /\.(pdf|docx?|xlsx?|zip|rar|jpe?g|png|gif|svg|webp|ico|mp4|mp3|wav|css|js|json|xml|woff2?|ttf)$/i;

export interface DiscoveredLink {
    url: string;
    text: string;
}

export interface SelectedPage {
    url: string;
    kind: PageKind;
}

// A company's root domain often redirects between the apex and "www." host;
// treat those two as the same site without opening the door to arbitrary
// cross-domain redirects.
function bareHost(hostname: string): string {
    return hostname.toLowerCase().replace(/^www\./, "");
}

function normalizeUrl(rawUrl: string): string | null {
    try {
        const url = new URL(rawUrl);
        url.hash = "";
        if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
            url.pathname = url.pathname.slice(0, -1);
        }
        return url.toString();
    } catch {
        return null;
    }
}

export function isAllowedUrl(rawUrl: string, allowedHost: string): boolean {
    let url: URL;
    try {
        url = new URL(rawUrl);
    } catch {
        return false;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (bareHost(url.hostname) !== bareHost(allowedHost)) return false;
    if (IRRELEVANT_EXTENSION.test(url.pathname)) return false;
    return true;
}

const ENTITY_MAP: Record<string, string> = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…",
    eacute: "é", egrave: "è", ecirc: "ê", euml: "ë",
    aacute: "á", agrave: "à", acirc: "â", auml: "ä", aring: "å",
    iacute: "í", igrave: "ì", icirc: "î", iuml: "ï",
    oacute: "ó", ograve: "ò", ocirc: "ô", ouml: "ö", oslash: "ø",
    uacute: "ú", ugrave: "ù", ucirc: "û", uuml: "ü",
    ccedil: "ç", ntilde: "ñ", szlig: "ß", copy: "©", reg: "®", trade: "™",
};

function decodeHtmlEntities(text: string): string {
    return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (whole, code: string) => {
        if (code[0] === "#") {
            const codePoint = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
            return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : whole;
        }
        return ENTITY_MAP[code.toLowerCase()] ?? whole;
    });
}

// Extracts <a href> links and their visible text from raw HTML. Regex-based
// on purpose: this collector only needs link discovery, not a full DOM, so it
// avoids pulling in a parser dependency for it.
export function extractLinks(html: string, baseUrl: string): DiscoveredLink[] {
    const links: DiscoveredLink[] = [];
    const anchorPattern = /<a\b[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = anchorPattern.exec(html)) !== null) {
        const [, href, innerHtml] = match;
        if (/^(mailto|tel|javascript):/i.test(href.trim())) continue;
        let resolved: string;
        try {
            resolved = new URL(href, baseUrl).toString();
        } catch {
            continue;
        }
        const text = decodeHtmlEntities(innerHtml.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
        links.push({ url: resolved, text });
    }
    return links;
}

function matchPageKind(url: string, linkText: string): PageKind | null {
    let path: string;
    try {
        path = decodeURIComponent(new URL(url).pathname);
    } catch {
        path = url;
    }
    const haystack = `${path} ${linkText}`;
    for (const { kind, pattern } of PAGE_PATTERNS) {
        if (pattern.test(haystack)) return kind;
    }
    return null;
}

// Chooses which discovered links are worth visiting: same-domain, not an
// obviously irrelevant file, matching a known company-page category,
// deduplicated, and capped to the page budget. The homepage itself is not
// included here — the caller always visits it first, outside this budget.
export function selectPagesToVisit(
    homepageUrl: string,
    links: DiscoveredLink[],
    allowedHost: string,
    limits: { maxPages: number } = WEBSITE_COLLECTION_LIMITS,
): SelectedPage[] {
    const seen = new Set<string>([normalizeUrl(homepageUrl) ?? homepageUrl]);
    const byKind = new Map<PageKind, SelectedPage>();
    for (const link of links) {
        if (!isAllowedUrl(link.url, allowedHost)) continue;
        const normalized = normalizeUrl(link.url);
        if (!normalized || seen.has(normalized)) continue;
        const kind = matchPageKind(link.url, link.text);
        if (!kind) continue; // obviously irrelevant to a company researcher
        seen.add(normalized);
        if (!byKind.has(kind)) {
            byKind.set(kind, { url: normalized, kind });
        }
    }
    const budget = Math.max(0, limits.maxPages - 1); // homepage already counted
    return PAGE_PATTERNS.map((entry) => byKind.get(entry.kind))
        .filter((page): page is SelectedPage => Boolean(page))
        .slice(0, budget);
}

const SKIPPED_TAGS = /<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi;

// Turns raw page HTML into plain, readable text: strips non-content tags,
// markup, and boilerplate whitespace, then caps the result to keep stored
// evidence bounded.
export function extractReadableText(html: string, maxLength: number = WEBSITE_COLLECTION_LIMITS.maxEvidenceLength): string {
    const withoutSkippedTags = html.replace(SKIPPED_TAGS, " ");
    const withoutComments = withoutSkippedTags.replace(/<!--[\s\S]*?-->/g, " ");
    const withoutTags = withoutComments.replace(/<[^>]+>/g, " ");
    const decoded = decodeHtmlEntities(withoutTags);
    const collapsed = decoded.replace(/\s+/g, " ").trim();
    return collapsed.length > maxLength ? `${collapsed.slice(0, maxLength).trim()}...` : collapsed;
}

// Picks the first sentence-like chunk of readable text worth proposing as a
// FACT: long enough to say something, short enough to stay a single claim.
export function firstMeaningfulSentence(text: string): string | null {
    const sentences = text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
    for (const sentence of sentences) {
        if (sentence.length >= 25 && sentence.length <= 320 && /[a-zA-Z]{3,}/.test(sentence)) {
            return sentence;
        }
    }
    return null;
}

// The official website is a company describing itself, so it's a generally
// high-confidence source; confidence still varies a little by how time-stable
// each page category tends to be (an About page ages better than a blog post).
export function confidenceForPageKind(kind: PageKind): number {
    switch (kind) {
        case "Home":
        case "About":
        case "Company information":
            return 92;
        case "Products":
        case "Services":
            return 90;
        case "Pricing":
            return 88;
        case "Locations":
        case "Contact":
            return 85;
        case "Team":
            return 82;
        case "FAQ":
            return 80;
        case "Careers":
            return 75;
        case "Blog/News":
            return 72;
        default:
            return 80;
    }
}

export interface CandidateDraft {
    statement: string;
    confidence: number;
}

// Evidence (the readable page text) is never permanent knowledge on its own —
// this only drafts a reviewable FACT candidate from it.
export function buildCandidateFromPage(pageKind: PageKind, readableText: string): CandidateDraft | null {
    const statement = firstMeaningfulSentence(readableText);
    if (!statement) return null;
    return { statement, confidence: confidenceForPageKind(pageKind) };
}

export interface FetchedPage {
    html: string;
    finalUrl: string;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

async function readCappedText(response: Response, maxBytes: number): Promise<string> {
    const body = response.body;
    if (!body || typeof body.getReader !== "function") {
        return (await response.text()).slice(0, maxBytes);
    }
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (received < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
            chunks.push(value);
            received += value.length;
        }
    }
    try {
        await reader.cancel();
    } catch {
        // already finished
    }
    const combined = new Uint8Array(Math.min(received, maxBytes));
    let offset = 0;
    for (const chunk of chunks) {
        const remaining = combined.length - offset;
        if (remaining <= 0) break;
        combined.set(chunk.subarray(0, remaining), offset);
        offset += Math.min(chunk.length, remaining);
    }
    return new TextDecoder("utf-8", { fatal: false }).decode(combined);
}

// Fetches one page while enforcing the collector's safety limits: only the
// allowed domain (re-checked on every redirect hop, so a redirect can't hop
// the collector onto a different site), a bounded number of redirects, a
// request timeout, and a hard cap on how many bytes of the body are read.
// Returns null for anything that isn't a usable page: network failure,
// timeout, a redirect off-domain or past the redirect budget, or a response
// that isn't HTML/text (an "obviously irrelevant" PDF, image, etc.).
export async function fetchPageWithLimits(
    url: string,
    allowedHost: string,
    limits: Pick<typeof WEBSITE_COLLECTION_LIMITS, "maxRedirects" | "requestTimeoutMs" | "maxContentBytes">,
    fetchImpl: FetchLike,
): Promise<FetchedPage | null> {
    let currentUrl = url;
    for (let redirectCount = 0; redirectCount <= limits.maxRedirects; redirectCount++) {
        if (!isAllowedUrl(currentUrl, allowedHost)) return null;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), limits.requestTimeoutMs);
        let response: Response;
        try {
            response = await fetchImpl(currentUrl, {
                redirect: "manual",
                signal: controller.signal,
                headers: { "User-Agent": "CompanyBrainResearcher/1.0 (+official-website-discovery)" },
            });
        } catch {
            return null;
        } finally {
            clearTimeout(timeout);
        }

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location");
            if (!location) return null;
            try {
                currentUrl = new URL(location, currentUrl).toString();
            } catch {
                return null;
            }
            continue; // re-validated against allowedHost at the top of the loop
        }

        if (!response.ok) return null;
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType && !contentType.includes("text/html") && !contentType.includes("text/plain")) {
            return null; // obviously irrelevant: not a page a reader would browse
        }

        const html = await readCappedText(response, limits.maxContentBytes);
        return { html, finalUrl: currentUrl };
    }
    return null; // exceeded the redirect budget
}
