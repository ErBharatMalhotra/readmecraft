import { COMMUNITY_TEMPLATES } from '@/lib/templates';

export default function sitemap() {
  const baseUrl = 'https://readme.bharatdn.com';
  const now = new Date().toISOString();
  
  const staticUrls = [
    { url: baseUrl, changefreq: 'daily', priority: 1.0 },
    { url: `${baseUrl}/deploy`, changefreq: 'monthly', priority: 0.5 },
  ];

  const validTemplates = COMMUNITY_TEMPLATES.filter(t => t.id && t.theme);

  const templateUrls = validTemplates.map((template) => ({
    url: `${baseUrl}/?template=${template.id}&theme=${template.theme}`,
    changefreq: 'weekly',
    priority: 0.7,
  }));

  const templatePageUrls = validTemplates.map((template) => ({
    url: `${baseUrl}/templates/${template.id}`,
    changefreq: 'weekly',
    priority: 0.6,
  }));

  const allUrls = [...staticUrls, ...templateUrls, ...templatePageUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.url.replace(/&/g, '&')}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}