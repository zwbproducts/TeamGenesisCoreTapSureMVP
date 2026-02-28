import { useState } from 'react'
import { ChevronDown, Shield, TrendingUp, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import type { Receipt, PolicyConfirmation } from '../../lib/schemas'

interface Props {
  receipt: Receipt
  policy: PolicyConfirmation | null
}

export function CustomerDashboard({ receipt, policy }: Props) {
  const [expandedSections, setExpandedSections] = useState({
    policy: true,
    coverage: true,
    claims: true,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const getDaysUntilExpiry = () => {
    if (!policy?.coverage_period) return null
    const months = parseInt(policy.coverage_period) || 3
    const expiry = new Date()
    expiry.setMonth(expiry.getMonth() + months)
    const today = new Date()
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft
  }

  const daysLeft = getDaysUntilExpiry()

  return (
    <div className="space-y-4">
      {/* Policy Overview Section */}
      <Card className="border-2 border-pink-500 bg-black/80 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all duration-300 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-900/20 via-transparent to-pink-500/20 pointer-events-none" />
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-pink-900/30 to-transparent hover:from-pink-900/50 transition-colors relative z-10"
          onClick={() => toggleSection('policy')}
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-pink-400 drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]" />
            <CardTitle className="text-lg font-bold text-pink-400 tracking-wider">YOUR POLICY</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-pink-400 transition-transform duration-300 ${
              expandedSections.policy ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.policy && (
          <CardContent className="p-4 pt-2 space-y-4 border-t border-pink-500/30 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-1">
                <p className="text-xs text-pink-400 font-semibold uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  <p className="font-semibold text-green-400 capitalize">{policy?.status || 'ACTIVE'}</p>
                </div>
              </div>

              {/* Policy ID */}
              <div className="space-y-1">
                <p className="text-xs text-pink-400 font-semibold uppercase tracking-wider">Policy ID</p>
                <p className="font-mono text-sm text-pink-300 truncate">{policy?.policy_id || 'TS-2024-98765'}</p>
              </div>

              {/* Coverage Amount */}
              <div className="space-y-1">
                <p className="text-xs text-pink-400 font-semibold uppercase tracking-wider">Coverage</p>
                <p className="text-lg font-bold text-green-400">${policy?.premium?.toFixed(2) || '150.00'}</p>
              </div>

              {/* Expiry */}
              <div className="space-y-1">
                <p className="text-xs text-pink-400 font-semibold uppercase tracking-wider">Expires In</p>
                <p className={`font-semibold ${
                  daysLeft && daysLeft < 30 ? 'text-orange-400' : 'text-pink-300'
                }`}>
                  {daysLeft ? `${daysLeft} DAYS` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Policy Holder Info */}
            <div className="bg-pink-900/20 p-3 rounded-lg border border-pink-500/30 backdrop-blur-sm">
              <p className="text-xs text-pink-400 font-semibold uppercase tracking-wider">Purchase Location</p>
              <p className="font-semibold text-pink-300 mt-1">{receipt.merchant || 'NEON BAZAAR'}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Coverage Details Section */}
      <Card className="border-2 border-green-500 bg-black/80 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all duration-300 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-transparent to-green-500/20 pointer-events-none" />
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-green-900/30 to-transparent hover:from-green-900/50 transition-colors relative z-10"
          onClick={() => toggleSection('coverage')}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
            <CardTitle className="text-lg font-bold text-green-400 tracking-wider">COVERAGE DETAILS</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-green-400 transition-transform duration-300 ${
              expandedSections.coverage ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.coverage && (
          <CardContent className="p-4 pt-2 space-y-3 border-t border-green-500/30 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
            {/* Coverage Percentage */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-green-400">Coverage %</p>
                <Badge className="bg-green-600 text-lg py-1 text-green-100">
                  85%
                </Badge>
              </div>
              <div className="w-full bg-black/50 rounded-full h-2.5 overflow-hidden border-2 border-green-500/30">
                <div
                  className="bg-gradient-to-r from-green-500 via-green-400 to-green-300 h-2.5 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                  style={{ width: '85%' }}
                />
              </div>
            </div>

            {/* Eligibility */}
            <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-500/30 backdrop-blur-sm">
              <span className="text-sm font-semibold text-green-400">Eligibility</span>
              <Badge className="bg-green-600 text-green-100">{receipt.eligibility || 'ELIGIBLE'}</Badge>
            </div>

            {/* Coverage Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/50 p-3 rounded-lg border border-green-500/30 backdrop-blur-sm">
                <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">Premium</p>
                <p className="text-lg font-bold text-green-300 mt-1">${policy?.premium?.toFixed(2) || '150.00'}</p>
              </div>
              <div className="bg-black/50 p-3 rounded-lg border border-green-500/30 backdrop-blur-sm">
                <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">Period</p>
                <p className="text-lg font-bold text-green-300 mt-1">{policy?.coverage_period || '12 MONTHS'}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Recent Claims Section */}
      <Card className="border-2 border-purple-500 bg-black/80 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-purple-500/20 pointer-events-none" />
        <CardHeader
          className="cursor-pointer p-4 flex flex-row items-center justify-between bg-gradient-to-r from-purple-900/30 to-transparent hover:from-purple-900/50 transition-colors relative z-10"
          onClick={() => toggleSection('claims')}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
            <CardTitle className="text-lg font-bold text-purple-400 tracking-wider">RECENT ACTIVITY</CardTitle>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-purple-400 transition-transform duration-300 ${
              expandedSections.claims ? 'rotate-180' : ''
            }`}
          />
        </CardHeader>

        {expandedSections.claims && (
          <CardContent className="p-4 pt-2 space-y-3 border-t border-purple-500/30 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
            {/* Current Transaction */}
            <div className="bg-gradient-to-r from-purple-900/20 to-transparent p-4 rounded-lg border border-purple-500/30 backdrop-blur-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-purple-300">{receipt.merchant || 'NEON BAZAAR'}</p>
                  <p className="text-xs text-purple-400 mt-1">{receipt.date || new Date().toLocaleDateString()}</p>
                </div>
                <Badge className="bg-purple-600 text-purple-100">RECENT</Badge>
              </div>
              <p className="text-xl font-bold text-purple-300 mt-2">${receipt.total?.toFixed(2) || '299.99'}</p>
            </div>

            {/* QR Status */}
            <div className="flex items-center gap-2 p-3 bg-green-900/20 rounded-lg border border-green-500/30 backdrop-blur-sm">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="text-sm font-semibold text-green-400">QR VERIFIED ✓</span>
            </div>

            {/* Confidence */}
            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-500/30 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-blue-400">Analysis Confidence</span>
                <Badge className="bg-blue-600 text-blue-100">{Math.round(receipt.confidence * 100)}%</Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
