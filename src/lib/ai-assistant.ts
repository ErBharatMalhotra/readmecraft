// ============================================================================
// ReadmeCraft — AI README Assistant (Roast & Polish Engine)
// Uses deterministic "Google XYZ" formula + LLM prompts for resume-level polish
// ============================================================================

import type { ProfileData, ProjectData, Section } from '@/types/readmecraft';

export interface AIAssistantConfig {
  apiKey?: string;
  model?: string;
  provider?: 'openai' | 'anthropic' | 'groq';
}

export interface PolishResult {
  original: string;
  polished: string;
  changes: Array<{
    type: 'bio' | 'project-desc' | 'feature' | 'skill' | 'achievement';
    before: string;
    after: string;
    reason: string;
  }>;
  xyzExamples: string[];
}

export interface RoastResult {
  score: number; // 0-100 (lower = more roasting needed)
  roastLevel: 'gentle' | 'spicy' | 'brutal';
  highlights: string[];
  burns: string[];
  actionItems: string[];
}

// -----------------------------------------------------------
// XYZ Formula Helpers (Google STAR method)
// -----------------------------------------------------------

const XYZ_TEMPLATES = [
  'Accomplished {result} as measured by {metric}, by doing {action}',
  'Increased {metric} by {percentage}% through {action}, resulting in {outcome}',
  'Built {project} using {tech} to solve {problem}, achieving {result}',
  'Reduced {metric} from {before} to {after} by implementing {solution}',
  'Led {team-size} engineers to deliver {project} ahead of schedule by {timeframe}',
  'Automated {process} saving {hours} hours/week and eliminating {errors} manual errors',
  'Scaled {system} to handle {scale} requests/day with {uptime}% uptime',
];

const WEAK_VERBS = ['helped', 'assisted', 'worked on', 'participated in', 'involved in', 'responsible for', 'managed', 'handled'];
const STRONG_VERBS = ['spearheaded', 'architected', 'engineered', 'optimized', 'delivered', 'launched', 'scaled', 'automated', 'reduced', 'increased', 'built', 'designed', 'implemented'];

// -----------------------------------------------------------
// Profile Bio Polishing
// -----------------------------------------------------------

export function polishBio(bio: string, profileData: ProfileData): { polished: string; xyzExamples: string[] } {
  if (!bio || bio.length < 30) {
    const fallback = `Building scalable systems at ${profileData.company || 'a tech company'}. ${profileData.skills.slice(0, 3).join(', ')} enthusiast.`;
    return {
      polished: fallback,
      xyzExamples: generateXYZFromSkills(profileData.skills),
    };
  }

  // Apply strong verb replacements
  let polished = bio;
  WEAK_VERBS.forEach((weak, i) => {
    const strong = STRONG_VERBS[i % STRONG_VERBS.length];
    const regex = new RegExp(`\\b${weak}\\b`, 'gi');
    polished = polished.replace(regex, strong);
  });

  // Ensure it ends with a tech hook
  if (!polished.match(/[.!?]$/)) polished += '.';
  if (!polished.toLowerCase().includes('building') && !polished.toLowerCase().includes('engineering')) {
    polished += ` Currently building with ${profileData.skills.slice(0, 2).join(' & ')}.`;
  }

  return {
    polished,
    xyzExamples: generateXYZFromSkills(profileData.skills),
  };
}

function generateXYZFromSkills(skills: string[]): string[] {
  const examples: string[] = [];
  const metrics = ['latency', 'throughput', 'cost', 'deployment time', 'bundle size', 'API response time'];
  const outcomes = ['50% faster deploys', '30% cost reduction', '99.99% uptime', 'sub-100ms p99 latency'];

  skills.slice(0, 3).forEach((skill, i) => {
    const template = XYZ_TEMPLATES[i % XYZ_TEMPLATES.length];
    examples.push(
      template
        .replace('{result}', outcomes[i % outcomes.length])
        .replace('{metric}', metrics[i % metrics.length])
        .replace('{action}', `leveraging ${skill} and modern CI/CD`)
        .replace('{percentage}', String(20 + i * 15))
        .replace('{outcome}', outcomes[i % outcomes.length])
        .replace('{project}', `${skill.toLowerCase()} microservice`)
        .replace('{tech}', skill)
        .replace('{problem}', 'scalability bottlenecks')
        .replace('{before}', '200ms')
        .replace('{after}', '45ms')
        .replace('{solution}', `${skill}-native optimization`)
        .replace('{team-size}', String(3 + i))
        .replace('{timeframe}', '2 weeks')
        .replace('{process}', 'manual deployments')
        .replace('{hours}', String(10 + i * 5))
        .replace('{errors}', '100% of')
        .replace('{scale}', '10M+')
        .replace('{uptime}', '99.99')
    );
  });
  return examples;
}

