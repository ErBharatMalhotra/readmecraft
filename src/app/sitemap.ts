import { MetadataRoute } from 'next';

// Template slugs that match both ?template= and /templates/[slug] routes
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

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://readme.bharatdn.com';
  const now = new Date();
  
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/deploy`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const templateRoutes: MetadataRoute.Sitemap = TEMPLATE_SLUGS.map((t) => ({
    url: `${baseUrl}/?template=${t.id}&theme=${t.theme}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const templatePageRoutes: MetadataRoute.Sitemap = TEMPLATE_SLUGS.map((t) => ({
    url: `${baseUrl}/templates/${t.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...templateRoutes, ...templatePageRoutes];
}