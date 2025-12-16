import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useInsuranceStore } from '../lib/store'
import type { ActorRole } from '../lib/schemas'

function formatPct(v: number) {
  const clamped = Math.max(0, Math.min(1, v))
  return `${Math.round(clamped * 100)}%`
}

export function RoleDashboards() {
  const { receipt, actorRole, setActorRole, policy } = useInsuranceStore()

  const verified = Boolean(receipt?.pos_qr_verified)
  const role: ActorRole = (actorRole ?? 'customer') as ActorRole

  const payload = receipt?.pos_qr_payload

  const header = useMemo(() => {
    if (!receipt) return null
    return {
      trust: `${receipt.trust_rating}/5 (${formatPct(receipt.trust_confidence)})`,
      qr: verified ? 'QR verified' : 'QR not verified',
    }
  }, [receipt, verified])

  if (!receipt || !verified) return null

  return (
    <Card className="shadow-lg border-2">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Dashboards</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={verified ? 'success' : 'warning'}>{header?.qr}</Badge>
            <Badge variant="secondary">Trust {header?.trust}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['customer', 'merchant', 'insurer'] as ActorRole[]).map((r) => (
            <Button
              key={r}
              type="button"
              size="sm"
              variant={role === r ? 'primary' : 'secondary'}
              onClick={() => setActorRole(r)}
              aria-label={`Select ${r} dashboard`}
            >
              {r}
            </Button>
          ))}
        </div>

        {role === 'merchant' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Merchant view (from verified QR payload)</p>
            <div className="grid gap-2 text-sm">
              <div><span className="text-gray-500">merchant_id:</span> {payload?.merchant_id ?? '—'}</div>
              <div><span className="text-gray-500">transaction_id:</span> {payload?.transaction_id ?? '—'}</div>
              <div><span className="text-gray-500">plan_id:</span> {payload?.plan_id ?? '—'}</div>
              <div><span className="text-gray-500">amount:</span> {payload?.amount_cents != null ? `${(payload.amount_cents / 100).toFixed(2)} ${payload.currency ?? ''}` : '—'}</div>
            </div>
          </div>
        )}

        {role === 'customer' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Customer view</p>
            <div className="grid gap-2 text-sm">
              <div><span className="text-gray-500">merchant:</span> {receipt.merchant}</div>
              <div><span className="text-gray-500">eligibility:</span> {receipt.eligibility}</div>
              <div><span className="text-gray-500">policy:</span> {policy ? `${policy.status} (${policy.policy_id})` : '—'}</div>
            </div>
          </div>
        )}

        {role === 'insurer' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Insurer view (verification + risk signals)</p>
            <div className="grid gap-2 text-sm">
              <div><span className="text-gray-500">tenant_id:</span> {payload?.tenant_id ?? '—'}</div>
              <div><span className="text-gray-500">qr_reason:</span> {receipt.pos_qr_reason ?? 'ok'}</div>
              <div><span className="text-gray-500">analysis_confidence:</span> {formatPct(receipt.confidence)}</div>
              <div><span className="text-gray-500">trust:</span> {receipt.trust_rating}/5 ({formatPct(receipt.trust_confidence)})</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
