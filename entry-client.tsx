// Entry point for client-side rendering only (NO SSR)
// This bypasses TanStack Start's SSR completely to fix Supabase auth issues

import { createRouter } from '@tanstack/react-router';
import { routeTree } from './src/routeTree.gen';
import { hydrateRoot } from 'react-dom/client';

const router = createRouter({
  routeTree,
  defaultSsr: false,
});

hydrateRoot(document, <router.Context.Provider value={{ router }}>{router.getOutlet()}</router.Context.Provider>);
