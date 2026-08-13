import { createFileRoute } from '@tanstack/react-router'
import { CreateOfferForm } from '@/components/marketplace/create-offer-form'

export const Route = createFileRoute('/_authenticated/marketplace/create')({
  ssr: false,
  component: CreateOfferPage,
})

function CreateOfferPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <CreateOfferForm />
      </div>
    </div>
  )
}
