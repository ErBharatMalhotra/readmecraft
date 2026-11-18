// GitHub returns profile status emoji as a shortcode (e.g. ":exploding_head:"),
// which does not render in README markdown. Convert the common ones to unicode.

const SHORTCODES: Record<string, string> = {
  exploding_head: '🤯',
  rocket: '🚀',
  fire: '🔥',
  sparkles: '✨',
  tada: '🎉',
  wave: '👋',
  coffee: '☕',
  laptop: '💻',
  computer: '💻',
  bug: '🐛',
  zap: '⚡',
  heart: '❤️',
  orange_heart: '🧡',
  yellow_heart: '💛',
  green_heart: '💚',
  blue_heart: '💙',
  purple_heart: '💜',
  star: '⭐',
  star2: '🌟',
  eyes: '👀',
  muscle: '💪',
  brain: '🧠',
  bulb: '💡',
  trophy: '🏆',
  target: '🎯',
  dart: '🎯',
  package: '📦',
  ship: '🚢',
  construction: '🚧',
  warning: '⚠️',
  white_check_mark: '✅',
  heavy_check_mark: '✔️',
  x: '❌',
  memo: '📝',
  pencil: '📝',
  books: '📚',
  book: '📖',
  chart_with_upwards_trend: '📈',
  bar_chart: '📊',
  smiling: '😊',
  smile: '😄',
  sunglasses: '😎',
  thinking: '🤔',
  sleeping: '😴',
  headset: '🎧',
  musical_note: '🎵',
  camera: '📷',
  globe_with_meridians: '🌐',
  earth_americas: '🌎',
  sun: '☀️',
  moon: '🌙',
  cloud: '☁️',
  rainbow: '🌈',
  seedling: '🌱',
  cactus: '🌵',
  cactus_mania: '🌵',
  puzzle_piece: '🧩',
  gear: '⚙️',
  wrench: '🔧',
  hammer: '🔨',
  lock: '🔒',
  key: '🔑',
  mag: '🔍',
  link: '🔗',
  pushpin: '📌',
  round_pushpin: '📍',
  calendar: '📅',
  clock1: '🕐',
  hourglass: '⏳',
  speech_balloon: '💬',
  email: '📧',
  phone: '📱',
  video_game: '🎮',
  game_die: '🎲',
  robot: '🤖',
  alien: '👽',
  ghost: '👻',
  skull: '💀',
  crown: '👑',
  gem: '💎',
  moneybag: '💰',
  chart: '💹',
};

/**
 * Convert a GitHub emoji shortcode (`:rocket:`) or a unicode emoji to a
 * renderable emoji. Unknown shortcodes return an empty string so the README
 * never shows raw `:code:` text.
 */
export function shortcodeToEmoji(value?: string | null): string {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (!raw.startsWith(':')) return raw; // already unicode (or plain text)
  const key = raw.replace(/^:+|:+$/g, '').toLowerCase();
  return SHORTCODES[key] || '';
}

/** Remove any leftover `:shortcode:` tokens from free text. */
export function stripShortcodes(value: string): string {
  return value
    .replace(/:[a-z0-9_+-]+:/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