// -----------------------------------------------------------
// Project Description Polishing
// -----------------------------------------------------------

export function polishProjectDesc(description: string, projectData: ProjectData): { polished: string; xyzExamples: string[] } {
  if (!description || description.length < 50) {
    const fallback = `${projectData.title} is a ${projectData.techStack[0] || 'modern'} application featuring ${projectData.features.slice(0, 3).join(', ')}. Built for performance and developer experience.`;
    return { polished: fallback, xyzExamples: generateProjectXYZ(projectData) };
  }

  let polished = description;
  WEAK_VERBS.forEach((weak, i) => {
    const strong = STRONG_VERBS[i % STRONG_VERBS.length];
    polished = polished.replace(new RegExp(`\\b${weak}\\b`, 'gi'), strong);
  });

  // Add tech stack context if missing
  const hasTech = projectData.techStack.some(t => polished.toLowerCase().includes(t.toLowerCase()));
  if (!hasTech && projectData.techStack.length > 0) {
    polished += ` Built with ${projectData.techStack.slice(0, 4).join(', ')}.`;
  }

  return { polished, xyzExamples: generateProjectXYZ(projectData) };
}

function generateProjectXYZ(projectData: ProjectData): string[] {
  return [
    `Accomplished ${projectData.features[0] || 'core functionality'} as measured by ${projectData.stars || 'user adoption'}, by doing ${projectData.techStack[0] || 'modern'} architecture`,
    `Increased performance by 40% through ${projectData.techStack[1] || 'optimization'}, resulting in sub-second load times`,
    `Built ${projectData.title} using ${projectData.techStack.slice(0, 3).join(', ')} to solve real-world ${projectData.features[0] || 'developer'} problems`,
  ];
}

// -----------------------------------------------------------
// Full README Roast (Deterministic + Fun)
// -----------------------------------------------------------

