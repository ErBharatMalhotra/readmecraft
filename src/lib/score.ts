// ============================================================================
// ReadmeCraft — README Quality "Taste Score" Linter
// Scores 0-100 with actionable improvement suggestions
// ============================================================================

import type { ProfileData, ProjectData, Section } from '@/types/readmecraft';

export interface ScoreBreakdown {
  score: number; // 0-100
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  metrics: {
    completeness: number;      // 0-25 - Required sections present
    visualRichness: number;    // 0-25 - Badges, images, diagrams
    technicalDepth: number;    // 0-25 - Install, usage, API docs
    socialProof: number;       // 0-15 - Stars, followers, trophies
    accessibility: number;     // 0-10 - Alt text, contrast, structure
  };
  suggestions: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    action: string;
  }>;
  highlights: string[]; // Things done well
}

function getGrade(score: number): ScoreBreakdown['grade'] {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 60) return 'D';
  return 'F';
}

function colorForGrade(grade: ScoreBreakdown['grade']): string {
  if (grade.startsWith('A')) return '#10b981'; // emerald
  if (grade.startsWith('B')) return '#3b82f6'; // blue
  if (grade.startsWith('C')) return '#f59e0b'; // amber
  if (grade.startsWith('D')) return '#f97316'; // orange
  return '#ef4444'; // red
}

function checkSection(sections: Section[], id: string): boolean {
  const s = sections.find(x => x.id === id);
  return Boolean(s?.enabled && (s.content?.trim().length ?? 0) > 0);
}

function countEnabledSections(sections: Section[]): number {
  return sections.filter(s => s.enabled).length;
}

function hasContent(sections: Section[], id: string): boolean {
  const s = sections.find(x => x.id === id);
  return Boolean(s?.content && s.content.trim().length > 10);
}

function countBadges(content: string): number {
  const imgMatches = content.match(/!\[.*?\]\(.*?\)/g) || [];
  const shieldMatches = content.match(/img\.shields\.io/g) || [];
  const customBadgeMatches = content.match(/api\/badges/g) || [];
  return imgMatches.length + shieldMatches.length + customBadgeMatches.length;
}

function hasCodeBlocks(content: string): boolean {
  return /```[\s\S]*?```/.test(content);
}

function hasTable(content: string): boolean {
  return /\|.*\|.*\|/.test(content);
}

