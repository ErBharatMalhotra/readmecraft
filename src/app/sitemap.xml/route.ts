import { NextResponse } from 'next/server';

const TEMPLATE_SLUGS = [
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

const BASE_URL = 'https://readme.bharatdn.com';

export async function GET() {
  const now = new Date().toISOString();
  
  const staticUrls = [
    { url: BASE_URL, changefreq: 'daily', priority: '1.0' },
    { url: `${BASE_URL}/deploy`, changefreq: 'monthly', priority: '0.5' },
  ];

  const templateUrls = TEMPLATE_SLUGS.map((t) => ({
    url: `${BASE_URL}/?template=${t.id}&theme=${t.theme}`.replace(/&/g, '&'),
    changefreq: 'weekly',
    priority: '0.7',
  }));

  const templatePageUrls = TEMPLATE_SLUGS.map((t) => ({
    url: `${BASE_URL}/templates/${t.id}`,
    changefreq: 'weekly',
    priority: '0.6',
  }));

  const allUrls = [...staticUrls, ...templateUrls, ...templatePageUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}