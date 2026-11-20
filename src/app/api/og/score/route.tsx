import type { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

// Social networks (X, LinkedIn, Slack) only preview raster images, so this
// route renders the score card as a real PNG instead of the SVG at /api/og.
export const runtime = 'nodejs';

const SIZE = { width: 1200, height: 630 };

const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const GRADE_PATTERN = /^(?:[A-F][+-]?|—)$/;

function cleanUsername(raw: string | null): string {
  const value = (raw ?? '').trim();
  return USERNAME_PATTERN.test(value) ? value : 'github';
}

function cleanScore(raw: string | null): string {
  const value = (raw ?? '').trim();
  if (!/^\d{1,3}$/.test(value)) return 'n/a';
  const score = Number(value);
  return score > 100 ? 'n/a' : String(score);
}

function cleanGrade(raw: string | null): string {
  const value = (raw ?? '').trim().toUpperCase();
  return GRADE_PATTERN.test(value) ? value : '—';
}

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = cleanUsername(searchParams.get('username'));
  const score = cleanScore(searchParams.get('score'));
  const grade = cleanGrade(searchParams.get('grade'));

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #070b14 0%, #0b1120 60%, #071a16 100%)',
        padding: '64px 72px',
        fontFamily: 'geist',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#10b981',
              color: '#04120c',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            R
          </div>
          <div style={{ display: 'flex', color: '#e2e8f0', fontSize: 28, fontWeight: 700 }}>
            ReadmeCraft
          </div>
          <div
            style={{
              display: 'flex',
              marginLeft: 6,
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: 16,
              letterSpacing: 2,
            }}
          >
            SCORE CARD
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: 44, color: '#f8fafc', fontSize: 62 }}>
          @{username}
        </div>
        <div style={{ display: 'flex', marginTop: 8, color: '#94a3b8', fontSize: 26 }}>
          GitHub profile README, scored from the live markdown
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            padding: '18px 32px',
            borderRadius: 20,
            border: '1px solid rgba(16, 185, 129, 0.45)',
            background: 'rgba(16, 185, 129, 0.08)',
          }}
        >
          <div style={{ display: 'flex', color: '#ffffff', fontSize: 96, fontWeight: 700 }}>
            {score}
          </div>
          <div style={{ display: 'flex', marginLeft: 8, color: '#64748b', fontSize: 36 }}>/100</div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 120,
            height: 120,
            borderRadius: 24,
            border: '2px solid rgba(16, 185, 129, 0.5)',
            background: 'rgba(16, 185, 129, 0.14)',
            color: '#34d399',
            fontSize: 52,
            fontWeight: 700,
          }}
        >
          {grade}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginLeft: 8,
            color: '#94a3b8',
            fontSize: 22,
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex' }}>Structure · Visuals · Docs</div>
          <div style={{ display: 'flex' }}>Links · Hygiene — 5 × 20 points</div>
        </div>
      </div>

      <div style={{ display: 'flex', color: '#475569', fontSize: 22 }}>
        readme.bharatdn.com/score/{username}
      </div>
    </div>,
    {
      ...SIZE,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, immutable',
      },
    }
  );
}
