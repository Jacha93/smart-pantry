import { readFileSync } from 'node:fs';

const SITE_ORIGIN = 'https://smartpantry.eu';

const expectedSitemapUrls = [
  `${SITE_ORIGIN}/`,
  `${SITE_ORIGIN}/de/datenschutz`,
  `${SITE_ORIGIN}/de/impressum`,
  `${SITE_ORIGIN}/en/privacy`,
  `${SITE_ORIGIN}/en/legal-notice`,
];

function fail(message) {
  console.error(`SEO check failed: ${message}`);
  process.exit(1);
}

function readText(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    fail(`Could not read ${path}`);
  }
}

function extractLinkHrefs(html, rel) {
  const linkPattern = /<link\s+[^>]*>/g;
  const attrPattern = /([a-zA-Z:-]+)="([^"]*)"/g;
  const links = [];

  for (const [tag] of html.matchAll(linkPattern)) {
    const attrs = {};

    for (const [, key, value] of tag.matchAll(attrPattern)) {
      attrs[key.toLowerCase()] = value;
    }

    if (attrs.rel === rel) {
      links.push(attrs);
    }
  }

  return links;
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

const robots = readText('public/robots.txt');
const sitemap = readText('public/sitemap.xml');
const html = readText('index.html');

assert(robots.includes('User-agent: *'), 'robots.txt must define a global user agent');
assert(robots.includes('Allow: /'), 'robots.txt must allow the public root');
assert(robots.includes('Disallow: /app'), 'robots.txt must disallow private app routes');
assert(robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`), 'robots.txt must reference the production sitemap');

const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert(sitemapUrls.length === expectedSitemapUrls.length, `sitemap must contain ${expectedSitemapUrls.length} URLs`);

for (const expectedUrl of expectedSitemapUrls) {
  assert(sitemapUrls.includes(expectedUrl), `sitemap is missing ${expectedUrl}`);
}

assert(!sitemapUrls.some((url) => url.includes('/app')), 'sitemap must not include private app routes');
assert(new Set(sitemapUrls).size === sitemapUrls.length, 'sitemap must not contain duplicate URLs');

const canonicalLinks = extractLinkHrefs(html, 'canonical');
assert(canonicalLinks.length === 1, 'index.html must have exactly one canonical link');
assert(canonicalLinks[0].href === `${SITE_ORIGIN}/`, 'index.html canonical must point to the public root');

const alternateLinks = extractLinkHrefs(html, 'alternate');
assert(
  alternateLinks.some((link) => link.hreflang === 'x-default' && link.href === `${SITE_ORIGIN}/`),
  'index.html must expose an x-default alternate for the public root',
);

const jsonLdMatch = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
assert(jsonLdMatch, 'index.html must include JSON-LD structured data');

let graph;
try {
  graph = JSON.parse(jsonLdMatch[1])['@graph'];
} catch {
  fail('index.html JSON-LD must be valid JSON');
}

assert(Array.isArray(graph), 'JSON-LD must contain an @graph array');

const graphTypes = graph.map((node) => node['@type']);
for (const expectedType of ['Organization', 'WebSite', 'SoftwareApplication']) {
  assert(graphTypes.includes(expectedType), `JSON-LD graph must include ${expectedType}`);
}

console.log('SEO surface check passed.');
