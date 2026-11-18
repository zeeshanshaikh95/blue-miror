import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { vi } from 'vitest';

// The suites render the full route tree in jsdom. On a loaded machine (whole
// suite in parallel) a first paint can take longer than the 1 s default, which
// produced intermittent "unable to find" failures. Waiting longer does not
// change any assertion; a missing element still fails.
configure({ asyncUtilTimeout: 5000 });

Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: vi.fn(),
});
