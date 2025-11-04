import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Set up global location for relative URL resolution in Node.js
// This allows fetch to work with relative URLs in tests
const baseUrl = 'http://localhost';
if (typeof globalThis.location === 'undefined') {
  (globalThis as any).location = {
    href: baseUrl,
    origin: baseUrl,
    protocol: 'http:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
  };
}

// Override fetch to resolve relative URLs in test environment
// Node.js fetch requires absolute URLs, so we resolve relative ones
const originalFetch = globalThis.fetch;
globalThis.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof input === 'string' && input.startsWith('/')) {
    // Resolve relative URL to absolute
    const url = new URL(input, baseUrl);
    return originalFetch(url.toString(), init);
  }
  return originalFetch(input, init);
};

// Cleanup after each test
afterEach(() => {
  cleanup();
});

