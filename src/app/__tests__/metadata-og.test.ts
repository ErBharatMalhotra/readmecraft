import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Metadata } from 'next';
import { describe, expect, it, vi } from 'vitest';

// The metadata objects live in server components that pull in client-only UI.
// Mock them so this test only ever evaluates the metadata exports.
vi.mock('@/components/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: unknown }) => children,
}));
vi.mock('@/components/StudioClient', () => ({
  StudioClient: () => null,
}));

import { metadata as siteMetadata } from '@/app/layout';
import { generateMetadata } from '@/app/page';
import { COMMUNITY_TEMPLATES } from '@/lib/templates';

type ImageEntry = string | URL | { url: string | URL; width?: number; height?: number };

/** Normalizes every shape Next.js accepts for `openGraph.images` / `twitter.images`. */
function imageUrls(images: unknown): string[] {
  if (!images) return [];
  const entries = Array.isArray(images) ? images : [images];
  return entries.map((entry) => {
    if (typeof entry === 'string') return entry;
    if (entry instanceof URL) return entry.href;
    if (typeof entry === 'object' && entry !== null && 'url' in entry) {
      const { url } = entry as { url: string | URL };
      return url instanceof URL ? url.href : url;
    }
    throw new Error(`Unsupported metadata image entry: ${JSON.stringify(entry)}`);
  });
}

type MetadataBase = Metadata['metadataBase'];

/** Next.js accepts a string or URL for metadataBase; normalize it. */
function toBase(raw: MetadataBase): URL | undefined {
  if (!raw) return undefined;
  return raw instanceof URL ? raw : new URL(raw);
}

/** Resolves a metadata image the way Next.js serializes the final <meta> tag. */
function absoluteImageUrl(source: string, base: MetadataBase): URL {
  const resolved = toBase(base);
  if (!resolved) throw new Error('metadataBase must be set for absolute social URLs');
  return new URL(source, resolved);
}

/** Route metadata inherits metadataBase from the root layout, so fall back to it. */
function inheritedBase(routeMetadata: Metadata): URL | undefined {
  return toBase(routeMetadata.metadataBase ?? siteMetadata.metadataBase);
}

function pngSize(buffer: Buffer): { width: number; height: number } {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function expectPngMetadataImage(label: string, images: unknown, base: MetadataBase): URL {
  const urls = imageUrls(images);
  expect(urls, `${label} must expose exactly one image`).toHaveLength(1);

  const absolute = absoluteImageUrl(urls[0], base);
  expect(['http:', 'https:'], `${label} must be an absolute URL`).toContain(absolute.protocol);
  expect(absolute.pathname, `${label} must be a PNG asset`).toMatch(/\.png$/);
  return absolute;
}

function expectLocalPngAsset(url: URL, expected: { width: number; height: number }): void {
  const filePath = join(process.cwd(), 'public', decodeURIComponent(url.pathname));
  expect(existsSync(filePath), `missing public asset for ${url.pathname}`).toBe(true);
  expect(statSync(filePath).size).toBeGreaterThan(0);

  const buffer = readFileSync(filePath);
  const signature = buffer.subarray(0, 8).toString('hex');
  expect(signature, `${url.pathname} must be a real PNG (not SVG)`).toBe('89504e470d0a1a0a');
  expect(pngSize(buffer), `${url.pathname} dimensions`).toEqual(expected);
}

describe('social preview metadata', () => {
  it('exposes absolute PNG URLs for og:image and twitter:image', () => {
    const base = toBase(siteMetadata.metadataBase);
    expect(base?.protocol).toBe('https:');

    const og = expectPngMetadataImage(
      'layout openGraph.images',
      siteMetadata.openGraph?.images,
      base
    );
    const twitter = expectPngMetadataImage(
      'layout twitter.images',
      siteMetadata.twitter?.images,
      base
    );

    expect(twitter.href).toBe(og.href);

    const ogEntry = Array.isArray(siteMetadata.openGraph?.images)
      ? (siteMetadata.openGraph.images[0] as ImageEntry)
      : undefined;
    expect(typeof ogEntry === 'object' && ogEntry !== null ? ogEntry : null).toMatchObject({
      width: 1200,
      height: 630,
    });

    expectLocalPngAsset(og, { width: 1200, height: 630 });
  });

  it('keeps the PNG absolute on the home page metadata', async () => {
    const home = await generateMetadata({ searchParams: Promise.resolve({}) });
    const base = inheritedBase(home);
    const og = expectPngMetadataImage('page openGraph.images', home.openGraph?.images, base);
    expect(og.href).toMatch(/^https:\/\/[^/]+\/.+\.png$/);
    expectPngMetadataImage('page twitter.images', home.twitter?.images, base);
  });

  it('keeps the PNG absolute on template preview metadata', async () => {
    const template = COMMUNITY_TEMPLATES[0];
    expect(template, 'expected at least one community template').toBeDefined();

    const preview: Metadata = await generateMetadata({
      searchParams: Promise.resolve({ template: template.id }),
    });
    const base = inheritedBase(preview);
    expectPngMetadataImage('template openGraph.images', preview.openGraph?.images, base);
    expectPngMetadataImage('template twitter.images', preview.twitter?.images, base);
  });

  // Live check: OG_LIVE_URL=https://readme.bharatdn.com npm test
  const liveBase = process.env.OG_LIVE_URL?.replace(/\/$/, '');
  const live = liveBase ? it : it.skip;

  live(
    'serves the OG image with 200 image/png',
    async () => {
      const og = absoluteImageUrl(
        imageUrls(siteMetadata.openGraph?.images)[0],
        siteMetadata.metadataBase
      );
      const target = `${liveBase}${og.pathname}`;

      const response = await fetch(target, { redirect: 'follow' });
      expect(response.status, `${target} status`).toBe(200);
      expect(response.headers.get('content-type'), `${target} content-type`).toContain('image/png');

      const body = Buffer.from(await response.arrayBuffer());
      expect(body.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(pngSize(body)).toEqual({ width: 1200, height: 630 });
    },
    20_000
  );
});
