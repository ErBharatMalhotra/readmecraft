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
      url: `${baseUrl}/templates`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/deploy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const templateRoutes: MetadataRoute.Sitemap = COMMUNITY_TEMPLATES.map((template) => ({
    url: `${baseUrl}/?template=${template.id}&theme=${template.theme}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...templateRoutes];
}