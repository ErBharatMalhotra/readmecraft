import { NextRequest, NextResponse } from 'next/server';
import { getThemeById } from '@/lib/themes';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'World-Class GitHub Profile README';
  const subtitle = searchParams.get('subtitle') || 'Built with ReadmeCraft — 50 Curated Viral Themes';
  const score = searchParams.get('score') || '98';
  const grade = searchParams.get('grade') || 'A+';
  const themeId = searchParams.get('theme') || 'gta6';

  const themeObj = getThemeById(themeId);
  const accent = themeObj?.emerald || '#10b981';
  const gradient = themeObj?.gradient || 'linear-gradient(135deg, #ff6b35, #ff007f, #7928ca)';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <!-- Background -->
  <rect width="1200" height="630" fill="#070b14"/>
  <circle cx="1050" cy="150" r="350" fill="${accent}" fill-opacity="0.08" filter="blur(80px)"/>
  <circle cx="150" cy="500" r="280" fill="#3b82f6" fill-opacity="0.06" filter="blur(80px)"/>
  
  <!-- Subtle Grid Lines -->
  <path d="M0 100H1200M0 200H1200M0 300H1200M0 400H1200M0 500H1200" stroke="#1e293b" stroke-opacity="0.25" stroke-dasharray="4 4"/>
  <path d="M200 0V630M400 0V630M600 0V630M800 0V630M1000 0V630" stroke="#1e293b" stroke-opacity="0.25" stroke-dasharray="4 4"/>

  <!-- Logo Pill -->
  <rect x="80" y="80" width="190" height="44" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
  <text x="135" y="108" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="800" font-size="18">ReadmeCraft</text>
  <rect x="94" y="93" width="18" height="18" rx="5" fill="${accent}"/>

  <!-- Main Headline -->
  <text x="80" y="240" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="54" letter-spacing="-1">
    ${title.slice(0, 36)}
  </text>
  
  <text x="80" y="305" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="500" font-size="24">
    ${subtitle.slice(0, 55)}
  </text>

  <!-- Taste Score Card -->
  <g transform="translate(80, 370)">
    <rect width="360" height="150" rx="20" fill="#0b1120" stroke="${accent}" stroke-width="2" stroke-opacity="0.4"/>
    <text x="36" y="50" fill="#64748b" font-family="monospace" font-size="14" font-weight="700" letter-spacing="1">README TASTE SCORE</text>
    <text x="36" y="115" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="56">${score}<tspan font-size="24" fill="#64748b" font-weight="500"> / 100</tspan></text>
    
    <rect x="250" y="45" width="70" height="65" rx="14" fill="${accent}" fill-opacity="0.15" stroke="${accent}" stroke-width="1.5"/>
    <text x="285" y="90" fill="${accent}" font-family="monospace" font-size="32" font-weight="900" text-anchor="middle">${grade}</text>
  </g>

  <!-- Theme Card -->
  <g transform="translate(480, 370)">
    <rect width="300" height="150" rx="20" fill="#0b1120" stroke="#1e293b" stroke-width="1.5"/>
    <text x="36" y="50" fill="#64748b" font-family="monospace" font-size="14" font-weight="700" letter-spacing="1">ACTIVE THEME</text>
    <text x="36" y="98" fill="${accent}" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="800" font-size="28" text-transform="uppercase">${themeId}</text>
    <text x="36" y="125" fill="#94a3b8" font-family="monospace" font-size="12">50 Universal Themes</text>
  </g>

  <!-- Footer Hook -->
  <text x="80" y="580" fill="#475569" font-family="monospace" font-size="14">https://readme.bharatdn.com • Open Source GitHub Studio</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}