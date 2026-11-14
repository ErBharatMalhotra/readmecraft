import { NextRequest, NextResponse } from 'next/server';
import { getThemeById } from '@/lib/themes';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username') || 'developer';
  const score = searchParams.get('score') || '96';
  const grade = searchParams.get('grade') || 'A+';
  const themeId = searchParams.get('theme') || 'gta6';

  const themeObj = getThemeById(themeId);
  const accent = themeObj?.emerald || '#10b981';
  const bg = themeObj?.bg || '#090d16';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="230" height="36" viewBox="0 0 230 36" fill="none">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <rect width="230" height="36" rx="8" fill="url(#grad)" stroke="${accent}" stroke-width="1.2" stroke-opacity="0.4"/>
  
  <!-- Icon -->
  <g transform="translate(10, 8)">
    <circle cx="10" cy="10" r="9" fill="${accent}" fill-opacity="0.15"/>
    <path d="M7 10L9 12L13 8" stroke="${accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  
  <!-- Label -->
  <text x="36" y="22" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" letter-spacing="0.5">READMECRAFT</text>
  
  <!-- Divider -->
  <line x1="145" y1="8" x2="145" y2="28" stroke="#1e293b" stroke-width="1"/>
  
  <!-- Score & Grade -->
  <text x="155" y="22" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700">${score}/100</text>
  <rect x="200" y="8" width="22" height="20" rx="4" fill="${accent}" fill-opacity="0.2"/>
  <text x="211" y="22" fill="${accent}" font-family="monospace" font-size="10" font-weight="800" text-anchor="middle">${grade}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}