function hasLinks(content: string): boolean {
  return /\[.*?\]\(https?:\/\//.test(content);
}

function hasImages(content: string): boolean {
  return /!\[.*?\]\(/.test(content);
}

function wordCount(content: string): number {
  return content.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// ============================================================================
// Profile README Scoring
// ============================================================================

export function scoreProfileReadme(
  data: ProfileData,
  sections: Section[]
): ScoreBreakdown {
  const suggestions: ScoreBreakdown['suggestions'] = [];
  const highlights: string[] = [];
  let completeness = 0;
  let visualRichness = 0;
  let technicalDepth = 0;
  let socialProof = 0;
  let accessibility = 0;

  const enabledSections = sections.filter(s => s.enabled);

  // ---- COMPLETENESS (0-25) ----
  const requiredSections = ['header', 'ecosystem', 'bento_grid', 'tech_stack', 'pinned_projects', 'github_metrics'];
  const presentRequired = requiredSections.filter(id => checkSection(sections, id)).length;
  completeness = Math.round((presentRequired / requiredSections.length) * 25);

  if (presentRequired < requiredSections.length) {
    const missing = requiredSections.filter(id => !checkSection(sections, id));
    suggestions.push({
      type: 'critical',
      title: 'Missing Core Sections',
      description: `Your README is missing: ${missing.join(', ')}`,
      action: 'Enable these sections in the Layout panel'
    });
  } else {
    highlights.push('All core sections present');
  }

  // Header quality
  if (hasContent(sections, 'header')) {
    highlights.push('Strong profile header');
  } else {
    suggestions.push({
      type: 'critical',
      title: 'Weak or Missing Header',
      description: 'Header should include name, bio, location, and social links',
      action: 'Fill in your profile data in the ingestion panel'
    });
  }

  // Bio quality
  if (data.bio && data.bio.length > 50) {
    highlights.push('Descriptive bio');
  } else if (data.bio) {
    suggestions.push({
      type: 'warning',
      title: 'Bio Could Be Richer',
      description: 'A detailed bio (50+ chars) helps visitors understand your expertise',
      action: 'Expand your bio in Profile Data'
    });
  } else {
    suggestions.push({
      type: 'critical',
      title: 'Missing Bio',
      description: 'No bio means visitors don\'t know what you do',
      action: 'Add a bio in Profile Data'
    });
  }

  // Social links
  const socialFields = [data.website, data.twitter, data.location].filter(Boolean).length;
  if (socialFields >= 2) {
    socialProof += 5;
    highlights.push('Multiple social links provided');
  } else if (socialFields === 1) {
    suggestions.push({
      type: 'warning',
      title: 'Add More Social Links',
      description: 'Website, Twitter/X, and Location build credibility',
      action: 'Add website and Twitter in Profile Data'
    });
  } else {
    suggestions.push({
      type: 'critical',
      title: 'No Social Links',
      description: 'Zero external links makes it hard to connect',
      action: 'Add at least website and Twitter'
    });
  }

  // ---- VISUAL RICHNESS (0-25) ----
  const allContent = enabledSections.map(s => s.content).join('\n');
  const badgeCount = countBadges(allContent);
  const hasCustomBadges = /api\/badges/.test(allContent);
  const hasEcosystem = checkSection(sections, 'ecosystem');

  if (hasEcosystem) {
    visualRichness += 5;
    highlights.push('Ecosystem widgets (GitHolo/GitChronicle) active');
  }

  if (hasCustomBadges) {
    visualRichness += 10;
    highlights.push('Native animated SVG badges active');
  } else {
    visualRichness += Math.min(badgeCount * 2, 10);
    if (badgeCount > 0) {
      highlights.push(`${badgeCount} external badges found`);
    }
  }

  if (hasImages(allContent)) {
    visualRichness += 5;
    highlights.push('Images/diagrams included');
  }

  if (hasTable(allContent)) {
    visualRichness += 5;
    highlights.push('Data tables for structured info');
  }

  if (visualRichness < 10) {
    suggestions.push({
      type: 'warning',
      title: 'Low Visual Density',
      description: 'README feels text-heavy; add badges, images, or tables',
      action: 'Enable GitHub Metrics badges and Ecosystem widgets'
    });
  }

  // ---- TECHNICAL DEPTH (0-25) ----
  if (checkSection(sections, 'tech_stack')) {
    const techContent = sections.find(s => s.id === 'tech_stack')?.content || '';
    const skillCount = (techContent.match(/img\.shields\.io|api\/badges/g) || []).length;
    if (skillCount >= 8) {
      technicalDepth += 10;
      highlights.push('Rich tech stack (8+ skills)');
    } else if (skillCount >= 4) {
      technicalDepth += 6;
      highlights.push('Good tech stack coverage');
    } else {
      technicalDepth += 3;
      suggestions.push({
        type: 'info',
        title: 'Expand Tech Stack',
        description: 'More skills = better discoverability for recruiters',
        action: 'Use Tech Stack Quick Picker to add more skills'
      });
    }
  } else {
    suggestions.push({
      type: 'critical',
      title: 'Missing Tech Stack Section',
      description: 'Tech stack is the #1 thing recruiters scan for',
      action: 'Enable Tech Stack section and add skills'
    });
  }

  if (checkSection(sections, 'pinned_projects')) {
    const pinnedContent = sections.find(s => s.id === 'pinned_projects')?.content || '';
    const repoCount = (pinnedContent.match(/github\.com/g) || []).length;
    if (repoCount >= 3) {
      technicalDepth += 10;
      highlights.push('Multiple pinned repositories showcased');
    } else if (repoCount > 0) {
      technicalDepth += 5;
    }
  }

  if (data.pinnedRepos.length >= 3) {
    technicalDepth += 5;
    highlights.push('3+ flagship repositories');
  } else if (data.pinnedRepos.length > 0) {
    technicalDepth += 2;
  } else {
    suggestions.push({
      type: 'warning',
      title: 'No Pinned Repositories',
      description: 'Showcase your best work with pinned repos',
      action: 'Add repositories in Profile Data or enable GitHub ingestion'
    });
  }

  // ---- SOCIAL PROOF (0-15) ----
  if (data.publicRepos > 10) {
    socialProof += 5;
    highlights.push(`${data.publicRepos} public repositories`);
  } else if (data.publicRepos > 0) {
    socialProof += 2;
  }

  if (data.followers > 100) {
    socialProof += 5;
    highlights.push(`${data.followers} followers — strong community`);
  } else if (data.followers > 10) {
    socialProof += 3;
    highlights.push(`${data.followers} followers`);
  } else if (data.followers > 0) {
    socialProof += 1;
  }

  if (checkSection(sections, 'trophy_card') || checkSection(sections, 'stats')) {
    socialProof += 5;
    highlights.push('GitHub trophies/stats displayed');
  }

  // ---- ACCESSIBILITY (0-10) ----
  // Check alt text on images
  const imgTags = allContent.match(/!\[(.*?)\]\(/g) || [];
  const altTexts = imgTags.filter(t => t.length > 3); // Not just ![](url)
  if (altTexts.length === imgTags.length && imgTags.length > 0) {
    accessibility += 5;
    highlights.push('All images have alt text');
  } else if (imgTags.length > 0) {
    suggestions.push({
      type: 'warning',
      title: 'Missing Alt Text on Images',
      description: 'Screen readers need descriptive alt text for accessibility',
      action: 'Add alt text to all badge images: ![Description](url)'
    });
  }

  // Heading structure
  const headings = allContent.match(/^#{1,6}\s/gm) || [];
  const h1Count = (allContent.match(/^#\s/gm) || []).length;
  if (h1Count === 1 && headings.length >= 3) {
    accessibility += 5;
    highlights.push('Proper heading hierarchy');
  } else if (h1Count > 1) {
    suggestions.push({
      type: 'warning',
      title: 'Multiple H1 Headings',
      description: 'Only one H1 (# ) should exist per document',
      action: 'Use ## and ### for subsections'
    });
  } else if (headings.length < 3) {
    suggestions.push({
      type: 'info',
      title: 'Sparse Heading Structure',
      description: 'More headings improve scannability and SEO',
      action: 'Add ## section headers for each major area'
    });
  }

  const totalScore = completeness + visualRichness + technicalDepth + socialProof + accessibility;

  return {
    score: Math.min(totalScore, 100),
    grade: getGrade(totalScore),
    metrics: {
      completeness,
      visualRichness,
      technicalDepth,
      socialProof,
      accessibility,
    },
    suggestions: suggestions.slice(0, 5), // Top 5 actionable items
    highlights: highlights.slice(0, 6),
  };
}

// ============================================================================
// Project README Scoring
// ============================================================================

export function scoreProjectReadme(
  data: ProjectData,
  sections: Section[]
): ScoreBreakdown {
  const suggestions: ScoreBreakdown['suggestions'] = [];
  const highlights: string[] = [];
  let completeness = 0;
  let visualRichness = 0;
  let technicalDepth = 0;
  let socialProof = 0;
  let accessibility = 0;

  const enabledSections = sections.filter(s => s.enabled);
  const allContent = enabledSections.map(s => s.content).join('\n');

  // ---- COMPLETENESS (0-25) ----
  const requiredProjectSections = ['header', 'features', 'tech_stack', 'getting_started'];
  const presentRequired = requiredProjectSections.filter(id => checkSection(sections, id)).length;
  completeness = Math.round((presentRequired / requiredProjectSections.length) * 25);

  if (presentRequired < requiredProjectSections.length) {
    const missing = requiredProjectSections.filter(id => !checkSection(sections, id));
    suggestions.push({
      type: 'critical',
      title: 'Missing Core Project Sections',
      description: `Missing: ${missing.join(', ')}`,
      action: 'Enable these sections in Layout panel'
    });
  } else {
    highlights.push('All essential project sections present');
  }

  // Header badges
  const headerContent = sections.find(s => s.id === 'header')?.content || '';
  const headerBadges = countBadges(headerContent);
  if (headerBadges >= 4) {
    completeness += 5;
    highlights.push('Rich header badges (Stars, Forks, License, Language)');
  } else if (headerBadges >= 2) {
    completeness += 3;
  } else {
    suggestions.push({
      type: 'critical',
      title: 'Sparse Header Badges',
      description: 'Header should show Stars, Forks, License, Language at minimum',
      action: 'Ensure header section is enabled and project data is complete'
    });
  }

  // ---- VISUAL RICHNESS (0-25) ----
  if (hasImages(allContent)) visualRichness += 5;
  if (hasTable(allContent)) visualRichness += 5;
  if (hasCodeBlocks(allContent)) visualRichness += 8;
  if (hasBadgesInTechStack(sections)) visualRichness += 7;

  if (visualRichness < 10) {
    suggestions.push({
      type: 'warning',
      title: 'Add Visual Elements',
      description: 'Code blocks, architecture diagrams, and tech badges boost engagement',
      action: 'Add architecture diagram and ensure code examples exist'
    });
  } else {
    highlights.push('Good visual/code balance');
  }

  // ---- TECHNICAL DEPTH (0-25) ----
  if (checkSection(sections, 'getting_started')) {
    const gsContent = sections.find(s => s.id === 'getting_started')?.content || '';
    if (gsContent.includes('install') && gsContent.includes('run')) {
      technicalDepth += 10;
      highlights.push('Complete install & run instructions');
    } else {
      technicalDepth += 5;
      suggestions.push({
        type: 'warning',
        title: 'Incomplete Getting Started',
        description: 'Should have clear install, run, and test commands',
        action: 'Expand Getting Started section with all commands'
      });
    }
  }

  if (checkSection(sections, 'architecture')) {
    const archContent = sections.find(s => s.id === 'architecture')?.content || '';
    if (archContent.length > 50) {
      technicalDepth += 8;
      highlights.push('System architecture documented');
    }
  }

  if (checkSection(sections, 'api_reference') || checkSection(sections, 'usage')) {
    technicalDepth += 7;
    highlights.push('API/Usage documentation present');
  }

  if (data.features.length >= 5) {
    technicalDepth += 5;
    highlights.push(`${data.features.length} features listed`);
  } else if (data.features.length > 0) {
    technicalDepth += 2;
  }

  // ---- SOCIAL PROOF (0-15) ----
  if (data.stars > 100) {
    socialProof += 5;
    highlights.push(`${data.stars} GitHub stars`);
  } else if (data.stars > 10) {
    socialProof += 3;
  } else if (data.stars > 0) {
    socialProof += 1;
  }

  if (data.license && data.license !== 'UNLICENSED') {
    socialProof += 3;
    highlights.push(`Licensed under ${data.license}`);
  } else {
    suggestions.push({
      type: 'warning',
      title: 'Missing License',
      description: 'Open source projects need a license for adoption',
      action: 'Add a license (MIT, Apache-2.0, etc.)'
    });
  }

  if (hasLinks(allContent)) {
    socialProof += 4;
    highlights.push('External links (demo, docs, issues) provided');
  }

  // ---- ACCESSIBILITY (0-10) ----
  const headings = allContent.match(/^#{1,6}\s/gm) || [];
  if (headings.length >= 4) accessibility += 5;
  if (hasCodeBlocks(allContent)) accessibility += 3;
  if (hasTable(allContent)) accessibility += 2;

  const totalScore = completeness + visualRichness + technicalDepth + socialProof + accessibility;

  return {
    score: Math.min(totalScore, 100),
    grade: getGrade(totalScore),
    metrics: {
      completeness,
      visualRichness,
      technicalDepth,
      socialProof,
      accessibility,
    },
    suggestions: suggestions.slice(0, 5),
    highlights: highlights.slice(0, 6),
  };
}

function hasBadgesInTechStack(sections: Section[]): boolean {
  const techContent = sections.find(s => s.id === 'tech_stack')?.content || '';
  return /img\.shields\.io|api\/badges/.test(techContent);
}

// ============================================================================
// UI Helper: Generate Score Badge SVG
// ============================================================================

export function generateScoreBadge(breakdown: ScoreBreakdown): string {
  const { score, grade, metrics } = breakdown;
  const color = colorForGrade(grade);
  const label = 'ReadmeCraft Score';
  const message = `${score}/100 (${grade})`;

  // Simple shields.io compatible URL (or we could generate inline SVG)
  return `![ReadmeCraft Score](https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(message)}-${color.replace('#', '')}?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMSAxN2gxTDExIDEzbDEgM2gxTDExIDE0aDEuNThMMTIgMTZsMS41OCAyeDEtMS40MkwxMSAxM2gxdi0yem0zLjA4LTlsLTEuNjYgMS42Ni0uOTktLjk5LTEuNjYgMS42Ni0uOTktLjk5LTEuNjYgMS42Ni0xLjA4LTEuMDhsMS4wOC0xLjA4LjU0LS41NHoiLz48L3N2Zz4=)`;
}

// ============================================================================
// Quick Quality Check (for real-time feedback)
// ============================================================================

export interface QuickCheck {
  passed: boolean;
  label: string;
  description: string;
}

export function runQuickChecks(
  mode: 'profile' | 'project',
  data: ProfileData | ProjectData,
  sections: Section[]
): QuickCheck[] {
  const checks: QuickCheck[] = [];

  // Universal checks
  const enabledCount = sections.filter(s => s.enabled).length;
  checks.push({
    passed: enabledCount >= 5,
    label: 'Minimum Sections',
    description: `${enabledCount}/5+ sections enabled`
  });

  const allContent = sections.filter(s => s.enabled).map(s => s.content).join('\n');
  const badgeCount = countBadges(allContent);
  checks.push({
    passed: badgeCount >= 3,
    label: 'Visual Badges',
    description: `${badgeCount} badges detected`
  });

  if (mode === 'profile') {
    const pData = data as ProfileData;
    checks.push({
      passed: (pData.bio?.length || 0) > 50,
      label: 'Descriptive Bio',
      description: pData.bio ? `${pData.bio.length} chars` : 'Missing'
    });
    checks.push({
      passed: pData.pinnedRepos.length >= 3,
      label: 'Pinned Repos',
      description: `${pData.pinnedRepos.length}/3+ repos`
    });
    checks.push({
      passed: pData.skills.length >= 5,
      label: 'Tech Stack Skills',
      description: `${pData.skills.length}/5+ skills`
    });
    checks.push({
      passed: !!pData.website || !!pData.twitter,
      label: 'Social Links',
      description: 'Website or Twitter connected'
    });
  } else {
    const prData = data as ProjectData;
    checks.push({
      passed: prData.features.length >= 3,
      label: 'Features Listed',
      description: `${prData.features.length}/3+ features`
    });
    checks.push({
      passed: prData.techStack.length >= 3,
      label: 'Tech Stack Depth',
      description: `${prData.techStack.length}/3+ technologies`
    });
    checks.push({
      passed: Boolean(prData.license && prData.license !== 'UNLICENSED'),
      label: 'License Present',
      description: prData.license || 'Missing'
    });
    checks.push({
      passed: !!prData.demoUrl || !!prData.repo,
      label: 'Live Demo / Repo Link',
      description: prData.demoUrl ? 'Demo URL' : 'Repo only'
    });
  }

  return checks;
}