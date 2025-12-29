import { useState } from 'react'
import { useInsuranceStore } from '../lib/store'
import type { ActorRole } from '../lib/schemas'
import { CustomerDashboard } from './dashboards/CustomerDashboard'
import { MerchantDashboard } from './dashboards/MerchantDashboard'
import { InsurerDashboard } from './dashboards/InsurerDashboard'
import { Button } from './ui/button'

export function RoleDashboards() {
  const { receipt, actorRole, setActorRole, policy } = useInsuranceStore()
  const [isMinimized, setIsMinimized] = useState(false)
  
  const verified = Boolean(receipt?.pos_qr_verified)
  const role: ActorRole = (actorRole ?? 'customer') as ActorRole

  if (!receipt || !verified) return null

  const roleIcons = {
    customer: '👤',
    merchant: '🏪',
    insurer: '🏢',
  }

  const roleLabels = {
    customer: 'Customer Portal',
    merchant: 'Merchant Dashboard',
    insurer: 'Insurer Analytics',
  }

  const roleColors = {
    customer: 'bg-blue-600 hover:bg-blue-700',
    merchant: 'bg-orange-600 hover:bg-orange-700',
    insurer: 'bg-red-600 hover:bg-red-700',
  }

  return (
    <div className="space-y-4">
      {/* Dashboard Header */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{roleIcons[role]}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{roleLabels[role]}</h2>
              <p className="text-xs text-gray-500">
                {verified && <span className="text-green-600 font-semibold">✓ QR Verified • Real-time Analytics</span>}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-600 hover:text-gray-800"
          >
            {isMinimized ? '▼' : '▲'}
          </Button>
        </div>

        {/* Role Switcher Buttons */}
        <div className="flex flex-wrap gap-2">
          {(['customer', 'merchant', 'insurer'] as ActorRole[]).map((r) => (
            <Button
              key={r}
              type="button"
              size="sm"
              onClick={() => setActorRole(r)}
              className={`${
                role === r
                  ? roleColors[r] + ' text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } transition-all duration-200`}
            >
              <span className="mr-2">{roleIcons[r]}</span>
              {roleLabels[r].split(' ')[0]}
            </Button>
          ))}
        </div>
      </div>

      {/* Dashboard Content */}
      {!isMinimized && (
        <div className="animate-in fade-in slide-in-from-top duration-300">
          {role === 'customer' && <CustomerDashboard receipt={receipt} policy={policy} />}
          {role === 'merchant' && <MerchantDashboard receipt={receipt} />}
          {role === 'insurer' && <InsurerDashboard receipt={receipt} />}
        </div>
      )}
    </div>
  )
}