export function roastReadme(
  mode: 'profile' | 'project',
  data: ProfileData | ProjectData,
  sections: Section[],
  markdown: string
): RoastResult {
  const burns: string[] = [];
  const highlights: string[] = [];
  const actionItems: string[] = [];

  // Word count check
  const wordCount = markdown.split(/\s+/).length;
  if (wordCount < 150) burns.push(`Your README is ${wordCount} words. A tweet has more substance.`);
  else highlights.push(`Decent length at ${wordCount} words.`);

  // Badge check
  const badgeCount = (markdown.match(/!\[.*?\]\(.*?\)/g) || []).length;
  if (badgeCount < 3) burns.push(`${badgeCount} badges? Even your grandma's recipe blog has more flair.`);
  else highlights.push(`${badgeCount} badges - looking sharp.`);

  // Bio / Description check
  if (mode === 'profile') {
    const pData = data as ProfileData;
    if (!pData.bio || pData.bio.length < 50) burns.push('Bio missing or shorter than a Tinder bio. Recruiters swipe left.');
    if (pData.skills.length < 5) burns.push(`${pData.skills.length} skills? Are you a specialist or just undecided?`);
    if (!pData.website && !pData.twitter) burns.push('Zero social links. Do you exist outside GitHub?');
    if (pData.pinnedRepos.length < 3) burns.push('Less than 3 pinned repos? Show your work or stay invisible.');
  } else {
    const prData = data as ProjectData;
    if (!prData.license || prData.license === 'UNLICENSED') burns.push('No license? Good luck with enterprise adoption.');
    if (prData.features.length < 3) burns.push('Feature list is emptier than a junior dev\'s first PR.');
    if (!prData.demoUrl && !prData.repo) burns.push('No demo, no repo link. How do people even use this?');
  }

  // Section structure
  const enabledSections = sections.filter(s => s.enabled).length;
  if (enabledSections < 5) burns.push(`${enabledSections} sections? A README needs structure, not a sticky note.`);

  // Images/diagrams
  if (!markdown.includes('![')) burns.push('Zero images or diagrams. Walls of text don\'t get read, they get scrolled.');

  // Code blocks
  const codeBlocks = (markdown.match(/```/g) || []).length / 2;
  if (codeBlocks === 0 && mode === 'project') burns.push('Project README with ZERO code examples? How do I install this, telepathy?');

  // Score calculation
  let score = 50;
  score += Math.min(badgeCount * 5, 20);
  score += Math.min(wordCount / 10, 20);
  score += enabledSections * 3;
  score += (markdown.includes('![') ? 10 : 0);
  score += (codeBlocks > 0 ? 10 : 0);
  score -= burns.length * 8;
  score = Math.max(0, Math.min(100, score));

  const roastLevel = score >= 70 ? 'gentle' : score >= 40 ? 'spicy' : 'brutal';

  // Action items
  if (burns.some(b => b.includes('bio'))) actionItems.push('Write a 100+ char bio with your superpower');
  if (burns.some(b => b.includes('badges'))) actionItems.push('Add 5+ dynamic badges (stars, license, language, CI)');
  if (burns.some(b => b.includes('skills'))) actionItems.push('List 8+ core skills with proficiency');
  if (burns.some(b => b.includes('pinned'))) actionItems.push('Pin your 3 best repos with descriptions');
  if (burns.some(b => b.includes('license'))) actionItems.push('Add MIT/Apache-2.0 license badge');
  if (burns.some(b => b.includes('demo'))) actionItems.push('Deploy a live demo and link it');
  if (burns.some(b => b.includes('images'))) actionItems.push('Add architecture diagram or screenshot');
  if (burns.some(b => b.includes('code'))) actionItems.push('Add install/run/test code blocks');

  return {
    score,
    roastLevel,
    highlights,
    burns,
    actionItems: actionItems.slice(0, 5),
  };
}

// -----------------------------------------------------------
// AI Polish Orchestrator (LLM-ready prompts)
// -----------------------------------------------------------

export function generatePolishPrompt(
  mode: 'profile' | 'project',
  data: ProfileData | ProjectData,
  markdown: string,
  roast: RoastResult
): string {
  const context = mode === 'profile'
    ? `GitHub Profile README for @${(data as ProfileData).username}`
    : `Project README for ${(data as ProjectData).title}`;

  return `You are a senior technical writer and GitHub profile optimizer. Polish this README using the Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".

CONTEXT: ${context}
CURRENT TASTE SCORE: ${roast.score}/100 (${roast.roastLevel})
KEY WEAKNESSES: ${roast.burns.join('; ')}

ORIGINAL MARKDOWN:
\`\`\`markdown
${markdown}
\`\`\`

REQUIREMENTS:
1. Keep ALL existing badges, SVG widgets, and theme-compatible markup intact
2. Rewrite bio/descriptions using strong verbs (spearheaded, architected, optimized, delivered)
3. Add XYZ-formatted achievement bullets where missing
4. Ensure every section has a clear purpose and scannable structure
5. Add code blocks for install/run/test if project README
6. Output ONLY the polished markdown, no explanations

POLISHED MARKDOWN:`;
}

// -----------------------------------------------------------
// Quick "One-Click Polish" (deterministic, no LLM needed)
// -----------------------------------------------------------

export function quickPolishMarkdown(
  mode: 'profile' | 'project',
  data: ProfileData | ProjectData,
  markdown: string
): string {
  let polished = markdown;

  // Polish bio section
  if (mode === 'profile') {
    const pData = data as ProfileData;
    const bioMatch = polished.match(/^## (?:About|Bio|Hi|Hello).*?\n(.*?)(?=\n## |\n---|\n$)/s);
    if (bioMatch && pData.bio) {
      const { polished: newBio } = polishBio(pData.bio, pData);
      polished = polished.replace(bioMatch[1], newBio);
    }
  }

  // Ensure code blocks have language hints
  polished = polished.replace(/```\n/g, '```bash\n');

  // Add install/run/test blocks if missing (project mode)
  if (mode === 'project') {
    const pData = data as ProjectData;
    if (!polished.includes('install') && pData.installCommand) {
      const installBlock = `\n## Installation\n\n\`\`\`bash\n${pData.installCommand}\n\`\`\`\n`;
      polished = polished.replace(/## Getting Started/, installBlock + '## Getting Started');
    }
    if (!polished.includes('run') && pData.runCommand) {
      const runBlock = `\n## Running\n\n\`\`\`bash\n${pData.runCommand}\n\`\`\`\n`;
      polished = polished.replace(/## (?:Usage|Features)/, runBlock + '## $1');
    }
  }

  return polished;
}