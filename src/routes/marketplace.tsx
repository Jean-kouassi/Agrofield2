import { createFileRoute } from '@tanstack/react-router'
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell'
import '@/styles/marketplace.css'

export const Route = createFileRoute('/marketplace')({
  component: MarketplacePage,
})

function MarketplacePage() {
  return <MarketplaceShell />
}
