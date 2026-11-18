import { NextResponse } from 'next/server';

// Force fresh deployment: 2026-11-15T07:20:00Z
export const dynamic = 'force-dynamic';

// COMMUNITY_TEMPLATES IDs for ?template= parameter
const TEMPLATE_PARAMS = [
  { id: 'fullstack-architect', theme: 'gta6' },
  { id: 'aiml-researcher', theme: 'cyberpunk2077' },
  { id: 'systems-rust', theme: 'elden-ring' },
  { id: 'devops-platform', theme: 'matrix' },
  { id: 'web3-builder', theme: 'synthwave' },
  { id: 'cs-student', theme: 'tokyonight' },
  { id: 'react-engineer', theme: 'atom' },
  { id: 'python-developer', theme: 'matrix' },
  { id: 'mobile-developer', theme: 'tokyonight' },
  { id: 'data-scientist', theme: 'matrix' },
  { id: 'security-engineer', theme: 'cyberpunk2077' },
  { id: 'game-developer', theme: 'synthwave' },
  { id: 'sre-engineer', theme: 'matrix' },
  { id: 'engineering-manager', theme: 'gta6' },
  { id: 'embedded-engineer', theme: 'elden-ring' },
  { id: 'qa-sdet', theme: 'atom' },
];

// PERSONAS slugs for /templates/[slug] routes
const PERSONA_SLUGS = [
  'fullstack-architect',
  'ai-ml-engineer',
  'rust-engineer',
  'devops-engineer',
  'web3-developer',
  'react-developer',
  'python-developer',
  'cs-student',
  'mobile-developer',
  'data-scientist',
  'security-engineer',
  'game-developer',
  'sre-engineer',
  'engineering-manager',
  'embedded-engineer',
  'qa-sdet',
];

const BASE_URL = 'https://readme.bharatdn.com';
const AMP = '&';

export function GET() {
  const now = new Date().toISOString();

  const staticUrls = [
    { url: BASE_URL, changefreq: 'daily', priority: '1.0' },
    { url: BASE_URL + '/deploy', changefreq: 'monthly', priority: '0.5' },
  ];

  const templateUrls = TEMPLATE_PARAMS.map((t) => ({
    url: (BASE_URL + '/?template=' + t.id + '&theme=' + t.theme).replace(/&/g, AMP + 'amp;'),
    changefreq: 'weekly',
    priority: '0.7',
  }));

  const templatePageUrls = PERSONA_SLUGS.map((slug) => ({
    url: BASE_URL + '/templates/' + slug,
    changefreq: 'weekly',
    priority: '0.6',
  }));

  const allUrls = [...staticUrls, ...templateUrls, ...templatePageUrls];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    allUrls
      .map(
        (u) =>
          '  <url>\n    <loc>' +
          u.url +
          '</loc>\n    <lastmod>' +
          now +
          '</lastmod>\n    <changefreq>' +
          u.changefreq +
          '</changefreq>\n    <priority>' +
          u.priority +
          '</priority>\n  </url>'
      )
      .join('\n') +
    '\n</urlset>';

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
