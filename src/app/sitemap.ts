import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://readme.bharatdn.com';

  const staticRoutes = ['', '/deploy', '/craft', '/templates'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const templateSlugs = [
    'python-developer',
    'react-developer',
    'fullstack-architect',
    'rust-engineer',
    'devops-engineer',
    'web3-developer',
    'ai-ml-engineer',
    'cs-student',
  ];

  const templateRoutes = templateSlugs.map((slug) => ({
    url: `${baseUrl}/templates/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...templateRoutes];
}