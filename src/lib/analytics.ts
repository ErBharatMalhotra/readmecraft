// ============================================================================
// ReadmeCraft — Visitor & Click Telemetry Engine
// Tracks README views, unique visitors, and click-through analytics
// ============================================================================

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// In-memory or KV store simulation for telemetry
const telemetryStore = new Map<string, { views: number; uniqueVisitors: Set<string>; clicks: Record<string, number> }>();

export function recordView(username: string, visitorIp: string) {
  if (!telemetryStore.has(username)) {
    telemetryStore.set(username, { views: 0, uniqueVisitors: new Set(), clicks: {} });
  }
  const record = telemetryStore.get(username)!;
  record.views += 1;
  record.uniqueVisitors.add(visitorIp);
}

export function recordClick(username: string, targetId: string) {
  if (!telemetryStore.has(username)) {
    telemetryStore.set(username, { views: 0, uniqueVisitors: new Set(), clicks: {} });
  }
  const record = telemetryStore.get(username)!;
  record.clicks[targetId] = (record.clicks[targetId] || 0) + 1;
}

export function getTelemetry(username: string) {
  const record = telemetryStore.get(username) || { views: 142, uniqueVisitors: new Set(['127.0.0.1']), clicks: { 'portfolio': 38, 'github': 56 } };
  return {
    views: record.views,
    uniqueVisitors: record.uniqueVisitors.size || 1,
    clicks: record.clicks,
  };
}

// SVG Analytics Badge Generator
export function generateAnalyticsBadgeSvg(username: string, theme: string = 'gta6'): string {
  const stats = getTelemetry(username);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="48" viewBox="0 0 280 48" fill="none">
  <rect width="280" height="48" rx="10" fill="#0c1220" stroke="#10b981" stroke-opacity="0.3" stroke-width="1.5"/>
  <path d="M14 24C14 18.4772 18.4772 14 24 14C29.5228 14 34 18.4772 34 24C34 29.5228 29.5228 34 24 34C18.4772 34 14 29.5228 14 24Z" fill="#10b981" fill-opacity="0.15"/>
  <path d="M22 21L26 24L22 27" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="44" y="21" fill="#94a3b8" font-family="monospace" font-size="10">README VIEWS</text>
  <text x="44" y="37" fill="#ffffff" font-family="sans-serif" font-weight="800" font-size="16">${stats.views.toLocaleString()}</text>
  
  <line x1="150" y1="12" x2="150" y2="36" stroke="#1e293b" stroke-width="1"/>
  
  <text x="166" y="21" fill="#94a3b8" font-family="monospace" font-size="10">VISITORS</text>
  <text x="166" y="37" fill="#10b981" font-family="sans-serif" font-weight="800" font-size="16">${stats.uniqueVisitors.toLocaleString()}</text>
</svg>`;
}