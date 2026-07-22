#!/usr/bin/env bash
# Build + deploy Cloudflare Workers.
# Prérequis : `bun install -g wrangler` et `wrangler login`.
set -euo pipefail
bun run build
wrangler deploy
echo "✅ Déployé — pense à définir les secrets si ce n'est pas fait :"
echo "   wrangler secret put SUPABASE_URL"
echo "   wrangler secret put SUPABASE_PUBLISHABLE_KEY"
echo "   wrangler secret put SUPABASE_SERVICE_ROLE_KEY"
echo "   wrangler secret put GEMINI_API_KEY"
