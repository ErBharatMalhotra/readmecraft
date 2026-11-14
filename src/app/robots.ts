import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/craft'],
    },
    sitemap: 'https://readme.bharatdn.com/sitemap.xml',
  };
}