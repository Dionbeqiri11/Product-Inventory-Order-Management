import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmount and clear storage between tests for isolation.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
