import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) =>
      `<div ${Object.entries(props)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')}>${children}</div>`,
    button: ({ children, ...props }: any) =>
      `<button ${Object.entries(props)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')}>${children}</button>`,
    span: ({ children, ...props }: any) =>
      `<span ${Object.entries(props)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')}>${children}</span>`,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Suppress console.error in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
      args[0]?.includes?.('act(...)')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
