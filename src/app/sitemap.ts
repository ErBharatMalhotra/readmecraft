import { MetadataRoute } from 'next';
import { COMMUNITY_TEMPLATES } from '@/lib/templates';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://readme.bharatdn.com';
  
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/deploy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Build template routes with proper URL encoding
  const templateRoutes: MetadataRoute.Sitemap = COMMUNITY_TEMPLATES.map((template) => ({
    url: `${baseUrl}/?template=${encodeURIComponent(template.id)}&theme=${encodeURIComponent(template.theme)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Also include /templates/[slug] static routes for SEO
  const templatePageRoutes: MetadataRoute.Sitemap = COMMUNITY_TEMPLATES.map((template) => ({
    url: `${baseUrl}/templates/${encodeURIComponent(template.id)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...templateRoutes, ...templatePageRoutes];
}