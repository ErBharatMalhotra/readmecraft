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

  // Filter out any templates with missing id or theme
  const validTemplates = COMMUNITY_TEMPLATES.filter(t => t.id && t.theme);

  // Build template routes - Next.js handles XML escaping automatically
  const templateRoutes: MetadataRoute.Sitemap = validTemplates.map((template) => ({
    url: `${baseUrl}/?template=${template.id}&theme=${template.theme}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Also include /templates/[slug] static routes for SEO
  const templatePageRoutes: MetadataRoute.Sitemap = validTemplates.map((template) => ({
    url: `${baseUrl}/templates/${template.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...templateRoutes, ...templatePageRoutes];
}