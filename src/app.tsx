import { getRouter } from './router';
import { StartClient } from '@tanstack/start';
import { hydrateRoot } from 'react-dom/client';

const router = getRouter();

// Force client-side rendering only (no SSR)
// This fixes Supabase auth issues during development
hydrateRoot(
  document,
  <StartClient router={router} />
);
