import { describe, expect, test } from "vitest";
import {
    buildCandidateFromPage,
    extractLinks,
    extractReadableText,
    isAllowedUrl,
    selectPagesToVisit,
    WEBSITE_COLLECTION_LIMITS,
} from "./websiteCollector";

const dublinBrewHomepage = `
<!doctype html>
<html>
<head><title>DublinBrew</title><style>.hidden { display: none; }</style></head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About Us</a>
    <a href="/menu">Menu</a>
    <a href="/locations">Our Locations</a>
    <a href="/contact">Contact Us</a>
    <a href="/careers">Careers</a>
    <a href="/privacy-policy">Privacy Policy</a>
    <a href="mailto:hello@dublinbrew.example">Email us</a>
    <a href="/menu.pdf">Download menu (PDF)</a>
    <a href="https://instagram.com/dublinbrew">Instagram</a>
  </nav>
  <script>console.log("tracking pixel noise that must never reach evidence text");</script>
  <main>
    <p>DublinBrew is an independent coffee roaster and caf&eacute; based in Dublin, Ireland.</p>
    <p>We roast single-origin beans in small batches every week.</p>
  </main>
  <footer><a href="/about">About Us</a></footer>
</body>
</html>
`;

describe("website collector: link discovery", () => {
    test("resolves relative links, decodes text, and keeps duplicates out", () => {
        const links = extractLinks(dublinBrewHomepage, "https://dublinbrew.example/");
        const aboutLinks = links.filter((link) => link.url === "https://dublinbrew.example/about");
        expect(aboutLinks).toHaveLength(2); // nav + footer both link here; dedupe happens later
        expect(aboutLinks[0].text).toBe("About Us");
    });

    test("drops mailto links entirely", () => {
        const links = extractLinks(dublinBrewHomepage, "https://dublinbrew.example/");
        expect(links.some((link) => link.url.startsWith("mailto:"))).toBe(false);
    });

    test("selects only same-domain, category-matching pages and caps to the page budget", () => {
        const links = extractLinks(dublinBrewHomepage, "https://dublinbrew.example/");
        const selected = selectPagesToVisit("https://dublinbrew.example/", links, "dublinbrew.example");

        const urls = selected.map((page) => page.url);
        expect(urls).toContain("https://dublinbrew.example/about");
        expect(urls).toContain("https://dublinbrew.example/menu");
        expect(urls).toContain("https://dublinbrew.example/locations");
        expect(urls).toContain("https://dublinbrew.example/contact");
        expect(urls).toContain("https://dublinbrew.example/careers");

        // Obviously irrelevant / off-topic / off-domain / duplicate links never make the list.
        expect(urls).not.toContain("https://dublinbrew.example/privacy-policy");
        expect(urls).not.toContain("https://dublinbrew.example/menu.pdf");
        expect(urls.some((url) => url.includes("instagram.com"))).toBe(false);
        expect(new Set(urls).size).toBe(urls.length); // no duplicates

        expect(selected.length).toBeLessThanOrEqual(WEBSITE_COLLECTION_LIMITS.maxPages - 1);
    });

    test("caps the number of pages selected even when more categories match than the budget allows", () => {
        const manyLinks = Array.from({ length: 20 }, (_, index) => ({
            url: `https://dublinbrew.example/about-${index}`,
            text: "About us",
        }));
        const selected = selectPagesToVisit("https://dublinbrew.example/", manyLinks, "dublinbrew.example", { maxPages: 4 });
        expect(selected.length).toBeLessThanOrEqual(3);
    });

    test("treats www and apex host as the same allowed domain, but rejects a different domain", () => {
        expect(isAllowedUrl("https://www.dublinbrew.example/about", "dublinbrew.example")).toBe(true);
        expect(isAllowedUrl("https://dublinbrew.example/about", "www.dublinbrew.example")).toBe(true);
        expect(isAllowedUrl("https://evil-example.com/about", "dublinbrew.example")).toBe(false);
    });
});

describe("website collector: readable text extraction", () => {
    test("strips scripts, styles, tags, and decodes entities into plain readable text", () => {
        const text = extractReadableText(dublinBrewHomepage, 2000);
        expect(text).not.toContain("<");
        expect(text).not.toContain("tracking pixel noise");
        expect(text).toContain("DublinBrew is an independent coffee roaster and café based in Dublin, Ireland.");
    });

    test("caps output to the requested max length", () => {
        const longHtml = `<p>${"Dublin coffee. ".repeat(500)}</p>`;
        const text = extractReadableText(longHtml, 100);
        expect(text.length).toBeLessThanOrEqual(103); // 100 chars + "..." marker
    });
});

describe("website collector: candidate drafting", () => {
    test("drafts a FACT-worthy statement with a page-kind-appropriate confidence", () => {
        const text = extractReadableText(dublinBrewHomepage, 2000);
        const draft = buildCandidateFromPage("About", text);
        expect(draft).not.toBeNull();
        expect(draft!.statement).toContain("DublinBrew is an independent coffee roaster");
        expect(draft!.confidence).toBe(92);
    });

    test("returns null for pages with no meaningful sentence, instead of inventing a candidate", () => {
        const draft = buildCandidateFromPage("Careers", extractReadableText("<p>ok</p>", 200));
        expect(draft).toBeNull();
    });
});
