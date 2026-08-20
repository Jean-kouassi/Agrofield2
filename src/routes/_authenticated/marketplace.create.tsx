import { createFileRoute } from '@tanstack/react-router'
import { CreateOfferForm } from '@/components/marketplace/create-offer-form'

export const Route = createFileRoute('/_authenticated/marketplace/create')({
  ssr: false,
  component: CreateOfferPage,
})

function CreateOfferPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-3xl px-4">
        <CreateOfferForm />
      </div>
    </div>
  )
}