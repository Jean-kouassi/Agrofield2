/**
 * Composant de débogage pour les commandes
 * À utiliser temporairement pour diagnostiquer les problèmes
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function DebugOrders() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function runDiagnostics() {
    setLoading(true)
    const results: any = {}

    try {
      // 1. Vérifier l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser()
      results.currentUser = user ? {
        id: user.id,
        email: user.email,
      } : null

      // 2. Compter les commandes
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      results.totalOrders = totalOrders

      // 3. Commandes de l'utilisateur (acheteur)
      if (user) {
        const { data: buyerOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('buyer_id', user.id)

        results.buyerOrders = buyerOrders?.length || 0
        results.buyerOrdersSample = buyerOrders?.slice(0, 3)

        // 4. Commandes de l'utilisateur (vendeur)
        const { data: sellerOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('seller_id', user.id)

        results.sellerOrders = sellerOrders?.length || 0
        results.sellerOrdersSample = sellerOrders?.slice(0, 3)

        // 5. Toutes les commandes visibles
        const { data: allVisibleOrders } = await supabase
          .from('orders')
          .select('*')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

        results.allVisibleOrders = allVisibleOrders?.length || 0
      }

      // 6. Structure de la table orders
      const { data: tableSchema, error: schemaError } = await supabase.rpc('get_table_schema', { table_name: 'orders' })
      if (schemaError) {
        results.schemaError = schemaError.message
      } else {
        results.schema = tableSchema
      }

    } catch (error: any) {
      results.error = error.message
    }

    setDebugInfo(results)
    setLoading(false)
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="text-sm">🔍 Debug Orders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={loading} size="sm">
          {loading ? 'Diagnostic en cours...' : 'Lancer le diagnostic'}
        </Button>

        {debugInfo && (
          <div className="space-y-3 text-xs font-mono">
            <div>
              <strong>Utilisateur:</strong>{' '}
              {debugInfo.currentUser ? (
                <Badge variant="outline">{debugInfo.currentUser.email}</Badge>
              ) : (
                <Badge variant="destructive">Non connecté</Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-gray-500">Total commandes</div>
                <div className="text-lg font-bold">{debugInfo.totalOrders || 0}</div>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <div className="text-green-700">En tant qu'acheteur</div>
                <div className="text-lg font-bold">{debugInfo.buyerOrders || 0}</div>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <div className="text-blue-700">En tant que vendeur</div>
                <div className="text-lg font-bold">{debugInfo.sellerOrders || 0}</div>
              </div>
            </div>

            {debugInfo.allVisibleOrders !== undefined && (
              <div className="p-2 bg-purple-50 rounded">
                <div className="text-purple-700">Commandes visibles (OR)</div>
                <div className="text-lg font-bold">{debugInfo.allVisibleOrders}</div>
              </div>
            )}

            {debugInfo.error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700">
                <strong>Erreur:</strong> {debugInfo.error}
              </div>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">Voir détails complets</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
